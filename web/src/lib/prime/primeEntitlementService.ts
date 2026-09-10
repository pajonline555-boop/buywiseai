import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { 
  UserEntitlement, 
  PrimePlanId, 
  PrimeEntitlementStatus, 
  PrimeProviderSource, 
  PrimeAuditEvent,
  AUTHORITATIVE_PRIME_PLANS 
} from './types';

// In-Memory Store for fallback & immediate runtime consistency
export const PRIME_ENTITLEMENTS_STORE = new Map<string, UserEntitlement>();

// Persistent Collections
const ENTITLEMENTS_COLLECTION = 'prime_entitlements';
const AUDIT_LOGS_COLLECTION = 'prime_entitlement_audit_logs';

/**
 * Timeout wrapper to prevent hanging on Firestore network calls
 */
async function withTimeout<T>(promise: Promise<T>, ms: number = 800): Promise<T | null> {
  return Promise.race([
    promise.catch(() => null),
    new Promise<null>(resolve => setTimeout(() => resolve(null), ms))
  ]);
}

/**
 * Log an authoritative audit event to Firestore & Store
 */
export async function logPrimeAuditEvent(event: PrimeAuditEvent): Promise<void> {
  const logId = `log_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const record = { ...event, id: logId };
  try {
    await withTimeout(addDoc(collection(db, AUDIT_LOGS_COLLECTION), record));
  } catch (err) {
    // Fallback notice
  }
}

/**
 * Fetch authoritative Prime entitlement for a user.
 * Performs lazy expiry check if current time > expiresAt.
 */
export async function getPrimeEntitlement(userId: string, userEmail?: string): Promise<UserEntitlement> {
  const timestamp = new Date().toISOString();

  // Check In-Memory Store first
  let entitlement = PRIME_ENTITLEMENTS_STORE.get(userId);

  if (!entitlement) {
    try {
      const docRef = doc(db, ENTITLEMENTS_COLLECTION, userId);
      const snap = await withTimeout(getDoc(docRef));
      if (snap && snap.exists()) {
        entitlement = snap.data() as UserEntitlement;
        PRIME_ENTITLEMENTS_STORE.set(userId, entitlement);
      }
    } catch (e) {
      // Ignore fallback
    }
  }

  // Default FREE entitlement if none exists
  if (!entitlement) {
    const defaultEntitlement: UserEntitlement = {
      userId,
      userEmail,
      plan: 'FREE',
      status: 'ACTIVE',
      source: 'NONE',
      startedAt: timestamp,
      expiresAt: '2099-12-31T23:59:59.000Z', // Permanent free tier
      autoRenew: false,
      updatedAt: timestamp,
      createdAt: timestamp,
      version: 1,
    };
    PRIME_ENTITLEMENTS_STORE.set(userId, defaultEntitlement);
    return defaultEntitlement;
  }

  // Lazy Expiry Check
  if (
    entitlement.plan !== 'FREE' && 
    entitlement.status === 'ACTIVE' && 
    new Date(entitlement.expiresAt).getTime() < Date.now()
  ) {
    entitlement.status = 'EXPIRED';
    entitlement.updatedAt = timestamp;
    PRIME_ENTITLEMENTS_STORE.set(userId, entitlement);
    
    try {
      await withTimeout(updateDoc(doc(db, ENTITLEMENTS_COLLECTION, userId), { 
        status: 'EXPIRED', 
        updatedAt: timestamp 
      }));
    } catch (err) {
      // Sync notice
    }

    await logPrimeAuditEvent({
      userId,
      eventType: 'PRIME_EXPIRED',
      provider: entitlement.source,
      plan: entitlement.plan,
      details: `Entitlement expired automatically on ${entitlement.expiresAt}`,
      timestamp,
      actor: 'SYSTEM_EXPIRY_ENGINE',
    });
  }

  return entitlement;
}

/**
 * Activates or upgrades a user's Prime membership
 */
export async function activatePrime(
  userId: string,
  planId: PrimePlanId,
  source: PrimeProviderSource,
  providerSubscriptionId?: string,
  userEmail?: string,
  actor: string = 'PAYMENT_VERIFIER'
): Promise<UserEntitlement> {
  const timestamp = new Date().toISOString();
  const plan = AUTHORITATIVE_PRIME_PLANS[planId];
  if (!plan || planId === 'FREE') {
    throw new Error('Invalid Prime plan specified for activation.');
  }

  // Calculate Expiry Date (30 days for monthly, 365 days for yearly)
  const durationMs = plan.billingPeriod === 'YEARLY' 
    ? 365 * 24 * 60 * 60 * 1000 
    : 30 * 24 * 60 * 60 * 1000;
  
  const expiresAt = new Date(Date.now() + durationMs).toISOString();

  const entitlement: UserEntitlement = {
    userId,
    userEmail,
    plan: planId,
    status: 'ACTIVE',
    source,
    providerSubscriptionId,
    startedAt: timestamp,
    expiresAt,
    autoRenew: true,
    lastPaymentAt: timestamp,
    updatedAt: timestamp,
    createdAt: timestamp,
    version: 1,
  };

  PRIME_ENTITLEMENTS_STORE.set(userId, entitlement);

  try {
    const docRef = doc(db, ENTITLEMENTS_COLLECTION, userId);
    await withTimeout(setDoc(docRef, entitlement));
  } catch (err) {
    // Sync notice
  }

  await logPrimeAuditEvent({
    userId,
    eventType: 'PRIME_ACTIVATED',
    provider: source,
    plan: planId,
    details: `Prime activated: ${plan.name} (${source}) until ${expiresAt}`,
    timestamp,
    actor,
  });

  return entitlement;
}

/**
 * Cancels Prime subscription (retains access until expiresAt)
 */
export async function cancelPrime(userId: string, actor: string = 'USER'): Promise<UserEntitlement> {
  const entitlement = await getPrimeEntitlement(userId);
  if (entitlement.plan === 'FREE') {
    return entitlement;
  }

  const timestamp = new Date().toISOString();
  entitlement.autoRenew = false;
  entitlement.status = 'CANCELLED';
  entitlement.cancelledAt = timestamp;
  entitlement.updatedAt = timestamp;

  PRIME_ENTITLEMENTS_STORE.set(userId, entitlement);

  try {
    const docRef = doc(db, ENTITLEMENTS_COLLECTION, userId);
    await withTimeout(updateDoc(docRef, { 
      autoRenew: false, 
      status: 'CANCELLED', 
      cancelledAt: timestamp, 
      updatedAt: timestamp 
    }));
  } catch (err) {
    // Sync notice
  }

  await logPrimeAuditEvent({
    userId,
    eventType: 'PRIME_CANCELLED',
    provider: entitlement.source,
    plan: entitlement.plan,
    details: `Subscription auto-renew cancelled by ${actor}. Access valid until ${entitlement.expiresAt}`,
    timestamp,
    actor,
  });

  return entitlement;
}

/**
 * Revokes or Refunds Prime membership immediately
 */
export async function refundOrRevokePrime(
  userId: string,
  reason: string,
  actor: string = 'ADMIN'
): Promise<UserEntitlement> {
  const entitlement = await getPrimeEntitlement(userId);
  const timestamp = new Date().toISOString();

  entitlement.status = 'REFUNDED';
  entitlement.refundedAt = timestamp;
  entitlement.autoRenew = false;
  entitlement.updatedAt = timestamp;

  PRIME_ENTITLEMENTS_STORE.set(userId, entitlement);

  try {
    const docRef = doc(db, ENTITLEMENTS_COLLECTION, userId);
    await withTimeout(updateDoc(docRef, { 
      status: 'REFUNDED', 
      refundedAt: timestamp, 
      autoRenew: false, 
      updatedAt: timestamp 
    }));
  } catch (err) {
    // Sync notice
  }

  await logPrimeAuditEvent({
    userId,
    eventType: 'PRIME_REFUNDED',
    provider: entitlement.source,
    plan: entitlement.plan,
    details: `Prime revoked/refunded: ${reason}`,
    timestamp,
    actor,
  });

  return entitlement;
}

/**
 * Admin manual grant or revoke function
 */
export async function grantPrimeByAdmin(
  userId: string,
  planId: PrimePlanId,
  grantedByEmail: string,
  customExpiresAt?: string
): Promise<UserEntitlement> {
  const timestamp = new Date().toISOString();
  if (planId === 'FREE') {
    return refundOrRevokePrime(userId, `Revoked by Admin (${grantedByEmail})`, `ADMIN:${grantedByEmail}`);
  }

  const plan = AUTHORITATIVE_PRIME_PLANS[planId];
  const durationMs = plan.billingPeriod === 'YEARLY' ? 365 * 86400000 : 30 * 86400000;
  const expiresAt = customExpiresAt || new Date(Date.now() + durationMs).toISOString();

  const entitlement: UserEntitlement = {
    userId,
    plan: planId,
    status: 'ACTIVE',
    source: 'ADMIN_GRANT',
    startedAt: timestamp,
    expiresAt,
    autoRenew: false,
    updatedAt: timestamp,
    createdAt: timestamp,
    version: 1,
  };

  PRIME_ENTITLEMENTS_STORE.set(userId, entitlement);

  try {
    const docRef = doc(db, ENTITLEMENTS_COLLECTION, userId);
    await withTimeout(setDoc(docRef, entitlement));
  } catch (err) {
    // Sync notice
  }

  await logPrimeAuditEvent({
    userId,
    eventType: 'ADMIN_GRANT',
    provider: 'ADMIN_GRANT',
    plan: planId,
    details: `Admin grant (${grantedByEmail}): Granted ${plan.name} until ${expiresAt}`,
    timestamp,
    actor: `ADMIN:${grantedByEmail}`,
  });

  return entitlement;
}

import { 
  PartnerFulfillmentRecord, 
  PartnerFulfillmentAuditLog, 
  PartnerOrderSubmissionPayload, 
  PartnerReturnRequestPayload, 
  ReturnCondition, 
  TrackingInfo, 
  FulfillmentMethod 
} from './fulfillmentTypes';
import { getPartnerFulfillmentProvider } from './partnerFulfillmentRouter';
import { MOCK_PARTNER_PRODUCTS } from '../partnerService';
import { db } from '../../firebase';
import { collection, addDoc, updateDoc, doc, getDoc, setDoc, getDocs, query, where } from 'firebase/firestore';

// In-Memory persistent stores for zero-latency fallback and testing
export const FULFILLMENT_RECORDS_STORE = new Map<string, PartnerFulfillmentRecord>();
export const FULFILLMENT_AUDIT_LOGS_STORE: PartnerFulfillmentAuditLog[] = [];

/**
 * Timeout wrapper for Firestore operations
 */
async function withTimeout<T>(promise: Promise<T>, ms: number = 1000): Promise<T | null> {
  return Promise.race([
    promise.catch(() => null),
    new Promise<null>(resolve => setTimeout(() => resolve(null), ms))
  ]);
}

/**
 * Generates a standard correlation ID for order fulfillment operation tracing
 */
export function generateCorrelationId(orderId: string): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(10000000 + Math.random() * 90000000);
  return `BW-FUL-${dateStr}-${rand}`;
}

/**
 * Records an entry in partner_fulfillment_audit_logs
 */
export async function recordFulfillmentAuditLog(
  entry: Omit<PartnerFulfillmentAuditLog, 'id' | 'timestamp'>
): Promise<PartnerFulfillmentAuditLog> {
  const timestamp = new Date().toISOString();
  const log: PartnerFulfillmentAuditLog = {
    ...entry,
    id: `log_ful_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    timestamp
  };

  FULFILLMENT_AUDIT_LOGS_STORE.unshift(log);

  try {
    withTimeout(addDoc(collection(db, 'partner_fulfillment_audit_logs'), log));
  } catch (err) {
    // Firestore sync notice
  }

  return log;
}

/**
 * Creates or retrieves a persistent partner fulfillment record
 */
export async function createFulfillmentRecord(
  orderId: string,
  partnerId: string,
  method: FulfillmentMethod,
  correlationId?: string
): Promise<PartnerFulfillmentRecord> {
  const existingKey = `ord_${orderId}_ptr_${partnerId}`;
  if (FULFILLMENT_RECORDS_STORE.has(existingKey)) {
    return FULFILLMENT_RECORDS_STORE.get(existingKey)!;
  }

  const timestamp = new Date().toISOString();
  const fulfillmentId = `ful_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const activeCorrelationId = correlationId || generateCorrelationId(orderId);

  const record: PartnerFulfillmentRecord = {
    fulfillmentId,
    orderId,
    partnerId,
    fulfillmentMethod: method,
    status: 'FULFILLMENT_PENDING',
    notificationStatus: 'PENDING',
    notificationAttempts: 0,
    maxAttempts: 5,
    correlationId: activeCorrelationId,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  FULFILLMENT_RECORDS_STORE.set(fulfillmentId, record);
  FULFILLMENT_RECORDS_STORE.set(existingKey, record);

  try {
    withTimeout(setDoc(doc(db, 'partner_fulfillments', fulfillmentId), record));
  } catch (err) {
    // Firestore sync notice
  }

  await recordFulfillmentAuditLog({
    orderId,
    fulfillmentId,
    partnerId,
    actorType: 'SYSTEM',
    actorId: 'server_fulfillment_dispatcher',
    action: 'ORDER_SUBMITTED',
    newStatus: 'FULFILLMENT_PENDING',
    correlationId: activeCorrelationId,
    metadata: { method }
  });

  return record;
}

/**
 * Immediate Server-Side Partner Dispatch Engine.
 * Called immediately after verified payment commit.
 */
export async function dispatchPartnerFulfillment(
  payload: PartnerOrderSubmissionPayload,
  method?: FulfillmentMethod
): Promise<{ success: boolean; fulfillmentRecord: PartnerFulfillmentRecord; message: string }> {
  // 1. Persistent Idempotency Check
  const record = await createFulfillmentRecord(
    payload.orderId, 
    payload.partnerId, 
    method || 'PARTNER_PORTAL',
    payload.correlationId
  );

  // Re-submission protection
  if (record.notificationStatus === 'SENT' || record.notificationStatus === 'ACKNOWLEDGED') {
    return {
      success: true,
      fulfillmentRecord: record,
      message: `Fulfillment job already dispatched (Persistent Idempotency Protection). Status: ${record.status}`
    };
  }

  // 2. Resolve Provider Adapter
  const provider = getPartnerFulfillmentProvider(record.fulfillmentMethod);
  const now = new Date();
  record.notificationAttempts += 1;
  record.lastNotificationAttemptAt = now.toISOString();

  // 3. Execute Partner Transmission
  const result = await provider.submitOrder(payload);

  if (result.success) {
    record.status = result.status;
    record.notificationStatus = 'SENT';
    record.partnerOrderReference = result.partnerOrderReference;
    record.updatedAt = now.toISOString();

    await recordFulfillmentAuditLog({
      orderId: payload.orderId,
      fulfillmentId: record.fulfillmentId,
      partnerId: payload.partnerId,
      actorType: 'SYSTEM',
      actorId: 'partner_dispatcher',
      action: 'ORDER_ACKNOWLEDGED',
      previousStatus: 'FULFILLMENT_PENDING',
      newStatus: result.status,
      correlationId: payload.correlationId,
      metadata: { partnerOrderReference: result.partnerOrderReference, raw: result.rawResponse }
    });

    try {
      withTimeout(updateDoc(doc(db, 'partner_fulfillments', record.fulfillmentId), {
        status: record.status,
        notificationStatus: 'SENT',
        partnerOrderReference: record.partnerOrderReference,
        notificationAttempts: record.notificationAttempts,
        lastNotificationAttemptAt: record.lastNotificationAttemptAt,
        updatedAt: record.updatedAt
      }));
    } catch (e) {
      // Sync notice
    }

    return {
      success: true,
      fulfillmentRecord: record,
      message: result.message
    };
  } else {
    // Handle Submission Failure & Schedule Exponential Retry
    record.status = 'PARTNER_NOTIFICATION_FAILED';
    record.notificationStatus = 'FAILED';
    record.lastError = result.message;

    // Calculate Exponential Backoff: 1m, 5m, 15m, 1h, 6h
    const backoffMinutes = [1, 5, 15, 60, 360][Math.min(record.notificationAttempts - 1, 4)];
    record.nextRetryAt = new Date(now.getTime() + backoffMinutes * 60 * 1000).toISOString();
    record.updatedAt = now.toISOString();

    await recordFulfillmentAuditLog({
      orderId: payload.orderId,
      fulfillmentId: record.fulfillmentId,
      partnerId: payload.partnerId,
      actorType: 'SYSTEM',
      actorId: 'partner_dispatcher',
      action: 'FULFILLMENT_FAILED',
      previousStatus: 'FULFILLMENT_PENDING',
      newStatus: 'PARTNER_NOTIFICATION_FAILED',
      correlationId: payload.correlationId,
      metadata: { error: result.message, attempt: record.notificationAttempts, nextRetryAt: record.nextRetryAt }
    });

    try {
      withTimeout(updateDoc(doc(db, 'partner_fulfillments', record.fulfillmentId), {
        status: record.status,
        notificationStatus: 'FAILED',
        lastError: record.lastError,
        notificationAttempts: record.notificationAttempts,
        nextRetryAt: record.nextRetryAt,
        updatedAt: record.updatedAt
      }));
    } catch (e) {
      // Sync notice
    }

    return {
      success: false,
      fulfillmentRecord: record,
      message: `Partner transmission failed (Attempt ${record.notificationAttempts}/${record.maxAttempts}). Scheduled retry at ${record.nextRetryAt}: ${result.message}`
    };
  }
}

/**
 * Exponential Backoff Retry Engine
 */
export async function retryFailedFulfillments(): Promise<{ processedCount: number; retriedCount: number }> {
  let retriedCount = 0;
  const now = new Date().toISOString();

  for (const [key, record] of FULFILLMENT_RECORDS_STORE.entries()) {
    if (
      record.status === 'PARTNER_NOTIFICATION_FAILED' &&
      record.notificationAttempts < record.maxAttempts &&
      record.nextRetryAt &&
      record.nextRetryAt <= now
    ) {
      retriedCount++;
      const provider = getPartnerFulfillmentProvider(record.fulfillmentMethod);
      const payload: PartnerOrderSubmissionPayload = {
        fulfillmentId: record.fulfillmentId,
        orderId: record.orderId,
        partnerId: record.partnerId,
        correlationId: record.correlationId,
        partnerSku: 'RETRY_SKU',
        productId: 'RETRY_PROD',
        productTitle: 'Retried Partner Order Item',
        quantity: 1,
        shippingAddress: {
          recipientName: 'Customer',
          phone: '+91 99000 00000',
          addressLine1: 'Retry Delivery Address',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560001',
          country: 'India'
        },
        createdAt: record.createdAt
      };

      await dispatchPartnerFulfillment(payload, record.fulfillmentMethod);
    }
  }

  return { processedCount: FULFILLMENT_RECORDS_STORE.size, retriedCount };
}

/**
 * Return Inspection Gate: Restocks inventory ONLY if item is RESTOCKABLE.
 */
export async function processReturnInspection(
  fulfillmentId: string,
  productId: string,
  quantity: number,
  condition: ReturnCondition,
  notes?: string,
  actorId: string = 'admin'
): Promise<{ restocked: boolean; message: string; record?: PartnerFulfillmentRecord }> {
  const record = FULFILLMENT_RECORDS_STORE.get(fulfillmentId);
  const prod = MOCK_PARTNER_PRODUCTS.find(p => p.id === productId);

  const timestamp = new Date().toISOString();
  let restocked = false;

  if (condition === 'RESTOCKABLE') {
    if (prod) {
      prod.stock += quantity;
      (prod as any).soldStock = Math.max(0, ((prod as any).soldStock || 0) - quantity);
      
      try {
        withTimeout(updateDoc(doc(db, 'partner_products', prod.id), {
          stock: prod.stock,
          soldStock: (prod as any).soldStock,
          updatedAt: timestamp
        }));
      } catch (e) {
        // Sync notice
      }
    }
    restocked = true;
  }

  if (record) {
    record.status = 'INSPECTED';
    record.inspectionCondition = condition;
    record.inspectionNotes = notes;
    record.updatedAt = timestamp;

    await recordFulfillmentAuditLog({
      orderId: record.orderId,
      fulfillmentId,
      partnerId: record.partnerId,
      actorType: 'PARTNER',
      actorId,
      action: 'INSPECTED',
      previousStatus: record.returnStatus || 'ITEM_RECEIVED',
      newStatus: 'INSPECTED',
      correlationId: record.correlationId,
      metadata: { condition, restocked, notes }
    });

    if (restocked) {
      await recordFulfillmentAuditLog({
        orderId: record.orderId,
        fulfillmentId,
        partnerId: record.partnerId,
        actorType: 'SYSTEM',
        actorId: 'inventory_restock_gate',
        action: 'RESTOCKED',
        newStatus: 'RESTOCKED',
        correlationId: record.correlationId,
        metadata: { quantityRestocked: quantity, newStock: prod?.stock }
      });
    }

    try {
      withTimeout(updateDoc(doc(db, 'partner_fulfillments', fulfillmentId), {
        status: 'INSPECTED',
        inspectionCondition: condition,
        inspectionNotes: notes,
        updatedAt: timestamp
      }));
    } catch (e) {
      // Sync notice
    }
  }

  const message = restocked 
    ? `Item inspected (${condition}): Restocked ${quantity} unit(s) to availableStock.`
    : `Item inspected (${condition}): Quarantined. availableStock NOT increased.`;

  return { restocked, message, record };
}

/**
 * Updates Carrier Tracking Information
 */
export async function updateFulfillmentTracking(
  fulfillmentId: string,
  trackingInfo: TrackingInfo,
  actorId: string = 'partner'
): Promise<PartnerFulfillmentRecord | null> {
  const record = FULFILLMENT_RECORDS_STORE.get(fulfillmentId);
  const timestamp = new Date().toISOString();

  if (record) {
    const prevStatus = record.status;
    record.status = 'SHIPPED';
    record.carrier = trackingInfo.carrier;
    record.trackingNumber = trackingInfo.trackingNumber;
    if (trackingInfo.trackingUrl) record.trackingUrl = trackingInfo.trackingUrl;
    record.shippedAt = trackingInfo.shippedAt || timestamp;
    record.updatedAt = timestamp;

    await recordFulfillmentAuditLog({
      orderId: record.orderId,
      fulfillmentId,
      partnerId: record.partnerId,
      actorType: 'PARTNER',
      actorId,
      action: 'TRACKING_UPDATED',
      previousStatus: prevStatus,
      newStatus: 'SHIPPED',
      correlationId: record.correlationId,
      metadata: { carrier: trackingInfo.carrier, trackingNumber: trackingInfo.trackingNumber }
    });

    try {
      withTimeout(updateDoc(doc(db, 'partner_fulfillments', fulfillmentId), {
        status: 'SHIPPED',
        carrier: record.carrier,
        trackingNumber: record.trackingNumber,
        trackingUrl: record.trackingUrl,
        shippedAt: record.shippedAt,
        updatedAt: timestamp
      }));
    } catch (e) {
      // Sync notice
    }

    return record;
  }
  return null;
}

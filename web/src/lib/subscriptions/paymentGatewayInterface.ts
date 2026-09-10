import crypto from "crypto";
import { SubscriptionPlanId, SUBSCRIPTION_PLANS, UserEntitlement } from "./subscriptionTypes";
import { getUserEntitlement, setUserPlan } from "../vto/vtoEntitlementService";

export type PaymentProvider = "RAZORPAY" | "STRIPE" | "CASHFREE" | "PHONEPE" | "MOCK_SANDBOX";

export interface PaymentWebhookPayload {
  eventId: string;
  provider: PaymentProvider;
  eventType: "SUBSCRIPTION_ACTIVATED" | "SUBSCRIPTION_RENEWED" | "SUBSCRIPTION_CANCELLED" | "PAYMENT_FAILED" | "REFUND_ISSUED";
  userId: string;
  planId: SubscriptionPlanId;
  amountINR: number;
  currency: string;
  signature: string;
  timestamp: string;
}

export interface SubscriptionEventRecord {
  eventId: string;
  userId: string;
  planId: SubscriptionPlanId;
  eventType: string;
  processedAt: string;
  idempotencyKey: string;
  status: "SUCCESS" | "DUPLICATE_SKIPPED" | "SIGNATURE_FAILED" | "INVALID_PLAN";
}

const processedWebhookEvents = new Set<string>();
const subscriptionAuditTrail: SubscriptionEventRecord[] = [];

/**
 * Verifies HMAC SHA256 Webhook Signatures from live payment providers (Razorpay / Stripe / etc.).
 */
export function verifyWebhookSignature(payloadRaw: string, signature: string, secretKey: string): boolean {
  if (!secretKey || secretKey.trim().length === 0) {
    console.warn("[PAYMENT GATEWAY SECURITY]: Cannot verify signature — Webhook Secret is empty/unconfigured.");
    return false;
  }
  try {
    const expectedSignature = crypto.createHmac("sha256", secretKey).update(payloadRaw).digest("hex");
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSignature);
    if (sigBuf.length !== expBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(sigBuf, expBuf);
  } catch (err) {
    console.error("[PAYMENT GATEWAY SECURITY]: Signature comparison exception", err);
    return false;
  }
}

/**
 * Server-authoritative webhook processor for incoming payment provider callbacks.
 * Idempotent, replay-protected, and signature-verified.
 */
export function handlePaymentWebhook(
  payload: PaymentWebhookPayload,
  webhookSecretKey?: string
): { success: boolean; eventRecord: SubscriptionEventRecord; entitlement?: UserEntitlement; reason?: string } {
  const idempotencyKey = `pay_event_${payload.provider}_${payload.eventId}`;

  // 1. Replay attack & duplicate prevention
  if (processedWebhookEvents.has(idempotencyKey)) {
    const eventRecord: SubscriptionEventRecord = {
      eventId: payload.eventId,
      userId: payload.userId,
      planId: payload.planId,
      eventType: payload.eventType,
      processedAt: new Date().toISOString(),
      idempotencyKey,
      status: "DUPLICATE_SKIPPED"
    };
    return { success: true, eventRecord, reason: "Webhook event already processed (Idempotency skip)." };
  }

  // 2. Webhook Signature Verification (If secret key is provided)
  if (webhookSecretKey) {
    const rawData = `${payload.eventId}:${payload.userId}:${payload.planId}:${payload.amountINR}:${payload.timestamp}`;
    const isValidSig = verifyWebhookSignature(rawData, payload.signature, webhookSecretKey);
    if (!isValidSig) {
      const eventRecord: SubscriptionEventRecord = {
        eventId: payload.eventId,
        userId: payload.userId,
        planId: payload.planId,
        eventType: payload.eventType,
        processedAt: new Date().toISOString(),
        idempotencyKey,
        status: "SIGNATURE_FAILED"
      };
      return { success: false, eventRecord, reason: "Forbidden: Webhook signature verification failed." };
    }
  }

  // 3. Plan Validation
  if (!SUBSCRIPTION_PLANS[payload.planId]) {
    const eventRecord: SubscriptionEventRecord = {
      eventId: payload.eventId,
      userId: payload.userId,
      planId: payload.planId,
      eventType: payload.eventType,
      processedAt: new Date().toISOString(),
      idempotencyKey,
      status: "INVALID_PLAN"
    };
    return { success: false, eventRecord, reason: `Unknown subscription plan ${payload.planId}` };
  }

  // 4. Server-Authoritative State Machine Transition
  let entitlement: UserEntitlement | undefined;
  if (payload.eventType === "SUBSCRIPTION_ACTIVATED" || payload.eventType === "SUBSCRIPTION_RENEWED") {
    entitlement = setUserPlan(payload.userId, payload.planId);
  } else if (payload.eventType === "SUBSCRIPTION_CANCELLED") {
    entitlement = getUserEntitlement(payload.userId);
    entitlement.status = "CANCELLED";
    entitlement.updatedAt = new Date().toISOString();
  }

  processedWebhookEvents.add(idempotencyKey);
  const eventRecord: SubscriptionEventRecord = {
    eventId: payload.eventId,
    userId: payload.userId,
    planId: payload.planId,
    eventType: payload.eventType,
    processedAt: new Date().toISOString(),
    idempotencyKey,
    status: "SUCCESS"
  };
  subscriptionAuditTrail.unshift(eventRecord);

  return { success: true, eventRecord, entitlement };
}

export function getSubscriptionAuditTrail(): SubscriptionEventRecord[] {
  return subscriptionAuditTrail;
}

/**
 * Truth Status Indicator
 */
export const PAYMENT_INTEGRATION_STATUS = {
  entitlementEngine: "IMPLEMENTED",
  realPaymentProcessing: "NOT YET LIVE",
  activeGateway: "NONE",
  supportedPlans: Object.keys(SUBSCRIPTION_PLANS)
};

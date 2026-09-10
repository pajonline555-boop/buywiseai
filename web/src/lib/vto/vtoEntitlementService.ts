import { UserEntitlement, SUBSCRIPTION_PLANS, SubscriptionPlanId } from "../subscriptions/subscriptionTypes";

// In-memory store for active entitlements & atomic credit locks
const entitlementsMap = new Map<string, UserEntitlement>();

export function getUserEntitlement(userId: string): UserEntitlement {
  let record = entitlementsMap.get(userId);
  if (!record) {
    // Default to FREE tier
    const now = new Date();
    const nextMonth = new Date(now.getTime() + 30 * 24 * 3600 * 1000);
    record = {
      userId,
      planId: "FREE",
      status: "ACTIVE",
      vtoCreditsTotal: SUBSCRIPTION_PLANS.FREE.vtoCreditsPerMonth,
      vtoCreditsUsed: 0,
      periodStart: now.toISOString(),
      periodEnd: nextMonth.toISOString(),
      updatedAt: now.toISOString()
    };
    entitlementsMap.set(userId, record);
  }
  return record;
}

export function setUserPlan(userId: string, planId: SubscriptionPlanId): UserEntitlement {
  const current = getUserEntitlement(userId);
  const plan = SUBSCRIPTION_PLANS[planId];
  const now = new Date();
  const updated: UserEntitlement = {
    ...current,
    planId,
    vtoCreditsTotal: plan.vtoCreditsPerMonth,
    updatedAt: now.toISOString()
  };
  entitlementsMap.set(userId, updated);
  return updated;
}

export interface CreditReservationResult {
  success: boolean;
  reservationId?: string;
  remainingCredits: number;
  reason?: string;
}

/**
 * Server-side atomic credit reservation before initiating paid GPU VTO pipeline.
 */
export function reserveVtoCredit(userId: string): CreditReservationResult {
  const entitlement = getUserEntitlement(userId);

  if (entitlement.status !== "ACTIVE") {
    return {
      success: false,
      remainingCredits: entitlement.vtoCreditsTotal - entitlement.vtoCreditsUsed,
      reason: "Subscription is not active."
    };
  }

  const remaining = entitlement.vtoCreditsTotal - entitlement.vtoCreditsUsed;
  if (remaining <= 0) {
    return {
      success: false,
      remainingCredits: 0,
      reason: `Insufficient VTO credits. Plan (${entitlement.planId}) quota exhausted (${entitlement.vtoCreditsUsed}/${entitlement.vtoCreditsTotal}). Upgrade to BuyWise Plus or Pro for additional VTO credits.`
    };
  }

  // Atomically increment credits used
  entitlement.vtoCreditsUsed += 1;
  entitlement.updatedAt = new Date().toISOString();
  entitlementsMap.set(userId, entitlement);

  const reservationId = `res_${userId}_${Date.now()}`;
  return {
    success: true,
    reservationId,
    remainingCredits: entitlement.vtoCreditsTotal - entitlement.vtoCreditsUsed
  };
}

/**
 * Atomic credit refund if VTO pipeline fails or GPU provider returns quota error.
 */
export function refundVtoCredit(userId: string, reservationId: string) {
  const entitlement = entitlementsMap.get(userId);
  if (entitlement && entitlement.vtoCreditsUsed > 0) {
    entitlement.vtoCreditsUsed -= 1;
    entitlement.updatedAt = new Date().toISOString();
    entitlementsMap.set(userId, entitlement);
    console.log(`[VTO ENTITLEMENT SERVICE]: Credit refunded for user ${userId} (Reservation: ${reservationId})`);
  }
}

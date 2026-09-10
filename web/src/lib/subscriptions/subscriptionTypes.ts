export type SubscriptionPlanId = "FREE" | "BUYWISE_PLUS" | "BUYWISE_PRO" | "BUYWISE_ELITE";

export interface PlanDetails {
  id: SubscriptionPlanId;
  name: string;
  monthlyPriceINR: number;
  vtoCreditsPerMonth: number;
  maxSavedAlerts: number;
  adSupported: boolean;
  priorityQueue: boolean;
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlanId, PlanDetails> = {
  FREE: {
    id: "FREE",
    name: "Free Shopper",
    monthlyPriceINR: 0,
    vtoCreditsPerMonth: 3,
    maxSavedAlerts: 5,
    adSupported: true,
    priorityQueue: false
  },
  BUYWISE_PLUS: {
    id: "BUYWISE_PLUS",
    name: "BuyWise Plus",
    monthlyPriceINR: 199,
    vtoCreditsPerMonth: 10,
    maxSavedAlerts: 25,
    adSupported: true,
    priorityQueue: false
  },
  BUYWISE_PRO: {
    id: "BUYWISE_PRO",
    name: "BuyWise Pro",
    monthlyPriceINR: 499,
    vtoCreditsPerMonth: 30,
    maxSavedAlerts: 100,
    adSupported: true,
    priorityQueue: true
  },
  BUYWISE_ELITE: {
    id: "BUYWISE_ELITE",
    name: "BuyWise Elite",
    monthlyPriceINR: 999,
    vtoCreditsPerMonth: 100,
    maxSavedAlerts: 500,
    adSupported: false,
    priorityQueue: true
  }
};

export interface UserEntitlement {
  userId: string;
  planId: SubscriptionPlanId;
  status: "ACTIVE" | "EXPIRED" | "CANCELLED";
  vtoCreditsTotal: number;
  vtoCreditsUsed: number;
  periodStart: string;
  periodEnd: string;
  updatedAt: string;
}

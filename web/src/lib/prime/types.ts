export type PrimePlanId = 'FREE' | 'PRIME_MONTHLY' | 'PRIME_YEARLY';

export type PrimeEntitlementStatus = 
  | 'ACTIVE' 
  | 'PENDING' 
  | 'PAST_DUE' 
  | 'CANCELLED' 
  | 'EXPIRED' 
  | 'REFUNDED' 
  | 'SUSPENDED';

export type PrimeProviderSource = 
  | 'NONE' 
  | 'RAZORPAY_WEB' 
  | 'GOOGLE_PLAY' 
  | 'GOOGLE_ALTERNATIVE_BILLING' 
  | 'ADMIN_GRANT' 
  | 'SANDBOX';

export interface PrimePlanConfig {
  id: PrimePlanId;
  name: string;
  description: string;
  billingPeriod: 'MONTHLY' | 'YEARLY' | 'NEVER';
  priceAmount: number; // in INR
  currency: 'INR';
  active: boolean;
  features: {
    unlimitedTryOn: boolean;
    instantPriceAlerts: boolean;
    exclusivePartnerDiscounts: boolean;
    priorityAiProcessing: boolean;
    earlyDealAccess: boolean;
  };
  googleProductId?: string;
}

export const AUTHORITATIVE_PRIME_PLANS: Record<PrimePlanId, PrimePlanConfig> = {
  FREE: {
    id: 'FREE',
    name: 'BuyWise Free Shopper',
    description: 'Basic access to SmartCompare, public coupons, and standard VTO studio.',
    billingPeriod: 'NEVER',
    priceAmount: 0,
    currency: 'INR',
    active: true,
    features: {
      unlimitedTryOn: false,
      instantPriceAlerts: false,
      exclusivePartnerDiscounts: false,
      priorityAiProcessing: false,
      earlyDealAccess: false,
    },
  },
  PRIME_MONTHLY: {
    id: 'PRIME_MONTHLY',
    name: 'BuyWise Prime Monthly',
    description: 'Unlimited AI Virtual Try-On, Instant Price Drop Alerts & Exclusive Partner Deals.',
    billingPeriod: 'MONTHLY',
    priceAmount: 199,
    currency: 'INR',
    active: true,
    features: {
      unlimitedTryOn: true,
      instantPriceAlerts: true,
      exclusivePartnerDiscounts: true,
      priorityAiProcessing: true,
      earlyDealAccess: true,
    },
    googleProductId: 'buywise_prime_monthly',
  },
  PRIME_YEARLY: {
    id: 'PRIME_YEARLY',
    name: 'BuyWise Prime Annual (Best Value)',
    description: 'Full year of VIP AI Shopping, priority GPU rendering & maximum partner discounts.',
    billingPeriod: 'YEARLY',
    priceAmount: 1499,
    currency: 'INR',
    active: true,
    features: {
      unlimitedTryOn: true,
      instantPriceAlerts: true,
      exclusivePartnerDiscounts: true,
      priorityAiProcessing: true,
      earlyDealAccess: true,
    },
    googleProductId: 'buywise_prime_yearly',
  },
};

export interface UserEntitlement {
  userId: string;
  userEmail?: string;
  plan: PrimePlanId;
  status: PrimeEntitlementStatus;
  source: PrimeProviderSource;
  providerCustomerId?: string;
  providerSubscriptionId?: string;
  startedAt: string;
  expiresAt: string;
  autoRenew: boolean;
  cancelledAt?: string;
  refundedAt?: string;
  lastPaymentAt?: string;
  updatedAt: string;
  createdAt: string;
  version: number;
}

export type PrimeAuditEventType = 
  | 'PRIME_CREATED'
  | 'PRIME_ACTIVATED'
  | 'PRIME_RENEWED'
  | 'PRIME_CANCELLED'
  | 'PRIME_EXPIRED'
  | 'PRIME_REFUNDED'
  | 'PRIME_SUSPENDED'
  | 'PRIME_REVOKED'
  | 'PAYMENT_FAILED'
  | 'WEBHOOK_REJECTED'
  | 'WEBHOOK_DUPLICATE'
  | 'ADMIN_GRANT'
  | 'ADMIN_REVOKE';

export interface PrimeAuditEvent {
  id?: string;
  userId: string;
  eventType: PrimeAuditEventType;
  provider: PrimeProviderSource;
  plan: PrimePlanId;
  details: string;
  metadata?: Record<string, any>;
  timestamp: string;
  actor: string;
}

export interface PrimeOrderCreationRequest {
  planId: PrimePlanId;
  provider: PrimeProviderSource;
}

export interface PrimeOrderVerificationRequest {
  orderId: string;
  paymentId: string;
  signature: string;
  planId: PrimePlanId;
  provider: PrimeProviderSource;
}

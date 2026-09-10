export type CouponDiscountType = 'PERCENTAGE' | 'FLAT_AMOUNT';
export type CouponSource = 'RETAILER' | 'PARTNER' | 'BUYWISE_EXCLUSIVE' | 'AFFILIATE_NETWORK';
export type CouponStatus = 'ACTIVE' | 'PENDING_VERIFICATION' | 'STALE' | 'EXPIRED' | 'FAILED_VERIFICATION';
export type RetailerName = 
  | 'Amazon India'
  | 'Flipkart'
  | 'Meesho'
  | 'Myntra'
  | 'Nykaa'
  | 'AJIO'
  | 'Tata CLiQ'
  | 'Etsy'
  | 'eBay'
  | 'Walmart'
  | 'Cuelinks Network'
  | 'vCommission Network'
  | 'BuyWise Partner Store'
  | 'All Stores';

export type FreshnessStatus = 'VERIFIED_TODAY' | 'LAST_VERIFIED' | 'UNVERIFIED' | 'EXPIRED';
export type VerificationMethod = 'AUTHORITATIVE_API' | 'PARTNER_DIRECT' | 'COMMUNITY_SUBMISSION' | 'UNVERIFIED';

export interface BuyWiseCoupon {
  id: string;
  code: string;
  title: string;
  description: string;
  retailer: RetailerName;
  discountType: CouponDiscountType;
  discountValue: number; // e.g. 10 for 10% or 400 for ₹400
  maxDiscount?: number;  // e.g. 400
  minOrderValue: number; // e.g. 2000
  category: string;      // e.g. 'Undergarments & Lingerie', 'Fashion & Clothing', 'Mobiles & Tech', 'All'
  source: CouponSource;
  validUntil: string;    // ISO date string e.g. '2026-09-10'
  lastVerifiedAt: string;// ISO string or human string e.g. '2 hours ago' or 'Pending Verification'
  freshnessStatus?: FreshnessStatus;
  freshnessBadge?: string; // e.g. '🟢 VERIFIED TODAY', '⚪ UNVERIFIED', '🟡 LAST VERIFIED'
  verificationMethod?: VerificationMethod;
  status: CouponStatus;
  newCustomerOnly?: boolean;
  paymentRestrictions?: string; // e.g. 'SBI Credit Card Only' or 'UPI / NetBanking'
  isStackable?: boolean;
  partnerId?: string;
  partnerName?: string;
  successRate?: number; // e.g. 98 for 98% working
  usedCount?: number;
  createdAt: string;
}

export interface EffectivePriceResult {
  originalPrice: number;
  listedPrice: number;
  effectivePrice: number;
  savingsAmount: number;
  bestCoupon: BuyWiseCoupon | null;
  hasCoupon: boolean;
}

import { SmartValueScoreBreakdown } from '../score/types';
import { TrustScoreBreakdown, TrustLevel } from '../trust/types';
import { PriceTrendSummary } from '../history/types';

export type SourceType = "api" | "affiliate" | "scraper" | "mock" | "unavailable";
export type VerificationStatus = "verified_live" | "verification_stale" | "unverified" | "unavailable";

export interface RetailerInfo {
  id: string;
  name: string;
  country: string;
  currency: string;
  enabled: boolean;
  logo?: string;
}

export interface StoreOffer {
  id: string;
  retailerId: string;
  store: string;
  title: string;
  url: string;
  price: number;
  currency: string;
  originalPrice?: number;
  mrp?: number;
  discount?: number;
  imageUrl?: string;
  logo?: string;
  rating?: number;
  reviewCount?: number;
  availability: "in_stock" | "out_of_stock" | "unknown";
  sellerName?: string;
  deliveryText?: string;
  isLowest?: boolean;
  isBestValue?: boolean;
  isBestMatch?: boolean;
  matchType?: "exact" | "variant" | "similar" | "unknown";
  matchConfidence?: number;
  identityConfidence?: number;
  attributeMatchScore?: number;
  visualSimilarityScore?: number;
  smartValueScore?: number;
  scoreBreakdown?: SmartValueScoreBreakdown;
  trustScore?: number;
  trustBreakdown?: TrustScoreBreakdown;
  trustLevel?: TrustLevel;
  dataSource?: SourceType;
  verificationStatus?: VerificationStatus;
  priceVerifiedAt?: string;
  sellerVerified?: boolean;
  staleVerification?: boolean;
  checkedAt: string;
  sourceType: SourceType;
  productSource?: "AFFILIATE" | "PARTNER" | "DIRECT";
  fulfillmentType?: "EXTERNAL_RETAILER" | "PARTNER_FULFILLED" | "BUYWISE_FULFILLED";
  partnerId?: string;
  partnerName?: string;
  partnerBadge?: boolean;
  tryOnEnabled?: boolean;
  brand?: string;
  model?: string;
  productId?: string;
  gtin?: string;
  variant?: {
    size?: string;
    color?: string;
    packQty?: number;
  };
  directProductUrl?: string;
  affiliateUrl?: string;
  isDirectProductLink?: boolean;
  listedPrice?: number;
  shippingFee?: number;
  effectivePayablePrice?: number;
  priceBasis?: 'listed' | 'effective_payable';
  tier?: 'PREMIUM' | 'LUXURY';
  dataFreshness?: string;
  provenance?: {
    source: SourceType;
    provider: string;
    rawListingId?: string;
    lastChecked: string;
    isLiveFeed: boolean;
  };
  imageProvenance?: {
    url: string;
    isGenuineProductImage: boolean;
    isFallback: boolean;
    safeHash?: string;
  };
}

export interface RetailerSearchResult {
  retailer: RetailerInfo;
  offers: StoreOffer[];
  success: boolean;
  error?: string;
  checkedAt: string;
}

export interface RetailerAdapter {
  id: string;
  name: string;
  country: string;
  currency: string;
  enabled: boolean;

  search(query: string): Promise<RetailerSearchResult>;
}

export interface GroupedOffers {
  exact: StoreOffer[];
  variant: StoreOffer[];
  similar: StoreOffer[];
  premium?: StoreOffer[];
  luxury?: StoreOffer[];
}

export interface ProviderStatusInfo {
  retailerId: string;
  retailerName: string;
  status: 'LIVE' | 'CREDENTIALS_REQUIRED' | 'API_UNAVAILABLE' | 'RATE_LIMITED' | 'FAILED' | 'PARTNER_LIVE';
  message?: string;
}

export interface TierSummary {
  premiumCount: number;
  luxuryCount: number;
  lowestPremiumPrice: number;
  lowestLuxuryPrice: number;
}

export interface ComparisonSummary {
  totalStoresChecked: number;
  successfulStores: number;
  lowestPrice: number;
  highestPrice: number;
  maximumSavings: number;
  currency: string;
  tierSummary?: TierSummary;
}

export interface ComparisonResponse {
  product: string;
  query: string;
  timestamp: string;
  stores: StoreOffer[];
  groupedOffers?: GroupedOffers;
  summary: ComparisonSummary;
  recommendation: string;
  priceTrend?: PriceTrendSummary;
  errors: Array<{ retailer: string; error: string }>;
  providerStatuses?: ProviderStatusInfo[];
}

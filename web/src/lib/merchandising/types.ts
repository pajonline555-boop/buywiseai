export type MerchandisingCollectionId = 
  | 'buywise_select'
  | 'red_carpet'
  | 'executive'
  | 'signature'
  | 'luxe_fashion'
  | 'elite_home'
  | 'premium_tech'
  | 'wedding_occasion'
  | 'gifts_prestige'
  | 'premium_beauty';

export type EligibilityMode = 'MANUAL' | 'RULE_BASED' | 'HYBRID';

export interface MerchandisingRuleConfig {
  categories?: string[];
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  minReviewsCount?: number;
  minMerchandisingScore?: number;
  requiredGarmentCategories?: string[];
  keywords?: string[];
}

export interface MerchandisingCollection {
  collectionId: MerchandisingCollectionId;
  slug: string;
  name: string;
  subtitle: string;
  description: string;
  heroHeadline: string;
  heroSubtitle: string;
  heroImage: string;
  ctaText: string;
  active: boolean;
  featured: boolean;
  displayOrder: number;
  eligibilityMode: EligibilityMode;
  manualProductIds: string[];
  excludedProductIds?: string[];
  ruleConfig: MerchandisingRuleConfig;
  seoTitle: string;
  seoDescription: string;
  startAt?: string;
  endAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MerchandisingAuditLog {
  id: string;
  adminId: string;
  collectionId: string;
  productId?: string;
  action: 'ASSIGN' | 'REMOVE' | 'FEATURE' | 'UNFEATURE' | 'REORDER' | 'PUBLISH' | 'UNPUBLISH';
  reason?: string;
  timestamp: string;
}

export interface PremiumScoreFactors {
  ratingScore: number;
  reviewVolumeScore: number;
  sellerVerificationScore: number;
  returnPolicyScore: number;
  specCompletenessScore: number;
  pricePositioningScore: number;
  totalMerchandisingScore: number;
}

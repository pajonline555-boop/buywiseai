export interface TrustFactorScore {
  score: number;
  maxScore: number;
  status: 'verified' | 'unverified' | 'stale' | 'unavailable';
  details?: string;
}

export interface TrustScoreBreakdown {
  retailerApiVerification: TrustFactorScore;
  priceFreshness: TrustFactorScore;
  sellerVerification: TrustFactorScore;
  identityConfidence: TrustFactorScore;
  availabilityConfidence: TrustFactorScore;
  returnWarrantyEvidence: TrustFactorScore;
}

export type TrustLevel = 'high' | 'moderate' | 'caution';

export interface TrustResult {
  trustScore: number; // 0 to 100
  trustLevel: TrustLevel;
  breakdown: TrustScoreBreakdown;
  reasoning: string;
}

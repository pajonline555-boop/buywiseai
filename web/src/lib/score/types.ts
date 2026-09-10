export interface FactorScore {
  score: number;
  maxScore: number;
  status: 'available' | 'unavailable';
  details?: string;
}

export interface SmartValueScoreBreakdown {
  priceCompetitiveness: FactorScore;
  productRating: FactorScore;
  reviewStrength: FactorScore;
  productMatchConfidence: FactorScore;
  sellerReliability: FactorScore;
  returnWarranty: FactorScore;
}

export interface SmartValueResult {
  totalScore: number; // 0 to 100
  breakdown: SmartValueScoreBreakdown;
  reasoning: string;
  isBestValue: boolean;
  isBestMatch: boolean;
  isLowestPrice: boolean;
}

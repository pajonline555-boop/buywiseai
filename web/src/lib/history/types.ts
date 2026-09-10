import { SourceType, VerificationStatus } from '../retailers/types';

export interface PriceHistoryEntry {
  id: string;
  productId: string;
  retailerId: string;
  store: string;
  price: number;
  mrp?: number;
  currency: string;
  timestamp: string;
  verificationStatus: VerificationStatus;
  dataSource: SourceType;
}

export type TrendDirection = 'falling' | 'rising' | 'stable' | 'insufficient_data';
export type PurchaseRecommendation = 'good_time_to_buy' | 'fair_price' | 'wait_for_price_drop' | 'insufficient_history';

export interface PriceTrendSummary {
  avg7Day: number | null;
  avg30Day: number | null;
  avg90Day: number | null;
  lowestPriceObserved: number | null;
  highestPriceObserved: number | null;
  priceChangePercentage: number | null; // e.g. -12.5 for 12.5% drop
  trendDirection: TrendDirection;
  isHistoricalLow: boolean;
  purchaseRecommendation: PurchaseRecommendation;
  dataPointsCount: number;
  lastVerifiedAt: string | null;
}

import { PriceHistoryEntry, PriceTrendSummary, TrendDirection, PurchaseRecommendation } from './types';

export function analyzePriceTrend(
  history: PriceHistoryEntry[],
  currentPrice: number
): PriceTrendSummary {
  // ZERO TREND FABRICATION RULE: If less than 2 verified data points exist, return insufficient history
  if (!history || history.length < 2 || currentPrice <= 0) {
    return {
      avg7Day: null,
      avg30Day: null,
      avg90Day: null,
      lowestPriceObserved: history.length > 0 ? history[0].price : null,
      highestPriceObserved: history.length > 0 ? history[0].price : null,
      priceChangePercentage: null,
      trendDirection: 'insufficient_data',
      isHistoricalLow: false,
      purchaseRecommendation: 'insufficient_history',
      dataPointsCount: history.length,
      lastVerifiedAt: history.length > 0 ? history[history.length - 1].timestamp : null,
    };
  }

  const now = Date.now();
  const getFilterAvg = (days: number): number | null => {
    const cutoff = now - days * 24 * 60 * 60 * 1000;
    const items = history.filter((h) => new Date(h.timestamp).getTime() >= cutoff);
    if (items.length === 0) return null;
    const sum = items.reduce((acc, curr) => acc + curr.price, 0);
    return Math.round(sum / items.length);
  };

  const avg7Day = getFilterAvg(7);
  const avg30Day = getFilterAvg(30) || getFilterAvg(90) || Math.round(history.reduce((a, b) => a + b.price, 0) / history.length);
  const avg90Day = getFilterAvg(90) || avg30Day;

  const prices = history.map((h) => h.price);
  const lowestPriceObserved = Math.min(...prices, currentPrice);
  const highestPriceObserved = Math.max(...prices, currentPrice);

  const priceChangePercentage = Math.round(((currentPrice - avg30Day) / avg30Day) * 100);
  const isHistoricalLow = currentPrice <= lowestPriceObserved;

  let trendDirection: TrendDirection = 'stable';
  if (priceChangePercentage <= -5) {
    trendDirection = 'falling';
  } else if (priceChangePercentage >= 5) {
    trendDirection = 'rising';
  }

  let purchaseRecommendation: PurchaseRecommendation = 'fair_price';
  if (isHistoricalLow || priceChangePercentage <= -10) {
    purchaseRecommendation = 'good_time_to_buy';
  } else if (priceChangePercentage >= 10) {
    purchaseRecommendation = 'wait_for_price_drop';
  }

  return {
    avg7Day,
    avg30Day,
    avg90Day,
    lowestPriceObserved,
    highestPriceObserved,
    priceChangePercentage,
    trendDirection,
    isHistoricalLow,
    purchaseRecommendation,
    dataPointsCount: history.length,
    lastVerifiedAt: history[history.length - 1].timestamp,
  };
}

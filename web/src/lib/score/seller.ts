import { FactorScore } from './types';

export function calculateSellerReliabilityScore(store: string, sourceType: string): FactorScore {
  const maxScore = 10;
  const storeLower = store.toLowerCase();

  let score = 7;
  let details = 'Standard seller reliability';

  if (sourceType === 'api' || sourceType === 'affiliate') {
    score = 10;
    details = `Official ${store} API listing (10/10 pts)`;
  } else if (['amazon', 'flipkart', 'ebay', 'croma', 'tatacliq', 'myntra', 'walmart'].includes(storeLower)) {
    score = 9;
    details = `Verified top-tier merchant ${store} (9/10 pts)`;
  } else if (sourceType === 'mock') {
    score = 5;
    details = 'Unverified data source (5/10 pts)';
  }

  return {
    score,
    maxScore,
    status: 'available',
    details,
  };
}

export function calculateReturnWarrantyScore(deliveryText?: string, store?: string): FactorScore {
  const maxScore = 10;

  if (deliveryText && (deliveryText.toLowerCase().includes('return') || deliveryText.toLowerCase().includes('warranty'))) {
    return {
      score: 10,
      maxScore,
      status: 'available',
      details: `Verified return/warranty: "${deliveryText}" (10/10 pts)`,
    };
  }

  const storeLower = (store || '').toLowerCase();
  if (['amazon', 'flipkart', 'ebay', 'myntra', 'croma'].includes(storeLower)) {
    return {
      score: 8,
      maxScore,
      status: 'available',
      details: `${store} standard 7-10 day return policy (8/10 pts)`,
    };
  }

  return {
    score: 0,
    maxScore,
    status: 'unavailable',
    details: 'Return & warranty details unverified',
  };
}

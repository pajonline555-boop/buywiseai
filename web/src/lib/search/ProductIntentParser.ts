import { normalizeSearchQuery, NormalizedQueryIntent } from './QueryNormalizer';

export type SearchQueryType =
  | 'PRODUCT'
  | 'CATEGORY'
  | 'BRAND'
  | 'GENERIC_ITEM'
  | 'ATTRIBUTE'
  | 'PRICE_INTENT'
  | 'SHOPPING_INTENT';

export interface ParsedSearchIntent {
  queryType: SearchQueryType;
  intent: NormalizedQueryIntent;
  confidence: number;
}

export function parseSearchIntent(rawQuery: string): ParsedSearchIntent {
  const intent = normalizeSearchQuery(rawQuery);
  const lower = rawQuery.toLowerCase().trim();

  let queryType: SearchQueryType = 'SHOPPING_INTENT';
  let confidence = 0.85;

  if (intent.maxPriceFilter) {
    queryType = 'PRICE_INTENT';
  } else if (lower.includes('iphone') || lower.includes('macbook') || lower.includes('airpods') || lower.includes('galaxy s24')) {
    queryType = 'PRODUCT';
    confidence = 0.98;
  } else if (intent.category === 'GROCERY') {
    queryType = 'GENERIC_ITEM';
    confidence = 0.95;
  } else if (intent.attributes.some((a) => a.startsWith('color:'))) {
    queryType = 'ATTRIBUTE';
  } else if (intent.brand) {
    queryType = 'BRAND';
  } else {
    queryType = 'CATEGORY';
  }

  return {
    queryType,
    intent,
    confidence,
  };
}

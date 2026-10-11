import { StoreOffer } from '../retailers/types';
import { NormalizedQueryIntent } from './QueryNormalizer';

export function rankSearchResults(offers: StoreOffer[], intent: NormalizedQueryIntent): StoreOffer[] {
  return [...offers].sort((a, b) => {
    const scoreA = calculateOfferRankScore(a, intent);
    const scoreB = calculateOfferRankScore(b, intent);
    return scoreB - scoreA;
  });
}

export function calculateOfferRankScore(offer: StoreOffer, intent: NormalizedQueryIntent): number {
  let score = 0;
  const titleLower = offer.title.toLowerCase();
  const queryLower = intent.normalizedQuery.toLowerCase();

  // 1. Exact query token match
  if (titleLower.includes(queryLower)) {
    score += 40;
  } else {
    const tokens = queryLower.split(/\s+/);
    const matched = tokens.filter((t) => titleLower.includes(t));
    score += (matched.length / Math.max(tokens.length, 1)) * 25;
  }

  // 2. Brand match
  if (intent.brand && titleLower.includes(intent.brand.toLowerCase())) {
    score += 20;
  }

  // 3. Pack / size match (e.g. 5kg)
  if (intent.packSize && titleLower.includes(intent.packSize.toLowerCase())) {
    score += 15;
  }

  // 4. Availability
  if (offer.availability === 'in_stock') {
    score += 10;
  }

  // 5. Smart Value Score factor if calculated
  if (offer.smartValueScore) {
    score += Math.round(offer.smartValueScore / 10);
  }

  return score;
}

import { FactorScore } from './types';

export function calculatePriceCompetitivenessScore(
  price: number,
  minPrice: number,
  maxPrice: number
): FactorScore {
  const maxScore = 35;

  if (price <= 0 || isNaN(price)) {
    return {
      score: 0,
      maxScore,
      status: 'unavailable',
      details: 'Price unverified',
    };
  }

  if (minPrice <= 0 || price <= minPrice) {
    return {
      score: maxScore,
      maxScore,
      status: 'available',
      details: `₹${price.toLocaleString()} (Lowest active price)`,
    };
  }

  // Calculate percentage price markup over minimum price
  const percentMarkup = (price - minPrice) / minPrice; // e.g. 0.0375 for 3.75% higher
  const penalty = Math.min(1.0, percentMarkup * 3); // 3x multiplier on percentage difference
  const score = Math.round(maxScore * (1 - penalty));

  return {
    score,
    maxScore,
    status: 'available',
    details: `₹${price.toLocaleString()} (${score}/${maxScore} pts)`,
  };
}

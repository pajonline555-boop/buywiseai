import { FactorScore } from './types';

export function calculateProductRatingScore(rating?: number): FactorScore {
  const maxScore = 20;

  if (typeof rating !== 'number' || isNaN(rating) || rating <= 0) {
    return {
      score: 0,
      maxScore,
      status: 'unavailable',
      details: 'Product rating unavailable',
    };
  }

  const clamped = Math.min(5.0, Math.max(1.0, rating));
  const score = Math.round((clamped / 5.0) * maxScore);

  return {
    score,
    maxScore,
    status: 'available',
    details: `⭐ ${clamped.toFixed(1)} / 5.0 (${score}/${maxScore} pts)`,
  };
}

export function calculateReviewStrengthScore(reviewCount?: number): FactorScore {
  const maxScore = 10;

  if (typeof reviewCount !== 'number' || isNaN(reviewCount) || reviewCount <= 0) {
    return {
      score: 0,
      maxScore,
      status: 'unavailable',
      details: 'Review count unavailable',
    };
  }

  let score = 2;
  if (reviewCount >= 10000) score = 10;
  else if (reviewCount >= 1000) score = 8;
  else if (reviewCount >= 100) score = 6;
  else if (reviewCount >= 10) score = 4;

  return {
    score,
    maxScore,
    status: 'available',
    details: `${reviewCount.toLocaleString()} verified reviews (${score}/${maxScore} pts)`,
  };
}

import { StoreOffer } from '../retailers/types';
import { SmartValueScoreBreakdown, SmartValueResult, FactorScore } from './types';
import { calculatePriceCompetitivenessScore } from './price';
import { calculateProductRatingScore, calculateReviewStrengthScore } from './quality';
import { calculateSellerReliabilityScore, calculateReturnWarrantyScore } from './seller';

export function calculateSmartValueScore(
  offer: StoreOffer,
  allOffers: StoreOffer[]
): SmartValueResult {
  const activePrices = allOffers.map(o => o.price).filter(p => p > 0);
  const minPrice = activePrices.length > 0 ? Math.min(...activePrices) : offer.price;
  const maxPrice = activePrices.length > 0 ? Math.max(...activePrices) : offer.price;

  // 1. Calculate Individual Factors
  const priceCompetitiveness = calculatePriceCompetitivenessScore(offer.price, minPrice, maxPrice);
  const productRating = calculateProductRatingScore(offer.rating);
  const reviewStrength = calculateReviewStrengthScore(offer.reviewCount);

  // Match Confidence (Max 15 pts)
  const matchConfidenceRaw = typeof offer.matchConfidence === 'number' ? offer.matchConfidence : 0.80;
  const productMatchConfidence: FactorScore = {
    score: Math.round(matchConfidenceRaw * 15),
    maxScore: 15,
    status: 'available',
    details: `${Math.round(matchConfidenceRaw * 100)}% product match (${Math.round(matchConfidenceRaw * 15)}/15 pts)`,
  };

  const sellerReliability = calculateSellerReliabilityScore(offer.store, offer.sourceType);
  const returnWarranty = calculateReturnWarrantyScore(offer.deliveryText, offer.store);

  const breakdown: SmartValueScoreBreakdown = {
    priceCompetitiveness,
    productRating,
    reviewStrength,
    productMatchConfidence,
    sellerReliability,
    returnWarranty,
  };

  // 2. Dynamic Renormalization for Missing Data
  const factors: FactorScore[] = [
    priceCompetitiveness,
    productRating,
    reviewStrength,
    productMatchConfidence,
    sellerReliability,
    returnWarranty,
  ];

  let availableSum = 0;
  let availableMax = 0;

  factors.forEach(f => {
    if (f.status === 'available') {
      availableSum += f.score;
      availableMax += f.maxScore;
    }
  });

  const totalScore = availableMax > 0 ? Math.round((availableSum / availableMax) * 100) : 50;

  // 3. Score Reasoning Explanation
  const isLowest = offer.price === minPrice;
  const reasoning = generateScoreReasoning(offer, totalScore, isLowest);

  return {
    totalScore,
    breakdown,
    reasoning,
    isBestValue: false, // Tagged during batch evaluation
    isBestMatch: false,
    isLowestPrice: isLowest,
  };
}

function generateScoreReasoning(offer: StoreOffer, totalScore: number, isLowest: boolean): string {
  const matchPct = Math.round((offer.matchConfidence || 0.8) * 100);
  const ratingText = offer.rating ? `⭐${offer.rating.toFixed(1)} rating` : 'verified merchant';
  const priceText = isLowest ? `lowest price of ₹${offer.price.toLocaleString()}` : `listed price of ₹${offer.price.toLocaleString()}`;

  return `Smart Value Score: ${totalScore}/100 combining ${priceText}, ${ratingText}, and ${matchPct}% product match.`;
}

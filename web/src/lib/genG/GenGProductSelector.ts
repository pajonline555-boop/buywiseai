import { GenGProduct, validateGenGProduct } from './GenGProductValidator';

/**
 * Calculates explainable ranking score for candidate Gen-G products.
 */
export function calculateGenGSelectionScore(product: GenGProduct): { score: number; reason: string } {
  let score = 50; // Base score
  const factors: string[] = [];

  // Availability factor
  if (product.availability === 'in_stock') {
    score += 20;
    factors.push('In Stock (+20)');
  }

  // Price competitiveness / Verified Discount
  if (product.discountPercent && product.discountPercent > 10) {
    const discountBonus = Math.min(20, Math.round(product.discountPercent / 2));
    score += discountBonus;
    factors.push(`Verified Deal (${product.discountPercent}% off, +${discountBonus})`);
  }

  // Rating evidence (only if officially available from retailer)
  if (product.rating && product.rating >= 4.0) {
    const ratingBonus = Math.round((product.rating - 3.5) * 10);
    score += ratingBonus;
    factors.push(`High Rating (${product.rating}★, +${ratingBonus})`);
  }

  // Data Freshness
  const verifiedAgeMs = Date.now() - new Date(product.lastVerifiedAt).getTime();
  if (verifiedAgeMs < 24 * 60 * 60 * 1000) {
    score += 10;
    factors.push('Live Verified (<24h, +10)');
  }

  const reason = `Featured Gen-G Product selected based on ${factors.join(', ')}`;
  return { score, reason };
}

/**
 * Selects exactly ONE top product per configured retailer according to explainable rules.
 */
export function selectTopProductForRetailer(retailerId: string, candidates: GenGProduct[]): GenGProduct | null {
  const validCandidates: Array<{ product: GenGProduct; score: number; reason: string }> = [];

  for (const candidate of candidates) {
    if (candidate.retailerId.toLowerCase() === retailerId.toLowerCase()) {
      const val = validateGenGProduct(candidate);
      if (val.isValid && val.product) {
        const { score, reason } = calculateGenGSelectionScore(val.product);
        validCandidates.push({
          product: { ...val.product, selectionScore: score, selectionReason: reason },
          score,
          reason,
        });
      }
    }
  }

  if (validCandidates.length === 0) return null;

  // Sort by score descending
  validCandidates.sort((a, b) => b.score - a.score);
  return validCandidates[0].product;
}

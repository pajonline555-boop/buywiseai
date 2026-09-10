import { StoreOffer } from '../retailers/types';
import { CanonicalProduct } from '../query/types';

export interface MatchClassificationResult {
  matchType: 'exact' | 'variant' | 'similar';
  matchConfidence: number;
  identityConfidence: number;
  attributeMatchScore: number;
  visualSimilarityScore: number;
}

export function classifyProductMatch(
  offer: StoreOffer,
  canonical: CanonicalProduct
): MatchClassificationResult {
  const offerTitle = offer.title.toLowerCase();
  const canonicalBrand = canonical.brand ? canonical.brand.toLowerCase() : null;
  const canonicalModel = canonical.model ? canonical.model.toLowerCase() : null;
  const canonicalCategory = canonical.category ? canonical.category.toLowerCase() : null;
  const canonicalSubcategory = canonical.subcategory ? canonical.subcategory.toLowerCase() : null;

  // --- LAYER 1: PRODUCT IDENTITY CONFIDENCE (Model / SKU / GTIN Verification) ---
  let identityConfidence = 0.50; // Neutral default when model is unknown

  if (canonicalModel) {
    if (offerTitle.includes(canonicalModel)) {
      // Check for variant model extension mismatch (e.g. "270 react" vs "270")
      const titleWords = offerTitle.split(/\s+/);
      const modelIndex = titleWords.findIndex(w => w.includes(canonicalModel));
      const nextWord = modelIndex >= 0 && modelIndex + 1 < titleWords.length ? titleWords[modelIndex + 1] : '';
      
      const variantExtensions = ['react', 'flyknit', 'ultra', 'plus', 'pro', 'max', 'lite', 'se'];
      const hasVariantExtension = variantExtensions.includes(nextWord);

      if (hasVariantExtension && !canonical.productName?.toLowerCase().includes(nextWord)) {
        // Offer is a distinct model variant
        identityConfidence = 0.45;
      } else {
        // High-confidence exact model match
        identityConfidence = 0.95;
      }
    } else {
      // Expected model is completely missing from offer title
      identityConfidence = 0.20;
    }
  } else if (canonical.productName) {
    const nameWords = canonical.productName.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const matches = nameWords.filter(w => offerTitle.includes(w));
    if (nameWords.length > 0) {
      identityConfidence = Math.min(0.85, (matches.length / nameWords.length) * 0.85);
    }
  }

  // --- LAYER 2: ATTRIBUTE MATCH SCORE (Brand, Category, Color, Gender) ---
  let attributeScore = 0;

  // Brand (weight: 0.40)
  if (canonicalBrand && offerTitle.includes(canonicalBrand)) {
    attributeScore += 0.40;
  }

  // Category / Subcategory with Synonym Matching (weight: 0.30)
  const isFootwear = canonicalCategory === 'footwear' || canonicalSubcategory === 'running_shoes';
  const hasFootwearTerm = offerTitle.includes('shoes') || offerTitle.includes('sneakers') || offerTitle.includes('footwear');

  if (canonicalSubcategory && offerTitle.includes(canonicalSubcategory)) {
    attributeScore += 0.30;
  } else if (isFootwear && hasFootwearTerm) {
    attributeScore += 0.25;
  } else if (canonicalCategory && offerTitle.includes(canonicalCategory)) {
    attributeScore += 0.20;
  }

  // Color (weight: 0.15)
  if (canonical.colors && canonical.colors.length > 0) {
    const colorMatch = canonical.colors.some(c => offerTitle.includes(c.toLowerCase()));
    if (colorMatch) attributeScore += 0.15;
  }

  // Gender (weight: 0.15)
  if (canonical.gender && offerTitle.includes(canonical.gender.toLowerCase())) {
    attributeScore += 0.15;
  }

  const attributeMatchScore = Math.min(1.0, parseFloat(attributeScore.toFixed(2)));

  // --- LAYER 3: VISUAL & FEATURE SIMILARITY SCORE ---
  let visualScore = 0.40;

  if (canonical.styles && canonical.styles.length > 0) {
    const styleMatch = canonical.styles.some(s => offerTitle.includes(s.toLowerCase()));
    if (styleMatch) visualScore += 0.30;
  }

  if (canonical.visualFeatures && canonical.visualFeatures.length > 0) {
    const featureMatch = canonical.visualFeatures.some(f => offerTitle.includes(f.toLowerCase()));
    if (featureMatch) visualScore += 0.30;
  }

  const visualSimilarityScore = Math.min(1.0, parseFloat(visualScore.toFixed(2)));

  // --- OVERALL MATCH CONFIDENCE (Weighted Combination) ---
  const overallRaw = (identityConfidence * 0.55) + (attributeMatchScore * 0.35) + (visualSimilarityScore * 0.10);
  const overallMatchConfidence = Math.min(0.98, Math.max(0.10, parseFloat(overallRaw.toFixed(2))));

  // --- STRICT EXACT MATCH GROUPING BOUNDARIES ---
  let matchType: 'exact' | 'variant' | 'similar' = 'similar';

  if (identityConfidence >= 0.85 && attributeMatchScore >= 0.65 && overallMatchConfidence >= 0.78) {
    matchType = 'exact';
  } else if (overallMatchConfidence >= 0.45 && attributeMatchScore >= 0.45) {
    matchType = 'variant';
  } else {
    matchType = 'similar';
  }

  return {
    matchType,
    matchConfidence: overallMatchConfidence,
    identityConfidence,
    attributeMatchScore,
    visualSimilarityScore,
  };
}

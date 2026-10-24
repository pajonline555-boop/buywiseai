import { StoreOffer } from '../retailers/types';
import { CanonicalProduct } from '../query/types';

export interface MatchClassificationResult {
  matchType: 'exact' | 'variant' | 'similar';
  matchConfidence: number;
  identityConfidence: number;
  attributeMatchScore: number;
  visualSimilarityScore: number;
  tier: 'PREMIUM' | 'LUXURY';
  isSameProductAndVariant: boolean;
  differenceReason?: string;
}

const LUXURY_BRANDS = new Set([
  'puma', 'nike', 'adidas', 'under armour', 'asics', 'new balance',
  'on running', 'skechers', 'reebok', 'jordan', 'converse', 'brooks',
  'salomon', 'apple', 'sony', 'bose', 'sennheiser', 'bang & olufsen',
  'ralph lauren', 'tommy hilfiger', 'calvin klein', 'armani', 'hugo boss',
  'allen solly', 'louis philippe', 'van heusen'
]);

const VALUE_PREMIUM_BRANDS = new Set([
  'lancer', 'asian', 'campus', 'sparx', 'bata', 'red tape', 'action',
  'abros', 'liberty', 'power', 'veirdo', 'roadster', 'ben martin',
  'fort collins', 'boat', 'noise', 'fire-boltt', 'realme', 'redmi', 'poco'
]);

export function extractBrandFromText(text: string): string | null {
  const lower = (text || '').toLowerCase();
  for (const b of Array.from(LUXURY_BRANDS).concat(Array.from(VALUE_PREMIUM_BRANDS))) {
    const regex = new RegExp(`\\b${b}\\b`, 'i');
    if (regex.test(lower)) {
      return b.toUpperCase();
    }
  }
  return null;
}

export function extractSneakerModel(text: string): string | null {
  const lower = (text || '').toLowerCase();
  // Match patterns like Wonder-3, Wonder-10, Wonder-13, Flyer Runner, Revolution 6, Air Max 270, Gel-Contend
  const wonderMatch = lower.match(/\bwonder\s*[-]?\s*(\d+[a-z0-9-]*)/i);
  if (wonderMatch) {
    return `WONDER-${wonderMatch[1].toUpperCase()}`;
  }
  if (lower.includes('flyer runner')) return 'FLYER RUNNER';
  if (lower.includes('revolution')) return 'REVOLUTION';
  if (lower.includes('runfalcon')) return 'RUNFALCON';
  if (lower.includes('gel-contend') || lower.includes('gel contend')) return 'GEL-CONTEND';
  if (lower.includes('fresh foam')) return 'FRESH FOAM';
  return null;
}

export function extractSizeFromText(text: string): string | null {
  const lower = (text || '').toLowerCase();
  const sizeMatch = lower.match(/\b(?:uk|us|eu|size)\s*[:.-]?\s*(\d{1,2}(?:\.\d)?)\b/i);
  if (sizeMatch) {
    return `UK ${sizeMatch[1]}`;
  }
  return null;
}

export function classifyProductTier(
  offer: StoreOffer,
  canonical?: CanonicalProduct
): 'PREMIUM' | 'LUXURY' {
  if (offer.tier) return offer.tier;

  const brand = (offer.brand || extractBrandFromText(offer.title) || canonical?.brand || '').toLowerCase();

  // If identifiable global / luxury brand
  for (const lb of Array.from(LUXURY_BRANDS)) {
    if (brand.includes(lb) || offer.title.toLowerCase().includes(lb)) {
      return 'LUXURY';
    }
  }

  // If known budget / value domestic brand
  for (const vb of Array.from(VALUE_PREMIUM_BRANDS)) {
    if (brand.includes(vb) || offer.title.toLowerCase().includes(vb)) {
      return 'PREMIUM';
    }
  }

  // Price-based tier inference for unspecified footwear/apparel
  if (offer.price >= 2500) {
    return 'LUXURY';
  }

  return 'PREMIUM';
}

export function extractFabricFromText(text: string): string | null {
  const lower = (text || '').toLowerCase();
  if (lower.includes('100% cotton') || lower.includes('pure cotton')) return '100% Cotton';
  if (lower.includes('banarasi silk') || lower.includes('banarasi festive silk')) return 'Banarasi Silk';
  if (lower.includes('cotton blend')) return 'Cotton Blend';
  if (lower.includes('cotton')) return 'Cotton';
  if (lower.includes('crepe')) return 'Crepe';
  if (lower.includes('georgette')) return 'Georgette';
  if (lower.includes('silk')) return 'Silk';
  if (lower.includes('chiffon')) return 'Chiffon';
  if (lower.includes('denim')) return 'Denim';
  if (lower.includes('linen')) return 'Linen';
  if (lower.includes('polyester')) return 'Polyester';
  if (lower.includes('net') || lower.includes('tulle')) return 'Net / Tulle';
  if (lower.includes('rayon') || lower.includes('viscose')) return 'Rayon';
  return null;
}

export function extractPackCountFromText(text: string): number {
  const lower = (text || '').toLowerCase();
  const packMatch = lower.match(/\bpack\s*of\s*(\d+)\b/i) ||
                    lower.match(/\bset\s*of\s*(\d+)\b/i) ||
                    lower.match(/\b(\d+)\s*(?:pack|pcs|pieces)\b/i);
  if (packMatch) {
    const qty = parseInt(packMatch[1], 10);
    if (!isNaN(qty) && qty > 0) return qty;
  }
  return 1;
}

export function isSameProductAndVariant(a: StoreOffer, b: StoreOffer): boolean {
  // Brand check - Different brands must never be the same product
  const brandA = (a.brand || extractBrandFromText(a.title) || '').toLowerCase();
  const brandB = (b.brand || extractBrandFromText(b.title) || '').toLowerCase();
  if (brandA && brandB && brandA !== brandB) {
    return false;
  }

  // Gender check (Men vs Women/Girls) - Different genders are distinct products
  const aMen = /\b(men|mens|men's|boy|boys)\b/i.test(a.title);
  const aWomen = /\b(women|womens|women's|girls|girl|ladies)\b/i.test(a.title);
  const bMen = /\b(men|mens|men's|boy|boys)\b/i.test(b.title);
  const bWomen = /\b(women|womens|women's|girls|girl|ladies)\b/i.test(b.title);
  if ((aMen && bWomen && !aWomen) || (aWomen && bMen && !bMen)) {
    return false;
  }

  // Pack Count check - Pack of 1 vs Pack of 5 must NEVER be declared the same product
  const packA = a.packQty || a.variant?.packQty || extractPackCountFromText(a.title);
  const packB = b.packQty || b.variant?.packQty || extractPackCountFromText(b.title);
  if (packA !== packB) {
    return false;
  }

  // Fabric / Material check - Cotton vs Crepe vs Polyester must NEVER be grouped as same product
  const fabricA = a.fabric || a.variant?.fabric || extractFabricFromText(a.title);
  const fabricB = b.fabric || b.variant?.fabric || extractFabricFromText(b.title);
  if (fabricA && fabricB && fabricA.toLowerCase() !== fabricB.toLowerCase()) {
    return false;
  }

  // Model check (e.g., Wonder-3 vs Wonder-13)
  const modelA = (a.model || extractSneakerModel(a.title) || '').toUpperCase();
  const modelB = (b.model || extractSneakerModel(b.title) || '').toUpperCase();
  if (modelA && modelB && modelA !== modelB) {
    return false;
  }

  // Variant check (Size) - Different sizes are distinct variants
  const sizeA = a.variant?.size || extractSizeFromText(a.title);
  const sizeB = b.variant?.size || extractSizeFromText(b.title);
  if (sizeA && sizeB && sizeA.toUpperCase() !== sizeB.toUpperCase()) {
    return false;
  }

  // Variant check (Color) - Different colors are distinct variants
  const colorA = a.variant?.color;
  const colorB = b.variant?.color;
  if (colorA && colorB && colorA.toLowerCase() !== colorB.toLowerCase()) {
    return false;
  }

  // If product IDs / ASINs / SKUs match exactly and attributes do not conflict
  if (a.productId && b.productId && a.productId.toUpperCase() === b.productId.toUpperCase()) {
    return true;
  }

  // Check significant title word overlap if brand and fabric match
  if (brandA && brandB && brandA === brandB) {
    const titleA = a.title || a.productTitle || '';
    const titleB = b.title || b.productTitle || '';
    const cleanWordsA = titleA.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 3);
    const cleanWordsB = titleB.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 3);
    const common = cleanWordsA.filter(w => cleanWordsB.includes(w));
    if (common.length >= 3) {
      return true;
    }
  }

  return Boolean(brandA && modelA && brandA === brandB && modelA === modelB);
}

export function groupSameProductsAcrossRetailers(offers: StoreOffer[]): import('../retailers/types').SameProductGroup[] {
  const groups: Array<{
    id: string;
    productTitle: string;
    brand?: string;
    model?: string;
    fabric?: string;
    style?: string;
    variantInfo?: string;
    primaryImageUrl?: string;
    offers: StoreOffer[];
  }> = [];

  for (const offer of offers) {
    let matchedGroup = groups.find(g => g.offers.some(existing => isSameProductAndVariant(existing, offer)));
    if (matchedGroup) {
      matchedGroup.offers.push(offer);
    } else {
      const titleText = offer.title || offer.productTitle || '';
      const brand = offer.brand || extractBrandFromText(titleText) || undefined;
      const model = offer.model || extractSneakerModel(titleText) || undefined;
      const fabric = offer.fabric || offer.variant?.fabric || extractFabricFromText(titleText) || undefined;
      const pack = offer.packQty || offer.variant?.packQty || extractPackCountFromText(titleText);
      const variantInfo = [fabric, pack > 1 ? `Pack of ${pack}` : undefined, offer.variant?.size].filter(Boolean).join(' · ');

      groups.push({
        id: `spg-${groups.length + 1}-${Date.now()}`,
        productTitle: titleText,
        brand,
        model,
        fabric,
        style: offer.style,
        variantInfo: variantInfo || undefined,
        primaryImageUrl: offer.imageUrl,
        offers: [offer],
      });
    }
  }

  return groups.map(g => {
    // Sort offers within group by effective price ascending
    g.offers.sort((a, b) => (a.effectivePayablePrice || a.price) - (b.effectivePayablePrice || b.price));
    const lowestPrice = g.offers[0].effectivePayablePrice || g.offers[0].price;
    const highestPrice = g.offers[g.offers.length - 1].effectivePayablePrice || g.offers[g.offers.length - 1].price;

    return {
      id: g.id,
      productTitle: g.productTitle,
      brand: g.brand,
      model: g.model,
      fabric: g.fabric,
      style: g.style,
      variantInfo: g.variantInfo,
      primaryImageUrl: g.primaryImageUrl,
      lowestPrice,
      highestPrice,
      storeCount: new Set(g.offers.map(o => o.store)).size,
      offers: g.offers,
    };
  });
}


export function classifyProductMatch(
  offer: StoreOffer,
  canonical: CanonicalProduct
): MatchClassificationResult {
  const offerTitle = offer.title.toLowerCase();
  const offerBrand = (offer.brand || extractBrandFromText(offer.title) || '').toLowerCase();
  const canonicalBrand = (canonical.brand || '').toLowerCase();

  const offerModel = (offer.model || extractSneakerModel(offer.title) || '').toLowerCase();
  const canonicalModel = (canonical.model || extractSneakerModel(canonical.rawInput) || '').toLowerCase();

  const tier = classifyProductTier(offer, canonical);

  // --- BRAND CONFLICT CHECK ---
  // If user searched for a specific brand (e.g. Lancer) and the offer is a distinct brand (e.g. Asian or Puma),
  // they are completely different products!
  if (canonicalBrand && offerBrand && canonicalBrand !== offerBrand) {
    return {
      matchType: 'similar',
      matchConfidence: 0.15,
      identityConfidence: 0.05,
      attributeMatchScore: 0.10,
      visualSimilarityScore: 0.40,
      tier,
      isSameProductAndVariant: false,
      differenceReason: `Brand mismatch: Expected ${canonical.brand}, found ${offer.brand || offerBrand}`,
    };
  }

  // --- GENDER CONFLICT CHECK ---
  const canonicalText = (canonical.title || canonical.rawInput || '').toLowerCase();
  const isCanonicalMen = /\b(men|mens|men's)\b/i.test(canonicalText);
  const isOfferWomen = /\b(women|womens|women's|ladies|girl|girls)\b/i.test(offerTitle);
  const isCanonicalWomen = /\b(women|womens|women's|ladies|girl|girls)\b/i.test(canonicalText);
  const isOfferMen = /\b(men|mens|men's|boy|boys)\b/i.test(offerTitle);

  if ((isCanonicalMen && isOfferWomen) || (isCanonicalWomen && isOfferMen)) {
    return {
      matchType: 'similar',
      matchConfidence: 0.25,
      identityConfidence: 0.15,
      attributeMatchScore: 0.20,
      visualSimilarityScore: 0.40,
      tier,
      isSameProductAndVariant: false,
      differenceReason: `Gender mismatch: Target is for ${isCanonicalMen ? 'Men' : 'Women'}, but offer is for ${isOfferWomen ? 'Women' : 'Men'}`,
    };
  }

  // --- MODEL SPECIFICITY CHECK ---
  // E.g., Lancer Wonder-3 vs Lancer Wonder-10
  if (canonicalModel && offerModel && canonicalModel !== offerModel) {
    return {
      matchType: 'similar',
      matchConfidence: 0.35,
      identityConfidence: 0.20,
      attributeMatchScore: 0.50,
      visualSimilarityScore: 0.50,
      tier,
      isSameProductAndVariant: false,
      differenceReason: `Model mismatch: Expected ${canonicalModel}, found ${offerModel}`,
    };
  }

  // --- VARIANT ATTRIBUTE CHECK (Size / Color) ---
  const offerSize = offer.variant?.size || extractSizeFromText(offer.title);
  const canonicalSize = extractSizeFromText(canonical.rawInput);

  let isVariantMismatch = false;
  let variantReason = '';
  if (canonicalSize && offerSize && canonicalSize.toUpperCase() !== offerSize.toUpperCase()) {
    isVariantMismatch = true;
    variantReason = `Size difference: Expected ${canonicalSize}, offer is ${offerSize}`;
  }

  // --- IDENTITY CONFIDENCE CALCULATION ---
  let identityConfidence = 0.50;

  if (canonicalModel && offerModel && canonicalModel === offerModel) {
    identityConfidence = 0.95;
  } else if (canonicalBrand && offerBrand && canonicalBrand === offerBrand) {
    identityConfidence = 0.80;
  } else if (canonical.productName) {
    const nameWords = canonical.productName.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const matches = nameWords.filter(w => offerTitle.includes(w));
    if (nameWords.length > 0) {
      identityConfidence = Math.min(0.85, (matches.length / nameWords.length) * 0.85);
    }
  }

  // --- ATTRIBUTE MATCH SCORE ---
  let attributeScore = 0;
  if (canonicalBrand && (offerBrand === canonicalBrand || offerTitle.includes(canonicalBrand))) {
    attributeScore += 0.40;
  }

  const isFootwear = canonical.category === 'footwear' || offerTitle.includes('shoes') || offerTitle.includes('sneakers');
  if (isFootwear) {
    attributeScore += 0.30;
  }

  const attributeMatchScore = Math.min(1.0, parseFloat(attributeScore.toFixed(2)));
  const visualSimilarityScore = 0.60;

  // --- OVERALL MATCH CONFIDENCE ---
  const overallRaw = (identityConfidence * 0.55) + (attributeMatchScore * 0.35) + (visualSimilarityScore * 0.10);
  const overallMatchConfidence = Math.min(0.98, Math.max(0.10, parseFloat(overallRaw.toFixed(2))));

  let matchType: 'exact' | 'variant' | 'similar' = 'similar';
  if (isVariantMismatch) {
    matchType = 'variant';
  } else if (identityConfidence >= 0.85 && attributeMatchScore >= 0.65 && overallMatchConfidence >= 0.75) {
    matchType = 'exact';
  } else if (overallMatchConfidence >= 0.45 && attributeMatchScore >= 0.35) {
    matchType = 'variant';
  } else {
    matchType = 'similar';
  }

  const isSame = matchType === 'exact' && !isVariantMismatch;

  return {
    matchType,
    matchConfidence: overallMatchConfidence,
    identityConfidence,
    attributeMatchScore,
    visualSimilarityScore,
    tier,
    isSameProductAndVariant: isSame,
    differenceReason: isVariantMismatch ? variantReason : undefined,
  };
}

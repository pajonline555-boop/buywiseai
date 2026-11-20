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
  matchExplanation?: {
    categoryMatch: boolean;
    materialMatch: boolean;
    colorMatch: boolean;
    styleMatch: boolean;
    brandMatch: boolean;
    matchingAttributes: string[];
    differingAttributes: string[];
    summary: string;
  };
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
  if (lower.includes('velvet')) return 'Velvet';
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
  if (lower.includes('organza')) return 'Organza';
  if (lower.includes('satin')) return 'Satin';
  if (lower.includes('chanderi')) return 'Chanderi';
  if (lower.includes('net') || lower.includes('tulle')) return 'Net / Tulle';
  if (lower.includes('rayon') || lower.includes('viscose')) return 'Rayon';
  return null;
}

export function extractGarmentType(text: string): string | null {
  const lower = (text || '').toLowerCase();
  if (/\b(salwar\s*(?:kameez|suit)?|straight\s*pant\s*suit|anarkali\s*(?:suit|dress)?|sharara\s*(?:suit|set)?|palazzo\s*suit|punjabi\s*suit|ethnic\s*suit|pant\s*suit|suit\s*set)\b/i.test(lower)) {
    return 'salwar_suit';
  }
  if (/\b(saree|sari)\b/i.test(lower)) return 'saree';
  if (/\b(lehenga|ghagra|chaniya\s*choli)\b/i.test(lower)) return 'lehenga';
  if (/\b(kurti|kurta)\b/i.test(lower)) return 'kurti';
  if (/\b(kamarbandh|waistband|tagdi|belly\s*chain|waist\s*belt)\b/i.test(lower)) return 'waistband_accessory';
  if (/\b(dress|frock|gown|midi\s*dress|maxi\s*dress)\b/i.test(lower)) return 'dress';
  if (/\b(jeans|denim|jeggings)\b/i.test(lower)) return 'jeans';
  if (/\b(t-?shirt|tee)\b/i.test(lower)) return 'tshirt';
  if (/\b(shirt)\b/i.test(lower)) return 'shirt';
  if (/\b(jacket|coat|hoodie|bomber|blazer)\b/i.test(lower)) return 'jacket';
  if (/\b(shoes?|sneakers?|boots?|sandals?|footwear)\b/i.test(lower)) return 'footwear';
  if (/\b(washing\s*machine|refrigerator|fridge|air\s*conditioner|ac|microwave)\b/i.test(lower)) return 'appliance';
  if (/\b(phone|smartphone|iphone|mobile)\b/i.test(lower)) return 'phone';
  if (/\b(laptop|macbook)\b/i.test(lower)) return 'laptop';
  if (/\b(headphone|earphone|earbuds)\b/i.test(lower)) return 'audio';
  if (/\b(tv|television)\b/i.test(lower)) return 'tv';
  if (/\b(lipstick|makeup|cosmetics|serum|sunscreen)\b/i.test(lower)) return 'beauty';
  return null;
}

export function extractColorsFromText(text: string): string[] {
  const lower = (text || '').toLowerCase();
  const colors: string[] = [];
  if (/\b(dark\s*teal|teal|peacock\s*blue|cyan)\b/i.test(lower)) colors.push('teal');
  if (/\b(navy\s*blue|royal\s*blue|sky\s*blue|blue)\b/i.test(lower)) colors.push('blue');
  if (/\b(emerald\s*green|bottle\s*green|olive\s*green|mint\s*green|green)\b/i.test(lower)) colors.push('green');
  if (/\b(maroon|burgundy|wine|crimson|ruby|red)\b/i.test(lower)) colors.push('red');
  if (/\b(pink|magenta|rose|fuchsia)\b/i.test(lower)) colors.push('pink');
  if (/\b(yellow|mustard|gold|golden)\b/i.test(lower)) colors.push('yellow');
  if (/\b(black|charcoal)\b/i.test(lower)) colors.push('black');
  if (/\b(white|ivory|cream|off-?white)\b/i.test(lower)) colors.push('white');
  if (/\b(purple|violet|lavender)\b/i.test(lower)) colors.push('purple');
  if (/\b(orange|peach|coral|rust)\b/i.test(lower)) colors.push('orange');
  return Array.from(new Set(colors));
}

export function extractEmbroideryStyle(text: string): string[] {
  const lower = (text || '').toLowerCase();
  const styles: string[] = [];
  if (/\b(embroidered|embroidery|thread\s*work)\b/i.test(lower)) styles.push('embroidered');
  if (/\b(zari|zari\s*work|tilla)\b/i.test(lower)) styles.push('zari');
  if (/\b(sequin|sequins|sequence)\b/i.test(lower)) styles.push('sequin');
  if (/\b(gotta\s*patti|gota\s*patti)\b/i.test(lower)) styles.push('gotta_patti');
  if (/\b(mirror\s*work|kutchi\s*mirror)\b/i.test(lower)) styles.push('mirror_work');
  if (/\b(printed|floral\s*print|digital\s*print|handblock)\b/i.test(lower)) styles.push('printed');
  if (/\b(solid|plain)\b/i.test(lower)) styles.push('solid');
  return Array.from(new Set(styles));
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
    const matchedGroup = groups.find(g => g.offers.some(existing => isSameProductAndVariant(existing, offer)));
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

  const matchingAttributes: string[] = [];
  const differingAttributes: string[] = [];

  // --- BRAND CONFLICT CHECK ---
  let brandMatch = false;
  if (canonicalBrand && offerBrand) {
    if (canonicalBrand === offerBrand) {
      brandMatch = true;
      matchingAttributes.push(`Brand: ${offer.brand || offerBrand}`);
    } else {
      differingAttributes.push(`Brand: Expected ${canonical.brand}, found ${offer.brand || offerBrand}`);
      return {
        matchType: 'similar',
        matchConfidence: 0.15,
        identityConfidence: 0.05,
        attributeMatchScore: 0.10,
        visualSimilarityScore: 0.35,
        tier,
        isSameProductAndVariant: false,
        differenceReason: `Brand mismatch: Expected ${canonical.brand}, found ${offer.brand || offerBrand}`,
        matchExplanation: {
          categoryMatch: true,
          materialMatch: false,
          colorMatch: false,
          styleMatch: false,
          brandMatch: false,
          matchingAttributes,
          differingAttributes,
          summary: `Different brand: ${canonical.brand} vs ${offer.brand || offerBrand}`,
        },
      };
    }
  }

  // --- GENDER CONFLICT CHECK ---
  const canonicalText = (canonical.title || canonical.rawInput || '').toLowerCase();
  const isCanonicalMen = /\b(men|mens|men's)\b/i.test(canonicalText);
  const isOfferWomen = /\b(women|womens|women's|ladies|girl|girls)\b/i.test(offerTitle);
  const isCanonicalWomen = /\b(women|womens|women's|ladies|girl|girls)\b/i.test(canonicalText);
  const isOfferMen = /\b(men|mens|men's|boy|boys)\b/i.test(offerTitle);

  if ((isCanonicalMen && isOfferWomen) || (isCanonicalWomen && isOfferMen)) {
    differingAttributes.push(`Target audience: ${isCanonicalMen ? 'Men' : 'Women'} vs ${isOfferWomen ? 'Women' : 'Men'}`);
    return {
      matchType: 'similar',
      matchConfidence: 0.20,
      identityConfidence: 0.10,
      attributeMatchScore: 0.15,
      visualSimilarityScore: 0.30,
      tier,
      isSameProductAndVariant: false,
      differenceReason: `Gender mismatch: Target is for ${isCanonicalMen ? 'Men' : 'Women'}, but offer is for ${isOfferWomen ? 'Women' : 'Men'}`,
      matchExplanation: {
        categoryMatch: false,
        materialMatch: false,
        colorMatch: false,
        styleMatch: false,
        brandMatch,
        matchingAttributes,
        differingAttributes,
        summary: `Gender mismatch between target and offer.`,
      },
    };
  }

  // --- GARMENT TYPE / PRODUCT TYPE CHECK ---
  const canonicalGarment = extractGarmentType(canonicalText) || canonical.subcategory?.toLowerCase();
  const offerGarment = extractGarmentType(offerTitle);
  let categoryMatch = true;

  if (canonicalGarment && offerGarment) {
    if (canonicalGarment === offerGarment) {
      matchingAttributes.push(`Garment type: ${canonicalGarment.replace(/_/g, ' ')}`);
    } else {
      categoryMatch = false;
      differingAttributes.push(`Garment type: Expected ${canonicalGarment.replace(/_/g, ' ')}, found ${offerGarment.replace(/_/g, ' ')}`);
    }
  }

  // --- FABRIC / MATERIAL CHECK ---
  const canonicalFabric = canonical.fabric || extractFabricFromText(canonicalText) || (canonical.materials && canonical.materials[0]);
  const offerFabric = offer.fabric || offer.variant?.fabric || extractFabricFromText(offerTitle);
  let materialMatch = false;

  if (canonicalFabric && offerFabric) {
    if (canonicalFabric.toLowerCase() === offerFabric.toLowerCase()) {
      materialMatch = true;
      matchingAttributes.push(`Fabric: ${offerFabric}`);
    } else {
      differingAttributes.push(`Fabric: Target is ${canonicalFabric}, offer is ${offerFabric}`);
    }
  } else if (!canonicalFabric && !offerFabric) {
    materialMatch = true;
  }

  // --- COLOR CHECK ---
  const canonicalColors = canonical.colors && canonical.colors.length > 0 ? canonical.colors.map(c => c.toLowerCase()) : extractColorsFromText(canonicalText);
  const offerColors = offer.variant?.color ? [offer.variant.color.toLowerCase()] : extractColorsFromText(offerTitle);
  let colorMatch = false;

  if (canonicalColors.length > 0 && offerColors.length > 0) {
    const hasCommonColor = canonicalColors.some(c => offerColors.some(oc => oc.includes(c) || c.includes(oc)));
    if (hasCommonColor) {
      colorMatch = true;
      matchingAttributes.push(`Color: ${offerColors.join(', ')}`);
    } else {
      differingAttributes.push(`Color: Expected ${canonicalColors.join('/')}, found ${offerColors.join('/')}`);
    }
  } else {
    colorMatch = true;
  }

  // --- EMBROIDERY / DESIGN STYLE CHECK ---
  const canonicalEmbroidery = extractEmbroideryStyle(canonicalText);
  const offerEmbroidery = extractEmbroideryStyle(offerTitle);
  let styleMatch = false;

  if (canonicalEmbroidery.length > 0 && offerEmbroidery.length > 0) {
    const commonStyles = canonicalEmbroidery.filter(s => offerEmbroidery.includes(s));
    if (commonStyles.length > 0) {
      styleMatch = true;
      matchingAttributes.push(`Design work: ${commonStyles.join(', ')}`);
    } else {
      differingAttributes.push(`Design: Expected ${canonicalEmbroidery.join('/')}, found ${offerEmbroidery.join('/')}`);
    }
  } else {
    styleMatch = true;
  }

  // --- MODEL SPECIFICITY CHECK ---
  if (canonicalModel && offerModel && canonicalModel !== offerModel) {
    differingAttributes.push(`Model: Expected ${canonicalModel}, found ${offerModel}`);
    return {
      matchType: 'similar',
      matchConfidence: 0.35,
      identityConfidence: 0.20,
      attributeMatchScore: 0.40,
      visualSimilarityScore: 0.45,
      tier,
      isSameProductAndVariant: false,
      differenceReason: `Model mismatch: Expected ${canonicalModel}, found ${offerModel}`,
      matchExplanation: {
        categoryMatch,
        materialMatch,
        colorMatch,
        styleMatch,
        brandMatch,
        matchingAttributes,
        differingAttributes,
        summary: `Model mismatch: ${canonicalModel} vs ${offerModel}`,
      },
    };
  }

  // --- VARIANT ATTRIBUTE CHECK (Size) ---
  const offerSize = offer.variant?.size || extractSizeFromText(offer.title);
  const canonicalSize = extractSizeFromText(canonical.rawInput);
  let isVariantMismatch = false;
  let variantReason = '';

  if (canonicalSize && offerSize && canonicalSize.toUpperCase() !== offerSize.toUpperCase()) {
    isVariantMismatch = true;
    variantReason = `Size difference: Expected ${canonicalSize}, offer is ${offerSize}`;
    differingAttributes.push(variantReason);
  }

  // --- IDENTITY CONFIDENCE CALCULATION ---
  let identityConfidence = 0.40;
  if (canonicalModel && offerModel && canonicalModel === offerModel) {
    identityConfidence = 0.95;
    matchingAttributes.push(`Exact Model: ${offerModel}`);
  } else if (canonicalBrand && offerBrand && canonicalBrand === offerBrand) {
    identityConfidence = 0.85;
  } else if (canonical.productName) {
    const nameWords = canonical.productName.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const matches = nameWords.filter(w => offerTitle.includes(w));
    if (nameWords.length > 0) {
      const matchRatio = matches.length / nameWords.length;
      if (!canonicalBrand || (offerBrand && canonicalBrand === offerBrand)) {
        identityConfidence = Math.min(0.88, 0.40 + (matchRatio * 0.50));
      } else {
        identityConfidence = Math.min(0.70, matchRatio * 0.70);
      }
    }
  }

  // When category, fabric, color, and design all match without brand conflict, identity concordance is strong
  if (categoryMatch && materialMatch && colorMatch && styleMatch && !canonicalBrand) {
    identityConfidence = Math.max(identityConfidence, 0.76);
  }

  // --- ATTRIBUTE MATCH SCORE CALCULATION ---
  let attributeScore = 0.10;
  if (categoryMatch) attributeScore += 0.30;
  else attributeScore -= 0.30;

  if (materialMatch) attributeScore += 0.20;
  else if (canonicalFabric && offerFabric) attributeScore -= 0.25;

  if (colorMatch) attributeScore += 0.20;
  else if (canonicalColors.length > 0 && offerColors.length > 0) attributeScore -= 0.25;

  if (styleMatch) attributeScore += 0.15;
  if (brandMatch) attributeScore += 0.20;

  const isFootwear = (canonical.category === 'footwear' || canonicalGarment === 'footwear') && offerTitle.includes('shoe');
  if (isFootwear) attributeScore += 0.10;

  const attributeMatchScore = Math.min(1.0, Math.max(0.05, parseFloat(attributeScore.toFixed(2))));

  // Visual similarity score
  let visualSimilarity = 0.50;
  if (categoryMatch && colorMatch && materialMatch) visualSimilarity = 0.88;
  else if (categoryMatch && (colorMatch || materialMatch)) visualSimilarity = 0.70;
  else if (!categoryMatch) visualSimilarity = 0.25;

  const visualSimilarityScore = parseFloat(visualSimilarity.toFixed(2));

  // --- OVERALL MATCH CONFIDENCE ---
  // Branded tech/footwear uses 50% identity weighting; unbranded fashion weights verified visual attributes higher
  const isBrandedTechOrShoe = Boolean(canonicalBrand || canonicalModel);
  const overallRaw = isBrandedTechOrShoe
    ? (identityConfidence * 0.50) + (attributeMatchScore * 0.35) + (visualSimilarityScore * 0.15)
    : (identityConfidence * 0.35) + (attributeMatchScore * 0.45) + (visualSimilarityScore * 0.20);

  const overallMatchConfidence = Math.min(0.98, Math.max(0.10, parseFloat(overallRaw.toFixed(2))));

  // --- MATCH TYPE HIERARCHY ---
  // A. Verified exact match: identityConfidence >= 0.85 && attributeMatchScore >= 0.65 && overall >= 0.78
  // B. High-confidence visual match: attributeMatchScore >= 0.65 && overall >= 0.78
  // C. Close alternative: category matches, overall >= 0.45
  // D. Unrelated / rejected: overall < 0.45 or category mismatch
  let matchType: 'exact' | 'variant' | 'similar' = 'similar';
  let differenceReason: string | undefined = undefined;

  if (identityConfidence >= 0.85 && attributeMatchScore >= 0.65 && overallMatchConfidence >= 0.78 && !isVariantMismatch) {
    matchType = 'exact';
  } else if (attributeMatchScore >= 0.65 && overallMatchConfidence >= 0.78) {
    matchType = 'variant'; // High-confidence visual match
    if (isVariantMismatch) differenceReason = variantReason;
  } else if (categoryMatch && overallMatchConfidence >= 0.40) {
    matchType = 'similar'; // Close alternative
    differenceReason = differingAttributes[0] || 'Minor style variation';
  } else {
    matchType = 'similar';
    differenceReason = differingAttributes[0] || 'Unrelated product or low similarity';
  }

  const isSame = matchType === 'exact' && !isVariantMismatch;

  const summary = isSame
    ? 'Verified exact match with matching brand, fabric, and attributes.'
    : matchType === 'variant'
    ? 'High-confidence visual match with matching category, fabric, and color.'
    : differingAttributes.length > 0
    ? `Alternative with differences: ${differingAttributes.join(', ')}`
    : 'Similar category alternative.';

  return {
    matchType,
    matchConfidence: overallMatchConfidence,
    identityConfidence,
    attributeMatchScore,
    visualSimilarityScore,
    tier,
    isSameProductAndVariant: isSame,
    differenceReason,
    matchExplanation: {
      categoryMatch,
      materialMatch,
      colorMatch,
      styleMatch,
      brandMatch,
      matchingAttributes,
      differingAttributes,
      summary,
    },
  };
}

import { CanonicalProduct, CanonicalSourceType } from './types';
import { generateCategorizedQueries } from './engine';
import { VisionProductAnalysis } from '../vision/types';
import { normalizeSearchQuery } from '../search/QueryNormalizer';
import { parseSearchIntent } from '../search/ProductIntentParser';

export function normalizeVisionToCanonical(
  analysis: VisionProductAnalysis,
  rawInput: string = 'Photo Upload'
): CanonicalProduct {
  const timestamp = new Date().toISOString();
  const id = `canonical-photo-${Date.now()}`;

  const queries = generateCategorizedQueries({
    title: analysis.productName,
    brand: analysis.brand,
    model: analysis.model,
    productName: analysis.productName,
    category: analysis.category,
    subcategory: analysis.subcategory,
    colors: analysis.colors,
    materials: analysis.materials,
    styles: analysis.styles,
    gender: analysis.gender,
    visualFeatures: analysis.visibleFeatures,
  });

  // Fallback to analysis searchQueries if engine queries are empty
  const exactQueries = queries.exact.length > 0 ? queries.exact : analysis.searchQueries;
  const similarQueries = queries.similar.length > 0 ? queries.similar : analysis.searchQueries;

  return {
    id,
    sourceType: 'photo',
    rawInput,
    title: analysis.productName || analysis.brand || analysis.category || rawInput,
    category: analysis.category,
    subcategory: analysis.subcategory,
    brand: analysis.brand,
    model: analysis.model,
    productName: analysis.productName,
    gender: analysis.gender,
    colors: analysis.colors || [],
    materials: analysis.materials || [],
    styles: analysis.styles || [],
    visualFeatures: analysis.visibleFeatures || [],
    observedAttributes: analysis.observedAttributes || {},
    inferredAttributes: analysis.inferredAttributes || {},
    visibleText: analysis.visibleText || [],
    confidence: analysis.confidence || { category: null, brand: null, model: null, overall: null },
    exactSearchQueries: exactQueries,
    similarSearchQueries: similarQueries,
    broadSearchQueries: queries.broad,
    budgetSearchQueries: queries.budget,
    createdAt: timestamp,
  };
}

export function normalizeTextQueryToCanonical(rawQuery: string): CanonicalProduct {
  const timestamp = new Date().toISOString();
  const id = `canonical-text-${Date.now()}`;
  const trimmed = rawQuery.trim();

  const parsed = parseSearchIntent(trimmed);
  const intent = parsed.intent;

  const queries = generateCategorizedQueries({
    title: intent.normalizedQuery,
    brand: intent.brand || null,
    category: intent.category,
    subcategory: intent.subcategory,
  });

  // Extract budget constraints: e.g. "under 500", "under ₹500", "below 1000"
  const priceMatch = trimmed.match(/(?:under|below|less than|within)\s*(?:rs\.?|inr|₹)?\s*(\d{2,6})/i);
  const maxPrice = priceMatch ? parseInt(priceMatch[1], 10) : null;

  // Extract fabric / material
  const fabricMatch = trimmed.match(/\b(cotton|pure cotton|crepe|georgette|silk|banarasi silk|linen|denim|chiffon|polyester|rayon|velvet|satin)\b/i);
  const fabric = fabricMatch ? fabricMatch[1].toLowerCase() : null;

  // Extract gender
  const genderMatch = trimmed.match(/\b(girls?|boys?|women|men|kids?|baby|toddler)\b/i);
  const gender = genderMatch ? genderMatch[1].toLowerCase() : null;

  return {
    id,
    sourceType: 'text',
    rawInput: trimmed,
    title: intent.normalizedQuery,
    category: intent.category,
    subcategory: intent.subcategory,
    brand: intent.brand || null,
    model: null,
    productName: intent.productType,
    gender,
    colors: [],
    materials: fabric ? [fabric] : [],
    styles: [],
    visualFeatures: [],
    observedAttributes: {},
    inferredAttributes: {},
    visibleText: [],
    maxPrice,
    fabric,
    confidence: {
      category: parsed.confidence,
      brand: intent.brand ? 0.9 : null,
      model: null,
      overall: parsed.confidence,
    },
    exactSearchQueries: [intent.normalizedQuery, trimmed, ...queries.exact].filter((v, i, a) => a.indexOf(v) === i),
    similarSearchQueries: queries.similar.length > 0 ? queries.similar : [intent.normalizedQuery],
    broadSearchQueries: queries.broad.length > 0 ? queries.broad : [intent.normalizedQuery],
    budgetSearchQueries: queries.budget,
    createdAt: timestamp,
  };
}

export const normalizeQuery = normalizeTextQueryToCanonical;


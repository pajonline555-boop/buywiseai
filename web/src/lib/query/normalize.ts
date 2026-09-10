import { CanonicalProduct, CanonicalSourceType } from './types';
import { generateCategorizedQueries } from './engine';
import { VisionProductAnalysis } from '../vision/types';

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

  // Basic brand & category extraction heuristics for text queries
  const knownBrands = ['nike', 'adidas', 'apple', 'sony', 'samsung', 'puma', 'puma', 'levi', 'zara', 'macbook'];
  const words = trimmed.toLowerCase().split(/\s+/);
  const foundBrand = knownBrands.find((b) => words.includes(b));
  const brand = foundBrand ? foundBrand.charAt(0).toUpperCase() + foundBrand.slice(1) : null;

  const queries = generateCategorizedQueries({
    title: trimmed,
    brand,
    category: 'electronics', // Generic default for text
    subcategory: trimmed,
  });

  return {
    id,
    sourceType: 'text',
    rawInput: trimmed,
    title: trimmed,
    category: null,
    subcategory: null,
    brand,
    model: null,
    productName: trimmed,
    gender: null,
    colors: [],
    materials: [],
    styles: [],
    visualFeatures: [],
    observedAttributes: {},
    inferredAttributes: {},
    visibleText: [],
    confidence: {
      category: 0.8,
      brand: brand ? 0.9 : null,
      model: null,
      overall: 0.85,
    },
    exactSearchQueries: [trimmed, ...queries.exact].filter((v, i, a) => a.indexOf(v) === i),
    similarSearchQueries: queries.similar.length > 0 ? queries.similar : [trimmed],
    broadSearchQueries: queries.broad.length > 0 ? queries.broad : [trimmed],
    budgetSearchQueries: queries.budget,
    createdAt: timestamp,
  };
}

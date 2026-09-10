import { CategorizedQueries } from './types';

export interface QueryAttributesInput {
  title?: string | null;
  brand?: string | null;
  model?: string | null;
  productName?: string | null;
  category?: string | null;
  subcategory?: string | null;
  colors?: string[];
  materials?: string[];
  styles?: string[];
  gender?: string | null;
  visualFeatures?: string[];
}

export function generateCategorizedQueries(input: QueryAttributesInput): CategorizedQueries {
  const brand = sanitizeTerm(input.brand);
  const model = sanitizeTerm(input.model);
  const productName = sanitizeTerm(input.productName);
  const category = sanitizeTerm(input.category) || sanitizeTerm(input.subcategory) || 'item';
  const subcategory = sanitizeTerm(input.subcategory) || category;
  const gender = normalizeGender(input.gender);
  const mainColor = input.colors && input.colors[0] ? sanitizeTerm(input.colors[0]) : '';
  const secondaryColor = input.colors && input.colors[1] ? sanitizeTerm(input.colors[1]) : '';
  const mainMaterial = input.materials && input.materials[0] ? sanitizeTerm(input.materials[0]) : '';
  const mainStyle = input.styles && input.styles[0] ? sanitizeTerm(input.styles[0]) : '';
  const mainFeature = input.visualFeatures && input.visualFeatures[0] ? sanitizeTerm(input.visualFeatures[0]) : '';
  const title = sanitizeTerm(input.title);

  const exactQueries: string[] = [];
  const similarQueries: string[] = [];
  const broadQueries: string[] = [];
  const budgetQueries: string[] = [];

  // --- 1. EXACT QUERIES (High precision, brand/model focused) ---
  if (title) exactQueries.push(title);
  if (brand && model) exactQueries.push(`${brand} ${model} ${subcategory}`);
  if (brand && productName) exactQueries.push(`${brand} ${productName}`);
  if (brand && mainColor && subcategory) exactQueries.push(`${brand} ${mainColor} ${subcategory} ${gender}`.trim());
  if (brand && subcategory) exactQueries.push(`${brand} ${subcategory} ${gender}`.trim());

  // --- 2. SIMILAR QUERIES (Style, visual features, color focused) ---
  if (mainColor && mainStyle && subcategory) similarQueries.push(`${mainColor} ${mainStyle} ${subcategory} ${gender}`.trim());
  if (mainColor && mainMaterial && subcategory) similarQueries.push(`${mainColor} ${mainMaterial} ${subcategory}`);
  if (mainFeature && mainColor && category) similarQueries.push(`${mainColor} ${mainFeature} ${category}`);
  if (mainStyle && subcategory) similarQueries.push(`${mainStyle} ${subcategory} ${gender}`.trim());
  if (mainColor && secondaryColor && category) similarQueries.push(`${mainColor} ${secondaryColor} ${category}`);

  // --- 3. BROAD QUERIES (High recall, category & brand focused) ---
  if (brand && category) broadQueries.push(`${brand} ${category}`);
  if (mainColor && subcategory) broadQueries.push(`${mainColor} ${subcategory}`);
  if (subcategory) broadQueries.push(`${subcategory} ${gender}`.trim());
  if (category && category !== subcategory) broadQueries.push(category);

  // --- 4. BUDGET QUERIES (Value & savings oriented) ---
  if (mainColor && subcategory) budgetQueries.push(`affordable ${mainColor} ${subcategory} ${gender}`.trim());
  if (brand && category) budgetQueries.push(`budget ${brand} ${category}`);
  if (subcategory) budgetQueries.push(`best price ${subcategory} ${gender}`.trim());

  return {
    exact: deduplicateAndClean(exactQueries),
    similar: deduplicateAndClean(similarQueries),
    broad: deduplicateAndClean(broadQueries),
    budget: deduplicateAndClean(budgetQueries),
  };
}

function sanitizeTerm(term?: string | null): string {
  if (!term) return '';
  return term.replace(/[^a-zA-Z0-9\s]/g, '').trim().toLowerCase();
}

function normalizeGender(gender?: string | null): string {
  if (!gender) return '';
  const lower = gender.toLowerCase().trim();
  if (lower.includes('men') && !lower.includes('women')) return "men's";
  if (lower.includes('women')) return "women's";
  if (lower.includes('unisex')) return 'unisex';
  return '';
}

function deduplicateAndClean(queries: string[]): string[] {
  const seen = new Set<string>();
  const cleaned: string[] = [];

  for (const q of queries) {
    const normalized = q.replace(/\s+/g, ' ').trim();
    if (normalized && normalized.length >= 3 && !seen.has(normalized)) {
      seen.add(normalized);
      cleaned.push(normalized);
    }
  }

  return cleaned.slice(0, 5);
}

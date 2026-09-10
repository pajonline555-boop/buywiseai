export type CanonicalSourceType = 'text' | 'photo' | 'assistant' | 'barcode';

export interface CanonicalConfidence {
  category: number | null;
  brand: number | null;
  model: number | null;
  overall: number | null;
}

export interface CategorizedQueries {
  exact: string[];
  similar: string[];
  broad: string[];
  budget: string[];
}

export interface CanonicalProduct {
  id: string;
  sourceType: CanonicalSourceType;
  rawInput: string;
  title: string;
  category: string | null;
  subcategory: string | null;
  brand: string | null;
  model: string | null;
  productName: string | null;
  gender: string | null;
  colors: string[];
  materials: string[];
  styles: string[];
  visualFeatures: string[];
  observedAttributes: Record<string, unknown>;
  inferredAttributes: Record<string, unknown>;
  visibleText: string[];
  confidence: CanonicalConfidence;
  exactSearchQueries: string[];
  similarSearchQueries: string[];
  broadSearchQueries: string[];
  budgetSearchQueries: string[];
  createdAt: string;
}

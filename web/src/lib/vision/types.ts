export interface VisionConfidence {
  category: number | null;
  brand: number | null;
  model: number | null;
  overall: number | null;
}

export interface VisualProfile {
  silhouette: string | null;
  shape: string | null;
  pattern: string | null;
  texture: string | null;
  colorPalette: string[];
  dominantColors: string[];
  designElements: string[];
  logoPlacement: string | null;
  distinctiveFeatures: string[];
}

export interface ImageQualityAssessment {
  quality: 'usable' | 'blurry' | 'too_dark' | 'too_small' | 'obstructed';
  isUsable: boolean;
  warning?: string | null;
}

export interface VisionProductAnalysis {
  category: string | null;
  subcategory: string | null;
  brand: string | null;
  model: string | null;
  productName: string | null;
  gender: string | null;
  colors: string[];
  materials: string[];
  styles: string[];
  visibleFeatures: string[];
  visualProfile?: VisualProfile;
  observedAttributes: Record<string, unknown>;
  inferredAttributes: Record<string, unknown>;
  visibleText: string[];
  confidence: VisionConfidence;
  searchQueries: string[];
}

export interface VisionResult {
  success: boolean;
  status: 'analyzed' | 'no_product_detected' | 'error';
  mode: 'exact' | 'similar';
  productDetected: boolean;
  qualityAssessment?: ImageQualityAssessment;
  detectedProductsCount?: number;
  primaryProduct?: VisionProductAnalysis;
  products?: VisionProductAnalysis[];
  suggestedQuery?: string;
  error?: string;
  timestamp: string;
}

export interface VisionRequestOptions {
  mode: 'exact' | 'similar';
}

export interface VisionProvider {
  id: string;
  name: string;
  analyze(image: string, options: VisionRequestOptions): Promise<VisionResult>;
}

export type VtoCategory = 
  | "sarees_ethnic"
  | "salwar_anarkali"
  | "lehenga_bridal"
  | "western_gowns"
  | "tops_shirts"
  | "jeans_trousers"
  | "jackets"
  | "mens_suits"
  | "mens_sherwanis"
  | "kurtas"
  | "kids_wear"
  | "jewellery"
  | "watches"
  | "accessories";

export type VtoInputMode = "selfie" | "half_body" | "full_body";

export type SareeDrapeStyle = 
  | "nivi" 
  | "bengali" 
  | "gujarati" 
  | "lehenga_saree" 
  | "maharashtrian" 
  | "tamil" 
  | "kerala" 
  | "seedha_pallu" 
  | "open_pallu" 
  | "pleated_pallu";

export type JewelleryAnchorType = 
  | "necklace" 
  | "earrings" 
  | "maang_tikka" 
  | "bangles" 
  | "ring" 
  | "nose_ring";

export type FabricType = 
  | "silk" 
  | "cotton" 
  | "chiffon" 
  | "georgette" 
  | "velvet" 
  | "banarasi" 
  | "kanjivaram";

export interface VtoPoint2D {
  x: number; // percentage 0..100
  y: number; // percentage 0..100
}

export interface VtoLandmarks {
  faceCenter?: VtoPoint2D;
  leftEye?: VtoPoint2D;
  rightEye?: VtoPoint2D;
  noseTip?: VtoPoint2D;
  mouthCenter?: VtoPoint2D;
  chinBottom?: VtoPoint2D;
  leftEar?: VtoPoint2D;
  rightEar?: VtoPoint2D;
  foreheadCenter?: VtoPoint2D;
  neckBase?: VtoPoint2D;
  leftShoulder?: VtoPoint2D;
  rightShoulder?: VtoPoint2D;
  waistCenter?: VtoPoint2D;
  leftWrist?: VtoPoint2D;
  rightWrist?: VtoPoint2D;
}

export interface ImageQualityAnalyzerResult {
  resolution: number;
  personDetected: boolean;
  faceDetected: boolean;
  bodyVisibility: VtoInputMode;
  poseQuality: number;
  lightingQuality: number;
  occlusionLevel: number;
  suitabilityScore: number;
  guidanceText?: string;
  recommendations: string[];
}

export interface TryOnQualityScore {
  garmentFitScore: number;
  identityPreservationScore: number;
  geometryScore: number;
  occlusionScore: number;
  lightingScore: number;
  texturePreservationScore: number;
  overallScore: number;
}

export interface VtoUserPhoto {
  id: string;
  url: string;
  mimeType: string;
  width: number;
  height: number;
  sizeBytes: number;
  uploadedAt: string;
  expiresAt: string;
  inputMode: VtoInputMode;
  landmarks?: VtoLandmarks;
  quality?: ImageQualityAnalyzerResult;
}

export interface SareeGarmentDetails {
  palluPosition: string;
  blouseStyle: string;
  borderWidthPx?: number;
  zariWorkType?: string;
  drapeStyle: SareeDrapeStyle;
  fabric: FabricType;
}

export interface JewelleryGarmentDetails {
  anchorType: JewelleryAnchorType;
  metalType: string;
  gemstoneType?: string;
}

export interface VtoGarmentAnalysis {
  productId: string;
  title: string;
  category: VtoCategory;
  imageUrl: string;
  colors: string[];
  fabric?: FabricType;
  sareeDetails?: SareeGarmentDetails;
  jewelleryDetails?: JewelleryGarmentDetails;
  status: "READY" | "PROCESSING" | "UNAVAILABLE" | "LOW_CONFIDENCE";
}

export interface VtoJobResult {
  jobId: string;
  sessionId: string;
  status: "IDLE" | "PROCESSING" | "COMPLETED" | "FAILED" | "CONFIGURING";
  userPhotoUrl: string;
  productId: string;
  productTitle: string;
  productStore: string;
  productPrice: number;
  productUrl: string;
  resultImageUrl?: string;
  qualityScore?: TryOnQualityScore;
  providerId: string;
  createdAt: string;
  completedAt?: string;
  error?: string;
}

export interface VtoProviderConfig {
  id: string;
  name: string;
  isConfigured: boolean;
  modelName: string;
  statusMessage: string;
}

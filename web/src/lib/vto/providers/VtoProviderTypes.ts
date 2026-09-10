export type VtoLicenseStatus = 
  | "DEVELOPMENT_ONLY"
  | "COMMERCIAL_LICENSED"
  | "UNKNOWN"
  | "DISABLED";

export interface VtoProviderCapabilities {
  supportsImageToImage: boolean;
  supportsGarmentConditioning: boolean;
  supportsSaree: boolean;
  supportsSalwarSuit: boolean;
  supportsDress: boolean;
  supportsSuit: boolean;
  supportsJewellery: boolean;
  supportsMenswear: boolean;
  supportsPosePreservation: boolean;
  supportsBackgroundPreservation: boolean;
  maxInputResolution: number;
  maxOutputResolution: number;
}

export interface NormalizedVtoGenerationRequest {
  requestId: string;
  userId: string;
  personImage: string; // URL or base64
  garmentImage: string; // URL or base64
  garmentType: string;
  productTitle?: string;
  productId?: string;
  storeName?: string;
  garmentMetadata?: Record<string, any>;
  requestedStyle?: string;
  resolution?: string;
  preserveIdentity?: boolean;
  preservePose?: boolean;
  preserveBackground?: boolean;
  privacyMode?: "private_ephemeral" | "user_vault";
}

export interface NormalizedVtoGenerationResult {
  success: boolean;
  requestId: string;
  provider: string;
  providerRequestId?: string;
  image?: string;
  width?: number;
  height?: number;
  mimeType?: string;
  generationTimeMs: number;
  estimatedCost: number;
  model: string;
  licenseStatus: VtoLicenseStatus;
  fallbackUsed?: boolean;
  failureCode?: string;
  failureMessage?: string;
}

export interface ProviderHealthResult {
  healthy: boolean;
  status: "operational" | "degraded" | "unavailable" | "disabled" | "license_blocked";
  latencyMs: number;
  details?: string;
}

export interface IVtoProvider {
  id: string;
  name: string;
  generate(request: NormalizedVtoGenerationRequest): Promise<NormalizedVtoGenerationResult>;
  healthCheck(): Promise<ProviderHealthResult>;
  getCapabilities(): VtoProviderCapabilities;
  estimateCost(request: NormalizedVtoGenerationRequest): number;
  getProviderName(): string;
  getLicenseStatus(): VtoLicenseStatus;
  isConfigured(): boolean;
}

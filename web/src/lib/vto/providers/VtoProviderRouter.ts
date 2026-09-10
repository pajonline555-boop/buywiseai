import { 
  IVtoProvider, 
  NormalizedVtoGenerationRequest, 
  NormalizedVtoGenerationResult, 
  ProviderHealthResult, 
  VtoLicenseStatus, 
  VtoProviderCapabilities 
} from "./VtoProviderTypes";
import { runPodVtoProvider } from "./RunPodVtoProvider";
import { falVtoProvider } from "./FalVtoProvider";
import { huggingFaceVtoProvider } from "../huggingface-vto";

export interface VtoRouterMetrics {
  totalRequests: number;
  primarySuccessCount: number;
  fallbackSuccessCount: number;
  totalFailures: number;
  totalCostEstimated: number;
}

export class VtoProviderRouter implements IVtoProvider {
  public id = "vto-provider-router";
  public name = "BuyWise Canonical VTO Provider Router";

  private providers: IVtoProvider[] = [
    runPodVtoProvider,
    falVtoProvider,
    huggingFaceVtoProvider
  ];

  private metrics: VtoRouterMetrics = {
    totalRequests: 0,
    primarySuccessCount: 0,
    fallbackSuccessCount: 0,
    totalFailures: 0,
    totalCostEstimated: 0
  };

  public isConfigured(): boolean {
    return process.env.VTO_ROUTER_ENABLED !== "false";
  }

  public getLicenseStatus(): VtoLicenseStatus {
    const primary = this.selectPrimaryProvider();
    return primary ? primary.getLicenseStatus() : "DEVELOPMENT_ONLY";
  }

  public getProviderName(): string {
    return this.name;
  }

  public getCapabilities(): VtoProviderCapabilities {
    const primary = this.selectPrimaryProvider() || runPodVtoProvider;
    return primary.getCapabilities();
  }

  public estimateCost(request: NormalizedVtoGenerationRequest): number {
    const primary = this.selectPrimaryProvider();
    return primary ? primary.estimateCost(request) : 0.0;
  }

  public async healthCheck(): Promise<ProviderHealthResult> {
    const startTime = Date.now();
    const primary = this.selectPrimaryProvider();
    if (!primary) {
      return {
        healthy: false,
        status: "unavailable",
        latencyMs: 0,
        details: "No configured or commercially authorized VTO provider available."
      };
    }
    const primaryHealth = await primary.healthCheck();
    return {
      healthy: primaryHealth.healthy,
      status: primaryHealth.status,
      latencyMs: Date.now() - startTime,
      details: `Primary Provider (${primary.id}): ${primaryHealth.details || "OK"}`
    };
  }

  public selectPrimaryProvider(): IVtoProvider | null {
    const isProduction = process.env.NODE_ENV === "production";
    const primaryConfigured = runPodVtoProvider.isConfigured();

    if (primaryConfigured) {
      if (isProduction && runPodVtoProvider.getLicenseStatus() !== "COMMERCIAL_LICENSED") {
        console.warn("[VTO Router Warning]: RunPod primary provider is blocked in production due to non-commercial license status.");
      } else {
        return runPodVtoProvider;
      }
    }

    // Fallback selection if RunPod is unconfigured
    if (falVtoProvider.isConfigured()) {
      if (isProduction && falVtoProvider.getLicenseStatus() !== "COMMERCIAL_LICENSED") {
        console.warn("[VTO Router Warning]: fal.ai fallback provider is blocked in production due to non-commercial license status.");
      } else {
        return falVtoProvider;
      }
    }

    // Development mode fallback
    if (!isProduction && huggingFaceVtoProvider.isConfigured()) {
      return huggingFaceVtoProvider;
    }

    return null;
  }

  public selectFallbackProvider(primaryId: string): IVtoProvider | null {
    const isProduction = process.env.NODE_ENV === "production";

    if (primaryId === runPodVtoProvider.id && falVtoProvider.isConfigured()) {
      if (isProduction && falVtoProvider.getLicenseStatus() !== "COMMERCIAL_LICENSED") {
        console.warn("[VTO Router Warning]: fal.ai fallback blocked in production (license not commercial).");
        return null;
      }
      return falVtoProvider;
    }

    if (!isProduction && primaryId !== huggingFaceVtoProvider.id && huggingFaceVtoProvider.isConfigured()) {
      return huggingFaceVtoProvider;
    }

    return null;
  }

  public async generate(request: NormalizedVtoGenerationRequest): Promise<NormalizedVtoGenerationResult> {
    const startTime = Date.now();
    this.metrics.totalRequests++;

    const primary = this.selectPrimaryProvider();
    if (!primary) {
      this.metrics.totalFailures++;
      return {
        success: false,
        requestId: request.requestId,
        provider: this.id,
        generationTimeMs: Date.now() - startTime,
        estimatedCost: 0,
        model: "none",
        licenseStatus: "DISABLED",
        failureCode: "NO_PROVIDER_AVAILABLE",
        failureMessage: "No commercially authorized or configured VTO provider is available."
      };
    }

    console.log(`[VTO Router]: Route request ${request.requestId} -> Primary: ${primary.id}`);
    
    // Attempt 1: Primary Provider
    const primaryResult = await primary.generate(request);

    if (primaryResult.success && primaryResult.image) {
      this.metrics.primarySuccessCount++;
      this.metrics.totalCostEstimated += primaryResult.estimatedCost;
      console.log(`[VTO Router]: Primary provider ${primary.id} SUCCEEDED in ${primaryResult.generationTimeMs}ms.`);
      return primaryResult;
    }

    console.warn(`[VTO Router]: Primary provider ${primary.id} FAILED: ${primaryResult.failureMessage}. Evaluating failover...`);

    // Check if failover is permitted (only on transient infrastructure/provider failures)
    const fallback = this.selectFallbackProvider(primary.id);
    if (!fallback) {
      this.metrics.totalFailures++;
      return {
        ...primaryResult,
        failureMessage: `Primary provider ${primary.id} failed and no secondary fallback is available: ${primaryResult.failureMessage}`
      };
    }

    console.log(`[VTO Router]: Triggering Failover -> Secondary: ${fallback.id}`);

    // Attempt 2: Secondary / Fallback Provider
    const fallbackResult = await fallback.generate(request);

    if (fallbackResult.success && fallbackResult.image) {
      this.metrics.fallbackSuccessCount++;
      this.metrics.totalCostEstimated += fallbackResult.estimatedCost;
      console.log(`[VTO Router]: Secondary provider ${fallback.id} SUCCEEDED in ${fallbackResult.generationTimeMs}ms.`);
      return {
        ...fallbackResult,
        fallbackUsed: true
      };
    }

    this.metrics.totalFailures++;
    console.error(`[VTO Router]: Both primary (${primary.id}) and fallback (${fallback.id}) providers FAILED for request ${request.requestId}.`);

    return {
      success: false,
      requestId: request.requestId,
      provider: this.id,
      generationTimeMs: Date.now() - startTime,
      estimatedCost: 0,
      model: `${primary.id}+${fallback.id}`,
      licenseStatus: primary.getLicenseStatus(),
      failureCode: "ALL_PROVIDERS_FAILED",
      failureMessage: `Primary (${primaryResult.failureMessage}) & Fallback (${fallbackResult.failureMessage}) failed.`
    };
  }

  public getMetrics(): VtoRouterMetrics {
    return { ...this.metrics };
  }

  public getAllProvidersStatus() {
    return this.providers.map((p) => ({
      id: p.id,
      name: p.name,
      configured: p.isConfigured(),
      licenseStatus: p.getLicenseStatus()
    }));
  }

  // Legacy wrapper for /api/try-on/generate
  public async generateTryOn(
    userPhoto: any,
    product: any,
    userPhotoBase64?: string,
    garmentBase64?: string
  ): Promise<any> {
    const requestId = `vto_legacy_${Date.now()}`;
    const result = await this.generate({
      requestId,
      userId: "legacy_try_on",
      personImage: userPhotoBase64 || userPhoto.url,
      garmentImage: garmentBase64 || product.imageUrl,
      garmentType: product.category || "sarees_ethnic",
      productTitle: product.title,
      productId: product.id,
      storeName: product.store || "Store"
    });

    if (result.success && result.image) {
      return {
        jobId: result.requestId,
        sessionId: `sess_${Date.now()}`,
        status: "COMPLETED",
        userPhotoUrl: userPhoto.url,
        productId: product.id,
        productTitle: product.title,
        productStore: product.store || "Store",
        productPrice: product.price || 0,
        productUrl: product.url || "/search",
        resultImageUrl: result.image,
        providerId: result.provider,
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString()
      };
    }

    return {
      jobId: result.requestId,
      sessionId: `sess_${Date.now()}`,
      status: "FAILED",
      userPhotoUrl: userPhoto.url,
      productId: product.id,
      productTitle: product.title,
      productStore: product.store || "Store",
      productPrice: product.price || 0,
      productUrl: product.url || "/search",
      providerId: result.provider,
      createdAt: new Date().toISOString(),
      error: result.failureMessage || "Legacy generation failed."
    };
  }
}

export const vtoProviderRouter = new VtoProviderRouter();

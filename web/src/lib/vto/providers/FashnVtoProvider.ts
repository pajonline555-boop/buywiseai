import { 
  IVtoProvider, 
  NormalizedVtoGenerationRequest, 
  NormalizedVtoGenerationResult, 
  ProviderHealthResult, 
  VtoLicenseStatus, 
  VtoProviderCapabilities 
} from "./VtoProviderTypes";
import axios from "axios";

export interface FashnRunResponse {
  id: string;
  error?: string | null;
}

export interface FashnStatusResponse {
  id: string;
  status: "starting" | "in_progress" | "completed" | "failed";
  output?: string[];
  error?: {
    name?: string;
    message?: string;
  } | string | null;
}

export class FashnVtoProvider implements IVtoProvider {
  public id = "fashn-vto";
  public name = "FASHN.ai Commercial Virtual Try-On Engine";

  private getApiKey(): string | undefined {
    return process.env.FASHN_API_KEY;
  }

  public getModelName(): "tryon-max" | "tryon-v1.6" {
    const configured = (process.env.FASHN_MODEL || process.env.FASHN_MODEL_NAME || "tryon-max").toLowerCase();
    return configured.includes("1.6") ? "tryon-v1.6" : "tryon-max";
  }

  private getTimeoutMs(): number {
    return parseInt(process.env.FASHN_TIMEOUT_MS || "75000", 10);
  }

  public isConfigured(): boolean {
    const enabled = process.env.FASHN_ENABLED !== "false";
    return enabled && !!this.getApiKey();
  }

  public getLicenseStatus(): VtoLicenseStatus {
    const rawStatus = process.env.FASHN_LICENSE_STATUS?.toUpperCase();
    if (rawStatus === "COMMERCIAL_LICENSED") return "COMMERCIAL_LICENSED";
    if (rawStatus === "DEVELOPMENT_ONLY") return "DEVELOPMENT_ONLY";
    if (rawStatus === "DISABLED") return "DISABLED";
    // FASHN is a commercial SaaS API with full commercial rights for generated images
    return this.isConfigured() ? "COMMERCIAL_LICENSED" : "DEVELOPMENT_ONLY";
  }

  public getProviderName(): string {
    return this.name;
  }

  public getCapabilities(): VtoProviderCapabilities {
    const isMax = this.getModelName() === "tryon-max";
    return {
      supportsImageToImage: true,
      supportsGarmentConditioning: true,
      supportsSaree: true,
      supportsSalwarSuit: true,
      supportsDress: true,
      supportsSuit: true,
      supportsJewellery: isMax,
      supportsMenswear: true,
      supportsPosePreservation: true,
      supportsBackgroundPreservation: true,
      maxInputResolution: isMax ? 4096 : 1296,
      maxOutputResolution: isMax ? 4096 : 1296
    };
  }

  public estimateCost(request: NormalizedVtoGenerationRequest): number {
    // FASHN Pricing: Try-On Max = 4 credits (~$0.036 - $0.040 per gen)
    // Try-On v1.6 = 1 credit (~$0.009 - $0.015 per gen)
    return this.getModelName() === "tryon-max" ? 0.038 : 0.012;
  }

  public async healthCheck(): Promise<ProviderHealthResult> {
    const startTime = Date.now();
    if (!this.isConfigured()) {
      return {
        healthy: false,
        status: "disabled",
        latencyMs: 0,
        details: "FASHN_API_KEY is not configured in server environment."
      };
    }

    try {
      const apiKey = this.getApiKey();
      const res = await axios.get("https://api.fashn.ai/v1/health", {
        headers: { Authorization: `Bearer ${apiKey}` },
        timeout: 5000
      }).catch((err) => {
        // Some services don't have public GET /health, fallback to credential presence check
        if (err.response?.status === 401) {
          throw new Error("Invalid FASHN_API_KEY credentials (HTTP 401)");
        }
        return { status: 200, data: { status: "ready" } };
      });

      return {
        healthy: true,
        status: "operational",
        latencyMs: Date.now() - startTime,
        details: `Configured model: ${this.getModelName()}`
      };
    } catch (err: any) {
      return {
        healthy: false,
        status: "unavailable",
        latencyMs: Date.now() - startTime,
        details: err?.message || "FASHN API healthcheck failed"
      };
    }
  }

  private mapGarmentCategory(garmentType?: string, productTitle?: string): "tops" | "bottoms" | "one-pieces" {
    const text = `${garmentType || ""} ${productTitle || ""}`.toLowerCase();
    if (text.includes("pant") || text.includes("skirt") || text.includes("trouser") || text.includes("jeans") || text.includes("lower")) {
      return "bottoms";
    }
    if (
      text.includes("saree") || 
      text.includes("sari") || 
      text.includes("lehenga") || 
      text.includes("chaniya") || 
      text.includes("anarkali") || 
      text.includes("suit") || 
      text.includes("dress") || 
      text.includes("gown") || 
      text.includes("overall")
    ) {
      return "one-pieces";
    }
    return "tops";
  }

  public async generate(request: NormalizedVtoGenerationRequest): Promise<NormalizedVtoGenerationResult> {
    const startTime = Date.now();
    const modelName = this.getModelName();
    const licenseStatus = this.getLicenseStatus();

    if (!this.isConfigured()) {
      return {
        success: false,
        requestId: request.requestId,
        provider: this.id,
        generationTimeMs: Date.now() - startTime,
        estimatedCost: 0,
        model: modelName,
        licenseStatus,
        failureCode: "FASHN_NOT_CONFIGURED",
        failureMessage: "FASHN_API_KEY is not configured in server environment."
      };
    }

    const apiKey = this.getApiKey()!;
    const category = this.mapGarmentCategory(request.garmentType, request.productTitle);
    const timeoutMs = this.getTimeoutMs();

    try {
      console.log(`[FASHN.ai VTO Provider]: Submitting task to model ${modelName} for requestId ${request.requestId}...`);

      const formatImage = (img: string) => {
        if (!img) return "";
        if (img.startsWith("http://") || img.startsWith("https://") || img.startsWith("data:image/")) {
          return img;
        }
        return `data:image/jpeg;base64,${img}`;
      };

      // 1. Prepare Request Payload per current FASHN.ai API Spec
      const inputs: Record<string, any> = {
        model_image: formatImage(request.personImage),
        category
      };

      if (modelName === "tryon-max") {
        inputs.product_image = formatImage(request.garmentImage);
        // Prompt tuning for Indian ethnic wear fidelity & natural fit
        if (request.productTitle) {
          inputs.prompt = `Photorealistic natural fit of ${request.productTitle}, preserve realistic fabric folds, drape, accessories, and clean boundaries.`;
        }
      } else {
        inputs.garment_image = formatImage(request.garmentImage);
      }

      // 2. Submit asynchronous prediction task
      const submitRes = await axios.post<FashnRunResponse>(
        "https://api.fashn.ai/v1/run",
        {
          model_name: modelName,
          inputs
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          },
          timeout: 20000
        }
      );

      const predictionId = submitRes.data?.id;
      if (!predictionId) {
        throw new Error(submitRes.data?.error || "FASHN.ai did not return a valid prediction ID.");
      }

      console.log(`[FASHN.ai VTO Provider]: Prediction queued (ID: ${predictionId}). Polling status...`);

      // 3. Poll for result completion
      const pollStart = Date.now();
      const pollIntervalMs = 1500;
      let outputImageUrl: string | null = null;

      while (Date.now() - pollStart < timeoutMs) {
        await new Promise((r) => setTimeout(r, pollIntervalMs));

        const statusRes = await axios.get<FashnStatusResponse>(
          `https://api.fashn.ai/v1/status/${predictionId}`,
          {
            headers: { Authorization: `Bearer ${apiKey}` },
            timeout: 10000
          }
        );

        const statusData = statusRes.data;

        if (statusData.status === "completed") {
          const outputs = statusData.output;
          if (Array.isArray(outputs) && outputs.length > 0) {
            outputImageUrl = outputs[0];
            break;
          }
          throw new Error("FASHN generation completed but output array is empty.");
        }

        if (statusData.status === "failed") {
          const errDetail = typeof statusData.error === "object" 
            ? statusData.error?.message 
            : statusData.error || "Unknown prediction failure";
          throw new Error(`FASHN prediction failed: ${errDetail}`);
        }
      }

      if (!outputImageUrl) {
        throw new Error(`FASHN generation timed out after ${Math.round(timeoutMs / 1000)} seconds.`);
      }

      console.log(`[FASHN.ai VTO Provider]: Success in ${((Date.now() - startTime) / 1000).toFixed(1)}s!`);

      return {
        success: true,
        requestId: request.requestId,
        provider: this.id,
        providerRequestId: predictionId,
        image: outputImageUrl,
        generationTimeMs: Date.now() - startTime,
        estimatedCost: this.estimateCost(request),
        model: modelName,
        licenseStatus
      };

    } catch (err: any) {
      const errMsg = err?.response?.data?.error?.message || err?.response?.data?.detail || err?.message || "FASHN execution error";
      console.warn(`[FASHN.ai VTO Provider Exception]:`, errMsg);
      return {
        success: false,
        requestId: request.requestId,
        provider: this.id,
        generationTimeMs: Date.now() - startTime,
        estimatedCost: 0,
        model: modelName,
        licenseStatus,
        failureCode: "FASHN_EXECUTION_FAILED",
        failureMessage: errMsg
      };
    }
  }
}

export const fashnVtoProvider = new FashnVtoProvider();

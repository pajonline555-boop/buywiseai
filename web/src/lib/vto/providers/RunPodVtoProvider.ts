import { 
  IVtoProvider, 
  NormalizedVtoGenerationRequest, 
  NormalizedVtoGenerationResult, 
  ProviderHealthResult, 
  VtoLicenseStatus, 
  VtoProviderCapabilities 
} from "./VtoProviderTypes";
import axios from "axios";

export class RunPodVtoProvider implements IVtoProvider {
  public id = "runpod-vto";
  public name = "RunPod Serverless VTO Primary Engine";

  private getApiKey(): string | undefined {
    return process.env.RUNPOD_API_KEY;
  }

  private getEndpointId(): string | undefined {
    return process.env.RUNPOD_ENDPOINT_ID;
  }

  private getTimeoutMs(): number {
    return parseInt(process.env.RUNPOD_TIMEOUT_MS || "60000", 10);
  }

  private getMaxRetries(): number {
    return parseInt(process.env.RUNPOD_MAX_RETRIES || "2", 10);
  }

  public isConfigured(): boolean {
    const enabled = process.env.RUNPOD_ENABLED !== "false";
    return enabled && !!this.getApiKey() && !!this.getEndpointId();
  }

  public getLicenseStatus(): VtoLicenseStatus {
    const rawStatus = process.env.VTO_RUNPOD_LICENSE_STATUS?.toUpperCase();
    if (rawStatus === "COMMERCIAL_LICENSED") return "COMMERCIAL_LICENSED";
    if (rawStatus === "DEVELOPMENT_ONLY") return "DEVELOPMENT_ONLY";
    if (rawStatus === "DISABLED") return "DISABLED";
    // Default safety behavior: if explicitly configured with custom RunPod endpoint, treat as commercial, else dev
    return this.isConfigured() ? "COMMERCIAL_LICENSED" : "DEVELOPMENT_ONLY";
  }

  public getProviderName(): string {
    return this.name;
  }

  public getCapabilities(): VtoProviderCapabilities {
    return {
      supportsImageToImage: true,
      supportsGarmentConditioning: true,
      supportsSaree: true,
      supportsSalwarSuit: true,
      supportsDress: true,
      supportsSuit: true,
      supportsJewellery: false,
      supportsMenswear: true,
      supportsPosePreservation: true,
      supportsBackgroundPreservation: true,
      maxInputResolution: 2048,
      maxOutputResolution: 2048
    };
  }

  public estimateCost(request: NormalizedVtoGenerationRequest): number {
    // Estimated RunPod serverless GPU cost per VTO job (approx. 10s execution on A10G ~ $0.0075)
    return 0.0075;
  }

  public async healthCheck(): Promise<ProviderHealthResult> {
    const startTime = Date.now();
    if (!this.isConfigured()) {
      return {
        healthy: false,
        status: "disabled",
        latencyMs: 0,
        details: "RunPod API Key or Endpoint ID not configured."
      };
    }

    try {
      const endpointId = this.getEndpointId();
      const apiKey = this.getApiKey();
      
      const res = await axios.get(`https://api.runpod.ai/v2/${endpointId}/health`, {
        headers: { Authorization: `Bearer ${apiKey}` },
        timeout: 5000
      });

      const latencyMs = Date.now() - startTime;
      const isHealthy = res.status === 200 && res.data?.jobs?.inQueue !== undefined;

      return {
        healthy: isHealthy,
        status: isHealthy ? "operational" : "degraded",
        latencyMs,
        details: `Jobs in queue: ${res.data?.jobs?.inQueue ?? 0}, workers: ${res.data?.workers?.running ?? 0}`
      };
    } catch (err: any) {
      return {
        healthy: false,
        status: "unavailable",
        latencyMs: Date.now() - startTime,
        details: err?.message || "Health check failed."
      };
    }
  }

  public async generate(request: NormalizedVtoGenerationRequest): Promise<NormalizedVtoGenerationResult> {
    const startTime = Date.now();
    const modelName = process.env.VTO_RUNPOD_MODEL || "buywise-idm-vton-v1";
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
        failureCode: "RUNPOD_NOT_CONFIGURED",
        failureMessage: "RunPod provider credentials are not configured in server environment."
      };
    }

    const endpointId = this.getEndpointId();
    const apiKey = this.getApiKey();
    const timeoutMs = this.getTimeoutMs();
    const maxRetries = this.getMaxRetries();

    let attempt = 0;
    let lastError: any = null;

    while (attempt <= maxRetries) {
      attempt++;
      try {
        console.log(`[RunPod VTO Provider]: Submitting VTO job (Attempt ${attempt}/${maxRetries + 1})...`);
        
        // 1. Submit runsync or async job
        const submitUrl = `https://api.runpod.ai/v2/${endpointId}/runsync`;
        const payload = {
          input: {
            person_image: request.personImage,
            garment_image: request.garmentImage,
            garment_type: request.garmentType,
            product_title: request.productTitle || "",
            preserve_pose: request.preservePose !== false,
            preserve_background: request.preserveBackground !== false
          }
        };

        const response = await axios.post(submitUrl, payload, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          },
          timeout: timeoutMs
        });

        const status = response.data?.status;
        const output = response.data?.output;

        if (status === "COMPLETED" && output) {
          const resultImageUrl = typeof output === "string" ? output : (output.image_url || output.image || output.url);
          if (resultImageUrl) {
            return {
              success: true,
              requestId: request.requestId,
              provider: this.id,
              providerRequestId: response.data?.id || `runpod_${Date.now()}`,
              image: resultImageUrl,
              generationTimeMs: Date.now() - startTime,
              estimatedCost: this.estimateCost(request),
              model: modelName,
              licenseStatus
            };
          }
        }

        // If job queued/IN_PROGRESS asynchronously, poll status
        if (response.data?.id && (status === "IN_QUEUE" || status === "IN_PROGRESS")) {
          const jobId = response.data.id;
          const pollResult = await this.pollJobStatus(endpointId!, apiKey!, jobId, startTime, timeoutMs, request, modelName, licenseStatus);
          if (pollResult.success) return pollResult;
        }

        throw new Error(`RunPod generation failed with status: ${status}`);

      } catch (err: any) {
        lastError = err;
        console.warn(`[RunPod VTO Provider]: Attempt ${attempt} failed:`, err?.message || err);
        
        // Do not retry on client/unauthorized 4xx errors
        if (err.response && err.response.status >= 400 && err.response.status < 500) {
          break;
        }

        if (attempt <= maxRetries) {
          const backoffMs = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 500, 5000);
          await new Promise((res) => setTimeout(res, backoffMs));
        }
      }
    }

    return {
      success: false,
      requestId: request.requestId,
      provider: this.id,
      generationTimeMs: Date.now() - startTime,
      estimatedCost: 0,
      model: modelName,
      licenseStatus,
      failureCode: "RUNPOD_EXECUTION_FAILED",
      failureMessage: lastError?.message || "RunPod serverless execution failed after retries."
    };
  }

  private async pollJobStatus(
    endpointId: string,
    apiKey: string,
    jobId: string,
    startTime: number,
    timeoutMs: number,
    request: NormalizedVtoGenerationRequest,
    modelName: string,
    licenseStatus: VtoLicenseStatus
  ): Promise<NormalizedVtoGenerationResult> {
    const statusUrl = `https://api.runpod.ai/v2/${endpointId}/status/${jobId}`;
    const pollIntervalMs = 2000;

    while (Date.now() - startTime < timeoutMs) {
      await new Promise((res) => setTimeout(res, pollIntervalMs));
      try {
        const res = await axios.get(statusUrl, {
          headers: { Authorization: `Bearer ${apiKey}` },
          timeout: 10000
        });

        const status = res.data?.status;
        if (status === "COMPLETED") {
          const output = res.data?.output;
          const resultImageUrl = typeof output === "string" ? output : (output?.image_url || output?.image || output?.url);
          if (resultImageUrl) {
            return {
              success: true,
              requestId: request.requestId,
              provider: this.id,
              providerRequestId: jobId,
              image: resultImageUrl,
              generationTimeMs: Date.now() - startTime,
              estimatedCost: this.estimateCost(request),
              model: modelName,
              licenseStatus
            };
          }
        } else if (status === "FAILED" || status === "CANCELLED") {
          return {
            success: false,
            requestId: request.requestId,
            provider: this.id,
            providerRequestId: jobId,
            generationTimeMs: Date.now() - startTime,
            estimatedCost: 0,
            model: modelName,
            licenseStatus,
            failureCode: `RUNPOD_JOB_${status}`,
            failureMessage: res.data?.error || `RunPod job ended with status ${status}`
          };
        }
      } catch (err: any) {
        console.warn("[RunPod VTO Polling Error]:", err?.message);
      }
    }

    return {
      success: false,
      requestId: request.requestId,
      provider: this.id,
      providerRequestId: jobId,
      generationTimeMs: Date.now() - startTime,
      estimatedCost: 0,
      model: modelName,
      licenseStatus,
      failureCode: "RUNPOD_TIMEOUT",
      failureMessage: `RunPod job timed out after ${timeoutMs}ms`
    };
  }
}

export const runPodVtoProvider = new RunPodVtoProvider();

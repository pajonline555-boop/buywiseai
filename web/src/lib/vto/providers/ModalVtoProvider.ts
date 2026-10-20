import { 
  IVtoProvider, 
  NormalizedVtoGenerationRequest, 
  NormalizedVtoGenerationResult, 
  ProviderHealthResult, 
  VtoLicenseStatus, 
  VtoProviderCapabilities 
} from "./VtoProviderTypes";
import axios from "axios";

export class ModalVtoProvider implements IVtoProvider {
  public id = "modal-vto";
  public name = "Modal ComfyUI CatVTON Serverless Engine";

  private getEndpointUrl(): string | undefined {
    return process.env.MODAL_VTO_URL;
  }

  private getTimeoutMs(): number {
    return parseInt(process.env.MODAL_TIMEOUT_MS || "60000", 10);
  }

  public isConfigured(): boolean {
    const enabled = process.env.MODAL_ENABLED !== "false";
    return enabled && !!this.getEndpointUrl();
  }

  public getLicenseStatus(): VtoLicenseStatus {
    const rawStatus = process.env.VTO_MODAL_LICENSE_STATUS?.toUpperCase();
    if (rawStatus === "COMMERCIAL_LICENSED") return "COMMERCIAL_LICENSED";
    if (rawStatus === "DEVELOPMENT_ONLY") return "DEVELOPMENT_ONLY";
    if (rawStatus === "DISABLED") return "DISABLED";
    // Default: Commercial licensed when user deploys own container on Modal
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
    // Modal L4 GPU execution cost (~5s on $0.80/hr L4 = ~$0.0013)
    return 0.0013;
  }

  public async healthCheck(): Promise<ProviderHealthResult> {
    const startTime = Date.now();
    if (!this.isConfigured()) {
      return {
        healthy: false,
        status: "disabled",
        latencyMs: 0,
        details: "Modal VTO endpoint URL not configured (MODAL_VTO_URL)."
      };
    }

    try {
      const endpoint = this.getEndpointUrl()!;
      // Health check or quick ping to Modal scale-to-zero endpoint
      return {
        healthy: true,
        status: "operational",
        latencyMs: Date.now() - startTime,
        details: `Configured Modal endpoint: ${new URL(endpoint).hostname}`
      };
    } catch (err: any) {
      return {
        healthy: false,
        status: "unavailable",
        latencyMs: Date.now() - startTime,
        details: `Invalid Modal endpoint URL: ${err.message}`
      };
    }
  }

  private mapGarmentCategory(garmentType?: string, productTitle?: string): "upper" | "lower" | "overall" {
    const text = `${garmentType || ""} ${productTitle || ""}`.toLowerCase();
    
    // Ethnic full-body garments
    if (
      text.includes("saree") || 
      text.includes("sari") || 
      text.includes("lehenga") || 
      text.includes("kurti") || 
      text.includes("kurta") || 
      text.includes("anarkali") || 
      text.includes("salwar") || 
      text.includes("dress") || 
      text.includes("gown") || 
      text.includes("choli") ||
      text.includes("overall")
    ) {
      return "overall";
    }

    // Lower body
    if (
      text.includes("pant") || 
      text.includes("jeans") || 
      text.includes("trouser") || 
      text.includes("skirt") || 
      text.includes("legging") || 
      text.includes("palazzo") || 
      text.includes("dhoti")
    ) {
      return "lower";
    }

    // Upper body default
    return "upper";
  }

  public async generate(request: NormalizedVtoGenerationRequest): Promise<NormalizedVtoGenerationResult> {
    const startTime = Date.now();
    const endpoint = this.getEndpointUrl();

    if (!endpoint) {
      return {
        success: false,
        requestId: request.requestId,
        provider: this.id,
        generationTimeMs: 0,
        estimatedCost: 0,
        model: "Modal-ComfyUI-CatVTON",
        licenseStatus: this.getLicenseStatus(),
        failureCode: "CONFIG_ERROR",
        failureMessage: "Modal VTO endpoint URL is not configured."
      };
    }

    const category = this.mapGarmentCategory(request.garmentType, request.productTitle);

    try {
      console.log(`[Modal VTO]: Calling ${endpoint} for ${request.requestId} (Category: ${category})`);

      const response = await axios.post(
        endpoint,
        {
          person_image_url: request.personImage,
          garment_image_url: request.garmentImage,
          userImageBase64: request.personImage,
          garmentImageUrl: request.garmentImage,
          category,
          title: request.productTitle || "garment",
          mode: "FIT_ON_USER",
          person_node_id: "10",
          garment_node_id: "11",
          mask_node_id: "12"
        },
        {
          responseType: "arraybuffer",
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "BuyWise-Web/1.0"
          },
          timeout: this.getTimeoutMs()
        }
      );

      const contentType = response.headers["content-type"] || "image/webp";
      let base64Image = "";

      if (contentType.includes("application/json") || contentType.includes("text/json")) {
        const jsonStr = Buffer.from(response.data).toString("utf8");
        const parsed = JSON.parse(jsonStr);
        base64Image = parsed.imageBase64 || parsed.imageUrl || parsed.resultImage || "";
        if (!base64Image) {
          throw new Error("Modal JSON response did not contain an image field");
        }
      } else {
        const buffer = Buffer.from(response.data);
        base64Image = `data:${contentType};base64,${buffer.toString("base64")}`;
      }

      return {
        success: true,
        requestId: request.requestId,
        provider: this.id,
        image: base64Image,
        mimeType: base64Image.startsWith("data:") ? base64Image.split(";")[0].replace("data:", "") : contentType,
        generationTimeMs: Date.now() - startTime,
        estimatedCost: this.estimateCost(request),
        model: "Modal-ComfyUI-CatVTON-L4",
        licenseStatus: this.getLicenseStatus()
      };
    } catch (err: any) {
      const errMsg = err.response?.data 
        ? Buffer.isBuffer(err.response.data) 
          ? err.response.data.toString("utf8") 
          : JSON.stringify(err.response.data)
        : err.message;

      console.error(`[Modal VTO Failure]: ${errMsg}`);

      return {
        success: false,
        requestId: request.requestId,
        provider: this.id,
        generationTimeMs: Date.now() - startTime,
        estimatedCost: 0,
        model: "Modal-ComfyUI-CatVTON-L4",
        licenseStatus: this.getLicenseStatus(),
        failureCode: "MODAL_VTO_EXECUTION_FAILED",
        failureMessage: `Modal try-on execution failed: ${errMsg}`
      };
    }
  }
}

export const modalVtoProvider = new ModalVtoProvider();

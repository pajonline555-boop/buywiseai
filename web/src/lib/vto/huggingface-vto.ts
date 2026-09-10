import { 
  IVtoProvider, 
  NormalizedVtoGenerationRequest, 
  NormalizedVtoGenerationResult, 
  ProviderHealthResult, 
  VtoLicenseStatus, 
  VtoProviderCapabilities 
} from './providers/VtoProviderTypes';
import { VtoJobResult, VtoProviderConfig, VtoUserPhoto } from './types';

async function uploadToGradio(input: string, filename: string, hfToken?: string): Promise<any> {
  if (input.startsWith("http://") || input.startsWith("https://")) {
    return { url: input };
  }

  try {
    let buffer: Buffer;
    if (input.startsWith("data:")) {
      const base64Data = input.replace(/^data:image\/\w+;base64,/, "");
      buffer = Buffer.from(base64Data, "base64");
    } else {
      buffer = Buffer.from(input);
    }

    const formData = new FormData();
    const blob = new Blob([new Uint8Array(buffer)], { type: 'image/png' });
    formData.append('files', blob, filename);

    const headers: Record<string, string> = {};
    if (hfToken) headers["Authorization"] = `Bearer ${hfToken}`;

    const uploadRes = await fetch("https://yisol-idm-vton.hf.space/upload", {
      method: "POST",
      headers,
      body: formData
    });

    if (uploadRes.ok) {
      const paths = await uploadRes.json();
      const firstPath = paths?.[0];
      return typeof firstPath === 'string' ? { path: firstPath } : firstPath;
    }
  } catch (e) {
    console.warn("[Hugging Face VTO Upload Warning]:", e);
  }

  return { url: input };
}

export class HuggingFaceVtoProvider implements IVtoProvider {
  public id = "huggingface-vto";
  public name = "Hugging Face ZeroGPU IDM-VTON Engine (Development/Testing)";

  public isConfigured(): boolean {
    return process.env.HF_ENABLED !== "false";
  }

  public getLicenseStatus(): VtoLicenseStatus {
    const raw = process.env.HF_LICENSE_STATUS?.toUpperCase();
    if (raw === "COMMERCIAL_LICENSED") return "COMMERCIAL_LICENSED";
    if (raw === "DISABLED") return "DISABLED";
    // Default official yisol/IDM-VTON weights license is DEVELOPMENT_ONLY
    return "DEVELOPMENT_ONLY";
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
      maxInputResolution: 1024,
      maxOutputResolution: 1024
    };
  }

  public estimateCost(request: NormalizedVtoGenerationRequest): number {
    return 0.0; // Free ZeroGPU public space
  }

  public async healthCheck(): Promise<ProviderHealthResult> {
    const startTime = Date.now();
    try {
      const res = await fetch("https://yisol-idm-vton.hf.space", { method: "HEAD" });
      const latencyMs = Date.now() - startTime;
      return {
        healthy: res.ok,
        status: res.ok ? "operational" : "degraded",
        latencyMs,
        details: `Space HTTP status: ${res.status}`
      };
    } catch (e: any) {
      return {
        healthy: false,
        status: "unavailable",
        latencyMs: Date.now() - startTime,
        details: e?.message || "Hugging Face Space offline"
      };
    }
  }

  public getConfig(): VtoProviderConfig {
    const token = process.env.HF_TOKEN;
    return {
      id: this.id,
      name: this.name,
      isConfigured: true,
      modelName: "yisol/IDM-VTON (ZeroGPU - Development Only)",
      statusMessage: token 
        ? "Hugging Face ZeroGPU IDM-VTON Engine Active (Authenticated HF_TOKEN)."
        : "Hugging Face ZeroGPU IDM-VTON Development Engine Active."
    };
  }

  public async generate(request: NormalizedVtoGenerationRequest): Promise<NormalizedVtoGenerationResult> {
    const userPhoto: VtoUserPhoto = {
      id: `photo_${request.requestId}`,
      url: request.personImage,
      mimeType: "image/jpeg",
      width: 800,
      height: 1200,
      sizeBytes: 500000,
      uploadedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      inputMode: "full_body"
    };

    const product = {
      id: request.productId || "prod_gen",
      title: request.productTitle || "Garment Item",
      price: 0,
      store: request.storeName || "Retailer Store",
      url: "/search",
      imageUrl: request.garmentImage,
      category: request.garmentType
    };

    const legacyJob = await this.generateTryOn(
      userPhoto,
      product,
      request.personImage.startsWith("data:") ? request.personImage : undefined,
      request.garmentImage.startsWith("data:") ? request.garmentImage : undefined
    );

    if (legacyJob.status === "COMPLETED" && legacyJob.resultImageUrl) {
      return {
        success: true,
        requestId: request.requestId,
        provider: this.id,
        providerRequestId: legacyJob.jobId,
        image: legacyJob.resultImageUrl,
        generationTimeMs: 15000,
        estimatedCost: 0,
        model: "yisol/IDM-VTON",
        licenseStatus: this.getLicenseStatus()
      };
    }

    return {
      success: false,
      requestId: request.requestId,
      provider: this.id,
      providerRequestId: legacyJob.jobId,
      generationTimeMs: 15000,
      estimatedCost: 0,
      model: "yisol/IDM-VTON",
      licenseStatus: this.getLicenseStatus(),
      failureCode: "HF_GENERATION_FAILED",
      failureMessage: legacyJob.error || "Hugging Face ZeroGPU generation failed."
    };
  }

  public async generateTryOn(
    userPhoto: VtoUserPhoto,
    product: {
      id: string;
      title: string;
      price: number;
      store: string;
      url: string;
      imageUrl: string;
      category?: string;
      drapeStyle?: string;
    },
    userPhotoBase64?: string,
    garmentBase64?: string
  ): Promise<VtoJobResult> {
    const jobId = `vto_hf_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const createdAt = new Date().toISOString();

    try {
      console.log("[Hugging Face ZeroGPU VTO]: Uploading image inputs to Gradio endpoint...");
      const hfToken = process.env.HF_TOKEN;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (hfToken) {
        headers["Authorization"] = `Bearer ${hfToken}`;
      }

      const humanInputStr = userPhotoBase64 || userPhoto.url;
      const garmentInputStr = garmentBase64 || product.imageUrl;

      const [humanUploaded, garmentUploaded] = await Promise.all([
        uploadToGradio(humanInputStr, "human.png", hfToken),
        uploadToGradio(garmentInputStr, "garment.png", hfToken)
      ]);

      console.log("[Hugging Face ZeroGPU VTO]: Submitting job via REST /call/tryon...");
      const submitRes = await fetch("https://yisol-idm-vton.hf.space/call/tryon", {
        method: "POST",
        headers,
        body: JSON.stringify({
          data: [
            { background: humanUploaded, layers: [], composite: null },
            garmentUploaded,
            `${product.title} ${product.category || ''}`,
            true, // is_checked (Auto alignment)
            true,  // is_checked_crop
            30,
            Math.floor(Math.random() * 100000)
          ]
        })
      });

      if (submitRes.status === 429 || submitRes.status === 503) {
         throw new Error(`Provider returned ${submitRes.status}. Quota exhausted or space is asleep.`);
      }

      if (!submitRes.ok) {
         throw new Error(`Failed to submit job: ${submitRes.status} ${submitRes.statusText}`);
      }

      const { event_id } = await submitRes.json();
      if (!event_id) {
         throw new Error("No event_id returned from Gradio API.");
      }

      console.log(`[Hugging Face ZeroGPU VTO]: Job submitted. event_id=${event_id}. Starting SSE polling...`);

      const sseRes = await fetch(`https://yisol-idm-vton.hf.space/call/tryon/${event_id}`, { headers });
      
      if (!sseRes.ok || !sseRes.body) {
         throw new Error(`Failed to connect to SSE stream: ${sseRes.status}`);
      }

      const reader = sseRes.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let resultImageUrl = "";
      let errorEncountered = "";
      let done = false;

      while (!done) {
        const { value, done: streamDone } = await reader.read();
        if (streamDone) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (let i = 0; i < lines.length; i++) {
           const line = lines[i].trim();
           
           if (line.startsWith("event: ")) {
              const eventName = line.substring(7);
              if (i + 1 < lines.length && lines[i+1].trim().startsWith("data: ")) {
                 const dataStr = lines[i+1].trim().substring(6);
                 i++;

                 if (eventName === "error") {
                    errorEncountered = dataStr;
                    done = true;
                    break;
                 } else if (eventName === "complete") {
                    try {
                       const parsedData = JSON.parse(dataStr);
                       const outputData = parsedData?.[0];
                       if (typeof outputData === "string") {
                          resultImageUrl = outputData;
                       } else if (outputData?.url) {
                          resultImageUrl = outputData.url;
                       } else if (outputData?.path) {
                          resultImageUrl = outputData.path;
                       }
                    } catch(e) {}
                    done = true;
                    break;
                 }
              }
           }
        }
      }

      if (errorEncountered) {
         throw new Error(`Gradio generation error: ${errorEncountered}`);
      }

      if (resultImageUrl) {
        if (!resultImageUrl.startsWith("http://") && !resultImageUrl.startsWith("https://") && !resultImageUrl.startsWith("data:")) {
          resultImageUrl = `https://yisol-idm-vton.hf.space/file=${resultImageUrl}`;
        }

        console.log(`[Hugging Face ZeroGPU VTO]: SUCCESS! Generated VTO image URL: ${resultImageUrl}`);

        return {
          jobId,
          sessionId: `sess_${Date.now()}`,
          status: "COMPLETED",
          userPhotoUrl: userPhoto.url,
          productId: product.id,
          productTitle: product.title,
          productStore: product.store,
          productPrice: product.price,
          productUrl: product.url,
          resultImageUrl,
          providerId: this.id,
          createdAt,
          completedAt: new Date().toISOString()
        };
      } else {
         throw new Error("Job completed but no resultImageUrl was found.");
      }

    } catch (err: any) {
      const errMsg = err?.message || String(err);
      console.warn("[Hugging Face ZeroGPU VTO Error]:", errMsg);

      return {
        jobId: `vto_hf_error_${Date.now()}`,
        sessionId: `sess_${Date.now()}`,
        status: "FAILED",
        userPhotoUrl: userPhoto.url,
        productId: product.id,
        productTitle: product.title,
        productStore: product.store,
        productPrice: product.price,
        productUrl: product.url,
        providerId: this.id,
        createdAt,
        completedAt: createdAt,
        error: errMsg || "Virtual Try-On provider encountered an error."
      };
    }
  }
}

export const huggingFaceVtoProvider = new HuggingFaceVtoProvider();

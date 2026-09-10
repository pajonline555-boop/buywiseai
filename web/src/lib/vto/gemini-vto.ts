import { GoogleGenAI } from '@google/genai';
import { VtoJobResult, VtoProviderConfig, VtoUserPhoto } from './types';

export class GeminiVtoProvider {
  public id = "gemini-vto";
  public name = "Google Gemini 3.1 Flash Image VTO Engine";

  public isConfigured(): boolean {
    return Boolean(process.env.GEMINI_API_KEY);
  }

  public getConfig(): VtoProviderConfig {
    const configured = this.isConfigured();
    return {
      id: this.id,
      name: this.name,
      isConfigured: configured,
      modelName: "gemini-3.1-flash-image",
      statusMessage: configured 
        ? "Google Gemini 3.1 Flash Image VTO Engine active." 
        : "AI Virtual Try-On provider is unconfigured. Please set GEMINI_API_KEY in .env.local to enable live AI image editing."
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
    const configured = this.isConfigured();
    const apiKey = process.env.GEMINI_API_KEY;
    const modelName = "gemini-3.1-flash-image";
    const jobId = `vto_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const createdAt = new Date().toISOString();

    if (!configured || !apiKey) {
      return {
        jobId,
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
        error: "VTO_PROVIDER_UNAVAILABLE: Please set GEMINI_API_KEY in web/.env.local to enable AI image editing."
      };
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const parts: any[] = [];

      // Image A: Primary User Photo (Immutable Human Subject)
      if (userPhotoBase64) {
        const cleanUserBase64 = userPhotoBase64.replace(/^data:image\/\w+;base64,/, "");
        parts.push({
          inlineData: {
            mimeType: "image/jpeg",
            data: cleanUserBase64
          }
        });
      }

      // Image B: Selected Product Garment Photo
      if (garmentBase64) {
        const cleanGarmentBase64 = garmentBase64.replace(/^data:image\/\w+;base64,/, "");
        parts.push({
          inlineData: {
            mimeType: "image/jpeg",
            data: cleanGarmentBase64
          }
        });
      }

      parts.push({
        text: `Using Image A as the immutable identity reference for the person and Image B as the exact garment reference, create one photorealistic image showing the SAME PERSON from Image A wearing the garment from Image B. Preserve the person's face, hair, skin tone, body proportions, pose and background. Do not replace the person with the model from Image B. Use Image B only as the clothing reference. Return one finished photograph.`
      });

      const response = await ai.models.generateContent({
        model: modelName,
        contents: [
          {
            role: "user",
            parts
          }
        ]
      });

      const firstCandidate = response?.candidates?.[0];
      const inlineImagePart = firstCandidate?.content?.parts?.find((p: any) => p.inlineData);

      if (inlineImagePart?.inlineData?.data) {
        const generatedDataUrl = `data:${inlineImagePart.inlineData.mimeType || "image/png"};base64,${inlineImagePart.inlineData.data}`;
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
          resultImageUrl: generatedDataUrl,
          providerId: this.id,
          createdAt,
          completedAt: new Date().toISOString()
        };
      } else {
        return {
          jobId,
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
          error: "IMAGE_OUTPUT_UNAVAILABLE: gemini-3.1-flash-image did not return inlineData image bytes."
        };
      }
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      let classifiedError = "VTO_GENERATION_FAILED";

      if (errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("Quota exceeded")) {
        classifiedError = "QUOTA_EXHAUSTED: Google Gemini API quota limit 0 reached for model gemini-3.1-flash-image. Enable billing or check quotas at ai.google.dev.";
      } else if (errMsg.includes("404") || errMsg.includes("not found")) {
        classifiedError = "MODEL_NOT_FOUND: gemini-3.1-flash-image endpoint is not enabled or accessible for this API key.";
      } else if (errMsg.includes("403") || errMsg.includes("API_KEY_INVALID")) {
        classifiedError = "INVALID_API_KEY: Provided GEMINI_API_KEY is invalid or unauthorized.";
      }

      return {
        jobId,
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
        error: classifiedError
      };
    }
  }
}

export const geminiVtoProvider = new GeminiVtoProvider();

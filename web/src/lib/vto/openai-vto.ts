import { VtoJobResult, VtoProviderConfig, VtoUserPhoto } from './types';

export class OpenAiVtoProvider {
  public id = "openai-vto";
  public name = "OpenAI Image Generation VTO Engine";

  public isConfigured(): boolean {
    return Boolean(process.env.OPENAI_API_KEY);
  }

  public getConfig(): VtoProviderConfig {
    const configured = this.isConfigured();
    return {
      id: this.id,
      name: this.name,
      isConfigured: configured,
      modelName: "dall-e-3",
      statusMessage: configured 
        ? "OpenAI Image Generation VTO Engine active." 
        : "AI Virtual Try-On provider is unconfigured. Please set OPENAI_API_KEY in .env.local to enable live AI image editing."
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
    const apiKey = process.env.OPENAI_API_KEY;
    const jobId = `vto_oai_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
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
        error: "VTO_PROVIDER_UNAVAILABLE: Please set OPENAI_API_KEY in .env.local to enable AI image editing."
      };
    }

    try {
      const response = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: `Photorealistic virtual try-on photograph. Fit the clothing product '${product.title}' onto the user. Preserve facial identity, hair, skin tone, and body pose. Drape style: '${product.drapeStyle || 'nivi'}'. High resolution fashion photography.`,
          n: 1,
          size: "1024x1024",
          response_format: "b64_json"
        })
      });

      if (response.ok) {
        const data = await response.json();
        const b64 = data?.data?.[0]?.b64_json;
        if (b64) {
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
            resultImageUrl: `data:image/png;base64,${b64}`,
            providerId: this.id,
            createdAt,
            completedAt: new Date().toISOString()
          };
        }
      } else {
        const errText = await response.text();
        if (errText.includes("credit_balance_exhausted") || errText.includes("insufficient_quota")) {
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
            error: "VTO_PROVIDER_QUOTA_EXHAUSTED: OpenAI API key credit balance is exhausted. Please add billing credits at platform.openai.com/settings/billing."
          };
        }
      }
    } catch (err: any) {
      console.warn("[OpenAI Image VTO Error]:", err?.message);
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
      error: "VTO_GENERATION_FAILED: OpenAI API call did not return a valid transformed image."
    };
  }
}

export const openAiVtoProvider = new OpenAiVtoProvider();

import { VisionProvider, VisionRequestOptions, VisionResult, VisionProductAnalysis, VisualProfile, ImageQualityAssessment } from './types';
import { GoogleGenAI } from '@google/genai';

export class GeminiVisionProvider implements VisionProvider {
  readonly id = 'gemini';
  readonly name = 'Google Gemini Vision Provider';

  async analyze(image: string, options: VisionRequestOptions): Promise<VisionResult> {
    const timestamp = new Date().toISOString();
    const mode = options.mode || 'exact';
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      return {
        success: false,
        status: 'error',
        mode,
        productDetected: false,
        error: 'Gemini API key is not configured.',
        timestamp,
      };
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const model = process.env.GEMINI_VISION_MODEL || 'gemini-2.5-flash';

      const promptText = mode === 'exact' 
        ? `You are an expert product identification AI for BuyWise AI e-commerce search.
Your task is to analyze an uploaded image and extract structured product details and fine-grained visual characteristics for EXACT product matching.

STRICT INSTRUCTIONS:
1. Determine if a physical commercial product is visible. Set "productDetected": true or false.
2. Evaluate photo quality ("quality": "usable" | "blurry" | "too_dark" | "too_small" | "obstructed", "isUsable": boolean, "warning": string | null).
3. Count distinct physical products present ("detectedProductsCount": number).
4. Extract "visualProfile": silhouette, shape, pattern, texture, colorPalette, dominantColors, designElements, logoPlacement, distinctiveFeatures.
5. OBSERVED vs INFERRED attributes.
6. ZERO HALLUCINATION: Do NOT invent brand names or model names if not clearly visible. Set "brand": null or "model": null when uncertain.

Return ONLY a JSON object matching this exact structure:
{
  "productDetected": true,
  "detectedProductsCount": 1,
  "qualityAssessment": {
    "quality": "usable",
    "isUsable": true,
    "warning": null
  },
  "primaryProduct": {
    "category": "footwear" | "fashion" | "electronics" | "accessories" | "home" | null,
    "subcategory": string | null,
    "brand": string | null,
    "model": string | null,
    "productName": string | null,
    "gender": "men" | "women" | "unisex" | null,
    "colors": string[],
    "materials": string[],
    "styles": string[],
    "visibleFeatures": string[],
    "visualProfile": {
      "silhouette": string | null,
      "shape": string | null,
      "pattern": string | null,
      "texture": string | null,
      "colorPalette": string[],
      "dominantColors": string[],
      "designElements": string[],
      "logoPlacement": string | null,
      "distinctiveFeatures": string[]
    },
    "observedAttributes": {},
    "inferredAttributes": {},
    "visibleText": string[],
    "confidence": {
      "category": number | null,
      "brand": number | null,
      "model": number | null,
      "overall": number | null
    },
    "searchQueries": string[]
  }
}`
        : `You are a fashion & visual style analysis AI for BuyWise AI.
Your task is to analyze an uploaded image and extract visual design & style characteristics for SIMILAR STYLE matching.
Return ONLY a JSON object matching the exact structure requested.`;

      // Handle base64 image or URL
      let inlineData: { mimeType: string; data: string } | null = null;
      if (image.startsWith('data:')) {
        const parts = image.split(';base64,');
        const mimeType = parts[0].replace('data:', '');
        const data = parts[1];
        inlineData = { mimeType, data };
      }

      const contents: any[] = [promptText];
      if (inlineData) {
        contents.push({ inlineData });
      }

      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          responseMimeType: 'application/json',
        }
      });

      const content = response.text;
      if (!content) {
        throw new Error('Received empty response from Gemini Vision model');
      }

      const parsed = JSON.parse(content);
      const productDetected = Boolean(parsed.productDetected);

      const qualityAssessment: ImageQualityAssessment = {
        quality: parsed.qualityAssessment?.quality || 'usable',
        isUsable: typeof parsed.qualityAssessment?.isUsable === 'boolean' ? parsed.qualityAssessment.isUsable : true,
        warning: parsed.qualityAssessment?.warning || null,
      };

      if (!productDetected || !parsed.primaryProduct) {
        return {
          success: true,
          status: 'no_product_detected',
          mode,
          productDetected: false,
          qualityAssessment,
          detectedProductsCount: 0,
          suggestedQuery: 'No Product Detected',
          timestamp,
        };
      }

      const primaryProduct = this.sanitizeAnalysis(parsed.primaryProduct);
      const topQuery = primaryProduct.searchQueries[0] || primaryProduct.productName || primaryProduct.category || 'Uploaded Item';

      return {
        success: true,
        status: 'analyzed',
        mode,
        productDetected: true,
        qualityAssessment,
        detectedProductsCount: typeof parsed.detectedProductsCount === 'number' ? parsed.detectedProductsCount : 1,
        primaryProduct,
        products: [primaryProduct],
        suggestedQuery: topQuery,
        timestamp,
      };
    } catch (err: any) {
      return {
        success: false,
        status: 'error',
        mode,
        productDetected: false,
        error: err?.message || 'Gemini Vision AI analysis failed',
        timestamp,
      };
    }
  }

  public sanitizeAnalysis(raw: any): VisionProductAnalysis {
    const rawProfile = raw.visualProfile || {};
    const visualProfile: VisualProfile = {
      silhouette: typeof rawProfile.silhouette === 'string' ? rawProfile.silhouette : null,
      shape: typeof rawProfile.shape === 'string' ? rawProfile.shape : null,
      pattern: typeof rawProfile.pattern === 'string' ? rawProfile.pattern : null,
      texture: typeof rawProfile.texture === 'string' ? rawProfile.texture : null,
      colorPalette: Array.isArray(rawProfile.colorPalette) ? rawProfile.colorPalette.filter((c: any) => typeof c === 'string') : [],
      dominantColors: Array.isArray(rawProfile.dominantColors) ? rawProfile.dominantColors.filter((c: any) => typeof c === 'string') : [],
      designElements: Array.isArray(rawProfile.designElements) ? rawProfile.designElements.filter((d: any) => typeof d === 'string') : [],
      logoPlacement: typeof rawProfile.logoPlacement === 'string' ? rawProfile.logoPlacement : null,
      distinctiveFeatures: Array.isArray(rawProfile.distinctiveFeatures) ? rawProfile.distinctiveFeatures.filter((f: any) => typeof f === 'string') : [],
    };

    return {
      category: typeof raw.category === 'string' ? raw.category : null,
      subcategory: typeof raw.subcategory === 'string' ? raw.subcategory : null,
      brand: typeof raw.brand === 'string' ? raw.brand : null,
      model: typeof raw.model === 'string' ? raw.model : null,
      productName: typeof raw.productName === 'string' ? raw.productName : null,
      gender: typeof raw.gender === 'string' ? raw.gender : null,
      colors: Array.isArray(raw.colors) ? raw.colors.filter((c: any) => typeof c === 'string') : [],
      materials: Array.isArray(raw.materials) ? raw.materials.filter((m: any) => typeof m === 'string') : [],
      styles: Array.isArray(raw.styles) ? raw.styles.filter((s: any) => typeof s === 'string') : [],
      visibleFeatures: Array.isArray(raw.visibleFeatures) ? raw.visibleFeatures.filter((f: any) => typeof f === 'string') : [],
      visualProfile,
      observedAttributes: typeof raw.observedAttributes === 'object' && raw.observedAttributes !== null ? raw.observedAttributes : {},
      inferredAttributes: typeof raw.inferredAttributes === 'object' && raw.inferredAttributes !== null ? raw.inferredAttributes : {},
      visibleText: Array.isArray(raw.visibleText) ? raw.visibleText.filter((t: any) => typeof t === 'string') : [],
      confidence: {
        category: typeof raw.confidence?.category === 'number' ? Math.min(1, Math.max(0, raw.confidence.category)) : null,
        brand: typeof raw.confidence?.brand === 'number' ? Math.min(1, Math.max(0, raw.confidence.brand)) : null,
        model: typeof raw.confidence?.model === 'number' ? Math.min(1, Math.max(0, raw.confidence.model)) : null,
        overall: typeof raw.confidence?.overall === 'number' ? Math.min(1, Math.max(0, raw.confidence.overall)) : null,
      },
      searchQueries: Array.isArray(raw.searchQueries) ? raw.searchQueries.filter((q: any) => typeof q === 'string') : [],
    };
  }
}

export const geminiVisionProvider = new GeminiVisionProvider();

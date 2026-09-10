import { VisionProvider, VisionRequestOptions, VisionResult, VisionProductAnalysis, VisualProfile, ImageQualityAssessment } from './types';
import OpenAI from 'openai';

export class OpenAiVisionProvider implements VisionProvider {
  readonly id = 'openai';
  readonly name = 'OpenAI Vision Provider';

  async analyze(image: string, options: VisionRequestOptions): Promise<VisionResult> {
    const timestamp = new Date().toISOString();
    const mode = options.mode || 'exact';
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return {
        success: false,
        status: 'error',
        mode,
        productDetected: false,
        error: 'Vision AI API key is not configured.',
        timestamp,
      };
    }

    try {
      const openai = new OpenAI({ apiKey });
      const model = process.env.OPENAI_VISION_MODEL || 'gpt-4o';

      const systemPrompt = mode === 'exact' 
        ? `You are an expert product identification AI for BuyWise AI e-commerce search.
Your task is to analyze an uploaded image and extract structured product details and fine-grained visual characteristics for EXACT product matching.

STRICT INSTRUCTIONS:
1. Determine if a physical commercial product is visible. Set "productDetected": true or false.
2. Evaluate photo quality ("quality": "usable" | "blurry" | "too_dark" | "too_small" | "obstructed", "isUsable": boolean, "warning": string | null).
3. Count distinct physical products present ("detectedProductsCount": number).
4. Extract "visualProfile":
   - "silhouette": overall silhouette / cut description
   - "shape": structural shape description
   - "pattern": pattern type (solid, striped, mesh, printed)
   - "texture": material surface texture
   - "colorPalette": array of hex/color names visible
   - "dominantColors": main 1-2 colors
   - "designElements": key design features
   - "logoPlacement": exact visible location of logo
   - "distinctiveFeatures": unique visual identifiers
5. OBSERVED vs INFERRED:
   - "observedAttributes": Attributes DIRECTLY visible in the image.
   - "inferredAttributes": Reasonably deduced attributes.
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
    "observedAttributes": object,
    "inferredAttributes": object,
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

STRICT INSTRUCTIONS:
1. Determine if a commercial product or wearable item is present ("productDetected": true or false).
2. Evaluate photo quality and count products.
3. Extract fine-grained "visualProfile" (silhouette, colorPalette, pattern, texture, logoPlacement, designElements).
4. Focus on visual characteristics rather than exact model identity.
5. Generate 3 to 5 search queries for visually similar products across price points.

Return ONLY a JSON object matching the exact structure above.`;

      const response = await openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: `Analyze this image in ${mode} mode.` },
              { type: 'image_url', image_url: { url: image } },
            ],
          },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 1200,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Received empty response from Vision AI model');
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
        error: err?.message || 'Vision AI analysis failed',
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

export const openAiVisionProvider = new OpenAiVisionProvider();

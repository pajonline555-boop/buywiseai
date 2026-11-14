import { VisionProvider, VisionRequestOptions, VisionResult } from './types';
import { openAiVisionProvider } from './openai';
import { geminiVisionProvider } from './gemini';

export class ResilientVisionProvider implements VisionProvider {
  readonly id = 'resilient_vision';
  readonly name = 'Resilient Vision Provider (Gemini with OpenAI Failover)';

  async analyze(image: string, options: VisionRequestOptions): Promise<VisionResult> {
    // 1. Primary: Gemini Vision with multi-model fallback & backoff
    if (process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
      try {
        const geminiRes = await geminiVisionProvider.analyze(image, options);
        if (geminiRes.success && geminiRes.productDetected) {
          return geminiRes;
        }

        // If Gemini failed due to temporary load or error, attempt OpenAI failover
        if (!geminiRes.success) {
          console.warn('[ResilientVisionProvider] Gemini returned failure, attempting OpenAI failover:', geminiRes.error);
          if (process.env.OPENAI_API_KEY) {
            const openAiRes = await openAiVisionProvider.analyze(image, options);
            if (openAiRes.success) return openAiRes;
          }
          return geminiRes;
        }

        return geminiRes;
      } catch (err: any) {
        console.warn('[ResilientVisionProvider] Gemini exception, failing over to OpenAI:', err?.message || err);
      }
    }

    // 2. Secondary: OpenAI Vision Provider
    if (process.env.OPENAI_API_KEY) {
      return openAiVisionProvider.analyze(image, options);
    }

    return {
      success: false,
      status: 'error',
      mode: options.mode || 'exact',
      productDetected: false,
      error: 'Vision AI model is experiencing a temporary load spike. Please click Analyze & Search Deals again.',
      timestamp: new Date().toISOString(),
    };
  }
}

export const resilientVisionProvider = new ResilientVisionProvider();

export function getVisionProvider(): VisionProvider {
  return resilientVisionProvider;
}

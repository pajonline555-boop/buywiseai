import { VisionProvider } from './types';
import { openAiVisionProvider } from './openai';
import { geminiVisionProvider } from './gemini';

export function getVisionProvider(): VisionProvider {
  // Return Gemini Vision provider if GEMINI_API_KEY is configured
  if (process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
    return geminiVisionProvider;
  }
  return openAiVisionProvider;
}

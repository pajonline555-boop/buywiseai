export const dynamic = "force-static";
import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    const geminiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    const openAiKey = process.env.OPENAI_API_KEY;

    // 1. Prefer Google Gemini if GEMINI_API_KEY is configured
    if (geminiKey && !geminiKey.includes('your-actual')) {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      
      // Convert OpenAI style messages to Gemini contents format
      const formattedHistory = messages.map((m: any) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');
      
      const systemInstruction = "You are Maya, the official BuyWise AI Shopping & Personal Fashion Assistant. You help users compare prices across Amazon, Flipkart, and eBay, find smart deals, recommend outfits, check price history, and assist with virtual try-on selections. Speak warmly, smartly, and concisely as BuyWise AI's official assistant.";

      const response = await ai.models.generateContent({
        model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
        contents: `${systemInstruction}\n\nChat History:\n${formattedHistory}\n\nAssistant:`,
      });

      return NextResponse.json({
        role: 'assistant',
        content: response.text || "Hello! I'm Maya, your BuyWise AI Assistant. How can I help you today?"
      });
    }

    // 2. Fallback to OpenAI if OPENAI_API_KEY is configured
    if (openAiKey && !openAiKey.includes('your-actual')) {
      const openai = new OpenAI({ apiKey: openAiKey });

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { 
            role: "system", 
            content: "You are Maya, the official BuyWise AI Shopping & Personal Fashion Assistant. You help users compare prices across Amazon, Flipkart, and eBay, find smart deals, recommend outfits, check price history, and assist with virtual try-on selections. Speak warmly, smartly, and concisely as BuyWise AI's official assistant." 
          },
          ...messages
        ],
        temperature: 0.7,
      });

      return NextResponse.json(response.choices[0].message);
    }

    // 3. Fallback when neither key is configured
    return NextResponse.json({ 
      role: 'assistant', 
      content: "Hello! I'm Maya, your BuyWise AI Assistant. (No active GEMINI_API_KEY or OPENAI_API_KEY found in .env.local. Please configure your API key)." 
    });

  } catch (error: any) {
    console.error('AI Route Error:', error);
    
    if (error?.status === 429 || error?.code === 'credit_balance_exhausted' || error?.type === 'insufficient_quota') {
      return NextResponse.json({ 
        role: 'assistant', 
        content: "⚠️ OpenAI API Error 429: Credit Balance Exhausted (Insufficient Quota).\n\nYour OpenAI account has $0 remaining billing credits. Add credits or switch to GEMINI_API_KEY in .env.local." 
      });
    }

    return NextResponse.json({ 
      role: 'assistant',
      content: `AI Error: ${error?.message || 'Failed to communicate with AI model'}` 
    });
  }
}

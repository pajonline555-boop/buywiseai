export const dynamic = "force-static";
import { NextResponse } from 'next/server';
import { MayaKnowledgeService, MayaLanguage } from '@/lib/ai/mayaKnowledgeService';

export async function POST(request: Request) {
  try {
    const { messages, lang, liveContext, context } = await request.json();
    const lastUserMessage = messages && messages.length > 0 ? messages[messages.length - 1].content : '';
    const preferredLang: MayaLanguage = lang || 'en';

    // 1. Query Central Authoritative Knowledge Service with Conversation Context
    const kbResult = await MayaKnowledgeService.getAuthoritativeAnswer(lastUserMessage, preferredLang, liveContext, context);

    const geminiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    // 2. If Gemini API is available and match is NOT unknown/prompt injection, format response with Gemini 2.5 Flash
    if (geminiKey && !geminiKey.includes('your-actual') && kbResult.intent !== 'UNKNOWN' && kbResult.intent !== 'PROMPT_INJECTION') {
      try {
        const systemPrompt = `You are Maya, the official BuyWise AI Shopping & Personal Fashion Assistant.
        
AUTHORITATIVE KNOWLEDGE BASE FACT:
"${kbResult.answer}"

STRICT ANSWERING RULES:
1. Deliver this exact authoritative information clearly, concisely, and naturally in the user's requested language (${kbResult.languageUsed}).
2. Do NOT invent prices, dates, competition prizes, winners, or guarantees.
3. Keep response friendly, helpful, and concise.`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: 'user', parts: [{ text: lastUserMessage }] }]
          })
        });

        if (response.ok) {
          const data = await response.json();
          const replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (replyText && replyText.trim()) {
            return NextResponse.json({
              role: 'assistant',
              content: replyText.trim(),
              intent: kbResult.intent,
              isAuthoritative: true,
              context: kbResult.updatedContext
            });
          }
        }
      } catch (err) {
        console.error("Gemini formatting failed, returning raw KB answer:", err);
      }
    }

    // 3. Return Direct Authoritative Knowledge Base Result
    return NextResponse.json({
      role: 'assistant',
      content: kbResult.answer,
      intent: kbResult.intent,
      isAuthoritative: true,
      context: kbResult.updatedContext
    });

  } catch (error: any) {
    console.error('AI Chat Error:', error);
    return NextResponse.json({ 
      role: 'assistant',
      content: "Sorry, I'm having trouble connecting right now. Please try again!",
      intent: 'UNKNOWN',
      isAuthoritative: false
    });
  }
}




import {
  MayaIntent,
  MayaLanguage,
  AuthoritativeFaqItem,
  AUTHORITATIVE_FAQ_CATALOG,
  SAFE_UNCONFIRMED_FALLBACK,
  PROMPT_INJECTION_REFUSAL,
} from './authoritativeFaqCatalog';

export type { MayaLanguage, MayaIntent };

export interface ConversationContext {
  lastIntent?: MayaIntent;
  lastCategory?: string;
  activeTopic?: string;
  lastUpdatedTimestamp?: number;
}

export interface UnansweredQuestionRecord {
  id: string;
  query: string;
  language: MayaLanguage;
  intent: MayaIntent;
  timestamp: string;
  status: 'PENDING_REVIEW' | 'ADDED_TO_FAQ' | 'DISMISSED';
}

export interface MayaAnswerResult {
  answer: string;
  intent: MayaIntent;
  isAuthoritative: boolean;
  requiresLiveBackendData: boolean;
  languageUsed: MayaLanguage;
  updatedContext?: ConversationContext;
}

// In-memory log of unanswered questions for Admin Review Queue
export const MAYA_UNANSWERED_QUESTIONS: UnansweredQuestionRecord[] = [];

export class MayaKnowledgeService {
  /**
   * Detect prompt injection attempts
   */
  public static isPromptInjection(query: string): boolean {
    const q = query.toLowerCase();
    const injectionPatterns = [
      'ignore rules',
      'ignore instructions',
      'override system',
      'pretend admin',
      'pretend you are admin',
      'pretend you are an administrator',
      'tell me the secret',
      'tell me secret',
      'hidden competition prize',
      'make up today',
      'make up discount',
      'make up a discount',
      'invent a price',
      'reveal private',
      'another user order',
      "another user's order",
      'ignore buywise',
      'system prompt',
      'disable competition rules',
      'private customer information',
      'not shown to normal users',
      'winner even if you don\'t know',
      'give me internal',
      'firebase credentials',
      'say buywise is 100% secure',
      'unhackable'
    ];
    return injectionPatterns.some((pattern) => q.includes(pattern));
  }

  /**
   * Classify user query into one of 35+ recognized Maya intents, taking context into account
   */
  public static classifyIntent(query: string, context?: ConversationContext): MayaIntent {
    if (this.isPromptInjection(query)) {
      return 'PROMPT_INJECTION';
    }

    const q = query.toLowerCase().trim();

    // Check if context has expired (5 minutes threshold)
    const isContextValid = context && 
      context.lastUpdatedTimestamp && 
      (Date.now() - context.lastUpdatedTimestamp < 5 * 60 * 1000);

    // Check for explicit topic switching keywords
    const isExplicitTopicSwitch = 
      q.includes('compare') || 
      q.includes('smartcompare') || 
      q.includes('order') || 
      q.includes('vto') || 
      q.includes('try on') || 
      q.includes('prime') || 
      q.includes('coupon') || 
      q.includes('alert');

    // 1. Contextual Follow-Up Check (only if context valid and no topic switch)
    if (isContextValid && !isExplicitTopicSwitch && context?.lastCategory === 'COMPETITION') {
      if (q.includes('photo') || q.includes('image') || q.includes('picture') || q.includes('upload')) {
        return 'COMPETITION_SUBMISSION';
      }
      if (q.includes('rule') || q.includes('terms') || q.includes('how to')) {
        return 'COMPETITION_GENERAL';
      }
      if (q.includes('vote') || q.includes('voting') || q.includes('when does it close')) {
        return 'COMPETITION_VOTING';
      }
    }

    // 2. Direct Competition Intent Sub-Classification
    if (q.includes('win') || q.includes('winner') || q.includes('who won') || q.includes('winner kaise')) return 'COMPETITION_WINNER';
    if (q.includes('prize') || q.includes('reward amount') || q.includes('cash prize') || q.includes('prize kitna')) return 'COMPETITION_PRIZE';
    if (q.includes('vote') || q.includes('voting') || q.includes('can i vote') || q.includes('vote kaise')) return 'COMPETITION_VOTING';
    if (q.includes('submit') || q.includes('submission') || q.includes('reject') || q.includes('withdraw') || q.includes('photo submit')) return 'COMPETITION_SUBMISSION';
    if (q.includes('eligible') || q.includes('free entry') || q.includes('need to buy') || q.includes('who can participate') || q.includes('comp me entry')) return 'COMPETITION_ELIGIBILITY';
    if (q.includes('photo') && (q.includes('competition') || q.includes('public'))) return 'COMPETITION_PRIVACY';
    if (q.includes('competition') || q.includes('challenge') || q.includes('contest') || q.includes('leaderboard')) return 'COMPETITION_GENERAL';

    // 3. Product Search & SmartCompare
    if (q.includes('smartcompare') || q.includes('compare price') || q.includes('14 stores') || q.includes('cheap price') || q.includes('compare phones') || q.includes('lowest price')) return 'SMARTCOMPARE';
    if (q.includes('ad') || q.includes('advertisement') || q.includes('product page') || q.includes('/product/')) return 'PRODUCT_AD';
    if (q.includes('search') || q.includes('find product')) return 'PRODUCT_SEARCH';
    if (q.includes('trust score') || q.includes('value score')) return 'PRODUCT_DETAILS';

    // 4. Voice Search
    if (q.includes('voice') || q.includes('mic') || q.includes('speak') || q.includes('microphone')) return 'VOICE_SEARCH';

    // 5. Maya Assistant
    if (q.includes('who is maya') || q.includes('what can maya do') || q.includes('about maya')) return 'MAYA_ASSISTANT';

    // 6. Virtual Try-On (VTO)
    if (q.includes('saree') || q.includes('jewellery') || q.includes('gown')) return 'VTO_CATEGORY';
    if (q.includes('photo private') || q.includes('vto photo') || q.includes('image privacy')) return 'VTO_PRIVACY';
    if (q.includes('try on') || q.includes('try-on') || q.includes('trial room') || q.includes('vto')) return 'VTO_GENERAL';

    // 7. Orders, Returns & Refunds
    if (q.includes('return') || q.includes('restock') || q.includes('item return')) return 'RETURN';
    if (q.includes('refund') || q.includes('money back')) return 'REFUND';
    if (q.includes('order') || q.includes('track order') || q.includes('shipping') || q.includes('kahan hai mera order')) return 'ORDER';

    // 8. Coupons & Price Alerts
    if (q.includes('coupon') || q.includes('discount code') || q.includes('verified today')) return 'COUPON';
    if (q.includes('alert') || q.includes('price drop') || q.includes('notify price')) return 'PRICE_ALERT';

    // 9. Prime, Account & Security
    if (q.includes('prime') || q.includes('membership') || q.includes('vip')) return 'PRIME';
    if (q.includes('google sign') || q.includes('google login')) return 'GOOGLE_SIGNIN';
    if (q.includes('account') || q.includes('login') || q.includes('signup') || q.includes('logout')) return 'ACCOUNT';
    if (q.includes('secure') || q.includes('safety') || q.includes('safe hai kya')) return 'SECURITY';
    if (q.includes('privacy') || q.includes('data policy')) return 'PRIVACY';
    if (q.includes('language') || q.includes('bhasha') || q.includes('hindi') || q.includes('hinglish')) return 'LANGUAGE';

    return 'UNKNOWN';
  }

  /**
   * Detect language or respect user language preference
   */
  public static detectLanguage(query: string, preferredLang?: MayaLanguage): MayaLanguage {
    if (preferredLang) return preferredLang;

    const q = query.toLowerCase();
    const hindiScript = /[\u0900-\u097F]/;
    if (hindiScript.test(query)) return 'hi';

    const hinglishWords = ['kya', 'kaise', 'kahan', 'kab', 'hai', 'hain', 'mein', 'par', 'kar', 'karo', 'mujhe', 'baare', 'bhi', 'kya', 'hoge'];
    if (hinglishWords.some((w) => q.includes(w))) return 'hinglish';

    return 'en';
  }

  /**
   * Retrieve authoritative response from catalog or live backend context
   */
  public static async getAuthoritativeAnswer(
    query: string,
    requestedLang?: MayaLanguage,
    liveContext?: Record<string, any>,
    context?: ConversationContext
  ): Promise<MayaAnswerResult> {
    const lang = this.detectLanguage(query, requestedLang);
    const intent = this.classifyIntent(query, context);
    const q = query.toLowerCase().trim();

    // 1. Handle Prompt Injection Attempts
    if (intent === 'PROMPT_INJECTION') {
      return {
        answer: PROMPT_INJECTION_REFUSAL[lang],
        intent: 'PROMPT_INJECTION',
        isAuthoritative: true,
        requiresLiveBackendData: false,
        languageUsed: lang,
      };
    }

    // 2. Find matching Authoritative FAQ Item
    const matchedFaq = AUTHORITATIVE_FAQ_CATALOG.find((item) => {
      if (item.intent === intent) return true;
      return item.keywords.some((kw) => q.includes(kw.toLowerCase()));
    });

    if (matchedFaq) {
      let finalResponse = matchedFaq.answer[lang] || matchedFaq.answer['en'];

      // Inject Live Context if required by Intent
      if (matchedFaq.requiresLiveBackendData && liveContext) {
        if (intent === 'COMPETITION_WINNER' && liveContext.winnerName) {
          finalResponse += `\n\n🏆 Official Current Winner: ${liveContext.winnerName}`;
        } else if (intent === 'COMPETITION_PRIZE' && liveContext.prizeAmount) {
          finalResponse += `\n\n🎁 Official Active Challenge Prize: ${liveContext.prizeAmount}`;
        } else if (intent === 'ORDER' && liveContext.orderStatus) {
          finalResponse += `\n\n📦 Your Active Order Status: ${liveContext.orderStatus}`;
        }
      }

      // Update short-lived conversation context
      const newContext: ConversationContext = {
        lastIntent: intent,
        lastCategory: matchedFaq.category,
        lastUpdatedTimestamp: Date.now(),
      };

      return {
        answer: finalResponse,
        intent,
        isAuthoritative: true,
        requiresLiveBackendData: matchedFaq.requiresLiveBackendData,
        languageUsed: lang,
        updatedContext: newContext,
      };
    }

    // 3. Log unrecognized queries to Unanswered Review Queue (without PII)
    this.logUnansweredQuestion(query, lang, intent);

    // 4. Return Safe Unconfirmed Fallback
    return {
      answer: SAFE_UNCONFIRMED_FALLBACK[lang],
      intent: 'UNKNOWN',
      isAuthoritative: true,
      requiresLiveBackendData: false,
      languageUsed: lang,
    };
  }

  /**
   * Log unanswered query into memory/DB queue for Admin Review Console
   */
  private static logUnansweredQuestion(query: string, lang: MayaLanguage, intent: MayaIntent): void {
    MAYA_UNANSWERED_QUESTIONS.push({
      id: `unans-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      query: query.substring(0, 200), // sanitize length
      language: lang,
      intent,
      timestamp: new Date().toISOString(),
      status: 'PENDING_REVIEW',
    });
  }
}

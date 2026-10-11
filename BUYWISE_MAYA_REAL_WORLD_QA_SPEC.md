# BUYWISE MAYA REAL-WORLD QA SPECIFICATION

**PROJECT**: BuyWise AI  
**PHASE**: 11.2.1  
**DOCUMENT**: Maya Real-World Question Coverage Specification  

---

## 1. PURPOSE & DESIGN GOALS

Maya operates as a controlled, authoritative shopping assistant for BuyWise AI. Answers are served strictly from the approved BuyWise Knowledge Base or authenticated live application data while maintaining fluid conversational context.

```
USER QUERY
     ↓
Prompt Injection & Adversarial Defense Filter
     ↓
Conversational Context Evaluator (Short-Lived Topic Context)
     ↓
Intent Classifier & Natural Language Keyword Matcher (EN / HI / Hinglish)
     ↓
Authoritative Knowledge Base / Live Data Routing
     ↓
Multilingual Formatting & Safety Check
     ↓
Authoritative Maya Response
```

---

## 2. KEY REFINEMENTS IN PHASE 11.2.1

1. **Expanded Intent Classifier**: Added pattern matchers for informal Roman Hinglish (*"comp me entry"*, *"vote kaise karein"*, *"photo private hai"*, *"order kahan tak pahucha"*).
2. **Conversational Context Engine**: Tracks short-lived conversation context (`lastIntent`, `lastCategory`) so follow-up queries (*"What photo should I upload?"*) retain context (*"COMPETITION"*).
3. **Prompt-Injection Resistance**: Adversarial override attempts are filtered and given `PROMPT_INJECTION_REFUSAL`.
4. **Terminology Correction**: Replaced unsupported claims like "Zero Hallucinations" with *"Authoritative-answer policy with safe fallback for unconfirmed information"*.

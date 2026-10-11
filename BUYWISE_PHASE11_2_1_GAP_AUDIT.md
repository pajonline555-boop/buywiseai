# BUYWISE PHASE 11.2.1 GAP AUDIT REPORT

**PROJECT**: BuyWise AI  
**PHASE**: 11.2.1  
**TITLE**: Maya Real-World Question Coverage, Conversational Context & Answer Accuracy Audit  
**DATE**: 2026-09-11  

---

## 1. AUDIT FINDINGS SUMMARY

| Component | Status | Identified Gap / Required Refinement | Action Taken in Phase 11.2.1 |
| :--- | :--- | :--- | :--- |
| **FAQ Catalog Size** | **PARTIAL** | Previously 17 entries covering basic intents. Needed comprehensive coverage across 14 categories with 100+ FAQ items. | Substantially expanded `authoritativeFaqCatalog.ts`. |
| **Hinglish & Misspellings** | **MISSING** | Informal phrasing like *"comp me entry kaise milegi"*, *"vote kaise karein"* fell into `UNKNOWN` fallback. | Added informal Roman Hinglish regex patterns to `MayaKnowledgeService`. |
| **Conversational Context** | **MISSING** | Follow-up queries (e.g. *"What photo should I upload?"* after *"How do I enter competition?"*) lost topic context. | Implemented short-lived, conversation-scoped context tracking. |
| **Terminology** | **UNSUPPORTED** | Term *"Zero Hallucinations"* is overconfident and inaccurate for LLM systems. | Replaced with *"Authoritative-answer policy with safe fallback for unconfirmed information"*. |
| **Prompt-Injection Defense** | **PARTIAL** | Basic system prompt framing. Needed explicit refusal filters for malicious prompt overrides. | Added prompt-injection detector to `MayaKnowledgeService`. |
| **Web / Android Parity** | **PARTIAL** | Web and Android had slightly different static text strings for fallback queries. | Synchronized Android Compose AI sheet to use exact `MayaKnowledgeService` responses. |

---

## 2. DYNAMIC VS STATIC ROUTING GAP IDENTIFICATION

- **Static Approved Knowledge Base**: App features, SmartCompare explanation, general competition rules, VTO privacy, Trust Score explanation, general return policy.
- **Live Backend Data Routing**: Active competition live state, start/end dates, featured products, current leader/winner, real-time product prices, stock, verified coupon validity, authenticated user order status, user Prime entitlement.

---

## 3. PARITY & SECURITY CONCLUSION

Phase 11.2.1 addresses all identified audit gaps by unifying Web and Mobile under a single, authoritative, context-aware Maya Knowledge Engine.

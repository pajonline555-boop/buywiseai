# BUYWISE MAYA KNOWLEDGE BASE SPECIFICATION

**PROJECT**: BuyWise AI  
**PHASE**: 11.2  
**DOCUMENT**: Maya Knowledge Base System Specification  

---

## 1. ARCHITECTURAL OVERVIEW

The **Maya Knowledge Service (`MayaKnowledgeService`)** is the central knowledge retrieval and query classification engine powering the official BuyWise AI Assistant across Web and Android platforms.

```
USER QUESTION
     ↓
Language Detection (EN / HI / Hinglish)
     ↓
Intent Classification (35+ Maya Intents)
     ↓
Knowledge Base Retrieval (Authoritative FAQ Catalog)
     ↓
Live Backend Data Routing (if required)
     ↓
Safety & Quality Checks (Zero Hallucination Filter)
     ↓
Authoritative Response Delivery
```

---

## 2. CORE INTENT CLASSIFICATION MATRIX

Maya classifies queries into 35+ granular intent types:

| Category | Intent Identifiers |
| :--- | :--- |
| **COMPETITION** | `COMPETITION_GENERAL`, `COMPETITION_ELIGIBILITY`, `COMPETITION_ENTRY`, `COMPETITION_SUBMISSION`, `COMPETITION_VOTING`, `COMPETITION_WINNER`, `COMPETITION_PRIZE`, `COMPETITION_PRIVACY` |
| **PRODUCT & DEALS** | `PRODUCT_SEARCH`, `PRODUCT_COMPARISON`, `PRODUCT_AD`, `PRODUCT_DETAILS`, `SMARTCOMPARE` |
| **VOICE & ASSISTANT**| `VOICE_SEARCH`, `MAYA_ASSISTANT` |
| **TRY-ON (VTO)** | `VTO_GENERAL`, `VTO_CATEGORY`, `VTO_PRIVACY` |
| **COMMERCE & ORDERS**| `BUYWISE_STORE`, `ORDER`, `SHIPPING`, `RETURN`, `REFUND`, `COUPON`, `PRICE_ALERT` |
| **MEMBERSHIP** | `PRIME`, `PREMIUM_COLLECTION` |
| **ACCOUNT & AUTH** | `ACCOUNT`, `LOGIN`, `GOOGLE_SIGNIN`, `LANGUAGE` |
| **SECURITY & PRIVACY**| `PRIVACY`, `SECURITY`, `SUPPORT`, `UNKNOWN` |

---

## 3. ZERO-HALLUCINATION RULES

Maya MUST NOT invent:
- Product prices or discount percentages
- Competition prizes, dates, or winners
- Retailer availability or shipping dates
- Return eligibility or refund amounts
- Prime benefits or VTO capability guarantees
- Legal guarantees or security claims ("100% unhackable")

If information is unconfirmed or unavailable, Maya returns the safe fallback:
> *"Sorry, I don't have confirmed information about that yet. Please check the relevant BuyWise section or contact BuyWise support."*

---

## 4. ADMIN KNOWLEDGE MANAGEMENT

Located at `/admin/knowledge`:
- Allows admins (`pajonline555@gmail.com`, `akshayman224@gmail.com`) to manage the Authoritative FAQ Catalog.
- Lifecycle states: `DRAFT` → `REVIEW` → `APPROVED` → `PUBLISHED` → `ARCHIVED`.
- Displays logged unrecognized queries (`MAYA_UNANSWERED_QUESTIONS`) for continuous learning.

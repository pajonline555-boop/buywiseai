# BUYWISE MAYA INTENT COVERAGE MATRIX

**PROJECT**: BuyWise AI  
**PHASE**: 11.2.1  
**DOCUMENT**: Intent Classification & Data Routing Matrix  

---

## 1. INTENT COVERAGE TABLE

| Category | Intent Identifier | Live Data Required | Primary Knowledge Source |
| :--- | :--- | :--- | :--- |
| **COMPETITION** | `COMPETITION_GENERAL` | No | Authoritative FAQ Catalog |
| **COMPETITION** | `COMPETITION_ELIGIBILITY` | Yes | Competition Terms / Active Config |
| **COMPETITION** | `COMPETITION_SUBMISSION` | No | Submission Moderation Rules |
| **COMPETITION** | `COMPETITION_VOTING` | Yes | Active Voting Status |
| **COMPETITION** | `COMPETITION_WINNER` | Yes | Live Leaderboard DB |
| **COMPETITION** | `COMPETITION_PRIZE` | Yes | Active Challenge Config |
| **COMPETITION** | `COMPETITION_PRIVACY` | No | VTO Privacy Policy |
| **SMARTCOMPARE**| `SMARTCOMPARE` | No | 14+ Retailers Architecture FAQ |
| **PRODUCT** | `PRODUCT_SEARCH` | Yes | Live Merchant Search API |
| **PRODUCT** | `PRODUCT_AD` | No | Exact Deep-Link Policy (`/product/[slug]`) |
| **VOICE** | `VOICE_SEARCH` | No | Mic Permission & Speech FAQ |
| **MAYA** | `MAYA_ASSISTANT` | No | Maya Capabilities Guide |
| **VTO** | `VTO_GENERAL` | No | Virtual Trial Room Guide |
| **VTO** | `VTO_CATEGORY` | No | Saree Beta Drape / Jewellery Mapping |
| **COMMERCE** | `BUYWISE_STORE` | Yes | Live Store Inventory |
| **ORDERS** | `ORDER` | Yes | Authenticated User Order API |
| **ORDERS** | `RETURN` | Yes | 5-Stage Return Lifecycle Engine |
| **ORDERS** | `REFUND` | Yes | Inspection & Payment Gateway API |
| **COUPONS** | `COUPON` | Yes | Live Verified Today Engine |
| **ALERTS** | `PRICE_ALERT` | Yes | User Price Drop Tracker DB |
| **MEMBERSHIP** | `PRIME` | Yes | Authenticated Prime Entitlement |
| **SECURITY** | `SECURITY` | No | Factual Security Controls |
| **SECURITY** | `PROMPT_INJECTION` | No | Refusal Filter |

---

## 2. PARITY VERIFICATION
- Web (`/api/chat/route.ts`) and Mobile (`AiAssistantBottomSheet.kt`) use identical intent definitions and response catalog strings.

# BUYWISE AI — MASTER ARCHITECTURE SPECIFICATION
### *Shop Smarter. Buy Better.*

---

> [!IMPORTANT]
> **STANDING ARCHITECTURAL DIRECTIVE FOR ASSISTANTS & DEVELOPERS:**
> Before modifying any existing module, interface, or schema in this repository, you MUST read this document in full and preserve all existing contracts, thresholds, and data structures unless a change explicitly requires a schema migration. Never rewrite unrelated modules.

---

## 1. CONSUMER BRAND & ENGINE IDENTITY
- **Consumer Brand**: **BuyWise AI** (*Shop Smarter. Buy Better.*)
  - Used across all user-facing UI headers, page titles, cards, recommendation blocks, and client metadata.
- **Internal Comparison Engine**: **SmartCompare**
  - Used for internal code namespaces, module directories (`web/src/lib/comparison`), and backend utility helper names.

---

## 2. CANONICAL PRODUCT SCHEMA & INPUT NORMALIZATION
All product search inputs—regardless of origin—MUST normalize into the unified `CanonicalProduct` interface defined in [`web/src/lib/query/types.ts`](file:///c:/APPS/PAJONLINE%20ONLINE%20SHOPPING/web/src/lib/query/types.ts).

```typescript
export type CanonicalSourceType = 'text' | 'photo' | 'assistant' | 'barcode';

export interface CanonicalConfidence {
  category: number | null;
  brand: number | null;
  model: number | null;
  overall: number | null;
}

export interface CanonicalProduct {
  id: string;
  sourceType: CanonicalSourceType;
  rawInput: string;
  title: string;
  category: string | null;
  subcategory: string | null;
  brand: string | null;
  model: string | null;
  productName: string | null;
  gender: string | null;
  colors: string[];
  materials: string[];
  styles: string[];
  visualFeatures: string[];
  observedAttributes: Record<string, unknown>;
  inferredAttributes: Record<string, unknown>;
  visibleText: string[];
  confidence: CanonicalConfidence;
  exactSearchQueries: string[];
  similarSearchQueries: string[];
  broadSearchQueries: string[];
  budgetSearchQueries: string[];
  createdAt: string;
}
```

### Input Normalizers (`web/src/lib/query/normalize.ts`)
- `normalizeVisionToCanonical(analysis, rawInput)`: Converts Vision AI analysis output into canonical product format.
- `normalizeTextQueryToCanonical(rawQuery)`: Converts text input queries into canonical product format.

---

## 3. RETAILER ADAPTER ARCHITECTURE & RESILIENCE
Located in [`web/src/lib/retailers/`](file:///c:/APPS/PAJONLINE%20ONLINE%20SHOPPING/web/src/lib/retailers).

```typescript
export interface RetailerAdapter {
  id: string;
  name: string;
  country: string;
  currency: string;
  enabled: boolean;
  search(query: string): Promise<RetailerSearchResult>;
}
```

### Resilience & Execution Rules
1. **Parallel Execution**: Adapters execute concurrently via `Promise.allSettled()`.
2. **Timeout Protection**: Every adapter search is wrapped in an 8,000ms `Promise.race()` timeout. Slow or unresponsive adapters MUST be timed out cleanly without crashing the overall search request.
3. **Partial Failure Tolerance**: Unconfigured API credentials (missing keys) or network errors return `success: false` or `sourceType: "unavailable"` and MUST NOT crash other working adapters or invent manufactured store prices.
4. **Server Secret Isolation**: Credentials (`AMAZON_PAAPI_*`, `FLIPKART_*`, `EBAY_*`) are accessed strictly server-side in API routes or server modules.

---

## 4. COMPARISON DATA CONTRACTS & VERIFICATION BADGING
Defined in [`web/src/lib/retailers/types.ts`](file:///c:/APPS/PAJONLINE%20ONLINE%20SHOPPING/web/src/lib/retailers/types.ts).

```typescript
export interface StoreOffer {
  id: string;
  retailerId: string;
  store: string;
  title: string;
  url: string;
  price: number;
  currency: string;
  originalPrice?: number;
  mrp?: number;
  discount?: number;
  imageUrl?: string;
  logo?: string;
  rating?: number;
  reviewCount?: number;
  availability: "in_stock" | "out_of_stock" | "unknown";
  sellerName?: string;
  deliveryText?: string;
  isLowest?: boolean;
  isBestValue?: boolean;
  isBestMatch?: boolean;
  matchType?: "exact" | "variant" | "similar" | "unknown";
  matchConfidence?: number;
  identityConfidence?: number;
  attributeMatchScore?: number;
  visualSimilarityScore?: number;
  smartValueScore?: number;
  scoreBreakdown?: SmartValueScoreBreakdown;
  trustScore?: number;
  trustBreakdown?: TrustScoreBreakdown;
  trustLevel?: "high" | "moderate" | "caution";
  dataSource?: SourceType;
  verificationStatus?: VerificationStatus; // "verified_live" | "verification_stale" | "unverified"
  priceVerifiedAt?: string;
  sellerVerified?: boolean;
  staleVerification?: boolean;
  checkedAt: string;
  sourceType: SourceType;
}

export interface GroupedOffers {
  exact: StoreOffer[];
  variant: StoreOffer[];
  similar: StoreOffer[];
}

export interface ComparisonResponse {
  product: string;
  query: string;
  timestamp: string;
  stores: StoreOffer[];
  groupedOffers?: GroupedOffers;
  summary: ComparisonSummary;
  recommendation: string;
  priceTrend?: PriceTrendSummary;
  errors: Array<{ retailer: string; error: string }>;
}
```

---

## 5. PRODUCT IDENTITY HIERARCHY & MATCHING RULES
Located in [`web/src/lib/comparison/matcher.ts`](file:///c:/APPS/PAJONLINE%20ONLINE%20SHOPPING/web/src/lib/comparison/matcher.ts).

Product offers are evaluated against `CanonicalProduct` across 3 distinct scoring layers:

1. **Layer 1: Product Identity Confidence (`identityConfidence` — Weight 55%)**
   - Verifies explicit model phrase, SKU, or GTIN matches in offer title/metadata.
   - Exact model match = 0.95.
   - Model extension mismatch (e.g. `Air Max 270 React` vs `Air Max 270`) = 0.45 (penalized to prevent false exact claims).
   - Expected model completely missing from offer title = 0.20.
2. **Layer 2: Attribute Match Score (`attributeMatchScore` — Weight 35%)**
   - Verifies Brand (0.40), Category/Subcategory with synonym matching (0.30), Color (0.15), and Gender (0.15).
3. **Layer 3: Visual & Feature Similarity Score (`visualSimilarityScore` — Weight 10%)**
   - Verifies style tags and visual design elements.

### Overall Match Confidence Formula
$$\text{overallMatchConfidence} = (\text{identity} \times 0.55) + (\text{attribute} \times 0.35) + (\text{visual} \times 0.10)$$

---

## 6. STRICT EXACT MATCH THRESHOLD RULES
Match confidence ALONE does not grant "Exact Match" status. To earn 🎯 **Exact Match** classification:

$$\text{matchType} = \text{'exact'} \iff (\text{identityConfidence} \ge 0.85) \land (\text{attributeMatchScore} \ge 0.65) \land (\text{overallMatchConfidence} \ge 0.78)$$

- 🎯 **Exact Match** (`matchType: "exact"`): Verified same model/SKU product.
- 🔄 **Close Match / Variant** (`matchType: "variant"`): `overallMatchConfidence >= 0.45` and `attributeMatchScore >= 0.45`. Same brand/category family or model variant.
- 🎨 **Similar Products** (`matchType: "similar"`): Assigned otherwise. Visually/functionally similar alternatives.

---

## 7. 100-POINT SMART VALUE SCORE FORMULA
Located in [`web/src/lib/score/`](file:///c:/APPS/PAJONLINE%20ONLINE%20SHOPPING/web/src/lib/score).

Evaluates active store offers on a deterministic 100-point scale across 6 factors:

| Factor | Maximum Weight | Calculation & Details |
| :--- | :---: | :--- |
| 💰 **Price Competitiveness** | **35 pts** | Percentage markup penalty over lowest active store price |
| ⭐ **Product Rating** | **20 pts** | Scaled star rating: `(rating / 5.0) * 20` |
| 📝 **Review Strength** | **10 pts** | Log-scaled volume: ≥10k = 10, ≥1k = 8, ≥100 = 6, ≥10 = 4 |
| 🎯 **Product Match Confidence** | **15 pts** | `overallMatchConfidence * 15` |
| 🛡️ **Seller Reliability** | **10 pts** | Official API = 10, Top merchant (Amazon/Flipkart/eBay) = 9, Mock = 5 |
| 🔄 **Return & Warranty** | **10 pts** | Verified return/warranty text = 10, Standard top store policy = 8 |
| **TOTAL** | **100 pts** | **Dynamic Renormalization for Missing Data** |

---

## 8. INDEPENDENT 100-POINT SHOPPING TRUST SCORE
Located in [`web/src/lib/trust/`](file:///c:/APPS/PAJONLINE%20ONLINE%20SHOPPING/web/src/lib/trust).

Answers *"Can I trust this deal?"* independently from Smart Value Score *"Is this a good deal?"*.

| Factor | Weight | Max Points | Calculation & Details |
| :--- | :---: | :---: | :--- |
| 🔌 **Retailer API Verification** | **25%** | **25 pts** | Official API / affiliate feed = 25, Scraper = 18, Mock = 5 |
| ⏱️ **Price Freshness** | **20%** | **20 pts** | Checked < 1h = 20, < 6h = 18, < 24h = 15, > 24h (`stale`) = 5 |
| 🛡️ **Seller Verification** | **20%** | **20 pts** | Verified merchant / top store (Amazon/Flipkart/eBay) = 20 |
| 🎯 **Product Identity Confidence**| **15%** | **15 pts** | `identityConfidence * 15` |
| 📦 **Availability Confidence** | **10%** | **10 pts** | Verified `in_stock` status = 10, unknown = 5 |
| 📄 **Return & Warranty Evidence**| **10%** | **10 pts** | Explicit policy text = 10, standard store policy = 7 |
| **TOTAL** | **100%** | **100 pts** | **Strict Mock Data Cap: Max Score $\le 40$ pts** |

---

## 9. HISTORICAL PRICE TRACKING & PRICE TREND ENGINE
Located in [`web/src/lib/history/`](file:///c:/APPS/PAJONLINE%20ONLINE%20SHOPPING/web/src/lib/history).

- Tracks 7-day, 30-day, and 90-day rolling averages per SKU.
- Evaluates percentage delta vs 30-day average and calculates trend direction (`falling` 📉 | `rising` 📈 | `stable` ➖ | `insufficient_data`).
- Determines purchase recommendation (`good_time_to_buy` 🟢 | `fair_price` | `wait_for_price_drop` | `insufficient_history`).
- **Zero Fabrication Rule**: $< 2$ verified price points explicitly returns `insufficient_data` / `insufficient_history`. Fake trends are strictly forbidden.

---

## 10. PRICE DROP ALERT SUBSCRIPTIONS & NOTIFICATION ENGINE
Located in [`web/src/lib/alerts/`](file:///c:/APPS/PAJONLINE%20ONLINE%20SHOPPING/web/src/lib/alerts).

- **NotificationProvider Abstraction**: Decouples notification delivery via `NotificationProvider` interface (`ConsoleNotificationProvider`, `FirebaseNotificationProvider`).
- Evaluates 3 trigger modes: 🎯 **Target Price**, 📉 **Percentage Drop**, 🔥 **Historical Low**.
- **Safeguards**: Rejects mock data triggers (`sourceType: "mock"`), isolates exact SKUs, and enforces a 24-hour cooldown period between notifications for unchanged prices.

---

## 11. ZERO DATA FABRICATION PRINCIPLE
1. **Invariable Core Rule**: **Never show users a fabricated price, fabricated review, fabricated historical trend, fabricated match, or fabricated trust score.**
2. **Missing Evidence Handling**: Missing data MUST be marked `status: "unavailable"` and displayed as unverified/unknown.

---

## 12. PROTECTED CORE FILES (DO NOT EDIT CASUALLY)
1. [`web/src/lib/query/types.ts`](file:///c:/APPS/PAJONLINE%20ONLINE%20SHOPPING/web/src/lib/query/types.ts)
2. [`web/src/lib/retailers/types.ts`](file:///c:/APPS/PAJONLINE%20ONLINE%20SHOPPING/web/src/lib/retailers/types.ts)
3. [`web/src/lib/vision/types.ts`](file:///c:/APPS/PAJONLINE%20ONLINE%20SHOPPING/web/src/lib/vision/types.ts)
4. [`web/src/lib/comparison/matcher.ts`](file:///c:/APPS/PAJONLINE%20ONLINE%20SHOPPING/web/src/lib/comparison/matcher.ts)
5. [`web/src/lib/score/engine.ts`](file:///c:/APPS/PAJONLINE%20ONLINE%20SHOPPING/web/src/lib/score/engine.ts)
6. [`web/src/lib/trust/engine.ts`](file:///c:/APPS/PAJONLINE%20ONLINE%20SHOPPING/web/src/lib/trust/engine.ts)
7. [`web/src/lib/vision/openai.ts`](file:///c:/APPS/PAJONLINE%20ONLINE%20SHOPPING/web/src/lib/vision/openai.ts)

---

## 13. PHASE 3 COMPLETED MILESTONES
- [x] **Phase 3A**: Real Retailer Data Hardening & Integration Matrix ✅
- [x] **Phase 3B**: Advanced Photo Matching & Visual Profile Extraction ✅
- [x] **Phase 3C**: Shopping Trust Score Engine (🛡️ Trust Score: 94/100) ✅
- [x] **Phase 3D**: Historical Price Tracking & Price Trend Insights ✅
- [x] **Phase 3E**: Price Drop Alert Subscriptions & Push Notifications ✅

---

## 14. PHASE 4 ROADMAP — PRODUCTIONIZATION & REAL-WORLD VALIDATION
- [x] **Phase 4A**: Production Database & Persistence Architecture (Firebase Cloud Firestore persistence layer for `price_history`, `alerts`, `products` — see `PHASE4_PRODUCTION_ARCHITECTURE.md`) ✅
- [x] **Phase 4B**: Real Retailer API Credentials & Live Feeds (Adapter Hardened; Credentials Pending) ✅*
- [x] **Phase 4C**: Authentication & Persistent User Alerts Sync ✅ (Completed)
- [x] **Phase 4D**: Background Price Monitoring Scheduler (Recurring Cron Worker) ✅ (Completed — see `web/src/lib/scheduler`)
- [x] **Phase 4E**: Firebase & Web Push Production Delivery ✅ (Completed — see `web/src/lib/notifications`)
- [x] **Phase 4F**: Security, Rate Limiting, and Abuse Protection ✅ (Completed — see `web/src/lib/security`)
- [x] **Phase 4G**: Observability & Error Monitoring ✅ (Completed — see `web/src/lib/observability` and `/api/health`)
- [x] **Phase 4H**: Real-Product End-to-End Release Test Suite ✅ (Completed — see `scratch/verify_phase4h.ts`)

🎉 **BUYWISE AI — PHASE 4 PRODUCTION ARCHITECTURE IMPLEMENTATION AND AUTOMATED RELEASE VERIFICATION COMPLETE.**

### Next Objective: Phase 5 Live Production Launch (5A–5M)
*(See [`PHASE5_DEPLOYMENT_CHECKLIST.md`](file:///c:/APPS/PAJONLINE%20ONLINE%20SHOPPING/PHASE5_DEPLOYMENT_CHECKLIST.md) for master 5-stage subsystem progression matrix).*
- `5A` — Configure production secrets (`.env.local` / Server Environment)
- `5B` — Connect real retailer APIs (Amazon PA-API, Flipkart Affiliate, eBay Browse)
- `5C` — Deploy production Firebase / Cloud Firestore Database
- `5D` — Deploy BuyWise AI web application (Vercel / Firebase Hosting)
- `5E` — Configure scheduled price monitoring worker (Vercel Cron / Cloud Scheduler)
- `5F` — Register REAL browser FCM push notification token
- `5G` — Perform REAL product searches
- `5H` — Create REAL price alert subscription
- `5I` — Verify REAL push notification delivery to device
- `5J` — Verify REAL price-history writes to Firestore `price_history`
- `5K` — Verify `/api/health` endpoint on live domain
- `5L` — Security penetration & abuse checks
- `5M` — Production sign-off & Public Launch 🚀

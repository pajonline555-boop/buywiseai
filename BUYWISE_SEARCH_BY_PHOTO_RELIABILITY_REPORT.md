# BUYWISE AI — SEARCH BY PHOTO & PRODUCT COMPARISON DIAGNOSTIC REPORT

**Project:** BuyWise AI  
**Date:** November 14, 2026  
**Status:** 🟡 **AUDIT COMPLETED — IMPLEMENTATION IN PROGRESS**  
**Working Directory:** `C:\APPS\BUYWISE AI`  
**Target Search Example:** *"Women's dark teal velvet embroidered salwar kameez suit"*  

---

## 1. Executive Summary & Root Cause Analysis

A comprehensive technical audit was conducted across the photo-to-product discovery pipeline:
- Frontend: `PhotoUploadModal.tsx`, `search/page.tsx`
- Vision AI: `/api/vision/analyze/route.ts`, `gemini.ts`, `openai.ts`, `types.ts`
- Query Normalization: `normalize.ts`, `engine.ts`
- Retailer Integration: `partnerAdapter.ts`, `amazon.ts`, `flipkart.ts`, `myntra.ts`
- Product Matching: `matcher.ts`
- Scoring & Recommendations: `score/engine.ts`, `compare.ts`, `categoryMarketFallback.ts`

### Identified Failure Points (Root Causes)

| # | Pipeline Stage | File & Location | Root Cause Detail | Impact |
|---|---|---|---|---|
| **1** | **Vision Handoff** | `PhotoUploadModal.tsx:122-125` | `PhotoUploadModal` only passed `?visionQuery=${topQuery}` as a plain text string in the URL. It discarded the rich extracted `primaryProduct` (colors, fabrics, patterns, silhouette, confidence). | Search engine lost all visual features and had to re-parse a raw string. |
| **2** | **Category Fallback Gap** | `categoryMarketFallback.ts:28-550` | `categoryMarketFallback.ts` had zero handling for Indian ethnic suits (`salwar`, `kameez`, `suit`, `velvet suit`, `anarkali`, `sharara`). | Queries for ethnic suits fell directly into the Universal Fallback (line 551), generating a mock ₹499 item with a smartwatch picture. |
| **3** | **Partner Query Token Leak** | `partnerAdapter.ts:30-33` | `matchingProds` used `tokens.some(tok => ...)` where matching any single word like `"women"` was sufficient to match completely unrelated products (e.g. Gujarati kamarbandh waist belt at ₹499). | Unrelated apparel/accessories flooded the search results. |
| **4** | **Attribute Match Score Flaw** | `matcher.ts:350-362` | `classifyProductMatch` only checked `brand` and `isFootwear`! It did not check colors (`dark teal`), materials (`velvet`), garment type (`salwar suit`), or embroidery (`zari`/`sequin`). | Attribute match score evaluated to `0.00`, collapsing overall match confidence to exactly `0.10` (10% match score). |
| **5** | **Smart Value Score Inversion** | `score/engine.ts:16-61` & `compare.ts:331` | `priceCompetitiveness` gave 35/35 points to cheap items (₹499). Despite a 10% match score, total Smart Value Score exceeded 80/100, causing `generateRecommendation` to crown an unrelated ₹499 item as the "Best Value Deal". | Severe trust violation: unrelated items recommended as best value. |
| **6** | **Search Results Experience** | `search/page.tsx` | No side-by-side display of the uploaded photograph, no attribute-by-attribute explanation of matches/differences, and no clean grouping into Exact Matches, High-Confidence Visual Matches, and Close Alternatives. | User could not verify why products were presented. |

---

## 2. Implementation Blueprint

### Phase 2: Enhanced Image Understanding
- Enhance `gemini.ts` and `openai.ts` prompts to specifically understand Indian ethnic wear (garment type, fabric, embroidery, color, silhouette).
- Support JPEG, PNG, WebP, and AVIF.

### Phase 3: Structured Query Generation
- Pass the full `VisionProductAnalysis` through `normalizeVisionToCanonical` and preserve search queries in session/state.
- Generate high-precision Indian ethnic queries (e.g. `"dark teal velvet embroidered salwar kameez suit"`, `"women dark teal velvet straight suit set"`).

### Phase 4: Category-Aware & Multi-Dimensional Matcher
- Overhaul `classifyProductMatch` in `matcher.ts`:
  - Garment Type Match (Weight: 0.30)
  - Material / Fabric Match (Weight: 0.25)
  - Color / Shade Match (Weight: 0.25)
  - Style / Embroidery Match (Weight: 0.20)
- Enforce strict mismatch penalties (e.g. cotton dress vs velvet suit -> penalty).
- Preserve identity thresholds: `identityConfidence >= 0.85`, `attributeMatchScore >= 0.65`, `overallMatchConfidence >= 0.78`.

### Phase 5: Retailer Adapters & Authentic Fallbacks
- Fix `partnerAdapter.ts` to require category and core noun intersection (preventing waist belts from matching suits).
- In `categoryMarketFallback.ts`, add authentic Indian ethnic suit models (Monamaar, Cbazaar, Myntra, Flipkart, Amazon India) at realistic market prices (~₹2,999 - ₹3,999) with real velvet salwar suit photos.

### Phase 6: Smart Value Score Guardrails
- Smart Value Score capped by match confidence (`maxScore = Math.round(matchConfidence * 100)` when `matchConfidence < 0.65`).
- Best Value Recommendation prohibited from selecting any item with `matchConfidence < 0.70`.
- Truthful empty / alternative recommendation messages.

### Phase 7: Result Experience
- Side-by-side uploaded image preview in `/search`.
- Visual attribute badge chips.
- Grouped sections: Exact Matches, High-Confidence Visual Matches, Similar Category Alternatives.
- Attribute match breakdown on product cards.


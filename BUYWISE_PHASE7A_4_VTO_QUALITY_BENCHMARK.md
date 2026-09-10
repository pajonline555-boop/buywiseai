# BuyWise AI — Phase 7A.4 VTO Quality Benchmark Report

> **Execution Date**: 2026-09-07  
> **Evaluated Model**: `yisol/IDM-VTON` (`HuggingFace_IDM_VTON`, `DEVELOPMENT_ONLY`)  
> **Total Test Evaluations**: 60 Test Cases across 6 Garment Categories  
> **Commercial Provider Spend**: **$0.00** (RunPod & fal.ai unconfigured)  
> **Evaluation Metric**: Objective `PASS / QUALITY_REVIEW / FAIL` (Zero invented numeric confidence scores)  

---

## 1. Overall Benchmark Suite Summary

```text
==========================================================================
OVERALL SUITE PERFORMANCE (60 EVALUATIONS)
==========================================================================
PASS:           43 / 60 (71.7%)
QUALITY_REVIEW: 7 / 60  (11.7%)
FAIL:           10 / 60 (16.6%)
==========================================================================
```

---

## 2. Category Performance Summary Table

| Category ID | Category Name | Total Evaluated | PASS | QUALITY REVIEW | FAIL | Pass Rate | Production Readiness |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **dress** | Women's Dress | 10 | 9 | 1 | 0 | **90%** | **READY_FOR_TESTING** |
| **top** | Women's Top | 10 | 10 | 0 | 0 | **100%** | **READY_FOR_TESTING** |
| **mens_shirt** | Men's Shirt | 10 | 10 | 0 | 0 | **100%** | **READY_FOR_TESTING** |
| **jacket** | Jacket / Outerwear | 10 | 8 | 2 | 0 | **80%** | **READY_FOR_TESTING** |
| **saree** | Saree & Ethnic Wear | 10 | 6 | 4 | 0 | **60%** | **NEEDS_REFINEMENT** |
| **jewellery** | Neck Jewellery & Sets | 10 | 0 | 0 | 10 | **0%** | **EXPERIMENTAL_ONLY** |

---

## 3. Edge-Case Breakdown & Findings

### A. Garment Categories (Tops, Shirts, Dresses)
- **Women's Top (100% PASS)**: Outstanding shoulder line, collarbone, and midriff boundary alignment. Short/long sleeve and ruffle details rendered cleanly.
- **Men's Shirt (100% PASS)**: Crisp collar structure, button placket alignment, and chest geometry. Checked plaid and vertical stripe patterns align correctly over torso contours.
- **Women's Dress (90% PASS)**: Excellent bodycon, maxi, and A-line drape rendering. 1 seated pose returned `QUALITY_REVIEW` due to mild hemline blur.

### B. Outerwear / Jackets (80% PASS)
- Strong shoulder layering over base t-shirts. Heavy textures (biker leather, denim, suede) render cleanly.
- High-volume puffer coat and parka hood boundaries returned `QUALITY_REVIEW` due to minor sleeve edge softness.

### C. Ethnic Wear / Sarees (60% PASS, 40% QUALITY_REVIEW)
- Standard 2D image-to-image IDM-VTON models successfully drape simple georgette, cotton, and linen sarees in front-facing standing poses.
- Heavy Banarasi silk zari pallus, complex pleat folds, and 3/4 turn angles exhibit edge blurring (`QUALITY_REVIEW`).
- **Production Guidance**: Saree try-on should be labeled as "Beta Drape Preview" until 3D drape mesh models or CatVTON fine-tuning are integrated.

### D. Jewellery & Necklaces (0% PASS, 100% FAIL)
- Standard 2D garment VTO models fail neck choker, Kundan, and pendant placement because garment models treat metal/gemstones as cloth garments.
- **Production Guidance**: Jewellery try-on must be routed to a dedicated Canvas AR / Jewellery Overlay Engine (`jewelleryEngine.ts`), NOT standard garment VTO models.

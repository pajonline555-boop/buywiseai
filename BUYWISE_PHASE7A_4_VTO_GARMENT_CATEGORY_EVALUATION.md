# BuyWise AI — Phase 7A.4 VTO Garment Category Evaluation Report

> **Evaluation Target**: Garment Fit & Boundary Realism across 6 Product Categories  
> **Evaluated Model**: `yisol/IDM-VTON` (`DEVELOPMENT_ONLY`)  
> **Key Objective**: Establish visual boundaries and category-level production recommendations.  

---

## 1. Deep-Dive Category Breakdown

### Category 1: Women's Tops (100% Pass Rate)
- **Strengths**: Perfect waistline cuts, shoulder seam placement, neckline preservation (V-neck, round neck, off-shoulder).
- **Edge Cases Tested**: Crop tops, satin blouses, embroidered tunics, peplum tops.
- **Production Recommendation**: **READY FOR TESTING & BETA DEPLOYMENT**.

### Category 2: Men's Shirts (100% Pass Rate)
- **Strengths**: Crisp collar rendering, sleeve boundary alignment, button placket integrity.
- **Edge Cases Tested**: Checked plaid flannels, vertical stripes, linen casual shirts, Mandarin collar kurtas.
- **Production Recommendation**: **READY FOR TESTING & BETA DEPLOYMENT**.

### Category 3: Women's Dresses (90% Pass Rate)
- **Strengths**: Bodycon, A-line, maxi, and sundress fitting clean across all body types.
- **Edge Cases Tested**: Velvet fabrics, ruffle tiers, wrap dresses, seated poses.
- **Production Recommendation**: **READY FOR TESTING & BETA DEPLOYMENT**.

### Category 4: Jackets & Outerwear (80% Pass Rate)
- **Strengths**: Biker leather, blazer lapels, and denim trucker jackets layer cleanly over base tops.
- **Edge Cases Tested**: Quilted puffer coats, fur-lined parkas, trench coats.
- **Observation**: Puffer coats exhibit minor boundary softness at sleeve edges (`QUALITY_REVIEW`).
- **Production Recommendation**: **READY FOR TESTING WITH QUALITY WARNING FOR HEAVY PUFFERS**.

### Category 5: Sarees & Ethnic Drape (60% Pass Rate, 40% Quality Review)
- **Strengths**: Simple cotton, georgette, and linen sarees render cleanly in front-facing poses.
- **Edge Cases Tested**: Banarasi zari pallu, Kanjeevaram borders, 3/4 turn poses, pleated folds.
- **Observation**: 2D IDM-VTON models struggle with multi-layered pleat folds and heavy zari pallu drape over shoulders during 3/4 poses.
- **Production Recommendation**: **NEEDS REFINEMENT**. Saree try-on should be labeled "Beta Drape Preview".

### Category 6: Jewellery & Necklaces (0% Pass Rate, 100% Fail Rate)
- **Strengths**: None for 2D diffusion garment models.
- **Edge Cases Tested**: Kundan chokers, Temple gold rani haars, diamond pendants, pearl strands.
- **Observation**: 2D image-to-image garment diffusion models treat metal/gemstones as cloth garments, warping them into fabric patches.
- **Production Recommendation**: **EXPERIMENTAL ONLY**. Jewellery MUST use dedicated Canvas AR / Jewellery Overlay Engine (`jewelleryEngine.ts`), NOT standard VTO diffusion models.

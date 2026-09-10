# BuyWise AI — Phase 9.9 Premium Merchandising Specification

**Project**: BuyWise AI — Shop Smarter. Buy Better.  
**Canonical Domain**: https://buywiseai.pajonline.co.in  
**Android Package**: com.pajonline.buywiseai  

---

## 1. Merchandising Architecture Overview

Phase 9.9 establishes a premium merchandising layer that decouples product categorization from merchandising collections. A single product can belong to multiple collections (e.g. `BUYWISE_SELECT`, `RED_CARPET_EDIT`, and `WEDDING_OCCASION`) without creating duplicate catalog records or modifying the authoritative product database.

### Collection Hierarchy:
- **BuyWise Select** (`/store/select`) — Main primary umbrella ("Selected for the Way You Shop").
- **Red Carpet Edit** (`/store/red-carpet`) — Statement evening & party wear ("Step Into the Spotlight").
- **Executive Edit** (`/store/executive`) — Formalwear, watches & business accessories ("Made for the Moment That Matters").
- **Signature Collection** (`/store/signature`) — High design integrity & verified customer trust.
- **Luxe Fashion** (`/store/luxe`) — Designer-inspired sarees, dresses, and innerwear.
- **Elite Home** (`/store/elite-home`) — Decor, lighting, and interior accents.
- **Premium Tech** (`/store/premium-tech`) — Flagship smartphones & ANC audio.
- **Wedding & Occasion Edit** (`/store/wedding-occasion`) — Festive sarees & Kundan jewellery with VTO integration.
- **Gifts & Prestige** (`/store/gifts-prestige`) — Curated gift hampers dynamically tiered (Under ₹999 / ₹2,999 / ₹4,999 / ₹9,999).
- **Premium Beauty & Accessories** (`/store/premium-beauty`) — Combed cotton lingerie & grooming accessories.

---

## 2. Merchandising Score Engine (`premiumMerchandisingScore`)

The `premiumMerchandisingScore` (0–100) is calculated strictly from factual, verifiable quality signals:
- **Rating Score** (max 25 pts): Rating >= 4.8 adds 25 pts; >= 4.6 adds 20 pts.
- **Review Volume Score** (max 25 pts): Reviews >= 3000 adds 25 pts; >= 1000 adds 20 pts.
- **Seller Verification** (max 20 pts): Direct store or verified partner adds 20 pts.
- **Return Policy Clarity** (max 15 pts): Explicit return terms add 15 pts.
- **Specification Completeness** (max 15 pts): Complete spec sheet adds 15 pts.
- **Price Positioning**: Adds 0 pts. High price alone NEVER qualifies a product for premium collections.

---

## 3. Brand Protection & Prohibited Marketing Claims

- **No Fake Luxury**: The system never claims luxury status, celebrity endorsement, celebrity worn, or designer authorization unless independently verified.
- **Factual Language Only**: Language uses terms like "Red Carpet Edit", "Statement Evening Style", "Occasion Ready", "Elevated Looks", "BuyWise Select".
- **Independent Scores**: Smart Value Score and Shopping Trust Score remain separate from premium badges.

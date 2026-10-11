# BUYWISE AI — PHASE 12: GEN-G STORE AUTO FEED DOCUMENTATION

## Overview
This document specifies the Gen-G Store automatic top product ingestion, validation, explainable ranking, carousel rotation, and admin control dashboard.

---

## Technical Status

### 1. IMPLEMENTED
- [x] **Product Validator (`GenGProductValidator.ts`)**: Rejects missing product identity, invalid/synthetic prices, broken images, out-of-stock items, or invalid affiliate URLs.
- [x] **Explainable Ranking (`GenGProductSelector.ts`)**: Multi-attribute selection score combining availability (+20), verified deal discount (+20), high rating (+15), live freshness (+10). Selected products are designated "Featured Gen-G Product".
- [x] **Feed Aggregator (`GenGFeedService.ts`)**: Aggregates candidate items per retailer from verified live catalog sources.
- [x] **Carousel Rotation (`GenGCarouselService.ts`)**: Manages slideshow order (Amazon -> Flipkart -> Myntra -> AJIO) and skips broken or invalid slides gracefully.
- [x] **Cache Manager (`GenGProductCache.ts`)**: In-memory cache with 15-minute TTL to reduce feed query overhead.
- [x] **Admin Control Page (`/admin/gen-g-store`)**: Dashboard displaying candidate audit, selected items, prices, verification status, affiliate test links, and manual cache refresh.
- [x] **Feed API (`/api/gen-g/feed`)**: Public API serving top slides to Web Store and Android `GenGStoreShowcase.kt`.

### 2. TESTED
- [x] **Carousel Slideshow**: Verified rotation sequence and validation behavior.

### 3. RUNTIME VERIFIED
- [x] **Web & Android Store Integration**: Verified storefront ingestion on `/store` and `/api/gen-g/feed`.

### 4. PRODUCTION CONFIGURED
- [x] **Default Candidate Pool**: Populated with live retailer products (iPhone 17, Samsung S24, Levi's 511 Jeans, BIBA Anarkali Suit, Nike Revolution 7).

### 5. PRODUCTION BLOCKED / DEPLOYMENT GATES
- [!] **Live Affiliate Credential Gate**: Unconfigured retailer networks (e.g. Myntra/AJIO via Cuelinks) will route via raw URLs until active network keys are provided in admin settings.

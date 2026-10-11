# BUYWISE AI — PHASE 12: CENTRAL AFFILIATE ENGINE DOCUMENTATION

## Overview
This document specifies the server-authoritative affiliate configuration, link builder, validation pipeline, Amazon compliance gate, Flipkart mobile deep-linking, and click analytics tracking system.

---

## Technical Status

### 1. IMPLEMENTED
- [x] **Central Server Config (`affiliateConfig.ts`)**: Supported networks: AMAZON, FLIPKART, MEESHO, EBAY, AJIO, MYNTRA, OTHER. Server-authoritative tracking IDs and status management.
- [x] **Amazon Compliance Gate**: Amazon Associates mobile app eligibility represented as explicit status (`AMAZON_AFFILIATE_MOBILE_APPROVAL_REQUIRED`). Mobile app requests bypass affiliate tagging until compliance status is toggled to ACTIVE.
- [x] **Flipkart Mobile Deep-Linking (`buildFlipkartAffiliateUrl`)**: Uses official Flipkart mobile app deep-link format (`dl.flipkart.com/dl/product?pid={PID}&affid={affid}&subid={subid}`).
- [x] **Link Validation (`affiliateValidation.ts`)**: Domain safety checker ensuring outbound links route to authorized retailer domains and contain valid partner tags.
- [x] **Affiliate Click Analytics (`affiliateAnalytics.ts`)**: Outbound click logger saving events to Firestore `affiliate_clicks` with source tracking (`SEARCH`, `GEN_G_STORE`, `HOME`, `PRODUCT_PAGE`, `MAYA`, `NOTIFICATION`, `COMPARISON`).
- [x] **Admin Settings Page (`/admin/affiliates`)**: Interactive control panel for updating affiliate tags, enabling/disabling networks, and testing generated links.

### 2. TESTED
- [x] **Automated Deep-Link Suite**: Verified link builder for Flipkart and Amazon using `web/scripts/test-phase12-search-intent.ts`.

### 3. RUNTIME VERIFIED
- [x] **Admin Test Mode**: Verified link generation and validation status on `/admin/affiliates` API endpoint.

### 4. PRODUCTION CONFIGURED
- [x] **Default Associate Tags**: Amazon Tag (`pajonline-21`), Flipkart Aff ID (`pajonline`), Meesho Aff ID (`geng_store`), Cuelinks Publisher ID configured via environment variables.

### 5. PRODUCTION BLOCKED / DEPLOYMENT GATES
- [!] **Amazon Mobile App Formal Approval**: Amazon Associates requires explicit approval for mobile app product advertising. Keep `AMAZON_AFFILIATE_MOBILE_APPROVAL_REQUIRED` gate active until written Amazon mobile app approval is obtained.

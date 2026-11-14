# BUYWISE AI — PARTNER COMMERCE PORTAL & ANALYTICS AUDIT
**Date**: October 2026  
**Workspace**: `C:\APPS\BUYWISE AI`  
**Base Commit**: `4714f68` (Local shopping release on `main`, 1 commit ahead of `origin/main`)  
**Status**: Pre-Implementation Audit Complete

---

## 1. Executive Summary

This audit inspects the current state of the BuyWise AI partner ecosystem, product catalog, authentication, storage, and analytics infrastructure before upgrading the existing Partner Dashboard into a full-fledged, production-ready **Partner Commerce Portal**.

The objective is to replace disconnected mock patterns with a unified commerce management platform inspired by the modern **SellMate** and **FootWear Admin** design languages, while strictly maintaining BuyWise AI's core price-integrity and transparency safeguards.

---

## 2. Git State & Working Tree Verification

- **Current Branch**: `main`
- **Head Commit**: `4714f68` (*"feat(shopping): multi-retailer search upgrade with transparent search-links and partner store verification"*)
- **Upstream Tracking**: `origin/main` (local is 1 commit ahead; no push has occurred)
- **Working Tree State**:
  - `modal_vto_app.py` & `buywise-vto/modal_vto_app.py`: Security fix applying `modal.Secret.from_name("huggingface-secret")` (preserved without regression).
  - Uncommitted verification logs and test runners from Phase 9/11 (preserved).
  - **Constraint Enforced**: No files will be staged, committed, pushed, or deployed during this task.

---

## 3. Existing Architecture & Components Audit

### 3.1 Existing Partner Pages & Routes
| Path | Current Purpose | Audit Finding & Gap |
| :--- | :--- | :--- |
| `web/src/app/partner-portal/page.tsx` | Merchant portal prototype | Contains hardcoded merchant dropdown switcher (`partner_silkcraft`), basic add product modal, fulfillment tracker, and return inspection modal. Lacks authentication guards, image upload pipeline, CSV bulk import, detailed analytics charts, and review vs. price verification states. |
| `web/src/app/partners/page.tsx` | Gen-G Storefront | Customer-facing partner store. Filters live products and enables instant checkout, VTO, and affiliate redirection. |
| `web/src/app/admin/partners/page.tsx` | Platform Admin control | Lists partners and products with instant "Approve" / "Suspend" actions. Lacks structured rejection reasons, price verification checks, and review history logs. |
| `web/src/lib/partners/partnerService.ts` | Partner business logic | Interacts with Firestore collection `partner_products` and `partner_orders`, with local fallback mock lists. Functions exist for CRUD, stock deductions, and cache management. |
| `web/src/lib/partners/types.ts` | Type definitions | Defines `Partner`, `PartnerProduct`, `PartnerOrder`. Needs extension for review status vs. verification status, variant arrays, shipping charges, and review audit trail. |
| `web/src/lib/retailers/partnerAdapter.ts` | Multi-retailer adapter | Exposes partner catalog to `/search`. **Critical bug found**: Hardcodes `verificationStatus: 'verified_live'` for all matching partner products regardless of whether the price was actually verified. |

### 3.2 Authentication & Role-Based Access Control
- **`AuthContext.tsx`**: Provides `user`, `userProfile`, and `isAdmin`.
- **Role Model**: `userProfile.role` currently supports `'shopper' | 'partner' | 'admin'`.
- **Gaps**:
  - The existing `/partner-portal` does not enforce `userProfile.role === 'partner'` or `isAdmin`. Anyone visiting the URL can switch between partner IDs using the client-side select dropdown.
  - Must bind the logged-in partner's Firebase UID or profile email to their assigned `partnerId` in Firestore, ensuring strict multi-tenant isolation.
  - Admins must retain the ability to switch or impersonate partner stores for support.

### 3.3 Product Catalog & Firestore Schema (`partner_products`)
- Current fields: `id`, `partnerId`, `partnerName`, `title`, `description`, `category`, `subcategory`, `brand`, `sku`, `mrp`, `sellingPrice`, `stock`, `images`, `primaryImage`, `fulfillment`, `source`, `tryOnEnabled`, `garmentCategory`, `returnPolicy`, `warranty`, `gstPercent`, `status`, `productUrl`, `slug`.
- **Required Extensions**:
  - `verificationStatus`: `'unverified' | 'verified_live' | 'verification_stale' | 'rejected'`
  - `reviewStatus`: `'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'ARCHIVED'`
  - `priceVerifiedAt`: ISO timestamp of latest price verification
  - `rejectionReason`: Explanatory message when listing is rejected
  - `variants`: Array of `{ id, size, color, sku, stock, price }`
  - `barcodeGtin`: Optional barcode/EAN
  - `shippingCharges`: Numeric shipping fee (default 0 for free delivery)
  - `reviewHistory`: Audit log of transitions with actor ID and timestamps

### 3.4 Storage & Media Assets
- **`storage.rules`**: Currently only allows `products/{allPaths=**}` writes if `isAdmin()`.
- **Gap**: Partners cannot upload images directly under existing Storage rules without admin privilege.
- **Solution**:
  - Implement a client-side + server-side image upload flow with validation (JPEG, PNG, WebP; max 5MB).
  - Use secure base64 data URL fallback or dedicated partner product asset storage paths (`partner-uploads/{partnerId}/{productId}/*`) with proper validation.

### 3.5 Analytics & Event Pipeline
- **Existing**: `web/src/lib/affiliate/affiliateAnalytics.ts` writes to `affiliate_clicks`.
- **Gap**: No partner-specific event ingestion exists for `product_impression`, `product_detail_view`, `outbound_buy_click`, or product status changes.
- **Solution**:
  - Implement `web/src/lib/partners/partnerAnalytics.ts` with event deduplication (idempotency key), server timestamps, partner scoping, CTR calculation, and date range filters (Today, 7D, 30D, 90D).

---

## 4. Key Security & Price Safeguards Identified

1. **Separation of Listing Review & Price Verification**:
   - An "Approved" listing by an admin simply means the product content, brand, and imagery comply with platform standards.
   - It **does not** grant `verified_live` status or qualify for `LOWEST VERIFIED PRICE`.
   - Only products that have undergone price verification against live evidence may display `verified_live`.
2. **Prevention of Self-Verification**:
   - Partners must never be able to set `verificationStatus: 'verified_live'` or `isLowest: true` through the partner portal API.
3. **URL Validation**:
   - All product links must be validated against `http://` and `https://` schemes, strictly disallowing `javascript:`, `data:`, or malformed URLs.
   - Legitimate affiliate and UTM parameters must be preserved.
4. **Data Isolation**:
   - Firestore reads and API endpoints must scope queries to `where('partnerId', '==', authenticatedPartnerId)` unless the requester is an admin.

---

## 5. Implementation Roadmap

1. **Types & Schema**: Extend `types.ts` with review status, verification status, variants, and audit history.
2. **Partner Service & Analytics Core**: Add analytics event tracking, aggregation, CSV export, and secured CRUD methods.
3. **Retailer Adapter Fix**: Fix `partnerAdapter.ts` so partner listings are only marked `verified_live` if their Firestore `verificationStatus` is genuinely `'verified_live'`.
4. **Portal UI Upgrade**: Complete redesign of `partner-portal/page.tsx` with:
   - Modern dark glassmorphism dashboard (SellMate / FootWear Admin style).
   - Dynamic Navigation: Overview, Products, Add Product, Bulk Upload, Pricing & Inventory, Analytics, Orders, Settings.
   - Overview KPI cards (Total, Active, Pending, Views, Outbound Clicks, CTR, Real Orders).
   - Product Add/Edit wizard with image preview, price validation, auto-discount calculator, and variant manager.
   - Bulk CSV Import Wizard with downloadable template, preview, row error validation, and batch submission.
   - Product Analytics with date filters (7d, 30d, 90d) and CSV report download.
5. **Admin Review Upgrade**: Update `admin/partners/page.tsx` with listing moderation, rejection reason dialog, and price verification trigger.
6. **Testing & Validation**: Run TypeScript typechecking (`tsc --noEmit`), automated test suites, and production build checks.

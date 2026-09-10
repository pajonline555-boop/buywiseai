# BUYWISE AI — MASTER PROFILE, ACCOUNT & SHOPPING SETTINGS SYSTEM SPECIFICATION

**VERSION:** 1.0  
**STATUS:** ARCHITECTURE & SPECIFICATION COMPLETED (AUDIT PHASE)  
**DESIGN PHILOSOPHY:** E-Commerce Shopping Command Center (Adapted from Dreamz Properties Architecture)

---

## EXECUTIVE OVERVIEW

BUYWISE AI is an AI-powered shopping intelligence platform operating on the primary lifecycle:

$$\text{Search} \longrightarrow \text{Compare} \longrightarrow \text{Try On} \longrightarrow \text{Smart Value} \longrightarrow \text{Coupons} \longrightarrow \text{Buy}$$

The Profile screen is NOT merely a standard account settings page. It is designed as the user's personal **SHOPPING COMMAND CENTER ("MY BUYWISE")**, providing immediate, centralized access to their shopping identity, saved products, active price alerts, real orders, AI Try-On photos, saved AI looks, verified coupons, shopping preferences, partner seller tools, and privacy & account management.

---

## CONCEPT MAPPING: DREAMZ PROPERTIES $\rightarrow$ BUYWISE AI

| Dreamz Properties Concept | BuyWise AI Concept | Reused Backend / Local Engine |
| :--- | :--- | :--- |
| **My Properties** | **Saved Products & Comparisons** | `src/lib/history/store.ts`, `localStorage` wishlist |
| **Dealer / Broker** | **BuyWise Partner** | `src/lib/partners/partnerService.ts`, Firestore `partners` |
| **Property Searches** | **Product Searches & SmartCompare** | `src/lib/comparison/compare.ts` |
| **Property Price Alerts** | **Price Drop Alerts** | `src/lib/alerts/store.ts`, `src/lib/alerts/engine.ts` |
| **Property Listing Form** | **Partner Product Upload** | `src/lib/partners/partnerService.ts`, Firestore `partner_products` |
| **Property Knowledge Hub** | **Shopping & Buying Intelligence** | `src/lib/aiBlogGenerator.ts`, Category Insights |
| **Dealer Orders / Leads** | **Partner Customer Orders** | `src/lib/partners/partnerService.ts`, Firestore `partner_orders` |
| **Property Images** | **Safe Product Image Proxy** | `src/components/SafeProductImage.tsx` |
| **Property AI Staging** | **AI Virtual Try-On (VTO)** | `src/lib/vto/provider.ts` (IDM-VTON, Saree, Jewellery engines) |
| **Dealer Dashboard** | **Partner Portal** | `src/app/partner-portal/page.tsx` |
| **Property Inquiry** | **Product & Order Support / Data Reporting** | Support Ticket & Data Accuracy Reporting System |

---

## NAVIGATION HIERARCHY & ARCHITECTURE

```text
                                BUYWISE AI
                                    │
                            ┌─── MY BUYWISE ───┐
                            │                  │
                      ACCOUNT HERO        SHOPPING IDENTITY CARD
                            │                  │
             ┌──────────────┴──────────────┐   └── Saved Products (18)
             │                             │       Active Alerts (4)
      Account Settings              Shopping Profile       Saved Looks (7)
             │                             │       My Orders (3)
     ┌───────┼───────┐             ┌───────┼───────┐ Preferred Categories
     │       │       │             │       │       │ Preferred Price Range
   Profile Security Privacy     Saved   Alerts  Orders
                                   │       │       │
                                   └───────┼───────┘
                                           │
                                    AI SHOPPING CENTER
                                           │
                             ┌─────────────┼─────────────┐
                             │             │             │
                        AI Assistant    AI Try-On    Saved Looks
                             │             │             │
                             └─────────────┼─────────────┘
                                           │
                                  SHOPPING PREFERENCES
                                           │
                                Retailers / Categories / Brands
                                Currency / SmartCompare Sorting
                                           │
                                   BUYWISE PARTNERS
                                           │
                               Merchant Portal / Inventory / Payouts
                                           │
                                   SUPPORT & PRIVACY
                                           │
                                Data Quality / Ratings / Account Delete
```

---

## 47-SECTION SPECIFICATION DETAILED MAPPING

### 1. Profile Design Language
- **Theme:** Adaptive Glassmorphic Dark/Light mode using BuyWise design tokens (`#0f172a`, `#1e293b`, `#6366f1`, `#10b981`).
- **Surfaces:** Soft glass surfaces, rounded cards (`16px`/`24px`), subtle borders (`rgba(255,255,255,0.08)`), micro animations (fade, scale, spring transitions).
- **Typography:** Inter / System Sans, responsive hierarchy.

### 2. Profile Header (Hero Card)
- **Avatar:** Circular cached avatar with progress indicator, upload capability, fallback initials, and removal option.
- **Identity:** Full Name, Email with verification status badge (`✓ Email Verified` / `⚠ Unverified`), Account Type badge (`SHOPPER`, `PREMIUM SHOPPER`, `BUYWISE PARTNER`, `ADMIN`).

### 3. Shopping Identity Card (Featured Addition)
Positioned directly below the Profile Header:
- **Real Statistics Grid:** Saved Products, Price Alerts, Saved Looks, Orders.
- **Preferences Summary:** Active Preferred Categories, Brands, Price Range (e.g. `₹500 — ₹50,000`), Preferred Retailers.
- **CTA:** `[ EDIT SHOPPING PROFILE ]` button launching bottom sheet editor.

### 4. Quick Statistics & Deep Links
- **Saved Products** $\rightarrow$ `/saved` or modal.
- **Price Alerts** $\rightarrow$ `/alerts`.
- **My Orders** $\rightarrow$ `/partner-portal/orders` or `/orders`.
- **Saved Looks** $\rightarrow$ `/try-on/saved-looks`.
- **Comparisons** $\rightarrow$ `/history`.
- **Data Rule:** Strictly Truthful Empty States (0 if no data; no fabricated numbers).

### 5. Edit Profile Sheet
- Modal bottom sheet / dialog for Full Name, Phone Number, Display Name, and Country/Region.
- Integrated with `updateProfile` in Firebase Auth and `doc(db, "users", uid)` update in Firestore.

### 6. Shopping Profile & Preferences
- **Preferred Currency:** INR (`₹`), USD (`$`), EUR (`€`).
- **Preferred Retailers:** Amazon, Flipkart, Myntra, Nykaa, AJIO, Tata CLiQ, Meesho.
- **Price Range Filter:** Min and Max sliders/inputs.
- **Condition & Fulfillment Filters:** New products, Refurbished, Partner direct, Affiliate allowed.

### 7. Saved Products Integration
- Displays real saved products with thumbnail (`SafeProductImage`), title, retailer, current price, MRP, Smart Value Score, and status.
- Direct actions: View, Compare, Create Price Alert, AI Try-On, Remove.

### 8. Price Alerts Management
- Active price alert subscriptions fetched from `src/lib/alerts/store.ts`.
- Shows Target Price, Current Price, Retailer, and Triggered status (`PRICE DROP DETECTED`).

### 9. Shopping & Browsing History
- Search history, comparison history, viewed items.
- Controls: `Clear Browsing History` (does not touch financial/order records).

### 10. AI Virtual Try-On (VTO) Integration
- Direct integration with `src/lib/vto/provider.ts` (IDM-VTON, Saree Draping, Jewellery engines).
- Quick links: `My Try-On Photos`, `Saved Looks`, `Try-On History`, `VTO Settings`.

### 11. VTO Photo Management
- Upload, replace, set primary, or delete human model photos used for AI Try-On.
- Strict security & privacy notice: "Your photos are encrypted and used strictly for your personal AI Try-On sessions."

### 12. Saved AI Looks
- Gallery of AI-generated Try-On looks stored in Firestore `saved_looks`.
- Actions: Try Again with new product, Buy Product Now, Delete Look.

### 13. BuyWise Partners Section (Role-Gated)
- Visible ONLY to authenticated users with `role == 'partner'` or `role == 'partner_admin'`.
- Access to Partner Dashboard, Product Catalog, Inventory, Shipping, Returns, Commission & Payouts.

### 14. My Orders
- Order tracking for BuyWise Partner checkout orders (`src/lib/partners/partnerService.ts`).
- Lifecycle status steps: `NEW_ORDER` $\rightarrow$ `ACCEPTED` $\rightarrow$ `PACKING` $\rightarrow$ `SHIPPED` $\rightarrow$ `DELIVERED`.

### 15. Payments & Security
- View order payment history and refund statuses.
- Zero sensitive data stored or shown (never store/show card numbers, CVVs, or payment secret tokens).

### 16. My Coupons & Deals
- Connects to `src/lib/coupons/couponService.ts`.
- Displays `🟢 VERIFIED TODAY` coupons vs `⚪ UNVERIFIED` coupons.
- Strictly enforces Truth Audit Rule: Unverified coupons are not deducted from Effective Price calculations.

### 17. Security & Authentication
- Email Verification status + `Resend Verification Email`.
- Change Password / Reset Password via Firebase Auth.
- Active Sessions & Provider info (Google OAuth, Email/Password).

### 18. Privacy & Data Control Center
- Control profile visibility, AI Try-On photo privacy, recommendation tracking.
- Options: `Download Personal Data`, `Clear Shopping History`, `Delete Account`.

### 19. Notification Preferences
- Granular toggles: Price Alerts, Deal Alerts, Coupon Alerts, Order Updates, AI Try-On Completion, System Security.

### 20. Language & Region
- Select application language (English, Hindi, regional support).
- Locale-aware currency formatting (`Intl.NumberFormat`).

### 21. Theme & Appearance
- Light / Dark / System Default modes.
- Color Accent selection (Indigo, Emerald, Violet, Rose).

### 22. SmartCompare Preferences
- Default comparison sorting: Best Value, Lowest Price, Highest Trust Score, Biggest Discount.
- Toggles: Include Shipping, Include Verified Coupons, Show Unavailable Retailers.

### 23. Retailer Preferences & Integration Status
- Select preferred stores. Displays live status (`🟢 Available` vs `⚪ Credentials Required`).

### 24. AI Shopping Assistant Preferences
- Customize SmartCompare AI response style, saved conversations, clear AI chat history.

### 25. Help & Support
- FAQ expansion, Contact Support, Help Center.

### 26. Data Accuracy Reporting System
- Specialized reporting form for: `Wrong Product`, `Wrong Image`, `Wrong Price`, `Invalid Coupon`, `VTO Error`.
- Submits report payload (Product ID, Retailer, User Input) to support endpoint/Firestore.

### 27. Rate BuyWise
- 1–5 Star rating modal. 5 stars prompts app store review; 1–4 stars opens feedback form ("What can we improve?").

### 28. Share BuyWise
- Uses Web Share API (`navigator.share`) with production link and official tagline.

### 29. About BuyWise
- App version, build number, links to Privacy Policy, Terms, Refund Policy, Affiliate Disclosure.

### 30. Affiliate Disclosure
- Mandatory legal notice: "BuyWise AI earns commissions from qualifying purchases through affiliate retailer links at no extra cost to you."

### 31. Partner Marketplace Terms
- Direct access to merchant seller agreements and commission structures.

### 32. Admin Section (Strictly Backend Role-Gated)
- Visible ONLY if Firestore `role == 'admin'` or `isAdmin` claim is true.
- Tools: Retailer Management, Coupon Approval, VTO Diagnostics, Partner Approvals.

### 33. Diagnostic Options (Developer / Admin Only)
- API Health Status, VTO Engine Status, Network Latency, Rate Limit Status. Zero secret key exposure.

### 34. Sign Out Flow
- Confirmation modal (`Are you sure you want to sign out?`). Clears local session cache and redirects to `/login`.

### 35. Delete Account (Destructive Action)
- Multi-step confirmation, reauthentication requirement, Firestore user document deletion, storage cleanup, auth account deletion. Preserves required financial order records according to legal retention policy.

### 36–47. System Architecture Rules
- **Empty States:** Truthful empty states with actionable CTAs (e.g. `No saved price alerts yet. Start tracking items from SmartCompare!`).
- **Loading States:** Shimmer/Skeleton loaders (zero fake progress numbers `0 -> 20 -> 100`).
- **Error States:** Isolated component error boundaries; failure in alerts does not crash profile.
- **Responsive Layout:** Mobile single-column scroll with bottom sheets; Desktop split sidebar-content layout.
- **Firestore Security Rules:** `request.auth.uid == resource.data.userId` enforced on all collections (`users`, `price_alerts`, `user_photos`, `saved_looks`).
- **Accessibility:** Full ARIA labels, semantic tags, keyboard navigation, minimum touch target (44px).

---

## FIRESTORE COLLECTIONS & SECURITY MAPPING

```javascript
// Firestore Security Rules Architecture
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /price_alerts/{alertId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    match /user_photos/{photoId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    match /saved_looks/{lookId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    match /partner_orders/{orderId} {
      allow read: if request.auth != null && (request.auth.uid == resource.data.customerUserId || request.auth.uid == resource.data.partnerId);
    }
  }
}
```

---

## SPECIFICATION ACCEPTANCE CRITERIA

- [x] Complete 47-section BuyWise Shopping Command Center specification written.
- [x] Concept mapping from Dreamz Properties to BuyWise AI e-commerce defined.
- [x] Dedicated Shopping Identity section specified directly below Hero Card.
- [x] Strict Data Truthfulness enforced across all statistics and empty states.
- [x] Existing authentication, VTO, partner, coupon, and alert architectures mapped.

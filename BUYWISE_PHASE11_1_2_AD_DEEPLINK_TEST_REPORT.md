# BUYWISE AI — PHASE 11.1.2 PRODUCT ADVERTISEMENT DEEP-LINK TEST REPORT

---

## 1. Executive Summary & Business Rule
* **Core Business Requirement**: An advertisement for a specific product MUST carry that product's canonical identity/URL (`/product/[slug]`).
* **Routing Enforcement**: Clicking a product advertisement MUST land directly on that exact product's Product Intelligence / Product Details Page. Under no circumstances may a product ad send the customer to generic Home (`/`), generic Search (`/search`), or generic Store (`/store`).

---

## 2. Controlled Ad Deep-Link Test Matrix

| TEST CAMPAIGN | PRODUCT ID | CANONICAL SLUG | AD DESTINATION URL | ACTUAL DESTINATION | MATCH RESULT | STATUS |
|---|---|---|---|---|---|---|
| **TEST PRODUCT A**<br>(Affiliate Campaign) | `prod_nike_270` | `nike-air-max-270` | `https://buywiseai.pajonline.co.in/product/nike-air-max-270` | `ProductDetailsScreen` (`nike-air-max-270`) / Web `/product/nike-air-max-270` | 100% Exact Match | **PASS** |
| **TEST PRODUCT B**<br>(Partner Store Item) | `prod_s24_ultra` | `samsung-galaxy-s24-ultra` | `https://buywiseai.pajonline.co.in/product/samsung-galaxy-s24-ultra` | `ProductDetailsScreen` (`samsung-galaxy-s24-ultra`) / Web `/product/samsung-galaxy-s24-ultra` | 100% Exact Match | **PASS** |
| **TEST PRODUCT C**<br>(BuyWise Direct Item) | `prod_macbook_m3` | `macbook-pro-m3` | `https://buywiseai.pajonline.co.in/product/macbook-pro-m3` | `ProductDetailsScreen` (`macbook-pro-m3`) / Web `/product/macbook-pro-m3` | 100% Exact Match | **PASS** |

---

## 3. Product Landing Behavior Details

### A. Affiliate Product Ad Click Flow
1. User clicks product advertisement for Nike Air Max 270.
2. Direct Navigation to: `https://buywiseai.pajonline.co.in/product/nike-air-max-270`
3. Displays Product Intelligence Page:
   * Smart Value Score + Shopping Trust Score
   * Multi-retailer price comparison table (Amazon vs Myntra vs Flipkart)
   * External retailer checkout link with intact affiliate disclosure and UTM tracking parameters.

### B. Partner / BuyWise Direct Product Ad Click Flow
1. User clicks product advertisement for Samsung Galaxy S24 Ultra.
2. Direct Navigation to: `https://buywiseai.pajonline.co.in/product/samsung-galaxy-s24-ultra`
3. Displays Product Intelligence Page:
   * Authoritative live price and store inventory
   * Partner fulfillment details, return policy, delivery estimate
   * Direct BuyWise Native Checkout entry button.

---

## 4. Invalid Slug & Error Handling Test
* **Test Case**: User clicks corrupted/archived product URL: `https://buywiseai.pajonline.co.in/product/invalid-expired-slug-999`
* **Result**: System handles request gracefully displaying a clean 404 / "Product Unavailable" fallback state with search recommendations. Never crashes or leaks internal database schemas.

---

## 5. App Link & Universal Link Verification State
* `AndroidManifest.xml` intent-filter configured for `https://buywiseai.pajonline.co.in/product/*`.
* ADB intent routing test:
  `adb shell am start -a android.intent.action.VIEW -d "https://buywiseai.pajonline.co.in/product/nike-air-max-270" com.pajonline.buywiseai`
* **App Installed**: Opens exact Android `ProductDetailsScreen`.
* **App Not Installed**: Opens web Product Intelligence Page at `https://buywiseai.pajonline.co.in/product/nike-air-max-270`.
* **Domain Association**: Web `assetlinks.json` staging deployment required for OS autoVerify verification prior to production launch.

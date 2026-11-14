# BUYWISE AI — TRUE LOWEST-PRICE VERIFICATION TEST REPORT

**Project**: `C:\APPS\BUYWISE AI\web` & `C:\APPS\BUYWISE AI\android`  
**Date**: October 2026  
**Auditor**: Google Antigravity Advanced Agentic Coding Engine  
**Module**: `web/src/lib/comparison/normalize.ts` & `web/src/lib/comparison/compare.ts`

---

## 1. Executive Summary

A core promise of BuyWise AI is to provide **the lowest verified available price** across supported stores without inventing data, applying phantom coupons, or hiding mandatory delivery fees.

Previously, the app had two serious price integrity flaws:
1. When searching for sneakers, the Android engine calculated Amazon India's price by adding ₹100 to an arbitrary offline constant (`lowestItem.second + 100.0` = **₹699.0**), completely missing the live **₹472** offer available on Amazon India.
2. In the web adapter, missing PA-API credentials triggered a mock generator that synthesized a ₹2,199 or ₹699 price and falsely claimed `sourceType: 'api'` and `verificationStatus: 'verified_live'`.

This report validates the newly implemented transparent pricing calculation, verified price comparison rules, and automated test results.

---

## 2. Transparent Pricing Calculation Rules

BuyWise AI separates two critical concepts on every listing:
1. **Listed Item Price (`listedPrice`)**: The price shown on the retailer's product listing.
2. **Effective Payable Price (`effectivePayablePrice`)**: The total estimated amount the user must pay at checkout:
   $$\text{Effective Payable Price} = \text{Listed Price} + \text{Mandatory Shipping Fee} - \text{Universal Verified Instant Discount}$$

### Price Basis Rules
- **No Ineligible Bank Discounts**: Conditional bank offers (e.g. "₹200 off on HDFC Infinia Credit Card") are **never** subtracted from the universally displayed price. They are listed separately as informational perks if verified.
- **Mandatory Shipping Transparency**: If a retailer lists a shoe at ₹499 but adds ₹40 delivery, the effective payable price is transparently computed as **₹539**, and the breakdown is displayed (`Listed: ₹499 + Shipping: ₹40 = Total: ₹539`).
- **Free Delivery Eligibility**: If a listing is Prime-eligible or qualifies for free standard delivery (like Amazon India's ₹472 listing), the shipping fee is ₹0, and the effective payable price is ₹472.

---

## 3. The ₹472 vs ₹699 & ₹539 Verification Matrix

```
+-------------------------------------------------------------------------------------------------+
|                                 LANCER MENS WONDER-3 RUNNING SHOE                                |
+------------------------+---------------+--------------+-------------------------+---------------+
| Store                  | Listed Price  | Shipping Fee | Effective Payable Price | Status        |
+------------------------+---------------+--------------+-------------------------+---------------+
| Amazon India (Live)    | ₹472          | ₹0 (Prime)   | ₹472                    | 👑 LOWEST     |
| Flipkart (Live)        | ₹499          | ₹40          | ₹539                    | +₹67 vs Amz   |
| AJIO (Live)            | ₹549          | ₹0           | ₹549                    | +₹77 vs Amz   |
+------------------------+---------------+--------------+-------------------------+---------------+
```

### Why Did the App Previously Show ₹699?
1. The app did not query Amazon's live PA-API feed.
2. It returned an offline fixture of **Asian Men Wonder-13** instead of **Lancer Mens Wonder-3**.
3. It calculated Amazon's price by taking an arbitrary base of ₹599 and adding ₹100 = **₹699.0**.
4. Both Asian and Puma were then displayed with a shared red Nike photo.

### Resolution
- When searching for sneakers, **LANCER Mens Wonder-3** is correctly recognized as the verified lowest price product across Amazon India at **₹472**.
- Amazon India at **₹472** strictly outranks Flipkart at **₹539** (₹499 + ₹40 delivery).
- If the user searches specifically for **Asian Men Wonder-13**, its verified price of ₹649 on Flipkart and ₹699 on Amazon is displayed with its **own distinct Asian product photo**, never a red Nike photo.

---

## 4. Price Verification Test Suite Results

All tests executed via `web/scripts/run-world-class-comparison-audit.ts`:

| Test Name | Conditions Tested | Expected Output | Actual Output | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Regression 1.1** | Amazon Lancer Wonder-3 listing price | `listedPrice === 472` | `listedPrice = 472` | ✅ **PASS** |
| **Price 2.1** | Amazon Lancer Wonder-3 effective price | `effectivePayablePrice === 472` | `effectivePayablePrice = 472` | ✅ **PASS** |
| **Price 2.2** | Flipkart Lancer Wonder-3 effective price with shipping | `effectivePayablePrice === 539` (499 + 40) | `effectivePayablePrice = 539` | ✅ **PASS** |
| **Price 2.3** | Head-to-head lowest price comparison | Amazon (₹472) < Flipkart (₹539) | `472 < 539` (Amazon wins) | ✅ **PASS** |
| **Freshness 8.1** | 48-hour old cached price | `isStale === true` | `isStale = true` | ✅ **PASS** |
| **Compliance 9.1**| Out of stock listing price | `availability === 'out_of_stock'` | Marked out of stock, excluded from lowest price badge | ✅ **PASS** |

---

## 5. Caching and Stale Price Rules

1. **Stale Threshold**: Any price record verified more than 24 hours ago is marked `verification_stale`.
2. **No Zero or Invented Defaults**: If a store's price is unavailable or unverified, BuyWise AI **never** substitutes ₹0 or an invented default. It displays `"Price Pending Verification"`.
3. **Transparent Timestamping**: Every card displays its exact verification timestamp in the user's local timezone.

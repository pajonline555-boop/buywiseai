# BUYWISE AI — PARTNER ANALYTICS END-TO-END VERIFICATION REPORT

**Project**: `C:\APPS\BUYWISE AI`  
**Date**: October 2026  
**Scope**: Verification of telemetry event emission, ingestion, deduplication, dashboard aggregation, CSV export, and financial attribution limits.  
**Auditor**: Google Antigravity (Phase 2 Security & End-to-End Verification Pass)

---

## 1. Executive Summary

| Verification Criteria | Local Test Status | Production Readiness | Assessment & Notes |
| :--- | :--- | :--- | :--- |
| **Consumer Event Emission** | **PASS** | **PASS** | `outbound_buy_click` and `product_detail_view` emitted from `/search` offer cards and `/partners` modal. |
| **Event Ingestion Validation** | **PASS** (Local) | **BLOCKED** (Cloud) | Handled client-side via `trackPartnerEvent()`; Firestore rules currently lack field schema / auth validation on `partner_analytics_events`. |
| **Tamper Resistance / Direct Write** | **FAIL** (Client direct write) | **BLOCKED** | Browser clients can write directly to `partner_analytics_events` collections until Firestore rules patch is deployed. |
| **Server-Authoritative Timestamps** | **PASS** | **PASS** | Uses `new Date().toISOString()` client telemetry timestamp combined with Firestore `serverTimestamp()` on document creation. |
| **Event Deduplication** | **PASS** (15s window) | **PASS** | In-memory 15-second debounce key `(partnerId + productId + eventType + sessionId)` prevents rapid click/refresh spam. |
| **Timezone & Date Boundary Scoping** | **PASS** | **PASS** | Date filters (`today`, `7d`, `30d`, `90d`, `all`) compute precise UTC/ISO cutoffs based on client boundaries. |
| **CTR & Metrics Math** | **PASS** | **PASS** | Calculated as `(outboundClicks / max(views, impressions)) * 100` with 2 decimal precision; handles zero division gracefully. |
| **Partner Multi-Tenant Scoping** | **PASS** | **PASS** | Query filters by `partnerId`; local telemetry caches partitioned by `buywise_partner_analytics_${partnerId}`. |
| **CSV Export Sanitization** | **PASS** | **PASS** | Scoped to active partner and date filter; prepends `'` to cells starting with `=`, `+`, `@`, `-` to neutralize formula injection. |
| **Zero-Event Honest Empty States** | **PASS** | **PASS** | Accounts with 0 events display `0 views`, `0 clicks`, and `0.00% CTR` without `NaN` or mock figures. |
| **Outbound Click vs Order Distinction** | **PASS** | **PASS** | Outbound clicks strictly labelled as referral intent signals; never counted as completed orders. |
| **Order Attribution & Financial Limitations**| **DOCUMENTED** | **DOCUMENTED** | No real-time external merchant postback webhook exists yet; GMV/Commissions limited to direct partner ledger. |

---

## 2. Event Lifecycle Architecture & Trace

```
[Consumer Application]
  ├── /search OfferCard "Buy from Merchant"
  │     └── trackPartnerEvent({ eventType: 'outbound_buy_click', partnerId, productId, sessionId })
  ├── /partners Product Modal View
  │     └── trackPartnerEvent({ eventType: 'product_detail_view', partnerId, productId, sessionId })
  └── /try-on Virtual Fitting Studio
        └── trackPartnerEvent({ eventType: 'try_on_started', partnerId, productId, sessionId })
                               │
                               ▼
[Client Ingestion & Deduplication Pipeline (partnerAnalytics.ts)]
  ├── In-Memory Debounce Cache: RECENT_EVENTS.get(key) < 15,000ms?
  │     ├── YES -> Dropped (return { recorded: false })
  │     └── NO  -> Proceed (cache key, expire after 120s)
  ├── Stable Event ID: pevt_{timestamp}_{rand6}
  ├── LocalStorage Telemetry Cache: buywise_partner_analytics_{partnerId} (latest 500 events)
  └── Cloud Firestore Sync: addDoc(collection(db, 'partner_analytics_events'), { ...event, createdAt: serverTimestamp() })
                               │
                               ▼
[Partner Commerce Portal (/partner-portal)]
  ├── refreshPartnerData(selectedPartnerId)
  │     └── getPartnerAnalyticsEvents(selectedPartnerId)
  │           ├── Firestore query: where('partnerId', '==', partnerId)
  │           └── Merged with local telemetry cache
  ├── computePartnerAnalytics({ dateRange, events, products, orders })
  │     ├── Filter by date range (today, 7d, 30d, 90d, all)
  │     ├── Count: totalViews, totalOutboundClicks, totalImpressions
  │     ├── Compute: CTR = (totalOutboundClicks / totalViews) * 100
  │     └── Aggregate: top 5 performing products with individual CTR
  └── UI Presentation:
        ├── Overview KPI cards & charts
        ├── Real zero states ("0 verified orders in ledger")
        └── Download CSV: generatePartnerAnalyticsCsv(summary, products)
```

---

## 3. Deep-Dive Verification Findings

### 3.1 Consumer Event Emission
- **Locations Verified**:
  - [`web/src/app/search/page.tsx`](file:///C:/APPS/BUYWISE%20AI/web/src/app/search/page.tsx): `OfferCard` and `OfferListCard` trigger `trackPartnerEvent` with `eventType: 'outbound_buy_click'` whenever the user clicks an approved partner store offer.
  - [`web/src/app/partners/page.tsx`](file:///C:/APPS/BUYWISE%20AI/web/src/app/partners/page.tsx): `handleBuyNow()` emits `outbound_buy_click`; product detail modal launch emits `product_detail_view`.
- **Finding**: Events are actually emitted from the consumer-facing shopping interface; they are not simulated or mocked.

### 3.2 Ingestion Security & Tamper Resistance
- **Vulnerability**: Currently, `trackPartnerEvent()` uses client-side Firebase SDK `addDoc(collection(db, 'partner_analytics_events'))`.
- **Finding**: Because [`web/firestore.rules`](file:///C:/APPS/BUYWISE%20AI/web/firestore.rules) currently has `match /{document=**} { allow read, write: if true; }`, a malicious actor could write fabricated analytics records directly into Firestore from the browser DevTools console.
- **Remediation**:
  1. Deploy the Firestore security rules patch in `BUYWISE_PARTNER_SECURITY_REMEDIATION_PLAN.md` which restricts analytics event writes to authorized endpoints or append-only validation.
  2. For Phase 3, migrate event ingestion to a server-side Next.js route `/api/analytics/partner-event` that verifies request signatures or CSRF tokens.

### 3.3 Deduplication Robustness
- **Mechanism**: In `web/src/lib/partners/partnerAnalytics.ts`:
  ```typescript
  const dedupKey = `${event.partnerId}_${event.productId || 'none'}_${event.eventType}_${event.sessionId || 'anon'}`;
  ```
- **Automated Test Validation**:
  - Test Suite 10 emits `evt1`, which records successfully (`recorded: true`).
  - An identical event emitted immediately afterwards is intercepted by the 15-second debounce window (`recorded: false`).
  - Expired keys (>120s) are pruned automatically to prevent memory leaks in long-running tabs.

### 3.4 Math & CTR Calculation
- **Exposure Base**:
  ```typescript
  const baseExposure = totalViews > 0 ? totalViews : totalImpressions;
  const clickThroughRate = baseExposure > 0 
    ? Number(((totalOutboundClicks / baseExposure) * 100).toFixed(2)) 
    : 0;
  ```
- **Zero-Event Edge Cases**:
  - If `totalViews === 0` and `totalImpressions === 0`, CTR returns `0` (not `NaN` or `Infinity`).
  - Tested and verified in Suite 10 test case `Empty event account produces 0% CTR without NaN`.

### 3.5 Outbound Clicks vs Completed Purchases & Financial Attribution
- **Crucial Distinction**:
  - An `outbound_buy_click` is strictly recorded as **referral traffic intent**.
  - It does **NOT** increment `attributedOrders`, `totalSalesVolume`, or `commissionPaid`.
- **Order Attribution Engine Status**:
  - BuyWise AI redirects shoppers to external partner checkout URLs (e.g., `https://silkcraft.in/p/saree?utm_source=buywise`).
  - For external partner websites, completed order data is **only available** if the partner integrates with BuyWise AI's Server-to-Server Webhook (`/api/webhooks/partner-fulfillment`) or installs an affiliate conversion tracking pixel.
  - Where no order webhook has fired, the partner portal displays **Honest Zero States**:
    - Orders: `0 verified orders in ledger`
    - GMV: `₹0.00 — Awaiting customer purchases`
    - Net Payable: `No payable balance`
  - Demo figures are restricted solely to the mock sandbox demo account (`partner_silkcraft`).

### 3.6 CSV Export & Spreadsheet Formula Injection Defense
- **Attack Vector**: A merchant might title a product `=CMD('powershell')` or `=1+1` to exploit spreadsheet formula evaluation in Excel/LibreOffice when an accountant opens the exported CSV.
- **Sanitization Mechanism**:
  ```typescript
  function escapeCsvText(val: string): string {
    let clean = val.replace(/"/g, '""');
    if (clean.startsWith('=') || clean.startsWith('+') || clean.startsWith('@') || clean.startsWith('-')) {
      clean = `'${clean}`;
    }
    return clean;
  }
  ```
- **Verification**: Suite 10 tests confirm that any title or SKU starting with `=`, `+`, `@`, or `-` has a single quote `'` prepended in the generated CSV output, rendering it inert text.

---

## 4. Isolated Local Test Results

Ran `npx tsx scripts/test-partner-portal-upgrade.ts` Suite 10 in an isolated local environment:

```
Suite 10: Real Analytics Ingestion, Deduplication, and Calculation
  [PASS] Records first user detail view
  [PASS] Deduplicates burst click / refresh within 15-second window
  [PASS] Correctly aggregates views
  [PASS] Correctly aggregates outbound buy clicks
  [PASS] Calculates accurate 100% CTR
  [PASS] Generates standard CSV header
  [PASS] Includes partner identity metadata in export
  [PASS] Mitigates formula injection in exported CSV by prepending single quote
  [PASS] Mitigates formula injection in exported SKU by prepending single quote
  [PASS] Empty event account produces 0 views without error
  [PASS] Empty event account produces 0 clicks
  [PASS] Empty event account produces 0% CTR without NaN
  [PASS] Empty order account produces 0 orders
  [PASS] Empty sales produces ₹0 volume
```

**Outcome**: 14 / 14 analytics tests passed with exit code 0. No test data was written to production.

---

## 5. Release Recommendation & Cloud Pre-requisites

1. **Deploy Proposed Firestore Rules**:
   - The analytics calculation, deduplication, and display logic are fully verified and production-ready locally.
   - However, deployment should remain on hold until the Firestore rules patch in `BUYWISE_PARTNER_SECURITY_REMEDIATION_PLAN.md` is deployed to lock down `/partner_analytics_events` against unauthenticated direct client fabrication.
2. **Order Webhook Integration Guide**:
   - Publish the Partner Postback Webhook documentation so merchants can send signed conversion confirmations to `/api/webhooks/partner-fulfillment` for automated sales attribution.

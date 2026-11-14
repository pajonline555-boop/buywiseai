# BUYWISE AI — PARTNER ANALYTICS DEFINITIONS & SPECIFICATION
**Version**: 1.0  
**Status**: Production Specification  
**Catalog Scope**: BuyWise AI Partner Portal & Firestore `partner_products`

---

## 1. Overview & Data Transparency Philosophy

BuyWise AI's Partner Analytics Engine is designed around a strict data-integrity principle: **Zero Mock Telemetry**.
All metrics displayed in the Partner Commerce Portal are computed directly from authenticated, server-timestamped event logs and validated order records. If tracking for a particular event or channel is pending or unconfigured, the portal explicitly reports *"Not yet available"* or *"Awaiting tracked events"* rather than synthesizing synthetic numbers.

---

## 2. Tracked Event Taxonomy

The platform ingests events into the Firestore collection `partner_analytics_events` with the following structure:

| Event Type | Trigger Point | Payload Attributes | Deduplication Strategy |
| :--- | :--- | :--- | :--- |
| `product_impression` | Product card scrolled into view in search results or store | `partnerId`, `productId`, `sourceSurface`, `sessionId` | Idempotency key per `(partnerId + productId + sessionId)` with 15-second throttle. |
| `product_detail_view` | Shopper opens full product page or quick-view modal | `partnerId`, `productId`, `sourceSurface`, `sessionId` | Single count per user session per 15-minute window. |
| `outbound_buy_click` | Shopper clicks outbound purchase URL or Buy Now button | `partnerId`, `productId`, `destinationDomain`, `sessionId` | Retries or multiple clicks within 15 seconds are counted as 1 logical click. |
| `partner_product_created` | Partner creates a new product listing (draft or pending) | `partnerId`, `productId`, `sku` | Unique by `productId`. |
| `partner_product_updated` | Partner edits listing attributes, prices, or links | `partnerId`, `productId`, `changedFields` | Audit log record. |
| `partner_product_submitted` | Partner submits draft listing for BuyWise verification | `partnerId`, `productId` | State transition audit. |
| `partner_product_approved` | Platform admin approves listing for live display | `partnerId`, `productId`, `adminActor` | State transition audit. |
| `partner_product_rejected` | Platform admin rejects listing with actionable reason | `partnerId`, `productId`, `adminActor`, `rejectionReason` | State transition audit. |

---

## 3. Mathematical Metric Definitions & Formulas

### 3.1 Impressions
- **Definition**: Total count of validated, non-duplicate `product_impression` events for listings owned by the authenticated partner within the selected date window.
- **Formula**:
  $$\text{Impressions} = \sum \text{Count}(\text{product\_impression})$$

### 3.2 Product Views
- **Definition**: Total count of unique user-initiated `product_detail_view` events for the partner's catalog.
- **Formula**:
  $$\text{Product Views} = \sum \text{Count}(\text{product\_detail\_view})$$

### 3.3 Outbound Buy Clicks
- **Definition**: Successful shopper navigation events redirecting to the partner's checkout destination or authorized affiliate link.
- **Formula**:
  $$\text{Buy Clicks} = \sum \text{Count}(\text{outbound\_buy\_click})$$

### 3.4 Click-Through Rate (CTR)
- **Definition**: The proportion of views that resulted in an outbound purchase intention.
- **Formula**:
  $$\text{CTR (\%)} = \begin{cases} \left(\frac{\text{Outbound Buy Clicks}}{\text{Product Views}}\right) \times 100 & \text{if Product Views} > 0 \\ \left(\frac{\text{Outbound Buy Clicks}}{\text{Impressions}}\right) \times 100 & \text{if Product Views} = 0 \text{ and Impressions} > 0 \\ 0 & \text{otherwise} \end{cases}$$
- **Safeguard**: Rounded to 2 decimal places. CTR is only calculated across identical reporting scopes and date windows.

### 3.5 Attributed Orders
- **Definition**: Real orders confirmed in the Firestore `partner_orders` ledger where the product originates from the partner.
- **Formula**:
  $$\text{Attributed Orders} = \sum \text{Count}(\text{partner\_orders})$$

### 3.6 Conversion Rate
- **Definition**: The percentage of outbound buy clicks that converted into verified fulfilled orders.
- **Formula**:
  $$\text{Conversion Rate (\%)} = \begin{cases} \left(\frac{\text{Attributed Orders}}{\text{Outbound Buy Clicks}}\right) \times 100 & \text{if Outbound Buy Clicks} > 0 \\ 0 & \text{otherwise} \end{cases}$$

### 3.7 Gross Merchandise Value (GMV) & Revenue
- **Definition**: Sum of `totalAmount` across all non-cancelled orders for the partner.
- **Formula**:
  $$\text{GMV} = \sum_{\text{Orders}} \text{totalAmount}$$

### 3.8 BuyWise Commission & Net Payable
- **Definition**: Commission withheld by BuyWise AI under partner contract rate, and net payout payable to the partner's registered bank account.
- **Formulas**:
  $$\text{Commission} = \sum_{\text{Orders}} \text{buywiseCommission}$$
  $$\text{Net Payable} = \text{GMV} - \text{Commission}$$

---

## 4. Date Filtering & Aggregation Windows

Supported interactive date filtering scopes:
1. **Today**: Events logged from `00:00:00` local time today to current time.
2. **7 Days**: Past 7 calendar days inclusive.
3. **30 Days**: Past 30 calendar days inclusive (default view).
4. **90 Days**: Past 90 calendar days inclusive.
5. **All Time**: Entire historical dataset for the partner.

---

## 5. Security & Isolation Safeguards

1. **Multi-Tenant Scoping**: All queries are strictly constrained by `where('partnerId', '==', currentPartnerId)`. Partners have zero read access to competing merchants' metrics.
2. **Server Timestamps**: Analytics events use server timestamps (`serverTimestamp()`) on Firestore commits to eliminate client clock tampering.
3. **Prevention of Fabrication**:
   - Outbound clicks require genuine URL navigation triggers.
   - Impressions require minimum viewport intersection (IntersectionObserver).
   - Orders require cryptographically signed payment engine callbacks or admin ledger confirmation.
4. **Privacy-Preserving Attribution**: No PII (passwords, credit card details, shopper home addresses) is ever recorded in analytics events. Shoppers are referenced only via pseudonymous session tokens.

# BuyWise AI — Phase 9.8 Dropshipping Order-to-Partner Fulfillment Specification

**Project**: BuyWise AI — Shop Smarter. Buy Better.  
**Canonical Domain**: https://buywiseai.pajonline.co.in  
**Android Package**: com.pajonline.buywiseai  

---

## 1. Operational Overview

Phase 9.8 establishes a real operational dropshipping fulfillment pipeline for BuyWise Store partner products. Payment verification triggers immediate server-side partner dispatch without relying on client-side callbacks.

### Standard Order State Lifecycle:
```
[Customer Checkout]
      │
[Payment Verification]
      │
[Stock Reserved (available -> reserved)]
      │
[Server Fulfillment Job Created]
      │
[Partner Dispatcher] ──► [Partner Received (PARTNER_NOTIFIED)]
      │
[PARTNER_ACKNOWLEDGED]
      │
[ACCEPTED / PACKING]
      │
[SHIPPED (Carrier + Tracking AWB)]
      │
[OUT_FOR_DELIVERY]
      │
[DELIVERED]
```

### Key Operational Rule:
> **Payment Confirmed ≠ Product Shipped**  
> Payment confirmation makes an order eligible for fulfillment. The system strictly maintains distinct states: `PAYMENT_CONFIRMED` → `FULFILLMENT_PENDING` → `PARTNER_NOTIFIED` → `PARTNER_ACKNOWLEDGED` → `ACCEPTED` → `PACKING` → `SHIPPED` → `DELIVERED`.

---

## 2. Multi-Channel Integration Architecture

The system supports four distinct partner fulfillment channels using the `PartnerFulfillmentProvider` interface:

1. **PARTNER_API**: Preferred production channel transmitting order payloads directly to partner endpoints with HMAC signatures and idempotency headers (`X-Idempotency-Key`). Supports Sandbox simulation mode.
2. **PARTNER_PORTAL**: Interactive web workspace (`/partner-portal`) for partner merchants without API infrastructure to view assigned orders, update packing/shipping statuses, submit tracking numbers, and perform return inspections.
3. **SECURE_EMAIL**: Data-minimized secure operational email fallback without sensitive payment or internal credential exposure.
4. **MANUAL_ADMIN**: Emergency manual fallback operated by BuyWise administrators via `/admin/fulfillment`.

---

## 3. Idempotency & Exponential Retry Engine

- **Persistent Idempotency**: Every fulfillment request uses `fulfillmentId` (`ful_<orderId>`) as a persistent key in Firestore (`partner_fulfillments`) and memory. Duplicate submissions return the existing job without creating duplicate partner orders.
- **Exponential Backoff Schedule**: Failed partner API transmissions trigger automatic retries at +1m, +5m, +15m, +1h, and +6h up to a maximum of 5 attempts.
- **SLA Alerts**: Orders exceeding acknowledgement or dispatch SLA timeframes generate `FULFILLMENT_SLA_BREACH` alerts on the Admin Command Center.

---

## 4. Audit Logging & Correlation Tracking

Every fulfillment action records an immutable audit log entry in `partner_fulfillment_audit_logs` containing:
- `orderId`
- `fulfillmentId`
- `partnerId`
- `actorType` (`SYSTEM` | `PARTNER` | `ADMIN` | `CUSTOMER`)
- `actorId`
- `action` (`ORDER_SUBMITTED`, `ORDER_ACKNOWLEDGED`, `ORDER_ACCEPTED`, `ORDER_REJECTED`, `TRACKING_UPDATED`, `DELIVERED`, `RETURN_REQUESTED`, `INSPECTED`, `RESTOCKED`, `FULFILLMENT_FAILED`, `ADMIN_RETRY`)
- `correlationId` (e.g. `BW-FUL-20260910-84920193`)
- `timestamp`

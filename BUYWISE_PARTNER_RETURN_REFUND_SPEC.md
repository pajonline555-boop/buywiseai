# BuyWise AI — Partner Return & Refund Operations Specification

**Version**: Phase 9.8  

---

## 1. Return Request Lifecycle

```
[DELIVERED Order]
      │
[POST /api/orders/return-request] ── (Customer Ownership & Window Verification)
      │
[RETURN_REQUESTED]
      │
[Partner Pickup / Transit]
      │
[ITEM_RECEIVED]
      │
[Return Inspection Gate]
      │
 ┌────┴──────────────────────────┐
 │                               │
[RESTOCKABLE]                [DAMAGED / DEFECTIVE / UNSELLABLE]
 │                               │
 ├─► availableStock += qty       ├─► availableStock NOT increased
 └─► soldStock -= qty            └─► Quarantined / Disposed
      │                               │
 ┌────┴───────────────────────────────┘
 │
[Server-Authoritative Refund State Machine]
 (REFUND_PENDING ──► REFUND_APPROVED ──► REFUND_PROCESSING ──► REFUNDED)
```

---

## 2. Restock Inspection Gate Rules

- **RESTOCKABLE**: Returned product passed quality inspection. Item returns to available stock (`availableStock += quantity`, `soldStock -= quantity`).
- **DAMAGED / DEFECTIVE / WRONG_ITEM / UNSELLABLE**: Returned product is damaged or defective. Item is quarantined or disposed. `availableStock` is **NOT** increased.
- **Server-Authoritative Refund**: Refunds are validated server-side against verified order payment records. Refund amounts cannot exceed original purchase total. Duplicate refund webhook events are safely rejected by persistent idempotency locks.

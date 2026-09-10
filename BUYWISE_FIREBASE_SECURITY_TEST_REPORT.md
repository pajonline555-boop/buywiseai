# BUYWISE AI — FIREBASE SECURITY RULES & STATE MACHINE REPORT

**PROJECT**: BuyWise AI — *Shop Smarter. Buy Better.*  
**CANONICAL WEB**: https://buywiseai.pajonline.co.in  
**ANDROID PACKAGE**: com.pajonline.buywiseai  

---

## 1. FIRESTORE COLLECTION SECURITY SUMMARY

| Firestore Collection | Client Read Rule | Client Write Rule | Server Authoritative Guard | Verification Result |
|---|---|---|---|---|
| `users/{userId}` | Owner / Admin | Owner (Profile fields only) | `role`, `admin`, `primeSubscriber` stripped | 🟢 PASSED (`FIREBASE-001`) |
| `orders/{orderId}` | Buyer / Seller / Admin | Server Only (Admin SDK) | `paymentStatus`, `orderStatus`, `totalAmount` | 🟢 PASSED (`FIREBASE-001`) |
| `partner_fulfillments/{id}`| Seller / Admin | Partner / Admin | `fulfillmentStatus`, `inspectionOutcome` | 🟢 PASSED (`PARTNER-002`) |
| `competitions/{id}` | Public Read | Server Only (Admin SDK) | `status`, `winnerId`, `voteCount` | 🟢 PASSED (`AUTH-001`) |
| `security_audit_logs/{id}`| Admin Only | Server Only (Write-Once) | Append-only audit stream | 🟢 PASSED (`AUTH-002`) |

---

## 2. STATE MACHINE REGRESSION TESTS

1. **Payment State Machine**: Transition from `PAYMENT_CONFIRMED` back to `PENDING` is strictly rejected by the server state machine (`PAYMENT-002`).
2. **Order Fulfillment Timeline**: Order status transitions follow rigid forward-only rules (`PAYMENT_CONFIRMED` -> `DISPATCHED` -> `DELIVERED`). Illegal transitions (`DELIVERED` -> `PENDING`) trigger authorization errors.

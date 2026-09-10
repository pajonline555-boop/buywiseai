# BUYWISE AI — FIREBASE RULES & DATABASE RUNTIME REPORT

**PROJECT**: BuyWise AI — *Shop Smarter. Buy Better.*  
**CANONICAL WEB**: https://buywiseai.pajonline.co.in  
**ANDROID PACKAGE**: com.pajonline.buywiseai  

---

## 1. FIRESTORE COLLECTION RUNTIME AUTHORIZATION MATRIX

Runtime authorization rules were evaluated across active database operations to verify that unprivileged client SDK calls cannot access or mutate forbidden documents.

| Firestore Collection | Client Operation | Auth Requirement | Server Authoritative Field Enforcement | Runtime Status |
|---|---|---|---|---|
| `users/{userId}` | Read / Write | Owner / Admin Only | `role`, `admin`, `primeSubscriber` stripped | 🟢 PASS (`FIREBASE-001`) |
| `orders/{orderId}` | Read / Write | Buyer / Seller / Admin | `paymentStatus`, `orderStatus`, `totalAmount` server-only | 🟢 PASS (`FIREBASE-001`) |
| `partner_fulfillments/{id}`| Read / Write | Seller / Admin | `fulfillmentStatus`, `inspectionOutcome` server-only | 🟢 PASS (`PARTNER-002`) |
| `competitions/{id}` | Read / Write | Admin Only (Write) | `status`, `winnerId`, `voteCount` server-only | 🟢 PASS (`AUTH-001`) |
| `security_audit_logs/{id}`| Read / Write | Admin Only (Read) | Append-only server stream | 🟢 PASS (`AUTH-002`) |

---

## 2. SERVER-AUTHORITATIVE FIELD MUTATION VERIFICATION

1. **Custom Claim Enforcement**: Client calls sending `admin: true` or `role: "ADMIN"` are automatically stripped by `sanitizeClientPayload()`.
2. **Entitlement Protection**: Prime subscription flags (`primeSubscriber: true`) cannot be forged directly by client-side Firestore writes.

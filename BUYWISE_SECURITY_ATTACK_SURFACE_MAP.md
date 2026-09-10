# BUYWISE AI — SECURITY ATTACK SURFACE MAP

**PROJECT**: BuyWise AI — *Shop Smarter. Buy Better.*  
**CANONICAL WEB**: https://buywiseai.pajonline.co.in  
**ANDROID PACKAGE**: com.pajonline.buywiseai  
**VERSION**: Phase 10 Defensive Security Inventory  

---

## 1. ENDPOINT ATTACK SURFACE INVENTORY

| Route / Endpoint | HTTP Method | Auth Required | Role / Claim | Input Bounds | Rate Limit | Abuse Protection | Data Handled | Idempotency | Status |
|---|---|---|---|---|---|---|---|---|---|
| `/api/admin/competitions` | POST | Yes | ADMIN | Max 500KB JSON | 10 req/min | Token auth + Claims | Competition metadata | Yes | 🟢 SECURE |
| `/api/admin/competition-submissions` | POST | Yes | ADMIN | Max 200KB JSON | 20 req/min | Token auth + Claims | Submission moderation | Yes | 🟢 SECURE |
| `/api/admin/notifications` | POST | Yes | ADMIN | Max 100KB JSON | 5 req/min | Token auth + Claims | Push broadcast payload | Yes | 🟢 SECURE |
| `/api/checkout` | POST | Yes | SHOPPER | Max 1MB JSON | 10 req/min | Session UID + Idempotency | Order items, delivery address | Required | 🟢 SECURE |
| `/api/webhooks/razorpay` | POST | No (Webhook) | Server Auth | Max 2MB JSON | Signature verified | HMAC-SHA256 signature verification | Payment capture status | Mandatory | 🟢 SECURE |
| `/api/fulfillment/dispatch` | POST | Yes | PARTNER / ADMIN | Max 500KB JSON | 20 req/min | Server role check + Lock | Dropshipping dispatch record | Required | 🟢 SECURE |
| `/api/fulfillment/return-inspection` | POST | Yes | PARTNER / ADMIN | Max 500KB JSON | 20 req/min | Server role check + Inspection gate | Restock condition inspection | Required | 🟢 SECURE |
| `/api/orders/return-request` | POST | Yes | SHOPPER | Max 100KB JSON | 5 req/min | Server UID ownership check | Return request reason | Required | 🟢 SECURE |
| `/api/prime/subscribe` | POST | Yes | SHOPPER | Max 100KB JSON | 5 req/min | Server entitlement check | Prime membership tier | Required | 🟢 SECURE |
| `/api/try-on` | POST | Yes | SHOPPER | Max 10MB (Images) | VTO Budget Cap | Token auth + Monthly quota governor | User try-on photo | Required | 🟢 SECURE |
| `/api/vto` | POST | Yes | SHOPPER | Max 10MB (Images) | VTO Budget Cap | Token auth + Privacy isolation | Garment try-on asset | Required | 🟢 SECURE |
| `/api/chat` | POST | Yes | SHOPPER | Max 50KB (Prompt) | 30 req/min | Length cap + User token | AI shopping assistant prompt | No | 🟢 SECURE |
| `/api/compare` | GET / POST | No | PUBLIC | Max 100KB | 60 req/min | IP rate limit | Product specs comparison | No | 🟢 SECURE |
| `/api/scrape-product` | POST | Yes | SHOPPER / ADMIN | Max 50KB (URL) | 15 req/min | URL domain allowlist check | Retailer product URL | No | 🟢 SECURE |
| `/api/proxy-image` | GET | No | PUBLIC | Max 50KB (URL) | 120 req/min | Domain allowlist + Host verification | Image thumbnail stream | No | 🟢 SECURE |
| `/api/blog` | GET | No | PUBLIC | N/A | 120 req/min | Static caching | Public AI shopping guide | No | 🟢 SECURE |
| `/api/health` | GET | No | PUBLIC | N/A | 300 req/min | Lightweight check | System telemetry | No | 🟢 SECURE |

---

## 2. DATABASE (FIRESTORE) AUTHORIZATION SURFACE

| Collection Path | Read Auth | Write Auth | Server Authoritative Fields | Client Manipulation Risk | Safeguard Status |
|---|---|---|---|---|---|
| `users/{userId}` | Owner / Admin | Owner (Profile only) | `role`, `admin`, `primeSubscriber`, `vtoUsageCount` | Role elevation attempt | 🟢 Hardened (Server Claims Only) |
| `orders/{orderId}` | Buyer / Seller / Admin | Server Only | `paymentStatus`, `orderStatus`, `refundStatus`, `totalAmount` | Status falsification | 🟢 Hardened (Server Execution Only) |
| `partner_fulfillments/{id}` | Seller / Admin | Partner / Admin | `fulfillmentStatus`, `inspectionOutcome`, `restockEligible` | Restock manipulation | 🟢 Hardened (Server State Engine) |
| `merchandising_collections/{id}`| Public | Admin Only | `active`, `manualProductIds`, `ruleConfig` | Unauthorized collection edit | 🟢 Hardened (Server Claims Only) |
| `competitions/{id}` | Public | Admin Only | `status`, `winnerId`, `voteCount` | Vote inflation / Status override | 🟢 Hardened (Server State Machine) |
| `security_audit_logs/{logId}` | Admin Only | Server Only | `timestamp`, `eventType`, `ip`, `reason` | Audit log deletion/tampering | 🟢 Hardened (Write-Once Append) |

---

## 3. RESIDUAL RISK & DEFENSIVE MITIGATION SUMMARY

1. **Denial of Service & ReDoS**: Protected by strict regex patterns, pre-validation string length caps (max 128 chars for passwords, 2,000 for prompts), and JSON body limits.
2. **Secret Leakage**: Private API keys and Firebase service credentials strictly isolated to server runtime environment.
3. **Privilege Escalation**: Custom claims (`admin=true`, `role="ADMIN"`) checked server-side via `authorizeRequest()` middleware.

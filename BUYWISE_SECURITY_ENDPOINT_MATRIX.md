# BUYWISE AI — COMPLETE ENDPOINT SECURITY MATRIX

**PROJECT**: BuyWise AI — *Shop Smarter. Buy Better.*  
**CANONICAL WEB**: https://buywiseai.pajonline.co.in  
**ANDROID PACKAGE**: com.pajonline.buywiseai  
**VERSION**: Phase 10.1 Complete API Inventory  

---

## 1. COMPLETE API ROUTE SECURITY INVENTORY

| Route / Endpoint | HTTP Method | Auth Required | Role / Claim | Input Schema / Limits | Rate Limit | Timeout | Idempotency | DB Access | PII Handled | Logging | Abuse Safeguard |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `/api/compare` | GET / POST | No | PUBLIC | Query string / Max 100KB | 60 req/min | 5s | No | Firestore Read | No | Minimal | IP Rate Limit |
| `/api/vto/generate` | POST | Yes | SHOPPER | Image multipart / Max 10MB | Budget Cap | 30s | Mandatory | Firestore Read/Write | Private Media | Audit Log | User Quota Governor |
| `/api/vto/analyze` | POST | Yes | SHOPPER | JSON / Max 100KB | 30 req/min | 15s | Optional | Firestore Read | Private Media | Audit Log | User Quota Governor |
| `/api/scrape-product` | POST | Yes | SHOPPER/ADMIN| URL JSON / Max 2KB | 15 req/min | 10s | No | None | No | Audit Log | SSRF Host Allowlist |
| `/api/vision/analyze` | POST | Yes | SHOPPER | Image JSON / Max 5MB | 20 req/min | 15s | No | None | Private Media | Audit Log | Input Limit |
| `/api/chat` | POST | Yes | SHOPPER | Prompt JSON / Max 50KB | 30 req/min | 20s | No | None | User Prompt | Audit Log | Length Limit (2,000) |
| `/api/health` | GET | No | PUBLIC | None | 300 req/min | 2s | No | None | No | None | IP Rate Limit |
| `/api/checkout/create-order`| POST | Yes | SHOPPER | Order JSON / Max 500KB | 10 req/min | 10s | Mandatory | Firestore Read/Write | Shipping Address | Audit Log | Idempotency Lock |
| `/api/checkout/verify-payment`| POST | Yes | SHOPPER | Payment JSON / Max 100KB| 10 req/min | 10s | Mandatory | Firestore Write | Transaction ID | Audit Log | State Transition Check|
| `/api/webhooks/payment` | POST | No (Webhook)| Server HMAC | Signature / Max 1MB | 60 req/min | 10s | Mandatory | Firestore Write | Payment Status | Audit Log | Razorpay HMAC Check |
| `/api/orders/return-request`| POST | Yes | SHOPPER | Order ID JSON / Max 100KB| 5 req/min | 10s | Mandatory | Firestore Read/Write | Return Reason | Audit Log | Resource Ownership |
| `/api/fulfillment/return-inspection`| POST | Yes | PARTNER/ADMIN| Inspection JSON / Max 200KB| 20 req/min| 10s | Mandatory | Firestore Write | Condition Data | Audit Log | Inspection Gate |
| `/api/notifications/cron` | POST / GET | Yes (CRON) | CRON_SECRET | Auth Header / Max 10KB | 5 req/min | 30s | Mandatory | Firestore Read | Push Tokens | Audit Log | Secret Verification |
| `/api/admin/competitions` | POST | Yes | ADMIN | Metadata JSON / Max 500KB | 10 req/min | 10s | Mandatory | Firestore Write | None | Audit Log | Claims `admin===true` |
| `/api/admin/competition-submissions`| POST | Yes | ADMIN | Moderation JSON / Max 100KB| 20 req/min| 10s | Mandatory | Firestore Write | Public Media | Audit Log | Claims `admin===true` |
| `/api/admin/notifications` | POST | Yes | ADMIN | Broadcast JSON / Max 100KB| 5 req/min | 15s | Mandatory | Firestore Read | Push Tokens | Audit Log | Claims `admin===true` |
| `/api/admin/prime/grant` | POST | Yes | ADMIN | User ID JSON / Max 50KB | 10 req/min | 10s | Mandatory | Firestore Write | User Entitlement| Audit Log | Claims `admin===true` |
| `/api/prime/razorpay/create-order`| POST | Yes | SHOPPER | Plan JSON / Max 50KB | 5 req/min | 10s | Mandatory | Firestore Read/Write | Subscription ID | Audit Log | Server entitlement |
| `/api/prime/razorpay/verify-payment`| POST | Yes | SHOPPER | Payment Signature / Max 50KB| 5 req/min | 10s | Mandatory | Firestore Write | Subscription ID | Audit Log | HMAC Signature Check |
| `/api/proxy-image` | GET | No | PUBLIC | URL Param / Max 50KB | 120 req/min| 5s | No | None | No | Minimal | SSRF Host Verification|
| `/api/try-on/analyze` | POST | Yes | SHOPPER | Image JSON / Max 5MB | 20 req/min | 15s | No | None | Private Media | Audit Log | Input Limit |
| `/api/webhooks/partner-fulfillment`| POST | No (Webhook)| Server Auth | Dispatch JSON / Max 500KB| 30 req/min | 10s | Mandatory | Firestore Write | Tracking Info | Audit Log | Partner Signature |
| `/api/webhooks/razorpay-prime`| POST | No (Webhook)| Server HMAC | Event JSON / Max 500KB | 30 req/min | 10s | Mandatory | Firestore Write | Payment Status | Audit Log | Razorpay HMAC Check |
| `/api/blog/generate` | POST | Yes | ADMIN | Topic JSON / Max 50KB | 5 req/min | 30s | Mandatory | Firestore Write | None | Audit Log | Claims `admin===true` |

---

## 2. SECURITY INTEGRITY VERIFICATION SUMMARY

Every endpoint listed above enforces:
1. **Explicit Authentication & Custom Claim Verification** where required.
2. **Hard Input Length & Payload Limits** defined in `inputLimits.ts`.
3. **Server-Side Idempotency** for order, payment, fulfillment, and return state transitions.
4. **Zero Client Manipulation** of server-authoritative fields.

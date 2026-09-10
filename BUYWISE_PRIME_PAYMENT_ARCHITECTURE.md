# BuyWise Prime Payment Architecture & Entitlement Specification

**Phase 9.7 Architecture Specification**

---

## 1. Authoritative Server Entitlement Model
BuyWise Prime uses Firestore `prime_entitlements/{userId}` as the single server source of truth:
- `plan`: `'FREE' | 'PRIME_MONTHLY' | 'PRIME_YEARLY'`
- `status`: `'ACTIVE' | 'PENDING' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED' | 'REFUNDED' | 'SUSPENDED'`
- `source`: `'NONE' | 'RAZORPAY_WEB' | 'GOOGLE_PLAY' | 'GOOGLE_ALTERNATIVE_BILLING' | 'ADMIN_GRANT' | 'SANDBOX'`

## 2. Provider Abstractions
- **Razorpay Web Adapter** (`razorpayPrimeAdapter.ts`):
  - Server-side HMAC SHA-256 webhook verification.
  - Recalculates expected price from authoritative plan config (`AUTHORITATIVE_PRIME_PLANS`).
- **Google Play Adapter** (`googlePlayPrimeAdapter.ts`):
  - Verifies purchase tokens server-side for Android purchases (`buywise_prime_monthly`, `buywise_prime_yearly`).
- **Sandbox Adapter** (`sandboxPrimeAdapter.ts`):
  - Controlled E2E test adapter for dev environment without live financial transaction requirements.

## 3. Idempotency & Security
- Webhook events are checked against Firestore `prime_payment_events/{eventId}` to prevent double activations or double extensions.
- Client requests cannot manipulate plan entitlement (`plan=PRIME` in POST body rejected without signature & amount match).
- Payment secrets (`RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`) remain strictly server-side.

## 4. Kill Switch & Disclosure
- Kill Switch: `PRIME_PAYMENTS_ENABLED=false` enforces sandbox testing.
- Mandatory Disclosure: `REAL CUSTOMER PAYMENT PROCESSING IS NOT LIVE`.

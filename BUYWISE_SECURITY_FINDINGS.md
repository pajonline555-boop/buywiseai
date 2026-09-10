# BUYWISE AI — SECURITY HARDENING REPORTS SUMMARY

**PROJECT**: BuyWise AI — *Shop Smarter. Buy Better.*  
**CANONICAL WEB**: https://buywiseai.pajonline.co.in  
**ANDROID PACKAGE**: com.pajonline.buywiseai  

---

## 1. SSTI DEFENSE REPORT (`SECURITY_SSTI_TEST_REPORT.md`)
- **Status**: 🟢 **VERIFIED SAFE & HARDENED**
- **Findings**: Source code audit confirmed zero usage of `eval()`, `Function()`, or unsafe template string compilation.
- **Safeguard**: `sanitizeTextContent()` neutralizes dynamic JavaScript template interpolation tokens (`${...}`) and HTML tags, guaranteeing user content remains inert data when rendered.

---

## 2. REDOS DEFENSE REPORT (`SECURITY_REDOS_TEST_REPORT.md`)
- **Status**: 🟢 **VERIFIED SAFE & HARDENED**
- **Findings**: Evaluated all regular expressions in authentication, product search, email validation, and coupon processing.
- **Safeguard**: `isSafeEmail()` utilizes a simplified non-backtracking regular expression and enforces pre-validation string length caps (max 254 chars), eliminating exponential backtracking vulnerabilities.

---

## 3. INPUT BOUNDS REPORT (`SECURITY_INPUT_LIMITS.md`)
- **Status**: 🟢 **VERIFIED SAFE & HARDENED**
- **Input Boundaries**:
  - Passwords: Max 128 characters (oversized passwords safely rejected prior to hashing/comparison).
  - Search Queries: Max 200 characters.
  - Chat Prompts: Max 2,000 characters.
  - Product URLs: Max 2,048 characters.
  - API JSON Payloads: Max 5MB.

---

## 4. DATABASE INJECTION REPORT (`SECURITY_DATABASE_INJECTION_REPORT.md`)
- **Status**: 🟢 **VERIFIED SAFE & HARDENED**
- **Findings**: Firestore query structures audited. Client payloads stripped of forbidden server-authoritative fields (`admin`, `role`, `paymentStatus`, `orderStatus`, `fulfillmentStatus`, `refundStatus`, `primeSubscriber`).

---

## 5. CLIPBOARD & PASTEJACKING REPORT (`SECURITY_CLIPBOARD_AND_CONTENT_REPORT.md`)
- **Status**: 🟢 **VERIFIED SAFE & HARDENED**
- **Findings**: Copy actions in store, coupons, and partner portal strictly utilize standard `navigator.clipboard.writeText()`. Zero hidden script manipulation or clipboard hijacking logic present.

---

## 6. AUTH REPLAY REPORT (`SECURITY_AUTH_REPLAY_REPORT.md`)
- **Status**: 🟢 **VERIFIED SAFE & HARDENED**
- **Findings**: Replay guards implemented across payment webhooks, partner fulfillment dispatch, and checkout operations via server-side state machines and idempotency keys.

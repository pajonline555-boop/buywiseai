# BUYWISE AI — PAYMENT & PARTNER SECURITY REGRESSION REPORT

**PROJECT**: BuyWise AI — *Shop Smarter. Buy Better.*  
**CANONICAL WEB**: https://buywiseai.pajonline.co.in  
**ANDROID PACKAGE**: com.pajonline.buywiseai  

---

## 1. PAYMENT SECURITY REGRESSION SUMMARY

| Payment Adversarial Scenario | Vector Tested | Server Safeguard | Status Code | Test Result |
|---|---|---|---|---|
| Webhook Event Replay | Replayed `evt_test_123` | Server event idempotency store | 200 (Ignored Duplicate) | 🟢 PASSED (`PAYMENT-001`) |
| Forged Webhook Signature | Invalid HMAC header | SHA-256 Signature verification | 400 Bad Request | 🟢 PASSED (`PAYMENT-001`) |
| Amount Mismatch Attack | Client sends ₹1 for ₹5,000 item | Server catalog price recalculation | 400 Bad Request | 🟢 PASSED (`PAYMENT-002`) |
| Double Verification Request | Two verify API calls | Atomic status transition check | 200 (State Retained) | 🟢 PASSED (`PAYMENT-002`) |

---

## 2. PARTNER FULFILLMENT REGRESSION SUMMARY

| Partner Adversarial Scenario | Vector Tested | Server Safeguard | Status Code | Test Result |
|---|---|---|---|---|
| Cross-Partner Dispatch | Partner A dispatches Partner B order | Partner ID match check | 403 Forbidden | 🟢 PASSED (`PARTNER-001`) |
| Uninspected Return Restock | Restock item without inspection | Restock inspection gate | 400 Bad Request | 🟢 PASSED (`PARTNER-002`) |
| Forged Dispatch Callback | Unsigned partner tracking update | Webhook secret verification | 401 Unauthorized | 🟢 PASSED (`PARTNER-001`) |

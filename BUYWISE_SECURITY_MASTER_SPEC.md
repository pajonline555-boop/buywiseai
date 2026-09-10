# BUYWISE AI — SECURITY MASTER SPECIFICATION

**PROJECT**: BuyWise AI — *Shop Smarter. Buy Better.*  
**CANONICAL WEB**: https://buywiseai.pajonline.co.in  
**ANDROID PACKAGE**: com.pajonline.buywiseai  

---

## 1. EXECUTIVE DEFENSIVE ARCHITECTURE SUMMARY

BuyWise AI Phase 10 establishes a defense-in-depth security framework engineered to harden all application layers—web frontend, server API routes, database integrations, payment workflows, partner fulfillment, and Android client apps—against attack vectors identified in security analysis documents (including Server-Side Template Injection, Regular Expression Denial of Service, Long Password DoS, Secret Leakage, Database Injection, Pastejacking, and Auth Replay).

---

## 2. CORE SECURITY PRINCIPLES & GOVERNANCE

1. **User Input Remains Inert Data**: All incoming payload data (prompts, coupon codes, titles, URLs) is strictly sanitized and bound by explicit size limits before processing. Dynamic code execution (`eval`, `new Function`) is prohibited.
2. **Server-Authoritative Identity & State**: Critical authorization fields (`admin`, `role`, `paymentStatus`, `orderStatus`, `fulfillmentStatus`, `refundStatus`, `primeSubscriber`, `availableStock`) can ONLY be computed and updated by server runtime code evaluating authenticated Firebase token claims.
3. **Decoupled Abuse Protection**: Rate limiting and anti-abuse safeguards operate centrally via `abuseProtection.ts` tracking IP, user UID, and endpoint parameters without relying on intrusive tracking.
4. **Secret Isolation**: All private keys, service account credentials, payment secrets, and AI provider tokens reside strictly within server environment variables. Zero private credentials leak to client JS bundles or Android APK assets.
5. **Continuous Audit & Telemetry**: Every authorization denial, rate limit trigger, and administrative action is logged to `security_audit_logs` and accessible via the `/admin/security` dashboard.

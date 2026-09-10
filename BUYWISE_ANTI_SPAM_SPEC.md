# BUYWISE AI — ANTI-SPAM & RATE LIMITING SPECIFICATION

**PROJECT**: BuyWise AI — *Shop Smarter. Buy Better.*  
**CANONICAL WEB**: https://buywiseai.pajonline.co.in  
**ANDROID PACKAGE**: com.pajonline.buywiseai  

---

## 1. CENTRALIZED ABUSE PROTECTION ENGINE (`abuseProtection.ts`)

The anti-spam architecture operates centrally to prevent endpoint flooding, automated script abuse, and resource exhaustion without breaking normal browsing.

### Rate Limit Configuration Matrix

| Endpoint Group | Max Requests | Time Window | Penalty / Cooldown | Identifier Key |
|---|---|---|---|---|
| User Authentication (`/login`, `/signup`) | 5 reqs | 60 seconds | 5-minute block | IP + Email |
| Search & Comparison (`/api/compare`) | 60 reqs | 60 seconds | Throttled (429) | IP |
| AI Shopping Assistant (`/api/chat`) | 30 reqs | 60 seconds | Throttled (429) | UID / IP |
| Virtual Try-On Room (`/api/vto`, `/api/try-on`)| Budget Cap | Monthly/Daily | Quota Error | UID + Governor |
| Order Checkout & Payment (`/api/checkout`) | 10 reqs | 60 seconds | Throttled (429) | UID |
| Partner Fulfillment Dispatch (`/api/fulfillment`)| 20 reqs | 60 seconds | Throttled (429) | Partner ID |
| Admin Broadcast (`/api/admin/notifications`) | 5 reqs | 60 seconds | Throttled (429) | Admin UID |

---

## 2. PROGRESSIVE PENALTY & COOLDOWN LEVELS

- **Level 0 (Normal User)**: Request count within standard rate limits.
- **Level 1 (Rate Limit Exceeded)**: HTTP 429 Too Many Requests response returned with `Retry-After` header.
- **Level 2 (Burst Flooding)**: If request count exceeds 2x the limit within window, temporary 5-minute cooldown block is activated.
- **Level 3 (Suspicious Abuse)**: Security event logged to `security_audit_logs` for administrative telemetry review.

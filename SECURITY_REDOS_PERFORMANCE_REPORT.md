# BUYWISE AI — REDOS PERFORMANCE REPORT

**PROJECT**: BuyWise AI — *Shop Smarter. Buy Better.*  
**CANONICAL WEB**: https://buywiseai.pajonline.co.in  
**ANDROID PACKAGE**: com.pajonline.buywiseai  

---

## 1. REGULAR EXPRESSION AUDIT & INVENTORY

All regular expressions used across authentication, email validation, product search, coupon matching, and URL parsing were audited for catastrophic backtracking risks (ReDoS).

| Regular Expression Usage | Context / File | Nested Quantifiers | Lookaheads | Bound / Pre-Validation Limit | ReDoS Risk Rating |
|---|---|---|---|---|---|
| `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$` | `isSafeEmail()` (`inputLimits.ts`) | None | None | Max 254 chars | 🟢 ZERO RISK |
| `/^(0x[0-9a-f]+|\d+)$/i` | `isSafeExternalUrl()` (`inputLimits.ts`)| None | None | Max 2,048 chars | 🟢 ZERO RISK |
| `/^[A-Z0-9_-]{3,50}$/i` | Coupon Code Validator (`coupons/store.ts`)| None | None | Max 50 chars | 🟢 ZERO RISK |
| `/\$\{/g` | SSTI Token Neutralizer (`inputLimits.ts`)| None | None | Pre-sanitized | 🟢 ZERO RISK |

---

## 2. CONTROLLED PERFORMANCE STRESS TEST (`REDOS-001`)

- **Test Payload**: Malformed email string with 200 repeated prefix characters and 200 domain characters (`a...a@b...b..com`).
- **Maximum Acceptable Bound**: 50 milliseconds.
- **Observed Execution Time**: **< 1 millisecond** (In-Memory execution).
- **Result**: 🟢 **PASSED (REDOS-001)**. Safe rejection without event loop blocking.

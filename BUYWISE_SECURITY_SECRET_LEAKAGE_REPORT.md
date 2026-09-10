# BUYWISE AI — SECRET LEAKAGE & ENVIRONMENT VARIABLE SECURITY AUDIT

**PROJECT**: BuyWise AI — *Shop Smarter. Buy Better.*  
**CANONICAL WEB**: https://buywiseai.pajonline.co.in  
**ANDROID PACKAGE**: com.pajonline.buywiseai  

---

## 1. ENVIRONMENT VARIABLE & BUNDLE AUDIT SUMMARY

| Secret / Environment Variable | Storage Location | Exposed to Client JS? | Exposed to Android APK? | Security Status |
|---|---|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Client Config | Yes (Public Firebase) | Yes (google-services.json) | 🟢 SAFE (Restricted by Firebase Rules) |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Client Config | Yes (Public Domain) | Yes (Domain Config) | 🟢 SAFE (Public domain identifier) |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Client Config | Yes (Public Project ID)| Yes (Project ID) | 🟢 SAFE (Public project identifier) |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Server Environment | ❌ No | ❌ No | 🟢 SECURE (Strict Server Runtime) |
| `RAZORPAY_KEY_SECRET` | Server Environment | ❌ No | ❌ No | 🟢 SECURE (Strict Server Runtime) |
| `CASHFREE_SECRET_KEY` | Server Environment | ❌ No | ❌ No | 🟢 SECURE (Strict Server Runtime) |
| `OPENAI_API_KEY` | Server Environment | ❌ No | ❌ No | 🟢 SECURE (Strict Server Runtime) |
| `HUGGINGFACE_TOKEN` | Server Environment | ❌ No | ❌ No | 🟢 SECURE (Strict Server Runtime) |
| `CRON_SECRET` | Server Environment | ❌ No | ❌ No | 🟢 SECURE (Strict Server Runtime) |
| `PARTNER_API_SECRETS` | Server Environment | ❌ No | ❌ No | 🟢 SECURE (Strict Server Runtime) |

---

## 2. AUDIT VERIFICATION RULES

1. **Client Prefix Enforcement**: Only variables explicitly prefixed with `NEXT_PUBLIC_` are included in the Next.js browser bundle. Private backend API keys strictly lack `NEXT_PUBLIC_` prefix.
2. **Android Package Security**: The Android APK contains no private backend API keys, database credentials, or payment secrets. All payment verification and entitlement checks execute via server API calls.
3. **Log Masking**: System logs and security audit entries automatically redact authorization tokens, passwords, credit card numbers, and secret parameters.

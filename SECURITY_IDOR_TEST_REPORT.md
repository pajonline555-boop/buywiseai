# BUYWISE AI — IDOR ADVERSARIAL TEST REPORT

**PROJECT**: BuyWise AI — *Shop Smarter. Buy Better.*  
**CANONICAL WEB**: https://buywiseai.pajonline.co.in  
**ANDROID PACKAGE**: com.pajonline.buywiseai  

---

## 1. IDOR ADVERSARIAL ISOLATION MATRIX

Cross-user access control was tested using two controlled test users (`USER_A` and `USER_B`) and two partner merchant accounts (`PARTNER_A` and `PARTNER_B`).

| Adversarial Access Attempt | Request Context | Server Ownership Function | Target Resource Owner | Expected Status | Observed Result | Status |
|---|---|---|---|---|---|---|
| `USER_A` -> `USER_A` Order History | Authenticated | `verifyResourceOwnership()` | `USER_A` | ALLOWED | 200 OK | 🟢 PASS (`IDOR-001`) |
| `USER_A` -> `USER_B` Order History | Authenticated | `verifyResourceOwnership()` | `USER_B` | DENIED | 403 FORBIDDEN | 🟢 PASS (`IDOR-002`) |
| `USER_A` -> `USER_B` Private VTO Media | Authenticated | `verifyResourceOwnership()` | `USER_B` | DENIED | 403 FORBIDDEN | 🟢 PASS (`IDOR-003`) |
| `USER_A` -> `USER_B` Address Snapshot | Authenticated | `verifyResourceOwnership()` | `USER_B` | DENIED | 403 FORBIDDEN | 🟢 PASS (`IDOR-002`) |
| `PARTNER_A` -> `PARTNER_B` Dispatch | Authenticated | `verifyResourceOwnership()` | `PARTNER_B` | DENIED | 403 FORBIDDEN | 🟢 PASS (`PARTNER-001`) |
| `USER_A` -> `/admin` Dashboard | Authenticated | `authorizeRequest()` | Admin Only | DENIED | 403 FORBIDDEN | 🟢 PASS (`AUTH-002`) |

---

## 2. PRIVILEGE ELEVATION MITIGATION SUMMARY

1. **Client Field Tampering**: Direct client attempts to inject `userId`, `ownerId`, `admin=true`, or `role="ADMIN"` are automatically stripped by `sanitizeClientPayload()`.
2. **Server Identity**: Resource ownership is verified by matching the authenticated Firebase Token UID (`userToken.uid`) against the stored resource `userId`.

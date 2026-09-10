# BUYWISE AI — AUTHORIZATION MATRIX & ACCESS CONTROL SPECIFICATION

**PROJECT**: BuyWise AI — *Shop Smarter. Buy Better.*  
**CANONICAL WEB**: https://buywiseai.pajonline.co.in  
**ANDROID PACKAGE**: com.pajonline.buywiseai  

---

## 1. ROLE DEFINITIONS

1. **PUBLIC / GUEST**: Unauthenticated visitor browsing public store pages, AI blogs, Knowledge Hub, product catalog, and competitor comparison features.
2. **AUTHENTICATED USER (SHOPPER)**: Registered user verified via Firebase Auth. Access to personal cart, order history, VTO Try-On room, price alerts, profile, and competition submissions.
3. **PRIME USER**: Authenticated user with verified active Prime membership subscription (`primeSubscriber=true`). Access to Prime deals and enhanced VTO allowances.
4. **PARTNER MERCHANT**: Verified partner merchant (`role="PARTNER"` or `partnerId` assigned). Access to Partner Portal (`/partner-portal`), product inventory catalog, order fulfillment dispatch, and return inspections.
5. **ADMINISTRATOR**: Server-verified administrator (`pajonline555@gmail.com` with custom claim `admin=true` or `role="ADMIN"`). Full access to Admin Command Center (`/admin`), Security Logs, Competition Manager, Merchandising, and Global Settings.

---

## 2. ENDPOINT & RESOURCE ACCESS CONTROL MATRIX

| Endpoint / Feature | PUBLIC | AUTHENTICATED | PRIME | PARTNER | ADMIN | Server Rule |
|---|---|---|---|---|---|---|
| Product Search & Browse | ✅ Read | ✅ Read | ✅ Read | ✅ Read | ✅ Read | Unrestricted |
| SmartCompare & Price Alerts | ✅ Read | ✅ Read/Write | ✅ Read/Write | ✅ Read | ✅ Read | Owner check on alerts |
| VTO Try-On Room | ❌ Denied | ✅ Allowed | ✅ Enhanced | ❌ Denied | ✅ Allowed | Monthly VTO budget governor |
| Private Try-On Media Gallery | ❌ Denied | ✅ Own Only | ✅ Own Only | ❌ Denied | ✅ Audit Only | Strict IDOR UID match |
| Order Checkout (`/api/checkout`)| ❌ Denied | ✅ Allowed | ✅ Allowed | ❌ Denied | ✅ Allowed | Server amount & stock validation |
| Customer Order History | ❌ Denied | ✅ Own Only | ✅ Own Only | ❌ Denied | ✅ Full Access| Strict IDOR UID match |
| Partner Portal (`/partner-portal`)| ❌ Denied | ❌ Denied | ❌ Denied | ✅ Own Orders | ✅ Full Access| Partner ID match required |
| Order Dispatch (`/api/fulfillment`)| ❌ Denied | ❌ Denied | ❌ Denied | ✅ Assigned | ✅ Full Access| Partner authorization check |
| Return Inspection Gate | ❌ Denied | ❌ Denied | ❌ Denied | ✅ Assigned | ✅ Full Access| Restock condition validation |
| Admin Center (`/admin`) | ❌ Denied | ❌ Denied | ❌ Denied | ❌ Denied | ✅ Allowed | Firebase Custom Claim `admin===true` |
| Security Logs (`/admin/security`)| ❌ Denied | ❌ Denied | ❌ Denied | ❌ Denied | ✅ Allowed | Firebase Custom Claim `admin===true` |
| Merchandising Workspace | ❌ Denied | ❌ Denied | ❌ Denied | ❌ Denied | ✅ Allowed | Firebase Custom Claim `admin===true` |

---

## 3. IDOR & PRIVILEGE ESCALATION SAFEGUARDS

1. **Custom Claim Verification**: Email identity alone (`pajonline555@gmail.com`) does NOT authorize admin rights. Server requires cryptographic Firebase token with `claims.admin === true`.
2. **Server Authoritative State**: Client requests cannot directly modify `role`, `admin`, `paymentStatus`, `orderStatus`, `refundStatus`, or `primeSubscriber`.
3. **Audit Logging**: Any authorization failure or privilege escalation attempt triggers immediate write to `security_audit_logs`.

# BUYWISE AI — SSRF DEEP SECURITY VALIDATION REPORT

**PROJECT**: BuyWise AI — *Shop Smarter. Buy Better.*  
**CANONICAL WEB**: https://buywiseai.pajonline.co.in  
**ANDROID PACKAGE**: com.pajonline.buywiseai  

---

## 1. SSRF PROTECTION ENGINE OVERVIEW (`inputLimits.ts`)

BuyWise AI accepts retailer product URLs (`/api/scrape-product`) and proxy image requests (`/api/proxy-image`). To prevent Server-Side Request Forgery (SSRF) against internal microservices, cloud metadata endpoints, and local loopbacks, `isSafeExternalUrl()` enforces multi-layered destination validation.

---

## 2. AUDITED DESTINATION TYPES & DEFENSIVE RESULTS

| Target Destination / Vector | Example Input Payload | Engine Behavior | Verification Result |
|---|---|---|---|
| AWS / GCP / Azure Cloud Metadata | `http://169.254.169.254/latest/meta-data/` | Blocked & Logged | 🟢 PASSED (`SSRF-001`) |
| Google Cloud Internal Metadata | `http://metadata.google.internal/` | Blocked & Logged | 🟢 PASSED (`SSRF-001`) |
| IPv4 Loopback | `http://127.0.0.1:8080/admin` | Blocked & Logged | 🟢 PASSED (`SSRF-001`) |
| IPv6 Loopback | `http://[::1]:3000/api` | Blocked & Logged | 🟢 PASSED (`SSRF-002`) |
| Private IPv4 CIDR (10.x.x.x) | `http://10.0.0.1/internal-db` | Blocked & Logged | 🟢 PASSED (`SSRF-002`) |
| Private IPv4 CIDR (192.168.x.x) | `http://192.168.1.1/router` | Blocked & Logged | 🟢 PASSED (`SSRF-002`) |
| Private IPv4 CIDR (172.16.x.x) | `http://172.16.0.5/service` | Blocked & Logged | 🟢 PASSED (`SSRF-002`) |
| Decimal Encoded IP (127.0.0.1) | `http://2130706433/` | Blocked & Logged | 🟢 PASSED (`SSRF-003`) |
| Hexadecimal Encoded IP | `http://0x7f000001/` | Blocked & Logged | 🟢 PASSED (`SSRF-003`) |
| Allowed CDN (Unsplash / Amazon) | `https://images.unsplash.com/photo-1512...` | Allowed | 🟢 PASSED |

---

## 3. REDIRECT & PROTOCOL VALIDATION RULES

1. **Protocol Restriction**: Only `http:` and `https:` schemes are accepted. File schemes (`file://`), `gopher://`, `dict://`, and `ftp://` are immediately rejected.
2. **Domain Allowlisting**: High-risk proxy endpoints restrict outbound HTTP fetching to verified domain suffix allowlists (Amazon, Flipkart, Myntra, Meesho, Unsplash).

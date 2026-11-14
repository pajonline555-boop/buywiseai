# BUYWISE AI — RETAILER CREDENTIALS & INTEGRATION CHECKLIST
**Platform Onboarding, API Requirements & Manual Approval Steps**  
**Date**: October 2026  
**Auditor**: Google Antigravity Advanced Agentic Coding Engine  

---

## 1. Retailer Integration Overview

To provide live, automated price verification across India's top online shopping platforms, BuyWise AI requires specific API credentials, affiliate account approvals, or data partnerships. 

Below is the verified status and step-by-step checklist for each supported retailer.

---

## 2. Platform-by-Platform Credentials Checklist

### 1. Amazon India (Amazon.in)
- **Integration Path**: **Amazon Creators API** (Replaced deprecated PA-API 5.0).
- **Current Status in BuyWise AI**: 
  - Associate Tag `pajonline-21` is active and configured.
  - API Credentials (`AMAZON_CREATORS_CLIENT_ID` / `AMAZON_CREATORS_SECRET`) are unconfigured.
  - **Honest Fallback**: BuyWise AI generates compliant direct search links (`https://www.amazon.in/s?k=...&tag=pajonline-21`) without claiming unverified live API data.
- **Prerequisites for Live API Access**:
  1. Active Amazon Associates India Account.
  2. **10 Qualifying Sales within 30 consecutive days** via the Associate Tag.
  3. Amazon Creators Program enrollment & approval.
  4. Application registration on the Amazon Developer Console to obtain OAuth credentials.
- **Action Steps**:
  - [ ] Maintain consistent affiliate traffic via `tag=pajonline-21` until 10 qualifying sales threshold is reached.
  - [ ] Log in to [Amazon Associates Central India](https://affiliate-program.amazon.in/).
  - [ ] Navigate to *Tools -> Creators API* (or Developer Central) and register BuyWise AI.
  - [ ] Add `AMAZON_CREATORS_CLIENT_ID` and `AMAZON_CREATORS_CLIENT_SECRET` to server `.env`.

---

### 2. Flipkart (Flipkart.com)
- **Integration Path**: **Flipkart Affiliate API 1.0** (`/affiliate/1.0/search.json` and product feeds).
- **Current Status in BuyWise AI**:
  - Affiliate ID `pajonline` is configured for mobile deep-links and tracking URLs.
  - API Token (`FLIPKART_AFFILIATE_TOKEN`) is unconfigured.
  - **Honest Fallback**: BuyWise AI generates compliant deep links (`https://www.flipkart.com/search?q=...&affid=pajonline`) labeled as search links.
- **Prerequisites for Live API Access**:
  1. Approved Flipkart Affiliate Account.
  2. Generated Affiliate API Token in Flipkart Affiliate Portal.
- **Action Steps**:
  - [ ] Log in to the [Flipkart Affiliate Portal](https://affiliate.flipkart.com/).
  - [ ] Navigate to *API -> Generate Token*.
  - [ ] Add `FLIPKART_AFFILIATE_ID` and `FLIPKART_AFFILIATE_TOKEN` to server `.env`.
  - [ ] Set `FLIPKART_API_ENABLED=true` in `web/.env.local`.

---

### 3. Meesho (Meesho.com)
- **Integration Path**: **Direct Search Link Redirection** (`https://www.meesho.com/search?q=...`).
- **Current Status in BuyWise AI**:
  - Fully integrated as an honest, clearly labeled search-link fallback.
  - Returns `verificationStatus: 'unverified'` and `isSearchLinkOnly: true`.
  - Zero synthetic prices invented.
- **Prerequisites & Legal Constraints**:
  1. Meesho does not provide a public developer search API or affiliate product feed.
  2. Automated headless browser scraping of Meesho consumer endpoints is strictly prohibited by terms of service and subject to automated blocking.
  3. If Meesho launches an authorized affiliate/reseller API or partnership, BuyWise AI's `MeeshoAdapter` is structured to consume it immediately.
- **Action Steps**:
  - [x] Maintain transparent `isSearchLinkOnly: true` status.
  - [ ] Periodically monitor Meesho Seller / Affiliate announcements for authorized developer programs.

---

### 4. Myntra & Fashion Retailers (AJIO, Tata CLiQ)
- **Integration Path**: **Affiliate Aggregator Networks** (CueLinks, Admitad, or vCommission).
- **Current Status in BuyWise AI**:
  - Outbound links use standard affiliate redirection with context tracking.
- **Prerequisites for Live API Feeds**:
  1. Active publisher account on CueLinks or Admitad.
  2. Approved merchant campaign for Myntra, AJIO, and Nykaa.
  3. API access key for product catalog feeds.
- **Action Steps**:
  - [ ] Apply for fashion retailer campaigns via CueLinks / Admitad.
  - [ ] Configure `CUELINKS_API_KEY` or `ADMITAD_API_KEY` for automated fashion price indexing.

---

## 3. Environment Variables Reference Table

| Variable Name | Required By | Status in BuyWise AI | Description / Purpose |
| :--- | :--- | :--- | :--- |
| `AMAZON_ASSOCIATE_TAG` | Amazon Adapter | **Configured** (`pajonline-21`) | Associate tracking tag appended to all outbound Amazon links. |
| `AMAZON_CREATORS_CLIENT_ID` | Amazon Adapter | *Pending Account Eligibility* | OAuth Client ID for the Amazon Creators API. |
| `AMAZON_CREATORS_SECRET` | Amazon Adapter | *Pending Account Eligibility* | OAuth Secret for the Amazon Creators API. |
| `FLIPKART_AFFILIATE_ID` | Flipkart Adapter | **Configured** (`pajonline`) | Flipkart affiliate identifier for link building. |
| `FLIPKART_AFFILIATE_TOKEN` | Flipkart Adapter | *Pending Manual Generation* | Bearer token for Flipkart Affiliate API 1.0 search queries. |
| `NEXT_PUBLIC_APP_URL` | Web / Auth | **Configured** | Base domain for canonical link generation and callbacks. |
| `PARTNER_STORE_ENABLED` | BuyWise Store | **Configured** (`true`) | Enables direct merchant inventory search and 100% verified checkout. |

---

## 4. Operational Best Practices

1. **Never Mark Search Links as Verified Live**:
   If an adapter produces a redirect link or category search link without real-time price verification, it must remain `verificationStatus: 'unverified'` and `isSearchLinkOnly: true`.
2. **Preserve User Trust**:
   Never show a retailer offer as cheaper than another store unless the exact brand, model, and variant match. Different fabrics or pack quantities must be displayed under **Best Matches**, never **Same Product Comparison**.
3. **Graceful Partial Results**:
   When any retailer API returns a network timeout or credential error, return partial results from remaining retailers without interrupting the user's search session.

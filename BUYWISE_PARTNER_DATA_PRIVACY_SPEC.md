# BuyWise AI — Partner Data Privacy Specification

**Version**: Phase 9.8  
**Compliance Framework**: India Digital Personal Data Protection (DPDP) Act 2023 & DPDP Rules 2025  

---

## 1. Immutable Shipping Snapshot

- At checkout, an immutable snapshot (`shippingAddressSnapshot`) is created and bound to `partner_orders/{orderId}`.
- Updating a user's profile address later will **never** alter historical order destinations.

---

## 2. Minimal Data Transmission to Partners

Partners receive **only** operational fulfillment data:
- BuyWise Order Reference
- Partner SKU / Product ID
- Item Title & Quantity
- Recipient Name, Delivery Address, Phone Number
- Shipping Method & Return Policy Reference

Partners **NEVER** receive:
- Internal BuyWise authentication tokens
- Credit/Debit card numbers, CVVs, or payment provider credentials
- Razorpay secret keys
- Google OAuth credentials
- Customer browsing history or unrelated account data

---

## 3. Public Exposure Safeguards

Customer shipping details and phone numbers are strictly prohibited from appearing in:
- Public catalog product pages (`/store`, `/product/[slug]`)
- Dynamic XML sitemaps
- JSON-LD structured metadata
- Browser `localStorage` or public Firestore product collections
- Android APK static resources
- Production application console logs (redacted)

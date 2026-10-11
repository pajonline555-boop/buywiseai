# BUYWISE MAYA DATA ROUTING MATRIX

**PROJECT**: BuyWise AI  
**PHASE**: 11.2.1  
**DOCUMENT**: Data Routing Matrix & Live API Integration Specification  

---

## 1. DATA SOURCE ROUTING ARCHITECTURE

```
QUERY INPUT
     ↓
requiresLiveBackendData Flag Check
     ├── FALSE ➔ Return Static Authoritative KB Entry
     └── TRUE  ➔ Fetch Authenticated Live Backend API ➔ Merge with KB Answer
```

---

## 2. DETAILED ROUTING MATRIX

| Query Domain | Static KB Source | Live API / DB Endpoint |
| :--- | :--- | :--- |
| **Competition Rules** | `authoritativeFaqCatalog.ts` | — |
| **Active Competition Winner** | — | `/api/competition/active` (winnerName) |
| **Active Challenge Prize** | — | `/api/competition/active` (prizeAmount) |
| **SmartCompare Explanation** | `authoritativeFaqCatalog.ts` | — |
| **Live Product Price** | — | `/api/search` / Retailer APIs |
| **Order Tracking** | — | `/api/orders` (authenticated user session) |
| **Return Status** | — | `/api/orders/[id]/return` |
| **User Prime Entitlement** | — | `/api/user/prime` |
| **Verified Today Coupon** | — | `/api/coupons` |
| **VTO Photo Privacy** | `authoritativeFaqCatalog.ts` | — |

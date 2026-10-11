# BUYWISE MAYA LIVE DATA VS STATIC KNOWLEDGE POLICY

**PROJECT**: BuyWise AI  
**PHASE**: 11.2  
**DOCUMENT**: Live Data vs Static Knowledge Routing Policy  

---

## 1. ROUTING PRINCIPLE

Maya distinguishes between **Static Application Knowledge** (general rules, app features, privacy guides) and **Live Application Data** (real-time prices, competition live status, active leaderboards, user order tracking).

```
QUERY RECEIVED
     ↓
MayaKnowledgeService.classifyIntent()
     ↓
requiresLiveBackendData == true ?
     ├── YES ➔ Query Live DB / API ➔ Merge with KB Answer
     └── NO  ➔ Return Authoritative KB Answer
```

---

## 2. STATIC KNOWLEDGE DOMAINS
- What is SmartCompare?
- How does AI Virtual Try-On work?
- Are Try-On photos private?
- What is Shopping Trust Score?
- How to change application language?
- General competition rules and eligibility.

---

## 3. LIVE DATA DOMAINS
- Is competition currently live?
- Active challenge start/end dates and featured product.
- Current leaderboard rankings and declared winner.
- Exact product prices and live retailer stock.
- Order tracking status and return progress.
- Authenticated user Prime entitlement.

---

## 4. SAFE UNCONFIRMED FALLBACK
If live backend data is unreachable or unconfirmed, Maya responds with:
> *"Sorry, I don't have confirmed information about that yet. Please check the relevant BuyWise section or contact BuyWise support."*

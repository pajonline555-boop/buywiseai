# BUYWISE MAYA UNANSWERED QUESTION WORKFLOW

**PROJECT**: BuyWise AI  
**PHASE**: 11.2.1  
**DOCUMENT**: Unanswered Question Logging & Continuous Improvement Workflow  

---

## 1. WORKFLOW DIAGRAM

```
USER UNRECOGNIZED QUERY
     ↓
MayaKnowledgeService (Intent: UNKNOWN)
     ↓
Safe Fallback Returned to User
     ↓
Query Sanitized & Logged to MAYA_UNANSWERED_QUESTIONS Queue (No PII)
     ↓
Admin Knowledge Console (/admin/knowledge)
     ├── Admin Review & Draft FAQ
     ├── Category & Intent Assignment
     └── Publish Authoritative FAQ ➔ Added to Catalog
```

---

## 2. PII & PRIVACY RULES

- **Query Sanitization**: Queries are stripped of personal names, emails, order IDs, card numbers, and phone numbers before logging.
- **Sanitized Length Cap**: Maximum 200 characters stored per log entry.
- **Admin Review Queue**: Only authorized admins (`pajonline555@gmail.com`, `akshayman224@gmail.com`) can view and promote unanswered questions to authoritative FAQs.

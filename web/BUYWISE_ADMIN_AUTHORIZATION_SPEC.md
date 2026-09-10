# BUYWISE AI — ADMIN AUTHORIZATION SPECIFICATION

## Security Mandate
The email address `pajonline555@gmail.com` identifies the designated primary administrator account. **The email address string itself MUST NEVER grant admin access.**

Authorization is strictly enforced using **Firebase Authentication + Server-Side Firebase Custom Claims** (`admin: true`, `role: "ADMIN"`).

## Authorization Flow
```text
Client Request
      │
      ▼
Headers: Authorization: Bearer <ID_TOKEN>
      │
      ▼
Server API Route
      │
      ▼
requireAdmin(request)
      │
      ├─ 1. Verify Firebase ID Token
      ├─ 2. Inspect claims: (admin === true || role === "ADMIN")
      │
      ├── FALSE ➔ Return HTTP 403 Forbidden & Log Security Event
      │
      └── TRUE ➔ Execute Protected Admin Operation
```

## Security Audit Log Triggers
- `AUTHORIZATION_FAILURE`: Attempted access without valid token or custom claim.
- `ADMIN_LOGIN`: Successful server-authenticated admin session.
- `MEDIA_REVIEW`: Admin accessed user-submitted competition media.
- `ROLE_CHANGE` / `SUSPICIOUS_ACTIVITY`: Administrative mutations or notification dispatches.

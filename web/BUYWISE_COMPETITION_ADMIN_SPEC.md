# BUYWISE AI — COMPETITION ADMIN SPECIFICATION

## State Machine Workflow
The competition lifecycle strictly enforces legal state transitions:

```text
  DRAFT ➔ SCHEDULED ➔ LIVE ➔ SUBMISSION_CLOSED ➔ VOTING_LIVE ➔ VOTING_CLOSED ➔ UNDER_VERIFICATION ➔ WINNER_DECLARED ➔ ARCHIVED
    │         │        │           │                 │               │                  │
    └─────────┴────────┴───────────┴─────────────────┴───────────────┴──────────────────┴──➔ CANCELLED
```

## State Rules
1. **LIVE**: Submissions open; users can upload Try-Ons and voluntarily enter with dual consent.
2. **SUBMISSION_CLOSED**: Entry submissions locked; moderation finalized.
3. **VOTING_LIVE**: Public voting active; 1 vote per user/competition enforced server-side.
4. **VOTING_CLOSED**: Votes frozen; server fraud audit scan executes.
5. **UNDER_VERIFICATION**: Vote counts verified; tie-breaker algorithm evaluated.
6. **WINNER_DECLARED**: Winner officially assigned; Home Spotlight updated.

## Privacy Isolation Rule
Admins possess **zero access** to unsubmitted private user VTO galleries. Only media voluntarily submitted with explicit dual consent is accessible for moderation.

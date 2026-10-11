# BUYWISE MAYA CONVERSATION CONTEXT SPECIFICATION

**PROJECT**: BuyWise AI  
**PHASE**: 11.2.1  
**DOCUMENT**: Conversational Context & Multi-Turn Retention Specification  

---

## 1. CONTEXT RETENTION PRINCIPLE

To ensure natural conversation flow, Maya maintains a lightweight, short-lived `ConversationContext` object scoped strictly to the current chat session.

```typescript
export interface ConversationContext {
  lastIntent?: MayaIntent;
  lastCategory?: string;
  activeTopic?: string;
  lastUpdatedTimestamp?: number;
}
```

---

## 2. MULTI-TURN CONTEXT EXAMPLE

```
Turn 1:
User: "How do I enter the competition?"
Maya: Answers with 4-step challenge guide.
Context Updated: { lastIntent: 'COMPETITION_GENERAL', lastCategory: 'COMPETITION' }

Turn 2:
User: "What photo should I upload?"
Maya Evaluator: Query contains "photo", active context category is 'COMPETITION'.
Evaluated Intent: COMPETITION_SUBMISSION (retains competition photo context!)
Maya Answer: Answers with specific competition photo submission requirements.
```

---

## 3. PRIVACY & SAFETY BOUNDS

- **Short-Lived**: Context is maintained in component/session state and automatically expires after inactivity.
- **Zero Sensitive Data**: PII, credit card details, passwords, or authentication tokens are NEVER stored in context.
- **Explicit Reset**: Users can clear context by starting a new conversation.

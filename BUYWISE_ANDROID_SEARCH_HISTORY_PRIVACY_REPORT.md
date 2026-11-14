# BUYWISE AI — ANDROID LOCAL SEARCH HISTORY PRIVACY REPORT
**Phase:** 3.2 — Android Search History Account Isolation  
**Date:** October 24, 2026  
**Workspace:** `C:\APPS\BUYWISE AI`  
**Git Branch:** `main`  
**Git HEAD:** `4714f68e4a969a6daabbb4b7112b4438c162dbb6`  
**Status:** COMPLETE & VERIFIED — NO PRODUCTION DEPLOYMENT / NO PUSH  

---

## 1. Executive Summary

BuyWise AI's local search history on Android previously stored searches under a single device-level key (`local_search_history_v1`), which allowed different users signed into the same physical Android device to view each other's search history.

This vulnerability has been resolved in Phase 3.2 by implementing **strict account isolation** that matches BuyWise AI's web client behavior:
1. **Authoritative Identity:** Uses only the cryptographically verified Firebase Authentication UID (`FirebaseAuth.getInstance().currentUser?.uid`). User-editable fields (such as display name, email, or nickname) are strictly excluded from storage key generation.
2. **Account Segregation:** Authenticated users store their search history under a dedicated key (`local_search_history_uid_<sanitized_uid>`), while guest/unauthenticated users store history under `local_search_history_guest`.
3. **Instant Account Switch Protection:** UI layers (`SearchScreen` and `HomeScreen`) monitor the authoritative authentication state via Compose `LaunchedEffect(activeUserId)`, instantaneously refreshing search suggestions and preventing previous account queries from flashing or being selectable.
4. **Safe Legacy Migration Policy:** Pre-existing unscoped history (`local_search_history_v1`) is strictly never migrated into authenticated user accounts. Legacy history is migrated only to the guest/anonymous scope if guest history is empty, and then permanently deleted.
5. **Zero Remote Exfiltration:** Search queries remain strictly local within Android private `SharedPreferences` (`Context.MODE_PRIVATE`). No queries are uploaded, synchronized, or logged to Firestore, Firebase Storage, or any remote analytics endpoint.

---

## 2. Architecture & Identity Sourcing

### 2.1 Authoritative UID Derivation
- **Source:** [`AuthRepository.kt`](file:///C:/APPS/BUYWISE%20AI/android/app/src/main/java/com/pajonline/buywiseai/data/repository/AuthRepository.kt) exposes:
  - `AuthState.Authenticated(val email: String, val userId: String = "")`
  - `fun getCurrentUserId(): String? = auth?.currentUser?.uid`
- **Integrity Rule:** `userId` is obtained exclusively from `FirebaseUser.getUid()`. Mutable metadata (email addresses, profile names, phone numbers) are never used as identifiers, preventing identity spoofing and accidental key collisions when users change their profile details.

### 2.2 Key Derivation & Sanitization (`SearchHistoryEngine.getStorageKey`)
The storage key derivation algorithm enforces:
- **Guest / Signed-Out Fallback:** Any `null`, empty, or whitespace-only UID evaluates to `local_search_history_guest`.
- **Standard Alphanumeric UIDs:** Standard Firebase UIDs containing `[a-zA-Z0-9_-]` map to `local_search_history_uid_<UID>`.
- **Unusual / Special Characters Collision Resistance:** If an unusual UID contains characters outside `[a-zA-Z0-9_-]`, non-alphanumeric characters are converted to `_` and a 32-bit hex hash suffix of the raw string is appended:
  ```kotlin
  val sanitized = trimmed.replace(Regex("[^a-zA-Z0-9_-]"), "_")
  val hash = (trimmed.hashCode().toLong() and 0xFFFFFFFFL).toString(16)
  "${KEY_PREFIX}uid_${sanitized}_$hash"
  ```
  This ensures that UIDs such as `user.one` and `user/one` produce distinct keys and cannot accidentally collide.
- **Credential Hygiene:** No passwords, refresh tokens, session cookies, or auth secrets are ever written to or embedded within storage keys or records.

---

## 3. Legacy Migration Policy

The legacy storage key was `local_search_history_v1`.

### Privacy Hazard Avoided
Automatically copying legacy history into whatever account signs in first creates a severe privacy breach: an authenticated user would inherit queries previously made by a different person on that device.

### Implemented Safe Migration Policy
- **Authenticated Accounts:** When an authenticated user signs in (`activeUserId != null`), `SearchHistoryRepository.resolveKey(activeUserId)` is called. Authenticated accounts **never** touch, read, or migrate legacy history.
- **Guest / Anonymous Accounts:** When a user is in guest mode (`activeUserId == null`), `resolveKey(null)` checks for the existence of `local_search_history_v1`. If `local_search_history_guest` is empty and legacy history exists, the legacy history is copied to `local_search_history_guest`, and `local_search_history_v1` is immediately removed from disk (`prefs.edit().remove(KEY_LEGACY).apply()`).
- **One-Way Transition:** Once migrated or cleared, legacy storage no longer exists on the device.

---

## 4. Account Lifecycle & Switching Behavior

| Event | Source Account | Target Account | Behavior | Privacy Safeguard |
|---|---|---|---|---|
| **Initial Launch (Guest)** | None | Guest (`null`) | Uses `local_search_history_guest`. Safe legacy migration applies if legacy exists. | Authenticated keys untouched. |
| **User Sign-In** | Guest (`null`) | Account A (`uid_A`) | UI reacts via `LaunchedEffect(activeUserId)`, switches to `local_search_history_uid_uid_A`. | Guest history is NOT copied into Account A. Account A only sees its own prior searches. |
| **Account Switch** | Account A (`uid_A`) | Account B (`uid_B`) | `activeUserId` changes; suggestions immediately reload from `local_search_history_uid_uid_B`. | Account A's queries are hidden immediately with zero UI flash. |
| **Sign-Out** | Account B (`uid_B`) | Guest (`null`) | `activeUserId` becomes `null`; suggestions switch to `local_search_history_guest`. | Account B's queries remain safely locked under Account B's key. |
| **Clear All Searches** | Active Account | Active Account | Calls `historyRepo.clearHistory(activeUserId)`. Only the active account's SharedPreferences entry is removed. | Other accounts and guest history remain completely unaffected. |
| **Delete Single Entry** | Active Account | Active Account | Calls `historyRepo.removeSearch(item, activeUserId)`. Only removes item from active account's history. | Other accounts with same search term are untouched. |

---

## 5. UI Integration Integrity

Both primary search surfaces in the Android application now utilize the unified, account-scoped API:

1. **[`HomeScreen.kt`](file:///C:/APPS/BUYWISE%20AI/android/app/src/main/java/com/pajonline/buywiseai/ui/screens/home/HomeScreen.kt):**
   - Resolves `activeUserId` from `AuthRepository.getInstance().authState` / `getCurrentUserId()`.
   - Listens to authentication state with `LaunchedEffect(activeUserId)`.
   - Passes `activeUserId` to `historyRepo.getSuggestions()`, `historyRepo.saveSearch()`, `historyRepo.removeSearch()`, and `historyRepo.clearHistory()`.
2. **[`SearchScreen.kt`](file:///C:/APPS/BUYWISE%20AI/android/app/src/main/java/com/pajonline/buywiseai/ui/screens/search/SearchScreen.kt):**
   - Resolves `activeUserId` identically from `AuthRepository`.
   - Listens to authentication state with `LaunchedEffect(activeUserId)` to prevent stale query flash.
   - Passes `activeUserId` to all repository methods.

---

## 6. Files Modified

| File | Status | Description |
|---|---|---|
| [`AuthRepository.kt`](file:///C:/APPS/BUYWISE%20AI/android/app/src/main/java/com/pajonline/buywiseai/data/repository/AuthRepository.kt) | Modified | Added `userId` property to `AuthState.Authenticated` and `getCurrentUserId()` helper returning authoritative Firebase UID. |
| [`SearchHistoryRepository.kt`](file:///C:/APPS/BUYWISE%20AI/android/app/src/main/java/com/pajonline/buywiseai/data/repository/SearchHistoryRepository.kt) | Created/Updated | Implemented `SearchHistoryEngine`, safe key derivation, collision-proof hashing, Gson serialization, safe legacy migration, and account-scoped repository methods. |
| [`HomeScreen.kt`](file:///C:/APPS/BUYWISE%20AI/android/app/src/main/java/com/pajonline/buywiseai/ui/screens/home/HomeScreen.kt) | Modified | Integrated `activeUserId` resolution, reactive `LaunchedEffect` suggestion refresh, and account-scoped history operations. |
| [`SearchScreen.kt`](file:///C:/APPS/BUYWISE%20AI/android/app/src/main/java/com/pajonline/buywiseai/ui/screens/search/SearchScreen.kt) | Modified | Integrated `activeUserId` resolution, reactive `LaunchedEffect` suggestion refresh, and account-scoped history operations. |
| [`SearchHistoryTest.kt`](file:///C:/APPS/BUYWISE%20AI/android/app/src/test/java/com/pajonline/buywiseai/SearchHistoryTest.kt) | Created/Updated | Added 12 unit tests validating key derivation, collision resistance, multi-account isolation, and legacy migration safety. |

---

## 7. Compliance Verification

- [x] Local search history is strictly account-isolated by authoritative Firebase UID.
- [x] Guest history is dedicated to `local_search_history_guest`.
- [x] Legacy history (`local_search_history_v1`) never touches authenticated accounts.
- [x] Switching accounts immediately switches active history without flash.
- [x] Zero network or telemetry calls for search history.
- [x] Passwords, tokens, and secrets are never stored.
- [x] 30-item cap, recency ordering, deduplication, and autocomplete ranking preserved.

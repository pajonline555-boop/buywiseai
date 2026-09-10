# BUYWISE AI — Phase 11.1 Google Sign-In Specification

## Overview
This document specifies the Credential Manager and Google Identity Services (`androidx.credentials`) implementation on Android.

## Key Technical Specifications
- **Credential Manager**: `GoogleSignInHelper.kt` uses `CredentialManager.create(context)` with `GetGoogleIdOption`.
- **Firebase Auth Integration**: Exchanged ID token via `GoogleAuthProvider.getCredential(idToken, null)` in `AuthRepository.kt`.
- **Account Preservation**: Existing email/password accounts and user profiles remain unchanged.
- **Fallback**: Graceful fallback error handling if Play Services Credential Manager is unavailable or cancelled.

# BuyWise AI — Virtual Try-On Security & Privacy Specification

## Privacy-First Architecture

1. **User Consent**:
   - Explicit user consent check required before processing any uploaded image.
   - User photos are processed strictly for try-on preview generation.

2. **Data Retention & Expiration**:
   - Temporary photo references automatically expire after 24 hours.
   - 1-click **Delete My Photo** button triggers `/api/try-on/delete` to purge user photos immediately.

3. **No Secret Leakage & Observability**:
   - API keys and tokens are restricted to server-side API routes.
   - Correlation IDs track try-on job lifecycle without logging raw user photos or private URLs.

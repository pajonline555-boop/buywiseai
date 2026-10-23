# BUYWISE AI — PHASE 12 HOSTING ARCHITECTURE & ROOT CAUSE ANALYSIS

**Date**: 2026-10-23  
**Status**: DIAGNOSED & VERIFIED  
**Production Host**: `https://buywiseai.pajonline.co.in`  
**Firebase Project**: `pajonline-shopping`  
**Git Remote**: `https://github.com/pajonline555-boop/buywiseai.git` (branch `main`)

---

## 1. Hosting Architecture Identification

An exhaustive probe of the live production endpoint revealed the following architecture fingerprint:

```http
HTTP/2 400 Bad Request
server: envoy
via: 1.1 google
x-fah-adapter: nextjs-14.0.21
cache-tag: 226689194744, 226689194744:buywiseai
x-cloud-trace-context: ca3ff0732d83b75369bce56d123653af/...
x-correlation-id: corr_1792772654477_msbpwgc
content-type: application/json
content-security-policy: default-src 'self'; script-src 'self' ...
```

### Key Technical Findings:
1. **Hosting Platform**: **Firebase App Hosting** (Google Cloud Run + Envoy Proxy).
   - Proven by header `x-fah-adapter: nextjs-14.0.21` (`fah` = Firebase App Hosting).
   - Proven by Google Cloud Run infrastructure headers (`server: envoy`, `via: 1.1 google`, `traceparent`).
   - Dynamic Node.js server execution is active: every request generates a unique dynamic `x-correlation-id` and executes rate limiter logic in real time.
2. **Static Firebase Hosting (`firebase.json`)**:
   - `web/firebase.json` specifies `"public": "out"` for classic Firebase Hosting.
   - However, the custom domain `buywiseai.pajonline.co.in` is routed to the **Firebase App Hosting** backend, NOT the static `out` folder.
3. **Dynamic API Route Support**:
   - Next.js dynamic API routes (`route.ts`) **ARE 100% natively supported** by Firebase App Hosting because it runs a full Node.js container on Cloud Run with `output: "standalone"`.

---

## 2. Root Cause of the Production HTTP 400 Failure

### Root Cause 1: Static Route Prerender Declaration in Commit `3c1f472`
In the git commit currently deployed to production (`3c1f472`), `web/src/app/api/compare/route.ts` contained:
```typescript
export const dynamic = "force-static"; // <-- BUG IN DEPLOYED BASELINE
```
In Next.js on Cloud Run / Firebase App Hosting:
- Marking an API route `force-static` forces Next.js to treat the endpoint as statically prerendered at build time.
- Runtime query parameters (`request.nextUrl.searchParams` or `new URL(request.url).searchParams`) are stripped or evaluated as empty.
- When `rawQuery = searchParams.get('q')` executed, `rawQuery` was `null`.
- The code then executed:
  ```typescript
  if (!isValidQuery(rawQuery)) {
    return NextResponse.json({ error: 'Search query is required.' }, { status: 400 });
  }
  ```
- Result: **Every live GET request returned HTTP 400 `{"error":"Search query is required."}` regardless of parameters.**

### Root Cause 2: Deployed Version Lag
- Local source code in `c:\APPS\BUYWISE AI` has progressed significantly past commit `3c1f472`.
- In local source, `web/src/app/api/compare/route.ts` was already corrected to:
  ```typescript
  export const dynamic = "force-dynamic"; // <-- Dynamic on-demand route
  ```
  and `GET(request: NextRequest)` inspects both `request.nextUrl.searchParams` and `url.searchParams` for `q` and `query`.
- In Next.js Turbopack build (`npm run build`), `/api/compare` compiles to `ƒ (Dynamic)` server-rendered on demand.
- **The live site still served commit `3c1f472` because recent changes were never staged, committed, or pushed to `origin/main` to trigger a Firebase App Hosting rebuild.**

### Root Cause 3: Next.js 14 vs Next.js 16 Adapter Header
- The header `x-fah-adapter: nextjs-14.0.21` reflects Google's Cloud Native Buildpack adapter version for Firebase App Hosting (`@apphosting/adapter-nextjs`).
- Firebase App Hosting uses Cloud Build buildpacks to detect the Next.js runtime. When the older commit was built, the buildpack deployed using the Next.js 14 adapter image.

---

## 3. Root Cause of the POST HTTP 500 Failure

In `web/src/lib/comparison/planner.ts` (lines 23–34), `selectRetailerQuery` had:
```typescript
return (
  canonical.exactSearchQueries[0] || // <-- Crashes if exactSearchQueries is undefined
  canonical.title ||
  canonical.rawInput
);
```
When callers (including Android's `CanonicalQuery` payload) sent a partial canonical object lacking `exactSearchQueries`, this line threw an uncaught `TypeError: Cannot read properties of undefined (reading '0')`. This resulted in an unhandled rejection and HTTP 500.

**Source Fix Applied**:
Optional chaining (`canonical?.exactSearchQueries?.[0]`) and query fallback (`canonical?.title || canonical?.rawInput || ''`) have been implemented in `planner.ts`, and `route.ts` now auto-normalizes missing fields via `normalizeTextQueryToCanonical`.

---

## 4. Architecture Solution & Deployment Path

### Smallest Supported Architecture Correction:
We do NOT need to migrate away from Firebase App Hosting or change DNS records.
Firebase App Hosting already has the exact containerized architecture needed to run Next.js dynamic API routes.

The required steps:
1. **Source Code Fix**: Ensure `export const dynamic = "force-dynamic";`, robust POST normalization, and safe query planning are committed. (Completed locally).
2. **Next.js Standalone Build**: `web/next.config.mjs` already outputs `standalone`, which produces the Node.js server container required by Firebase App Hosting.
3. **App Hosting Configuration**: `web/apphosting.yaml` defines memory (1024 MiB), CPU (1), and autoscaling (0–5 instances).
4. **Trigger Deployment**: Commit the verified source code to `main` and push to GitHub `pajonline555-boop/buywiseai`, triggering Firebase App Hosting's automated Cloud Build pipeline.

### Safeguard:
No DNS records, domain mappings, or Cloud Run configs need to be altered. The public website at `https://buywiseai.pajonline.co.in` remains intact on the exact same domain.

**Deployment is currently on hold awaiting explicit user authorization.**

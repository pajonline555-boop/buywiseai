# BuyWise AI — Virtual Try-On Deployment Guide

## Environment Variables Configuration

Set the following environment variables in `.env.local` or production deployment server:

```env
# AI Vision Provider
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
GEMINI_MODEL=gemini-2.5-flash

# OpenAI Vision Provider (Fallback)
OPENAI_API_KEY=YOUR_OPENAI_API_KEY_HERE

# Firebase / Firestore Project
NEXT_PUBLIC_FIREBASE_PROJECT_ID=pajonline-shopping
```

## Production Deployment Checklist

1. [x] Next.js build passes cleanly without compilation or ESLint errors (`npm run build`).
2. [x] Privacy consent and user image deletion endpoints `/api/try-on/delete` active.
3. [x] Provider status fallback `/api/try-on` active for unconfigured environments.
4. [x] Multi-store retailer affiliate links verified (Amazon, Flipkart, Myntra, Meesho).

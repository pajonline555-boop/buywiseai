# BuyWise AI — Domain Vercel Binding & Google SEO Indexing Resolution Guide

> **Issue Reported**: Domain `http://buywiseai.pajonline.co.in` shows `404: DEPLOYMENT_NOT_FOUND` on Vercel and is not indexed by Google.  
> **Root Cause**: The domain CNAME DNS is pointing to Vercel, but the domain `buywiseai.pajonline.co.in` is not yet assigned under Vercel Project Settings -> Domains. Because Vercel returns HTTP 404, Googlebot drops the page from Google Search results.

---

## 1. Step-by-Step Fix to Link Domain to Vercel (Fixes 404 Immediately)

### Step 1: Add Domain in Vercel Project Settings
1. Open [Vercel Dashboard](https://vercel.com/dashboard).
2. Select your **BuyWise AI** Web Application project (`web`).
3. Click **Settings** (top navigation bar) -> **Domains** (left sidebar).
4. Enter `buywiseai.pajonline.co.in` in the domain input box.
5. Click **Add**.
6. Assign the target environment to **Production**.

```text
[DNS Settings (pajonline.co.in)] ──► CNAME buywiseai.pajonline.co.in ──► cname.vercel-dns.com
                                                                               │
                                                                               ▼
[Vercel Project Settings] ──► Domains ──► Add: buywiseai.pajonline.co.in ──► [Production Deployment (200 OK)]
```

### Step 2: SSL Certificate Auto-Issuance
- Once added, Vercel will automatically generate a Let's Encrypt SSL certificate for `https://buywiseai.pajonline.co.in`.
- Your site will instantly switch from `http://` (Not secure) to secure `https://buywiseai.pajonline.co.in`.

---

## 2. Completed Code-Level SEO Enhancements for Google Search

The web codebase has been updated with full production SEO metadata to ensure maximum ranking and immediate indexing on Google:

1. **Metadata Base & Canonical URL**: Set to `https://buywiseai.pajonline.co.in` in [layout.tsx](file:///c:/APPS/BUYWISE%20AI/web/src/app/layout.tsx).
2. **Open Graph & Twitter Cards**: Configured with official title, description, and high-resolution logo preview.
3. **Googlebot Indexing Directives**: Explicitly set `index: true, follow: true` with large snippet & image preview permissions.
4. **Schema.org Structured Data**: Embedded JSON-LD WebSite & SearchAction schema for rich Google search snippets.
5. **Robots & Sitemap**:
   - `robots.txt` available at `https://buywiseai.pajonline.co.in/robots.txt`
   - `sitemap.xml` available at `https://buywiseai.pajonline.co.in/sitemap.xml`

---

## 3. Immediate Google Search Indexing Steps

Once Vercel domain binding is active:

1. Open [Google Search Console](https://search.google.com/search-console).
2. Click **Add Property** -> choose **URL prefix** -> enter `https://buywiseai.pajonline.co.in`.
3. Go to **Sitemaps** in the left menu -> enter `sitemap.xml` -> click **Submit**.
4. Go to **URL Inspection** -> enter `https://buywiseai.pajonline.co.in` -> click **Request Indexing**.
5. Within 24–48 hours, Google will crawl `https://buywiseai.pajonline.co.in` and display BuyWise AI in Google Search results.

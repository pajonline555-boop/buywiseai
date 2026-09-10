# BuyWise AI — Firebase Hosting & GoDaddy DNS Setup Guide

> **Issue**: `buywiseai.pajonline.co.in` DNS currently points to Vercel (`cname.vercel-dns.com`), returning `404: DEPLOYMENT_NOT_FOUND`.  
> **Solution**: Switch DNS target in GoDaddy from Vercel to your Firebase Project (**`pajonline-shopping`**).

---

## Step 1: Connect Domain in Firebase Console

1. Open [Firebase Console](https://console.firebase.google.com/).
2. Click your project: **`pajonline-shopping`**.
3. In the left menu under **Build**, click **Hosting**.
4. Click **Add Custom Domain**.
5. Enter `buywiseai.pajonline.co.in` and click **Continue**.
6. Firebase will show you your domain target (e.g. CNAME `pajonline-shopping.web.app` or A record IP addresses).

---

## Step 2: Update GoDaddy DNS Settings (Remove Vercel)

1. Log into your [GoDaddy Domain Portfolio](https://dnc.godaddy.com/).
2. Select your domain **`pajonline.co.in`** -> click **DNS / Manage DNS**.
3. Find the CNAME record for `buywiseai` (which currently points to `cname.vercel-dns.com`).
4. Click **Edit**:
   - **Type**: `CNAME`
   - **Name**: `buywiseai`
   - **Value / Target**: `pajonline-shopping.web.app` (or the CNAME given by Firebase)
5. Click **Save**.

```text
[GoDaddy DNS (pajonline.co.in)]
  CNAME: buywiseai  ──►  pajonline-shopping.web.app  ──► [Firebase Hosting 200 OK]
```

---

## Step 3: Deploy Web App to Firebase Hosting

To deploy your latest Next.js Web App build to Firebase Hosting:

1. Open terminal in `c:\APPS\BUYWISE AI\web`.
2. Run:
   ```bash
   npx firebase-tools deploy --only hosting --project pajonline-shopping
   ```

---

## Step 4: Submit to Google Search Console

Once Firebase Hosting returns **200 OK** on `https://buywiseai.pajonline.co.in`:

1. Open [Google Search Console](https://search.google.com/search-console).
2. Add Property: `https://buywiseai.pajonline.co.in`.
3. Go to **Sitemaps** -> submit `sitemap.xml`.
4. Go to **URL Inspection** -> enter `https://buywiseai.pajonline.co.in` -> click **Request Indexing**.
5. Google Search will index your site within 24-48 hours.

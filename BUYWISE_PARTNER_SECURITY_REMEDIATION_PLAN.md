# BUYWISE AI — PARTNER PORTAL SECURITY REMEDIATION PLAN
**Target Environment**: Firebase Cloud Firestore & Cloud Storage  
**Scope**: Server-Authoritative Multi-Tenant Isolation, Field Allowlists, and Privileged State Protection  
**Status**: Ready for Administrative Review & Cloud Deployment

---

## 1. Vulnerability Analysis & Current Gaps

### 1.1 Firestore Security Gap
- **Active Rule** in [`web/firestore.rules`](file:///C:/APPS/BUYWISE%20AI/web/firestore.rules):
  ```rules
  match /partner_products/{productId} {
    allow read, write: if true;
  }
  ```
- **Attack Vector**: Any authenticated client can invoke `setDoc(doc(db, 'partner_products', id), { ... })` directly via browser DevTools, bypassing application-level TypeScript checks to:
  1. Overwrite another merchant's products (`partnerId: 'partner_silkcraft'`).
  2. Self-assign `verificationStatus: 'verified_live'` and `isLowest: true`.
  3. Change product `status` to `'LIVE'` without admin moderation.
  4. Artificially tamper with platform audit scores (`smartValueScore`, `shoppingTrustScore`).

### 1.2 Storage Upload Security Gap
- **Active Rule** in [`web/storage.rules`](file:///C:/APPS/BUYWISE%20AI/web/storage.rules):
  ```rules
  match /products/{allPaths=**} {
    allow read: if true;
    allow write: if isAdmin();
  }
  ```
- **Impact**: Non-admin partners cannot upload binary media files to Storage, resulting in local fallback to Base64 strings.

---

## 2. Proposed Production Security Rules Patch

### 2.1 Proposed `web/firestore.rules` Patch

Replace the open `partner_products`, `partner_orders`, and `partner_analytics_events` blocks with the following hardened definitions:

```rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper: Global Admin Check
    function isAdmin() {
      return request.auth != null && (
        request.auth.token.admin == true || 
        request.auth.token.role == 'ADMIN' ||
        request.auth.token.email in [
          'pajonline555@gmail.com',
          'ashupajonline@gmail.com',
          'akshayman224@gmail.com',
          'ashu@pajonline.co.in'
        ] ||
        (request.auth.token.email != null && (
          request.auth.token.email.matches('.*pajonline.*') ||
          request.auth.token.email.matches('.*admin.*')
        ))
      );
    }

    // Helper: Valid Partner Ownership
    function isPartnerOwner(partnerId) {
      return request.auth != null && (
        request.auth.uid == partnerId ||
        request.auth.token.partnerId == partnerId ||
        request.auth.token.email == partnerId
      );
    }

    // Helper: Verify partner is not modifying privileged verification fields
    function hasNoPrivilegedFieldTampering() {
      let incoming = request.resource.data;
      let existing = resource != null ? resource.data : null;

      return (
        // Non-admins can NEVER set verificationStatus to verified_live
        incoming.verificationStatus != 'verified_live' &&
        // Non-admins cannot set isLowest or partnerBadge
        (!('isLowest' in incoming) || incoming.isLowest == false) &&
        (!('partnerBadge' in incoming) || incoming.partnerBadge == false) &&
        // Non-admins cannot publish directly to LIVE
        (incoming.status != 'LIVE' || (existing != null && existing.status == 'LIVE' && existing.reviewStatus == 'APPROVED'))
      );
    }

    // 4. Partner Products Catalog
    match /partner_products/{productId} {
      // Anyone can read live or active products
      allow read: if true;

      // Create: Authenticated partner can create listings in unverified/pending state only
      allow create: if isAdmin() || (
        request.auth != null &&
        isPartnerOwner(request.resource.data.partnerId) &&
        request.resource.data.verificationStatus == 'unverified' &&
        request.resource.data.reviewStatus in ['DRAFT', 'PENDING_REVIEW'] &&
        request.resource.data.sellingPrice > 0 &&
        request.resource.data.sellingPrice <= request.resource.data.mrp &&
        hasNoPrivilegedFieldTampering()
      );

      // Update: Owner can update their own products, but cannot self-verify
      allow update: if isAdmin() || (
        request.auth != null &&
        resource != null &&
        isPartnerOwner(resource.data.partnerId) &&
        request.resource.data.partnerId == resource.data.partnerId &&
        hasNoPrivilegedFieldTampering()
      );

      // Delete: Admins or authenticated owner can archive/delete
      allow delete: if isAdmin() || (
        request.auth != null &&
        resource != null &&
        isPartnerOwner(resource.data.partnerId)
      );
    }

    // 5. Partner Orders
    match /partner_orders/{orderId} {
      // Partners can only read orders belonging to their store
      allow read: if isAdmin() || (
        request.auth != null &&
        resource != null &&
        isPartnerOwner(resource.data.partnerId)
      );
      // Orders can only be created by system checkout or admin
      allow create: if isAdmin();
      // Partners can only update fulfillment tracking fields (PACKING, SHIPPED, trackingNumber)
      allow update: if isAdmin() || (
        request.auth != null &&
        resource != null &&
        isPartnerOwner(resource.data.partnerId) &&
        request.resource.data.diff(resource.data).affectedKeys().hasOnly([
          'orderStatus', 'courierCarrier', 'trackingNumber', 'statusHistory', 'updatedAt'
        ])
      );
      allow delete: if isAdmin();
    }

    // 14. Partner Analytics Events
    match /partner_analytics_events/{eventId} {
      // Ingest: Anyone can emit client events with server timestamps
      allow create: if request.resource.data.eventType in [
        'product_impression', 'product_detail_view', 'outbound_buy_click',
        'partner_product_created', 'partner_product_updated', 'partner_product_submitted'
      ] && request.resource.data.partnerId != null;

      // Read: Admins or the owning partner can read their analytics
      allow read: if isAdmin() || (
        request.auth != null &&
        resource != null &&
        isPartnerOwner(resource.data.partnerId)
      );

      // Immutability: Analytics events cannot be edited or deleted by partners
      allow update, delete: if isAdmin();
    }

    // Default Fallback
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### 2.2 Proposed `web/storage.rules` Patch

```rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    function isAdmin() {
      return request.auth != null && (
        request.auth.token.admin == true || 
        request.auth.token.role == 'ADMIN'
      );
    }

    function isValidImageUpload() {
      return request.resource.size <= 5 * 1024 * 1024
        && (request.resource.contentType.matches('image/jpeg')
            || request.resource.contentType.matches('image/png')
            || request.resource.contentType.matches('image/webp'));
    }

    // User Profile Photos
    match /users/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if (request.auth != null && request.auth.uid == userId && isValidImageUpload()) || isAdmin();
      allow delete: if (request.auth != null && request.auth.uid == userId) || isAdmin();
    }

    // Partner Product Media Uploads (/partner-uploads/{partnerId}/*)
    match /partner-uploads/{partnerId}/{allPaths=**} {
      allow read: if true;
      allow write: if (request.auth != null && (request.auth.uid == partnerId || request.auth.token.partnerId == partnerId) && isValidImageUpload()) || isAdmin();
      allow delete: if isAdmin() || (request.auth != null && request.auth.uid == partnerId);
    }

    // Static Admin Media (/products/*)
    match /products/{allPaths=**} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

---

## 3. Deployment & Execution Procedure

> [!CAUTION]
> Do NOT execute automated deployment commands (`firebase deploy --only firestore:rules`) until you have completed manual administrative review. All rules changes must be executed deliberately to avoid disrupting active mobile shoppers.

1. **Staging Review**:
   Test the rules in the Firebase Console Rules Playground using simulated tokens for `shopper`, `partner`, and `admin`.
2. **Deploy Firestore Rules**:
   Deploy via Firebase Console -> Firestore Database -> Rules tab, or via `firebase deploy --only firestore:rules`.
3. **Deploy Storage Rules**:
   Deploy via Firebase Console -> Storage -> Rules tab, or via `firebase deploy --only storage`.
4. **Post-Deployment Verification**:
   Execute `npx tsx scripts/test-partner-portal-upgrade.ts` against the live rules emulator to confirm zero regressions.

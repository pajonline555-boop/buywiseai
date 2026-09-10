# BuyWise AI — Merchandising Collection Engine Specification

**Version**: Phase 9.9  

---

## 1. Data Model & Firestore Schema

Collection documents reside in `merchandising_collections/{collectionId}`:

```typescript
interface MerchandisingCollection {
  collectionId: string;
  slug: string;
  name: string;
  subtitle: string;
  description: string;
  heroHeadline: string;
  heroSubtitle: string;
  heroImage: string;
  ctaText: string;
  active: boolean;
  featured: boolean;
  displayOrder: number;
  eligibilityMode: 'MANUAL' | 'RULE_BASED' | 'HYBRID';
  manualProductIds: string[];
  excludedProductIds?: string[];
  ruleConfig: MerchandisingRuleConfig;
  seoTitle: string;
  seoDescription: string;
  createdAt: string;
  updatedAt: string;
}
```

---

## 2. Dynamic Resolution Algorithm

Products are resolved dynamically via `getCollectionProducts(slug, allProducts)`:
1. `allProducts` combines live partner products (`partnerService.ts`) and static production products (`categoryData.ts`).
2. `getEligibleCollections(product)` checks `ruleConfig` rules + `manualProductIds` inclusion - `excludedProductIds` exclusion.
3. Matching products populate collection views dynamically without database product duplication.

---

## 3. Controlled SEO & Indexing Rules

- Collection routes (`/store/[collectionSlug]`) generate custom OpenGraph tags and structured metadata.
- Collections with active products index normally.
- Empty or thin collections are set to `robots: { index: false }` (`noindex`) to protect search engine quality.

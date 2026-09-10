import { MerchandisingCollection, MerchandisingAuditLog, PremiumScoreFactors } from './types';
import { BestsellerProduct } from '../categoryData';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

export const MERCHANDISING_AUDIT_LOGS_STORE: MerchandisingAuditLog[] = [];

/**
 * Authoritative Seed Registry of 10 Merchandising Collections
 */
export const PREMIUM_COLLECTIONS_REGISTRY: MerchandisingCollection[] = [
  {
    collectionId: 'buywise_select',
    slug: 'select',
    name: 'BuyWise Select',
    subtitle: 'Curated Products Chosen for Style, Quality & Design Appeal',
    description: 'Our primary merchandising collection representing thoughtfully curated styles, flagship tech, and standout home & fashion products selected for design and quality signals.',
    heroHeadline: 'Selected for the Way You Shop',
    heroSubtitle: 'Thoughtfully curated styles, essentials and standout finds.',
    heroImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1400&q=80',
    ctaText: 'Explore BuyWise Select',
    active: true,
    featured: true,
    displayOrder: 1,
    eligibilityMode: 'RULE_BASED',
    manualProductIds: [],
    ruleConfig: {
      minMerchandisingScore: 75,
      minRating: 4.6
    },
    seoTitle: 'BuyWise Select — Curated Quality & Design Collection',
    seoDescription: 'Discover BuyWise Select: A curated collection of top-rated fashion, tech, home decor, and gifts evaluated by AI Smart Value and Trust scores.',
    createdAt: '2026-09-10T00:00:00Z',
    updatedAt: '2026-09-10T00:00:00Z'
  },
  {
    collectionId: 'red_carpet',
    slug: 'red-carpet',
    name: 'Red Carpet Edit',
    subtitle: 'Statement Evening Styles & Occasion Glamour',
    description: 'An occasion-focused glamour collection featuring evening sarees, choker sets, blazers, and statement accessories for celebrations and special events.',
    heroHeadline: 'Step Into the Spotlight',
    heroSubtitle: 'Statement styles for evenings, celebrations and unforgettable occasions.',
    heroImage: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=1400&q=80',
    ctaText: 'Explore the Red Carpet Edit',
    active: true,
    featured: true,
    displayOrder: 2,
    eligibilityMode: 'RULE_BASED',
    manualProductIds: [],
    ruleConfig: {
      categories: ['Fashion & Clothing', 'Undergarments & Lingerie', 'Jewellery', 'Fashion'],
      keywords: ['kanjivaram', 'kundan', 'silk', 'choker', 'anarkali', 'blazer', 'evening', 'party', 'designer']
    },
    seoTitle: 'Red Carpet Edit — Statement Evening & Party Styles | BuyWise AI',
    seoDescription: 'Explore the Red Carpet Edit for elegant evening sarees, Kundan choker sets, and occasion wear with 3D Virtual Try-On integration.',
    createdAt: '2026-09-10T00:00:00Z',
    updatedAt: '2026-09-10T00:00:00Z'
  },
  {
    collectionId: 'executive',
    slug: 'executive',
    name: 'Executive Edit',
    subtitle: 'Refined Work, Travel & Formal Lifestyle Essentials',
    description: 'Tailored formalwear, premium watches, leather accessories, and office organization items designed for professionals.',
    heroHeadline: 'Made for the Moment That Matters',
    heroSubtitle: 'Refined essentials for work, travel and everyday confidence.',
    heroImage: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1400&q=80',
    ctaText: 'Explore Executive Edit',
    active: true,
    featured: true,
    displayOrder: 3,
    eligibilityMode: 'RULE_BASED',
    manualProductIds: [],
    ruleConfig: {
      categories: ['Fashion & Clothing', 'Mobiles & Smartphones', 'Audio & Headphones', 'Electronics'],
      keywords: ['slim', 'jeans', 'shirt', 'watch', 'laptop', 'iphone', 'sony', 'trunk', 'headphone', 'executive']
    },
    seoTitle: 'Executive Edit — Premium Formalwear & Business Tech | BuyWise AI',
    seoDescription: 'Browse the Executive Edit for refined business shirts, blazers, flagship smartphones, and pro audio gear.',
    createdAt: '2026-09-10T00:00:00Z',
    updatedAt: '2026-09-10T00:00:00Z'
  },
  {
    collectionId: 'signature',
    slug: 'signature',
    name: 'Signature Collection',
    subtitle: 'Standout Products Evaluated Across Multiple Merchandising Signals',
    description: 'Products earning high ratings, review volume, identity confidence, and clear fulfillment policies.',
    heroHeadline: 'Distinctive Design & Quality Signals',
    heroSubtitle: 'Standout products chosen for verified customer trust and design integrity.',
    heroImage: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1400&q=80',
    ctaText: 'Discover Signature Collection',
    active: true,
    featured: false,
    displayOrder: 4,
    eligibilityMode: 'RULE_BASED',
    manualProductIds: [],
    ruleConfig: {
      minMerchandisingScore: 80
    },
    seoTitle: 'Signature Collection — Verified Quality Picks | BuyWise AI',
    seoDescription: 'Discover BuyWise Signature products evaluated for verified user satisfaction, high trust score, and reliable stock availability.',
    createdAt: '2026-09-10T00:00:00Z',
    updatedAt: '2026-09-10T00:00:00Z'
  },
  {
    collectionId: 'luxe_fashion',
    slug: 'luxe',
    name: 'Luxe Fashion',
    subtitle: 'Elevated & Designer-Inspired Apparel & Accessories',
    description: 'Super soft combed cotton garments, designer-inspired sarees, seamless lingerie, and premium outerwear.',
    heroHeadline: 'Elevated Fashion & Tailored Fit',
    heroSubtitle: 'Delicate fabrics, rich textures and modern silhouettes.',
    heroImage: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1400&q=80',
    ctaText: 'Shop Luxe Fashion',
    active: true,
    featured: true,
    displayOrder: 5,
    eligibilityMode: 'RULE_BASED',
    manualProductIds: [],
    ruleConfig: {
      categories: ['Fashion & Clothing', 'Undergarments & Lingerie', 'Fashion']
    },
    seoTitle: 'Luxe Fashion — Designer-Inspired Clothing | BuyWise AI',
    seoDescription: 'Shop Luxe Fashion for premium sarees, innerwear, Anarkali sets, and denim jeans with AI size and try-on guidance.',
    createdAt: '2026-09-10T00:00:00Z',
    updatedAt: '2026-09-10T00:00:00Z'
  },
  {
    collectionId: 'elite_home',
    slug: 'elite-home',
    name: 'Elite Home',
    subtitle: 'Modern Decor, Lighting & Interior Accessories',
    description: 'Curated home decor, artisanal candle sets, rosewood keepsakes, and ambient lighting.',
    heroHeadline: 'Artisanal Decor & Living Comfort',
    heroSubtitle: 'Elevate your home space with timeless accents.',
    heroImage: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1400&q=80',
    ctaText: 'Explore Elite Home',
    active: true,
    featured: false,
    displayOrder: 6,
    eligibilityMode: 'RULE_BASED',
    manualProductIds: [],
    ruleConfig: {
      categories: ['Home & Living', 'Gifts & Novelties', 'Decor']
    },
    seoTitle: 'Elite Home — Premium Decor & Accents | BuyWise AI',
    seoDescription: 'Transform your living space with Elite Home decor, lighting, and artisanal storage pieces.',
    createdAt: '2026-09-10T00:00:00Z',
    updatedAt: '2026-09-10T00:00:00Z'
  },
  {
    collectionId: 'premium_tech',
    slug: 'premium-tech',
    name: 'Premium Tech',
    subtitle: 'Flagship Electronics, ANC Audio & Smart Accessories',
    description: 'Industry-leading noise-cancelling headphones, 120Hz ProMotion smartphones, and high-performance devices.',
    heroHeadline: 'High-Performance Engineering',
    heroSubtitle: 'Flagship processors, active noise cancellation and crystal displays.',
    heroImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1400&q=80',
    ctaText: 'Explore Premium Tech',
    active: true,
    featured: true,
    displayOrder: 7,
    eligibilityMode: 'RULE_BASED',
    manualProductIds: [],
    ruleConfig: {
      categories: ['Mobiles & Smartphones', 'Audio & Headphones', 'Electronics']
    },
    seoTitle: 'Premium Tech — Flagship Smartphones & Noise-Cancelling Audio | BuyWise AI',
    seoDescription: 'Discover Premium Tech featuring iPhone 17, Sony WH-1000XM5, and Samsung S24 Ultra with verified price history.',
    createdAt: '2026-09-10T00:00:00Z',
    updatedAt: '2026-09-10T00:00:00Z'
  },
  {
    collectionId: 'wedding_occasion',
    slug: 'wedding-occasion',
    name: 'Wedding & Occasion Edit',
    subtitle: 'Ethnic Saree, Kundan Choker & Festive Celebration Attire',
    description: 'Curated sarees, lehengas, Anarkalis, Kundan jewellery, and festive outfits integrated with 3D Virtual Try-On.',
    heroHeadline: 'Celebrate Every Cherished Moment',
    heroSubtitle: 'Traditional craftsmanship meets modern elegance for weddings and festivities.',
    heroImage: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1400&q=80',
    ctaText: 'Shop Wedding & Occasion',
    active: true,
    featured: true,
    displayOrder: 8,
    eligibilityMode: 'RULE_BASED',
    manualProductIds: [],
    ruleConfig: {
      categories: ['Fashion & Clothing', 'Undergarments & Lingerie', 'Jewellery', 'Fashion'],
      keywords: ['saree', 'kanjivaram', 'kundan', 'choker', 'anarkali', 'ethnic', 'silk', 'wedding', 'festive']
    },
    seoTitle: 'Wedding & Occasion Edit — Festive Sarees & Kundan Sets | BuyWise AI',
    seoDescription: 'Explore the Wedding & Occasion Edit for pure Kanjivaram silk sarees and Kundan choker sets with Virtual Try-On.',
    createdAt: '2026-09-10T00:00:00Z',
    updatedAt: '2026-09-10T00:00:00Z'
  },
  {
    collectionId: 'gifts_prestige',
    slug: 'gifts-prestige',
    name: 'Gifts & Prestige',
    subtitle: 'Memorable Keepsakes Across Price Tiers',
    description: 'Curated birthday, anniversary, corporate, and festive gift hampers structured into convenient price tiers.',
    heroHeadline: 'Thoughtful Gifts for Every Milestone',
    heroSubtitle: 'Handcrafted rosewood boxes, chocolate hampers, and personalized keepsakes.',
    heroImage: 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?auto=format&fit=crop&w=1400&q=80',
    ctaText: 'Explore Gifts & Prestige',
    active: true,
    featured: false,
    displayOrder: 9,
    eligibilityMode: 'RULE_BASED',
    manualProductIds: [],
    ruleConfig: {
      categories: ['Gifts & Novelties', 'Fashion', 'Audio & Headphones'],
      keywords: ['gift', 'hamper', 'rosewood', 'chocolate', 'personalized', 'ferrero', 'pack']
    },
    seoTitle: 'Gifts & Prestige — Personalized Gift Boxes & Hampers | BuyWise AI',
    seoDescription: 'Find gifts for birthdays, anniversaries, and corporate events dynamically categorized under ₹999, ₹2,999, and ₹4,999.',
    createdAt: '2026-09-10T00:00:00Z',
    updatedAt: '2026-09-10T00:00:00Z'
  },
  {
    collectionId: 'premium_beauty',
    slug: 'premium-beauty',
    name: 'Premium Beauty & Accessories',
    subtitle: 'Elevated Grooming, Lingerie & Personal Accessories',
    description: 'Super soft combed cotton hipster panties, wirefree t-shirt bras, and luxury grooming accessories.',
    heroHeadline: 'Refined Comfort & Everyday Elegance',
    heroSubtitle: 'Anti-bacterial combed cotton, seamless contours and anti-chafing fit.',
    heroImage: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1400&q=80',
    ctaText: 'Explore Beauty & Accessories',
    active: true,
    featured: false,
    displayOrder: 10,
    eligibilityMode: 'RULE_BASED',
    manualProductIds: [],
    ruleConfig: {
      categories: ['Undergarments & Lingerie', 'Beauty & Personal Care', 'Fashion & Clothing']
    },
    seoTitle: 'Premium Beauty & Lingerie — Combed Cotton & Seamless Fit | BuyWise AI',
    seoDescription: 'Shop premium innerwear and beauty accessories with anti-bacterial cotton and wirefree comfort guarantees.',
    createdAt: '2026-09-10T00:00:00Z',
    updatedAt: '2026-09-10T00:00:00Z'
  }
];

/**
 * Calculates Factual Premium Merchandising Score (0–100)
 */
export function calculatePremiumMerchandisingScore(product: BestsellerProduct): PremiumScoreFactors {
  const rating = product.rating || 4.5;
  const ratingScore = rating >= 4.8 ? 25 : rating >= 4.6 ? 20 : 15;

  const reviews = product.reviewsCount || 100;
  const reviewVolumeScore = reviews >= 3000 ? 25 : reviews >= 1000 ? 20 : reviews >= 200 ? 15 : 10;

  const isVerifiedSeller = product.productSource === 'PARTNER' || product.bestStore.includes('pajonline-21') || product.bestStore.includes('BuyWise');
  const sellerVerificationScore = isVerifiedSeller ? 20 : 12;

  const returnPolicyScore = product.returnPolicy ? 15 : 10;
  const specCompletenessScore = (product.specs && product.specs.length >= 3) ? 15 : 8;

  const pricePositioningScore = 0; // Price alone does NOT increase premium score

  const totalMerchandisingScore = Math.min(100, ratingScore + reviewVolumeScore + sellerVerificationScore + returnPolicyScore + specCompletenessScore + pricePositioningScore);

  return {
    ratingScore,
    reviewVolumeScore,
    sellerVerificationScore,
    returnPolicyScore,
    specCompletenessScore,
    pricePositioningScore,
    totalMerchandisingScore
  };
}

/**
 * Evaluates which collections a product qualifies for dynamically
 */
export function getEligibleCollections(product: BestsellerProduct): string[] {
  const factors = calculatePremiumMerchandisingScore(product);
  const eligibleIds: string[] = [];

  PREMIUM_COLLECTIONS_REGISTRY.forEach(col => {
    if (!col.active) return;

    let qualifies = false;
    const { ruleConfig } = col;

    if (ruleConfig.minMerchandisingScore && factors.totalMerchandisingScore >= ruleConfig.minMerchandisingScore) {
      qualifies = true;
    }

    if (ruleConfig.minRating && (product.rating || 0) >= ruleConfig.minRating) {
      qualifies = true;
    }

    if (ruleConfig.categories && ruleConfig.categories.some(c => c.toLowerCase() === product.category.toLowerCase())) {
      qualifies = true;
    }

    if (ruleConfig.keywords) {
      const titleLower = product.name.toLowerCase();
      const catLower = product.category.toLowerCase();
      if (ruleConfig.keywords.some(kw => titleLower.includes(kw.toLowerCase()) || catLower.includes(kw.toLowerCase()))) {
        qualifies = true;
      }
    }

    if (col.manualProductIds.includes(product.id)) {
      qualifies = true;
    }

    if (col.excludedProductIds?.includes(product.id)) {
      qualifies = false;
    }

    if (qualifies) {
      eligibleIds.push(col.collectionId);
    }
  });

  return eligibleIds;
}

/**
 * Dynamically resolves products for a given collection slug without duplicating products
 */
export function getCollectionProducts(
  collectionSlug: string, 
  allProducts: BestsellerProduct[]
): { collection: MerchandisingCollection | null; products: BestsellerProduct[] } {
  const normalizedSlug = collectionSlug.toLowerCase().trim();
  const col = PREMIUM_COLLECTIONS_REGISTRY.find(c => c.slug.toLowerCase() === normalizedSlug || c.collectionId.toLowerCase() === normalizedSlug);

  if (!col) {
    return { collection: null, products: [] };
  }

  const filtered = allProducts.filter(prod => {
    const eligible = getEligibleCollections(prod);
    return eligible.includes(col.collectionId);
  });

  return { collection: col, products: filtered };
}

/**
 * Logs Admin Merchandising Action
 */
export async function recordMerchandisingAuditLog(
  logInput: Omit<MerchandisingAuditLog, 'id' | 'timestamp'>
): Promise<MerchandisingAuditLog> {
  const timestamp = new Date().toISOString();
  const log: MerchandisingAuditLog = {
    ...logInput,
    id: `merch_log_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    timestamp
  };

  MERCHANDISING_AUDIT_LOGS_STORE.unshift(log);

  try {
    await addDoc(collection(db, 'merchandising_audit_logs'), log);
  } catch (err) {
    // Firestore sync notice
  }

  return log;
}

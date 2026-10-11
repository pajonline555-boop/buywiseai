export interface CategoryCapabilities {
  category: string;
  tryOnSupported: boolean;
  priceComparisonSupported: boolean;
  unitPriceSupported: boolean; // e.g., per kg for grocery
  packSizeRelevant: boolean;
}

const CATEGORY_CAPABILITIES: Record<string, CategoryCapabilities> = {
  FASHION: {
    category: 'FASHION',
    tryOnSupported: true,
    priceComparisonSupported: true,
    unitPriceSupported: false,
    packSizeRelevant: false,
  },
  JEWELLERY: {
    category: 'JEWELLERY',
    tryOnSupported: true,
    priceComparisonSupported: true,
    unitPriceSupported: false,
    packSizeRelevant: false,
  },
  GROCERY: {
    category: 'GROCERY',
    tryOnSupported: false, // Strictly NO VTO for grocery/atta/flour
    priceComparisonSupported: true,
    unitPriceSupported: true,
    packSizeRelevant: true,
  },
  ELECTRONICS: {
    category: 'ELECTRONICS',
    tryOnSupported: false, // NO VTO for phones/laptops/headphones
    priceComparisonSupported: true,
    unitPriceSupported: false,
    packSizeRelevant: false,
  },
  HOME: {
    category: 'HOME',
    tryOnSupported: false,
    priceComparisonSupported: true,
    unitPriceSupported: false,
    packSizeRelevant: false,
  },
  BOOKS: {
    category: 'BOOKS',
    tryOnSupported: false,
    priceComparisonSupported: true,
    unitPriceSupported: false,
    packSizeRelevant: false,
  },
  BEAUTY: {
    category: 'BEAUTY',
    tryOnSupported: true, // Supported for lipstick / makeup
    priceComparisonSupported: true,
    unitPriceSupported: false,
    packSizeRelevant: false,
  },
  GENERAL: {
    category: 'GENERAL',
    tryOnSupported: false,
    priceComparisonSupported: true,
    unitPriceSupported: false,
    packSizeRelevant: false,
  },
};

export function getCategoryCapabilities(category: string): CategoryCapabilities {
  const normalized = category.toUpperCase().trim();
  return CATEGORY_CAPABILITIES[normalized] || CATEGORY_CAPABILITIES.GENERAL;
}

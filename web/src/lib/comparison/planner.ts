import { CanonicalProduct } from '../query/types';

export function selectRetailerQuery(
  canonical: CanonicalProduct,
  retailerId: string,
  searchMode: 'exact' | 'similar' = 'exact'
): string {
  if (searchMode === 'similar') {
    return (
      canonical.similarSearchQueries[0] ||
      canonical.broadSearchQueries[0] ||
      canonical.rawInput ||
      canonical.title
    );
  }

  // Exact Mode Query Selection per Retailer Strength
  switch (retailerId.toLowerCase()) {
    case 'amazon':
    case 'ebay':
      // Amazon & eBay perform best with precise brand + model query strings
      return (
        canonical.exactSearchQueries[0] ||
        canonical.title ||
        canonical.rawInput
      );

    case 'flipkart':
      // Flipkart performs best with slightly broader title/category queries
      return (
        canonical.exactSearchQueries[1] ||
        canonical.exactSearchQueries[0] ||
        canonical.broadSearchQueries[0] ||
        canonical.title
      );

    default:
      return (
        canonical.exactSearchQueries[0] ||
        canonical.title ||
        canonical.rawInput
      );
  }
}

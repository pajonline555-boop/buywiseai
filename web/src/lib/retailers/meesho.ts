import { RetailerAdapter, RetailerSearchResult, StoreOffer } from './types';

export class MeeshoAdapter implements RetailerAdapter {
  readonly id = 'meesho';
  readonly name = 'Meesho';
  readonly country = 'IN';
  readonly currency = 'INR';
  readonly enabled = true;
  readonly logo = 'https://upload.wikimedia.org/wikipedia/commons/8/80/Meesho_Logo.png';

  async search(query: string): Promise<RetailerSearchResult> {
    const timestamp = new Date().toISOString();
    const cleanQuery = query.trim();
    const searchUrl = `https://www.meesho.com/search?q=${encodeURIComponent(cleanQuery)}`;

    // Meesho does not offer an authorized public product search API or affiliate data feed.
    // BuyWise AI provides an honest, clearly labelled search-link fallback rather than fabricating fake prices.
    const searchLinkOffer: StoreOffer = {
      id: `meesho-search-${Date.now()}`,
      retailerId: this.id,
      store: this.name,
      title: `Search Meesho for "${cleanQuery}"`,
      url: searchUrl,
      directProductUrl: searchUrl,
      affiliateUrl: searchUrl,
      isDirectProductLink: false,
      price: 0,
      currency: this.currency,
      availability: 'unknown',
      checkedAt: timestamp,
      sourceType: 'affiliate',
      verificationStatus: 'unverified',
      logo: this.logo,
      isSearchLinkOnly: true,
      sourceLabel: 'Search Link Only',
      dataFreshness: 'Direct Retailer Search Link (Prices & availability verified on Meesho)',
      deliveryText: 'Explore latest seller catalogs on Meesho',
      provenance: {
        source: 'affiliate',
        provider: 'Meesho Search Link',
        lastChecked: timestamp,
        isLiveFeed: false,
      },
    };

    return {
      retailer: {
        id: this.id,
        name: this.name,
        country: this.country,
        currency: this.currency,
        enabled: this.enabled,
        logo: this.logo,
      },
      offers: [searchLinkOffer],
      success: true,
      error: 'Meesho public API unavailable. Providing direct search link fallback.',
      checkedAt: timestamp,
    };
  }
}

export const meeshoAdapter = new MeeshoAdapter();


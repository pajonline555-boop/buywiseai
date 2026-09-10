import { RetailerAdapter, RetailerSearchResult, StoreOffer } from './types';

export class WalmartAdapter implements RetailerAdapter {
  readonly id = 'walmart';
  readonly name = 'Walmart';
  readonly country = 'US';
  readonly currency = 'INR';
  readonly enabled = true;
  readonly logo = 'https://upload.wikimedia.org/wikipedia/commons/c/ca/Walmart_logo.svg';

  async search(query: string): Promise<RetailerSearchResult> {
    const timestamp = new Date().toISOString();
    const url = `https://www.walmart.com/search?q=${encodeURIComponent(query)}`;

    const offer: StoreOffer = {
      id: `wal-${Date.now()}`,
      retailerId: this.id,
      store: this.name,
      title: query,
      url,
      price: 131000,
      currency: this.currency,
      logo: this.logo,
      availability: 'in_stock',
      checkedAt: timestamp,
      sourceType: 'mock',
    };

    return {
      retailer: { id: this.id, name: this.name, country: this.country, currency: this.currency, enabled: this.enabled, logo: this.logo },
      offers: [offer],
      success: true,
      checkedAt: timestamp,
    };
  }
}

export const walmartAdapter = new WalmartAdapter();

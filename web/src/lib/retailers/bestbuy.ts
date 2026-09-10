import { RetailerAdapter, RetailerSearchResult, StoreOffer } from './types';

export class BestBuyAdapter implements RetailerAdapter {
  readonly id = 'bestbuy';
  readonly name = 'Best Buy';
  readonly country = 'US';
  readonly currency = 'INR';
  readonly enabled = true;
  readonly logo = 'https://upload.wikimedia.org/wikipedia/commons/f/f5/Best_Buy_Logo.svg';

  async search(query: string): Promise<RetailerSearchResult> {
    const timestamp = new Date().toISOString();
    const url = `https://www.bestbuy.com/site/searchpage.jsp?st=${encodeURIComponent(query)}`;

    const offer: StoreOffer = {
      id: `bb-${Date.now()}`,
      retailerId: this.id,
      store: this.name,
      title: query,
      url,
      price: 132500,
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

export const bestBuyAdapter = new BestBuyAdapter();

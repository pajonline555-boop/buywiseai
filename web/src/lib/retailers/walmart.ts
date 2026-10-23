import { RetailerAdapter, RetailerSearchResult, StoreOffer } from './types';

export class WalmartAdapter implements RetailerAdapter {
  readonly id = 'walmart';
  readonly name = 'Walmart';
  readonly country = 'US';
  readonly currency = 'INR';
  readonly enabled = false;
  readonly logo = 'https://upload.wikimedia.org/wikipedia/commons/c/ca/Walmart_logo.svg';

  async search(_query: string): Promise<RetailerSearchResult> {
    const timestamp = new Date().toISOString();

    return {
      retailer: { id: this.id, name: this.name, country: this.country, currency: this.currency, enabled: false, logo: this.logo },
      offers: [],
      success: false,
      error: 'Walmart is not supported for Indian retail product comparisons.',
      checkedAt: timestamp,
    };
  }
}

export const walmartAdapter = new WalmartAdapter();

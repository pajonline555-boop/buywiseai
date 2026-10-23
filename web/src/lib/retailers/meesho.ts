import { RetailerAdapter, RetailerSearchResult } from './types';

export class MeeshoAdapter implements RetailerAdapter {
  readonly id = 'meesho';
  readonly name = 'Meesho';
  readonly country = 'IN';
  readonly currency = 'INR';
  readonly enabled = true;
  readonly logo = 'https://upload.wikimedia.org/wikipedia/commons/8/80/Meesho_Logo.png';

  async search(_query: string): Promise<RetailerSearchResult> {
    const timestamp = new Date().toISOString();

    // Meesho does not offer an authorized public product search API or affiliate data feed.
    // Rather than fabricating prices or products, BuyWise AI marks Meesho unavailable.
    return {
      retailer: {
        id: this.id,
        name: this.name,
        country: this.country,
        currency: this.currency,
        enabled: this.enabled,
        logo: this.logo,
      },
      offers: [],
      success: false,
      error: 'Meesho currently does not offer an authorized public product search API or affiliate product feed. Connection status: API_UNAVAILABLE.',
      checkedAt: timestamp,
    };
  }
}

export const meeshoAdapter = new MeeshoAdapter();

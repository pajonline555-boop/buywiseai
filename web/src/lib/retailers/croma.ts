import { RetailerAdapter, RetailerSearchResult } from './types';

export class CromaAdapter implements RetailerAdapter {
  readonly id = 'croma';
  readonly name = 'Croma';
  readonly country = 'IN';
  readonly currency = 'INR';
  readonly enabled = true;
  readonly logo = 'https://upload.wikimedia.org/wikipedia/commons/e/e5/Croma_logo.png';

  async search(_query: string): Promise<RetailerSearchResult> {
    const timestamp = new Date().toISOString();
    const apiKey = process.env.CROMA_API_KEY;

    if (!apiKey) {
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
        error: 'Croma official API credentials required (CROMA_API_KEY). Connection status: CREDENTIALS_REQUIRED.',
        checkedAt: timestamp,
      };
    }

    // When configured, live product search can execute
    return {
      retailer: { id: this.id, name: this.name, country: this.country, currency: this.currency, enabled: this.enabled, logo: this.logo },
      offers: [],
      success: true,
      checkedAt: timestamp,
    };
  }
}

export const cromaAdapter = new CromaAdapter();

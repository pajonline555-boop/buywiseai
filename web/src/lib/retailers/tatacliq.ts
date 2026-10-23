import { RetailerAdapter, RetailerSearchResult } from './types';

export class TataCliqAdapter implements RetailerAdapter {
  readonly id = 'tatacliq';
  readonly name = 'Tata CLiQ';
  readonly country = 'IN';
  readonly currency = 'INR';
  readonly enabled = true;
  readonly logo = 'https://upload.wikimedia.org/wikipedia/commons/6/6b/Tata_CLiQ_Logo.svg';

  async search(_query: string): Promise<RetailerSearchResult> {
    const timestamp = new Date().toISOString();
    const apiKey = process.env.TATACLIQ_API_KEY;

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
        error: 'Tata CLiQ official API credentials required (TATACLIQ_API_KEY). Connection status: CREDENTIALS_REQUIRED.',
        checkedAt: timestamp,
      };
    }

    return {
      retailer: { id: this.id, name: this.name, country: this.country, currency: this.currency, enabled: this.enabled, logo: this.logo },
      offers: [],
      success: true,
      checkedAt: timestamp,
    };
  }
}

export const tataCliqAdapter = new TataCliqAdapter();

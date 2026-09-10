import { RetailerAdapter, RetailerSearchResult } from './types';

export class RelianceDigitalAdapter implements RetailerAdapter {
  readonly id = 'reliancedigital';
  readonly name = 'Reliance Digital';
  readonly country = 'IN';
  readonly currency = 'INR';
  readonly enabled = false; // Disabled by user request
  readonly logo = 'https://upload.wikimedia.org/wikipedia/commons/3/30/Reliance_Digital_Logo.svg';

  async search(query: string): Promise<RetailerSearchResult> {
    const timestamp = new Date().toISOString();
    return {
      retailer: { id: this.id, name: this.name, country: this.country, currency: this.currency, enabled: false, logo: this.logo },
      offers: [],
      success: true,
      checkedAt: timestamp,
    };
  }
}

export const relianceDigitalAdapter = new RelianceDigitalAdapter();

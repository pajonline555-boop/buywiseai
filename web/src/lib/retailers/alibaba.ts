import { RetailerAdapter, RetailerSearchResult } from './types';

/**
 * Alibaba Retailer Adapter (Restricted for Indian Traffic)
 * NOTE: Alibaba affiliate rules explicitly state that traffic from India is NOT eligible for commissions.
 * Therefore, this adapter is disabled for Indian region queries (`enabled: false`).
 */
export class AlibabaAdapter implements RetailerAdapter {
  readonly id = 'alibaba';
  readonly name = 'Alibaba';
  readonly country = 'CN';
  readonly currency = 'USD';
  // Explicitly disabled for India traffic commission compliance
  readonly enabled = false;
  readonly logo = 'https://upload.wikimedia.org/wikipedia/commons/1/1b/Alibaba.com_logo.png';
  readonly restrictionReason = 'Alibaba affiliate rules explicitly exclude traffic from India from earning publisher commissions.';

  async search(query: string): Promise<RetailerSearchResult> {
    const timestamp = new Date().toISOString();

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
      error: 'Alibaba affiliate program currently excludes Indian traffic from earning commissions. Store adapter is disabled for BuyWise India.',
      checkedAt: timestamp,
    };
  }
}

export const alibabaAdapter = new AlibabaAdapter();

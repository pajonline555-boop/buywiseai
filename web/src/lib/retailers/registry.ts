import { RetailerAdapter } from './types';
import { amazonAdapter } from './amazon';
import { flipkartAdapter } from './flipkart';
import { cromaAdapter } from './croma';
import { tataCliqAdapter } from './tatacliq';
import { meeshoAdapter } from './meesho';
import { myntraAdapter } from './myntra';
import { nykaaAdapter } from './nykaa';
import { ajioAdapter } from './ajio';
import { etsyAdapter } from './etsy';
import { ebayAdapter } from './ebay';
import { walmartAdapter } from './walmart';
import { cuelinksAdapter } from './cuelinks';
import { vcommissionAdapter } from './vcommission';
import { BuyWisePartnerAdapter } from './partnerAdapter';

export class RetailerRegistry {
  private adapters: Map<string, RetailerAdapter> = new Map();

  constructor() {
    // Level 3 — BuyWise Partner Marketplace
    this.register(new BuyWisePartnerAdapter());

    // Level 1 — Direct Retailer Adapters (India Phase A & International Phase B)
    this.register(amazonAdapter);
    this.register(flipkartAdapter);
    this.register(meeshoAdapter);
    this.register(myntraAdapter);
    this.register(nykaaAdapter);
    this.register(ajioAdapter);
    this.register(tataCliqAdapter);
    this.register(cromaAdapter);
    this.register(etsyAdapter);
    this.register(ebayAdapter);
    this.register(walmartAdapter);

    // Level 2 — Affiliate Network Adapters (Phase C)
    this.register(cuelinksAdapter);
    this.register(vcommissionAdapter);
  }

  public register(adapter: RetailerAdapter): void {
    if (adapter.enabled) {
      this.adapters.set(adapter.id, adapter);
    }
  }

  public getEnabledAdapters(): RetailerAdapter[] {
    return Array.from(this.adapters.values()).filter((a) => a.enabled);
  }

  public getAdapter(id: string): RetailerAdapter | undefined {
    return this.adapters.get(id);
  }
}

export const retailerRegistry = new RetailerRegistry();

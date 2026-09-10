import { RetailerAdapter, RetailerSearchResult, StoreOffer } from './types';
import axios from 'axios';

let cachedAccessToken: string | null = null;
let tokenExpiresAt = 0;

export class EbayAdapter implements RetailerAdapter {
  readonly id = 'ebay';
  readonly name = 'eBay';
  readonly country = 'GLOBAL';
  readonly currency = 'INR';
  readonly enabled = true;
  readonly logo = 'https://upload.wikimedia.org/wikipedia/commons/1/1b/EBay_logo.svg';

  private async getAccessToken(clientId: string, clientSecret: string): Promise<string> {
    const now = Date.now();
    if (cachedAccessToken && now < tokenExpiresAt - 60000) {
      return cachedAccessToken;
    }

    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const tokenUrl = 'https://api.ebay.com/identity/v1/oauth2/token';

    const response = await axios.post(
      tokenUrl,
      'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${authHeader}`,
        },
        timeout: 7000,
      }
    );

    const token = response.data?.access_token;
    const expiresIn = response.data?.expires_in || 7200;

    if (!token) {
      throw new Error('Failed to retrieve OAuth access token from eBay');
    }

    cachedAccessToken = token;
    tokenExpiresAt = now + expiresIn * 1000;
    return token;
  }

  async search(query: string): Promise<RetailerSearchResult> {
    const timestamp = new Date().toISOString();
    const clientId = process.env.EBAY_CLIENT_ID;
    const clientSecret = process.env.EBAY_CLIENT_SECRET;

    // Graceful check for configured credentials
    if (!clientId || !clientSecret) {
      return {
        retailer: { id: this.id, name: this.name, country: this.country, currency: this.currency, enabled: this.enabled, logo: this.logo },
        offers: [],
        success: false,
        error: 'eBay Browse API credentials not configured.',
        checkedAt: timestamp,
      };
    }

    try {
      const accessToken = await this.getAccessToken(clientId, clientSecret);
      const searchUrl = `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${encodeURIComponent(query)}&limit=5`;

      const response = await axios.get(searchUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-EBAY-C-MARKETPLACE-ID': 'EBAY-IN',
        },
        timeout: 7000,
      });

      const items = response.data?.itemSummaries || [];

      if (items.length === 0) {
        return {
          retailer: { id: this.id, name: this.name, country: this.country, currency: this.currency, enabled: this.enabled, logo: this.logo },
          offers: [],
          success: true,
          checkedAt: timestamp,
        };
      }

      const offers: StoreOffer[] = items.map((item: any) => {
        const priceVal = parseFloat(item.price?.value || '0');
        const sellerRatingStr = item.seller?.feedbackPercentage;
        const sellerRating = sellerRatingStr ? parseFloat(sellerRatingStr) / 20 : undefined; // Convert 100% to 5-star scale

        return {
          id: `ebay-${item.itemId || Date.now()}`,
          retailerId: this.id,
          store: this.name,
          title: item.title || query,
          url: item.itemWebUrl || `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}`,
          price: priceVal,
          currency: item.price?.currency || this.currency,
          imageUrl: item.image?.imageUrl || item.thumbnailImages?.[0]?.imageUrl,
          logo: this.logo,
          rating: sellerRating,
          sellerName: item.seller?.username || 'Verified Seller',
          availability: 'in_stock',
          checkedAt: timestamp,
          sourceType: 'api',
        };
      });

      return {
        retailer: { id: this.id, name: this.name, country: this.country, currency: this.currency, enabled: this.enabled, logo: this.logo },
        offers,
        success: true,
        checkedAt: timestamp,
      };
    } catch (err: any) {
      return {
        retailer: { id: this.id, name: this.name, country: this.country, currency: this.currency, enabled: this.enabled, logo: this.logo },
        offers: [],
        success: false,
        error: err?.response?.data?.errors?.[0]?.message || err?.message || 'eBay Browse API request failed',
        checkedAt: timestamp,
      };
    }
  }
}

export const ebayAdapter = new EbayAdapter();

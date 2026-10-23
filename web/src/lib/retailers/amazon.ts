import { RetailerAdapter, RetailerSearchResult, StoreOffer } from './types';
import { generateAmazonPAAPIHeaders } from './amazon-auth';
import axios from 'axios';

export function sanitizeSearchQuery(query: string): string {
  let cleaned = query.trim().replace(/\s+/g, ' ');
  cleaned = cleaned.replace(/\bi\s*phone\b/gi, 'iPhone');
  cleaned = cleaned.replace(/\bi\s*pad\b/gi, 'iPad');
  cleaned = cleaned.replace(/\bmac\s*book\b/gi, 'MacBook');
  return cleaned;
}

export class AmazonAdapter implements RetailerAdapter {
  readonly id = 'amazon';
  readonly name = 'Amazon India';
  readonly country = 'IN';
  readonly currency = 'INR';
  readonly enabled = true;
  readonly logo = 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg';

  async search(query: string): Promise<RetailerSearchResult> {
    const timestamp = new Date().toISOString();
    const cleanQuery = sanitizeSearchQuery(query);
    const accessKey = process.env.AMAZON_PAAPI_KEY;
    const secretKey = process.env.AMAZON_PAAPI_SECRET;
    const partnerTag = process.env.AMAZON_ASSOCIATE_TAG || 'pajonline-21';

    // Official PA-API credentials check
    if (!accessKey || !secretKey) {
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
        error: 'Amazon India official PA-API 5.0 credentials required (AMAZON_PAAPI_KEY / AMAZON_PAAPI_SECRET). Live product verification requires authorized API access.',
        checkedAt: timestamp,
      };
    }

    try {
      const payload = {
        Keywords: cleanQuery,
        Resources: [
          'ItemInfo.Title',
          'ItemInfo.ByLineInfo',
          'ItemInfo.Classifications',
          'Offers.Listings.Price',
          'Offers.Listings.SavingBasis',
          'Offers.Listings.Availability.Message',
          'Images.Primary.Large',
          'CustomerReviews.Count',
          'CustomerReviews.StarRating',
        ],
        PartnerTag: partnerTag,
        PartnerType: 'Associates',
        Marketplace: 'www.amazon.in',
      };

      const headers = generateAmazonPAAPIHeaders({ accessKey, secretKey, partnerTag }, payload);
      const response = await axios.post('https://webservices.amazon.in/paapi5/searchitems', payload, {
        headers,
        timeout: 7000,
      });

      const searchResult = response.data?.SearchResult;
      const items = searchResult?.Items || [];

      if (items.length === 0) {
        return {
          retailer: { id: this.id, name: this.name, country: this.country, currency: this.currency, enabled: this.enabled, logo: this.logo },
          offers: [],
          success: true,
          checkedAt: timestamp,
        };
      }

      const offers: StoreOffer[] = items.map((item: any) => {
        const listing = item.Offers?.Listings?.[0];
        const priceAmount = listing?.Price?.Amount || 0;
        const savingBasis = listing?.SavingBasis?.Amount || priceAmount;
        const discount = savingBasis > priceAmount ? savingBasis - priceAmount : 0;
        const rating = item.CustomerReviews?.StarRating?.Value ? parseFloat(item.CustomerReviews.StarRating.Value) : undefined;
        const reviewCount = item.CustomerReviews?.Count ? parseInt(item.CustomerReviews.Count, 10) : undefined;

        const rawUrl = item.DetailPageURL || `https://www.amazon.in/dp/${item.ASIN}?tag=${partnerTag}`;
        const itemUrl = rawUrl.includes('?') ? `${rawUrl}&tag=${partnerTag}` : `${rawUrl}?tag=${partnerTag}`;
        const imageUrl = item.Images?.Primary?.Large?.URL;
        const brand = item.ItemInfo?.ByLineInfo?.Brand?.DisplayValue;
        const title = item.ItemInfo?.Title?.DisplayValue || cleanQuery;

        return {
          id: `amz-${item.ASIN || Date.now()}`,
          retailerId: this.id,
          store: this.name,
          title,
          url: itemUrl,
          directProductUrl: itemUrl,
          affiliateUrl: itemUrl,
          isDirectProductLink: Boolean(item.ASIN),
          price: priceAmount,
          currency: listing?.Price?.Currency || this.currency,
          originalPrice: savingBasis,
          mrp: savingBasis,
          discount,
          imageUrl,
          logo: this.logo,
          rating,
          reviewCount,
          availability: listing?.Availability?.Message?.toLowerCase().includes('in stock') ? 'in_stock' : 'unknown',
          checkedAt: timestamp,
          sourceType: 'api',
          verificationStatus: 'verified_live',
          brand,
          productId: item.ASIN,
          listedPrice: priceAmount,
          shippingFee: 0,
          effectivePayablePrice: priceAmount,
          priceBasis: 'listed',
          dataFreshness: 'Live Amazon PA-API 5.0 Feed',
          provenance: {
            source: 'api',
            provider: 'Amazon India PA-API 5.0',
            rawListingId: item.ASIN,
            lastChecked: timestamp,
            isLiveFeed: true,
          },
          imageProvenance: {
            url: imageUrl,
            isGenuineProductImage: Boolean(imageUrl),
            isFallback: false,
          },
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
        error: err?.response?.data?.Errors?.[0]?.Message || err?.message || 'Amazon PA-API request failed',
        checkedAt: timestamp,
      };
    }
  }
}

export const amazonAdapter = new AmazonAdapter();

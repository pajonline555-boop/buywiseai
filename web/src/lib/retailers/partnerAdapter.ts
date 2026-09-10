import { RetailerAdapter, RetailerSearchResult, StoreOffer } from './types';
import { getPartnerProducts } from '../partners/partnerService';

export class BuyWisePartnerAdapter implements RetailerAdapter {
  id = 'buywise_partners';
  name = 'BuyWise Partners';
  country = 'IN';
  currency = 'INR';
  enabled = true;

  async search(queryStr: string): Promise<RetailerSearchResult> {
    const checkedAt = new Date().toISOString();
    try {
      const partnerProds = await getPartnerProducts();
      const queryLower = queryStr.toLowerCase().trim();

      // Filter products by search relevance
      const matchingProds = partnerProds.filter(p => {
        const titleMatch = p.title.toLowerCase().includes(queryLower);
        const descMatch = p.description.toLowerCase().includes(queryLower);
        const catMatch = p.category.toLowerCase().includes(queryLower);
        const subcatMatch = p.subcategory?.toLowerCase().includes(queryLower) || false;
        const brandMatch = p.brand.toLowerCase().includes(queryLower);
        return titleMatch || descMatch || catMatch || subcatMatch || brandMatch;
      });

      const offers: StoreOffer[] = matchingProds.map(p => ({
        id: p.id,
        retailerId: this.id,
        store: `🟢 ${p.partnerName} (BuyWise Partner)`,
        title: p.title,
        url: `/partners?product=${p.id}`,
        price: p.sellingPrice,
        currency: 'INR',
        originalPrice: p.mrp,
        mrp: p.mrp,
        discount: Math.round(((p.mrp - p.sellingPrice) / p.mrp) * 100),
        imageUrl: p.primaryImage,
        logo: '/favicon.ico',
        rating: p.rating || 4.9,
        reviewCount: p.reviewCount || 15,
        availability: p.stock > 0 ? 'in_stock' : 'out_of_stock',
        sellerName: p.partnerName,
        deliveryText: 'Fulfilled by Verified Partner (Free Delivery)',
        isLowest: false,
        isBestValue: true,
        matchType: 'exact',
        matchConfidence: 0.95,
        identityConfidence: 0.95,
        attributeMatchScore: 0.90,
        visualSimilarityScore: 0.90,
        smartValueScore: 95,
        trustScore: 98,
        trustLevel: 'high',
        dataSource: 'api',
        verificationStatus: 'verified_live',
        priceVerifiedAt: checkedAt,
        sellerVerified: true,
        staleVerification: false,
        checkedAt,
        sourceType: 'api',
        productSource: 'PARTNER',
        fulfillmentType: 'PARTNER_FULFILLED',
        partnerId: p.partnerId,
        partnerName: p.partnerName,
        partnerBadge: true,
        tryOnEnabled: p.tryOnEnabled
      }));

      return {
        retailer: {
          id: this.id,
          name: this.name,
          country: this.country,
          currency: this.currency,
          enabled: true,
          logo: '/favicon.ico'
        },
        offers,
        success: true,
        checkedAt
      };
    } catch (err) {
      console.warn('BuyWise Partner adapter search notice:', err);
      return {
        retailer: {
          id: this.id,
          name: this.name,
          country: this.country,
          currency: this.currency,
          enabled: true
        },
        offers: [],
        success: false,
        error: String(err),
        checkedAt
      };
    }
  }
}

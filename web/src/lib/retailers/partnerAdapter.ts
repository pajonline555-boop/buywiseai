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

      const tokens = queryLower.split(/\s+/).filter(t => t.length > 2);

      // Filter products by search relevance (exact substring or keyword token match)
      const matchingProds = partnerProds.filter(p => {
        const titleLower = p.title.toLowerCase();
        const descLower = p.description.toLowerCase();
        const catLower = p.category.toLowerCase();
        const subcatLower = (p.subcategory || '').toLowerCase();
        const brandLower = p.brand.toLowerCase();

        if (titleLower.includes(queryLower) || descLower.includes(queryLower) || catLower.includes(queryLower)) {
          return true;
        }
        return tokens.length > 0 && tokens.some(tok => 
          titleLower.includes(tok) || descLower.includes(tok) || catLower.includes(tok) || subcatLower.includes(tok) || brandLower.includes(tok)
        );
      });

      // Filter only live/approved products
      const liveMatchingProds = matchingProds.filter(p => 
        (p.status === 'LIVE' || (p.status as any) === 'ACTIVE') && 
        p.reviewStatus !== 'REJECTED' && 
        p.reviewStatus !== 'SUSPENDED' && 
        p.reviewStatus !== 'ARCHIVED'
      );

      const offers: StoreOffer[] = liveMatchingProds.map(p => {
        const isVerifiedLive = p.verificationStatus === 'verified_live';
        const deliveryText = p.shippingCharges && p.shippingCharges > 0 
          ? `Fulfilled by ${p.partnerName} (+₹${p.shippingCharges} Delivery)`
          : 'Fulfilled by Partner (Free Delivery)';

        return {
          id: p.id,
          retailerId: this.id,
          store: '🟢 BuyWise Store',
          title: p.title,
          url: p.productUrl && p.productUrl.startsWith('http') ? p.productUrl : `https://buywiseai.pajonline.co.in/partners?product=${p.id}`,
          directProductUrl: `https://buywiseai.pajonline.co.in/partners?product=${p.id}`,
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
          deliveryText,
          isLowest: false,
          isBestValue: isVerifiedLive,
          matchType: 'exact',
          matchConfidence: 0.95,
          identityConfidence: 0.95,
          attributeMatchScore: 0.90,
          visualSimilarityScore: 0.90,
          smartValueScore: 95,
          trustScore: isVerifiedLive ? 98 : 85,
          trustLevel: isVerifiedLive ? 'high' : 'moderate',
          dataSource: 'api',
          verificationStatus: isVerifiedLive ? 'verified_live' : 'unverified',
          priceVerifiedAt: isVerifiedLive ? (p.priceVerifiedAt || checkedAt) : undefined,
          sellerVerified: isVerifiedLive,
          staleVerification: false,
          checkedAt,
          sourceType: 'api',
          productSource: 'PARTNER',
          fulfillmentType: 'PARTNER_FULFILLED',
          partnerId: p.partnerId,
          partnerName: p.partnerName,
          partnerBadge: isVerifiedLive,
          tryOnEnabled: p.tryOnEnabled
        };
      });

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

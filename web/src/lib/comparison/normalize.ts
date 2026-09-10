import { StoreOffer } from '../retailers/types';
import { verifyOfferStatus } from '../retailers/verification';

export function normalizeOffer(offer: Partial<StoreOffer> & { price: number; store: string }): StoreOffer {
  const checkedAt = offer.checkedAt || new Date().toISOString();
  const sourceType = offer.sourceType || 'mock';

  const baseOffer: StoreOffer = {
    id: offer.id || `${offer.store.toLowerCase()}-${Date.now()}`,
    retailerId: offer.retailerId || offer.store.toLowerCase(),
    store: offer.store,
    title: offer.title || 'Product Offer',
    url: offer.url || '#',
    price: offer.price,
    currency: offer.currency || 'INR',
    originalPrice: offer.originalPrice || offer.mrp || offer.price,
    mrp: offer.mrp || offer.originalPrice || offer.price,
    discount: offer.discount || (offer.originalPrice ? offer.originalPrice - offer.price : 0),
    imageUrl: offer.imageUrl,
    logo: offer.logo || '',
    rating: typeof offer.rating === 'number' ? offer.rating : undefined,
    reviewCount: typeof offer.reviewCount === 'number' ? offer.reviewCount : undefined,
    availability: offer.availability || 'in_stock',
    sellerName: offer.sellerName || offer.store,
    deliveryText: offer.deliveryText,
    isLowest: offer.isLowest || false,
    matchType: offer.matchType || 'exact',
    checkedAt,
    sourceType,
    dataSource: sourceType,
  };

  // Attach verification status properties
  const verification = verifyOfferStatus(baseOffer);
  baseOffer.verificationStatus = verification.verificationStatus;
  baseOffer.staleVerification = verification.staleVerification;
  baseOffer.priceVerifiedAt = verification.priceVerifiedAt;
  baseOffer.sellerVerified = verification.sellerVerified;

  return baseOffer;
}

import { StoreOffer } from '../retailers/types';
import { verifyOfferStatus } from '../retailers/verification';
import { extractBrandFromText, extractSneakerModel } from './matcher';

export function normalizeOffer(offer: Partial<StoreOffer> & { price: number; store: string }): StoreOffer {
  const checkedAt = offer.checkedAt || new Date().toISOString();
  const sourceType = offer.sourceType || 'mock';

  const listedPrice = typeof offer.listedPrice === 'number' ? offer.listedPrice : offer.price;
  const shippingFee = typeof offer.shippingFee === 'number' ? offer.shippingFee : 0;
  const effectivePayablePrice = typeof offer.effectivePayablePrice === 'number'
    ? offer.effectivePayablePrice
    : listedPrice + shippingFee;

  const directProductUrl = offer.directProductUrl || (offer.isDirectProductLink ? offer.url : undefined);
  const isDirectProductLink = Boolean(offer.isDirectProductLink || (offer.url && (offer.url.includes('/dp/') || offer.url.includes('/p/'))));

  const brand = offer.brand || extractBrandFromText(offer.title || '') || undefined;
  const model = offer.model || extractSneakerModel(offer.title || '') || undefined;

  const baseOffer: StoreOffer = {
    id: offer.id || `${offer.store.toLowerCase()}-${Date.now()}`,
    retailerId: offer.retailerId || offer.store.toLowerCase(),
    store: offer.store,
    title: offer.title || 'Product Offer',
    url: offer.url || '#',
    directProductUrl,
    affiliateUrl: offer.affiliateUrl || offer.url,
    isDirectProductLink,
    price: offer.price,
    listedPrice,
    shippingFee,
    effectivePayablePrice,
    priceBasis: shippingFee > 0 ? 'effective_payable' : 'listed',
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
    brand,
    model,
    variant: offer.variant,
    tier: offer.tier,
    dataFreshness: offer.dataFreshness || 'Verified Today',
    provenance: offer.provenance,
    imageProvenance: offer.imageProvenance,
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

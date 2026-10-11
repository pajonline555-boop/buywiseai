import { StoreOffer } from '../retailers/types';

export interface SearchValidationResult {
  isValid: boolean;
  rejectionReasons: string[];
}

/**
 * Validates candidate search result offers from live retailer adapters.
 * Rejects fake prices, negative prices, ₹0, synthetic titles, broken images.
 */
export function validateSearchResultOffer(offer: Partial<StoreOffer>): SearchValidationResult {
  const rejectionReasons: string[] = [];

  if (!offer.title || typeof offer.title !== 'string' || offer.title.trim().length < 2) {
    rejectionReasons.push('Missing or empty title');
  }

  // Reject synthetic default product titles generated from query
  if (offer.title && offer.title.toLowerCase().includes('premium edition with live deal')) {
    rejectionReasons.push('Synthetic fabricated product title rejected');
  }

  if (typeof offer.price !== 'number' || isNaN(offer.price) || offer.price <= 0) {
    rejectionReasons.push(`Invalid price amount: ${offer.price}`);
  }

  // Reject obvious synthetic placeholder prices
  if (offer.price === 14999 && (!offer.store || offer.store === 'Amazon India') && offer.sourceType !== 'api') {
    rejectionReasons.push('Synthetic default price ₹14,999 rejected');
  }

  if (!offer.url || !offer.url.startsWith('http')) {
    rejectionReasons.push('Missing or invalid offer destination URL');
  }

  if (offer.imageUrl) {
    const imgLower = offer.imageUrl.toLowerCase();
    if (imgLower.includes('photo-1620799140188') || imgLower.includes('photo-1618354691373')) {
      rejectionReasons.push('Generic hoodie/t-shirt stock photo rejected for unrelated search');
    }
  }

  return {
    isValid: rejectionReasons.length === 0,
    rejectionReasons,
  };
}

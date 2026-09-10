import { StoreOffer } from '../retailers/types';

export function isValidQuery(query: string | null | undefined): boolean {
  if (!query) return false;
  const trimmed = query.trim();
  if (trimmed.length === 0 || trimmed.length > 250) return false;
  return true;
}

export function isValidOffer(offer: StoreOffer | null | undefined): boolean {
  if (!offer) return false;
  
  // Validate numeric price
  if (typeof offer.price !== 'number' || isNaN(offer.price) || offer.price <= 0) {
    return false;
  }

  // Validate required metadata
  if (!offer.store || !offer.title || !offer.url) {
    return false;
  }

  return true;
}

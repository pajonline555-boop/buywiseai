import { StoreOffer } from '../retailers/types';
import { PriceHistoryEntry } from './types';

// In-memory Price History Store
const priceHistoryStore: Map<string, PriceHistoryEntry[]> = new Map();

export function recordPriceHistory(offer: StoreOffer, productId: string): boolean {
  // ZERO MOCK CONTAMINATION RULE: Mock data is strictly forbidden from contaminating price history
  if (offer.sourceType === 'mock' || offer.verificationStatus === 'unverified') {
    return false;
  }

  const skuKey = productId.toLowerCase().trim();
  const entry: PriceHistoryEntry = {
    id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    productId: skuKey,
    retailerId: offer.retailerId || offer.store.toLowerCase(),
    store: offer.store,
    price: offer.price,
    mrp: offer.mrp || offer.originalPrice,
    currency: offer.currency || 'INR',
    timestamp: offer.checkedAt || new Date().toISOString(),
    verificationStatus: offer.verificationStatus || 'verified_live',
    dataSource: offer.sourceType,
  };

  const existing = priceHistoryStore.get(skuKey) || [];
  
  // Deduplicate exact same timestamp & price entries
  const isDuplicate = existing.some(
    e => e.retailerId === entry.retailerId && e.price === entry.price && e.timestamp === entry.timestamp
  );

  if (!isDuplicate) {
    existing.push(entry);
    priceHistoryStore.set(skuKey, existing);
    return true;
  }

  return false;
}

export function getPriceHistory(productId: string, retailerId?: string): PriceHistoryEntry[] {
  const skuKey = productId.toLowerCase().trim();
  const history = priceHistoryStore.get(skuKey) || [];

  if (retailerId) {
    return history.filter(h => h.retailerId.toLowerCase() === retailerId.toLowerCase());
  }

  return history;
}

export function clearPriceHistoryStore(): void {
  priceHistoryStore.clear();
}

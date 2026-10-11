import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { AffiliateNetworkType } from './affiliateConfig';

export type AffiliateSourceContext =
  | 'SEARCH'
  | 'GEN_G_STORE'
  | 'HOME'
  | 'PRODUCT_PAGE'
  | 'MAYA'
  | 'NOTIFICATION'
  | 'COMPARISON'
  | 'OTHER';

export interface AffiliateClickEvent {
  eventId: string;
  userIdHash?: string;
  sessionId: string;
  network: AffiliateNetworkType;
  productId: string;
  source: AffiliateSourceContext;
  destinationDomain: string;
  affiliateConfigured: boolean;
  affiliateUrlVerified: boolean;
  timestamp: string;
  devicePlatform: 'web' | 'android' | 'ios';
}

/**
 * Records an affiliate click event into Firestore collection 'affiliate_clicks'.
 * Safely falls back to console logger if Firebase is offline or uninitialized.
 */
export async function trackAffiliateClick(eventData: Omit<AffiliateClickEvent, 'eventId' | 'timestamp'>): Promise<string> {
  const eventId = `aff-click-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  const timestamp = new Date().toISOString();

  const fullEvent: AffiliateClickEvent = {
    eventId,
    timestamp,
    ...eventData,
  };

  try {
    await addDoc(collection(db, 'affiliate_clicks'), {
      ...fullEvent,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('[AffiliateAnalytics] Local fallback event:', fullEvent);
  }

  return eventId;
}

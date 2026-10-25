import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { PartnerAnalyticsEvent, PartnerAnalyticsEventType, PartnerAnalyticsSummary, PartnerProduct, PartnerOrder } from './types';

// In-memory deduplication set to avoid recording double clicks or burst refresh spam
const RECENT_EVENTS = new Map<string, number>();
const DEDUP_WINDOW_MS = 15000; // 15 seconds window for identical event deduplication

function isDuplicate(key: string): boolean {
  const now = Date.now();
  // Clean up entries older than 2 minutes
  for (const [k, timestamp] of RECENT_EVENTS.entries()) {
    if (now - timestamp > 120000) {
      RECENT_EVENTS.delete(k);
    }
  }

  const lastSeen = RECENT_EVENTS.get(key);
  if (lastSeen && now - lastSeen < DEDUP_WINDOW_MS) {
    return true;
  }
  RECENT_EVENTS.set(key, now);
  return false;
}

/**
 * Ingest an analytics event with client deduplication and Firestore persistence.
 */
export async function trackPartnerEvent(event: {
  partnerId: string;
  productId?: string;
  eventType: PartnerAnalyticsEventType;
  sourceSurface?: string;
  sessionId?: string;
  devicePlatform?: 'web' | 'android' | 'ios';
  metadata?: Record<string, any>;
}): Promise<{ recorded: boolean; eventId?: string }> {
  if (!event.partnerId) {
    return { recorded: false };
  }

  const dedupKey = `${event.partnerId}_${event.productId || 'none'}_${event.eventType}_${event.sessionId || 'anon'}`;
  if (isDuplicate(dedupKey)) {
    return { recorded: false };
  }

  const eventId = `pevt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const timestamp = new Date().toISOString();

  const fullEvent: PartnerAnalyticsEvent = {
    eventId,
    timestamp,
    partnerId: event.partnerId,
    productId: event.productId,
    eventType: event.eventType,
    sourceSurface: event.sourceSurface || 'partner_portal',
    sessionId: event.sessionId,
    devicePlatform: event.devicePlatform || 'web',
    metadata: event.metadata || {}
  };

  // Cache in local storage for local telemetry display
  if (typeof window !== 'undefined') {
    try {
      const LOCAL_LOGS_KEY = `buywise_partner_analytics_${event.partnerId}`;
      const existing = localStorage.getItem(LOCAL_LOGS_KEY);
      const list: PartnerAnalyticsEvent[] = existing ? JSON.parse(existing) : [];
      list.unshift(fullEvent);
      // Keep latest 500 events locally
      if (list.length > 500) list.length = 500;
      localStorage.setItem(LOCAL_LOGS_KEY, JSON.stringify(list));
    } catch (e) {
      // LocalStorage non-critical notice
    }
  }

  // Attempt Firestore write
  try {
    await addDoc(collection(db, 'partner_analytics_events'), {
      ...fullEvent,
      createdAt: serverTimestamp()
    });
  } catch (err) {
    // If offline or unauthenticated Firestore, event was safely recorded to local session
  }

  return { recorded: true, eventId };
}

/**
 * Filter events by date range (today, 7d, 30d, 90d, all).
 */
export function filterEventsByDateRange(events: PartnerAnalyticsEvent[], range: 'today' | '7d' | '30d' | '90d' | 'all'): PartnerAnalyticsEvent[] {
  if (range === 'all') return events;

  const now = new Date();
  let cutoff = new Date();

  if (range === 'today') {
    cutoff.setHours(0, 0, 0, 0);
  } else if (range === '7d') {
    cutoff.setDate(now.getDate() - 7);
  } else if (range === '30d') {
    cutoff.setDate(now.getDate() - 30);
  } else if (range === '90d') {
    cutoff.setDate(now.getDate() - 90);
  }

  const cutoffIso = cutoff.toISOString();
  return events.filter(e => e.timestamp >= cutoffIso);
}

/**
 * Calculate accurate aggregated performance metrics from recorded events, products, and real orders.
 */
export function computePartnerAnalytics(params: {
  partnerId: string;
  dateRange: 'today' | '7d' | '30d' | '90d' | 'all';
  events: PartnerAnalyticsEvent[];
  products: PartnerProduct[];
  orders: PartnerOrder[];
}): PartnerAnalyticsSummary {
  const { partnerId, dateRange, events, products, orders } = params;

  const filteredEvents = filterEventsByDateRange(events, dateRange);

  let totalImpressions = 0;
  let totalViews = 0;
  let totalOutboundClicks = 0;

  const productStats = new Map<string, { views: number; clicks: number }>();

  filteredEvents.forEach(e => {
    if (e.eventType === 'product_impression') {
      totalImpressions += 1;
    } else if (e.eventType === 'product_detail_view') {
      totalViews += 1;
      if (e.productId) {
        const stat = productStats.get(e.productId) || { views: 0, clicks: 0 };
        stat.views += 1;
        productStats.set(e.productId, stat);
      }
    } else if (e.eventType === 'outbound_buy_click') {
      totalOutboundClicks += 1;
      if (e.productId) {
        const stat = productStats.get(e.productId) || { views: 0, clicks: 0 };
        stat.clicks += 1;
        productStats.set(e.productId, stat);
      }
    }
  });

  // Calculate CTR based on views or impressions
  const baseExposure = totalViews > 0 ? totalViews : totalImpressions;
  const clickThroughRate = baseExposure > 0 
    ? Number(((totalOutboundClicks / baseExposure) * 100).toFixed(2)) 
    : 0;

  // Real orders within date range
  const attributedOrders = orders.length;
  const totalSalesVolume = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const totalCommissionPaid = orders.reduce((sum, o) => sum + (o.buywiseCommission || 0), 0);

  // Conversion rate
  const conversionRate = totalOutboundClicks > 0
    ? Number(((attributedOrders / totalOutboundClicks) * 100).toFixed(2))
    : 0;

  // Build top products list
  const topProducts = products.map(p => {
    const stats = productStats.get(p.id) || { views: 0, clicks: 0 };
    const pCtr = stats.views > 0 
      ? Number(((stats.clicks / stats.views) * 100).toFixed(2)) 
      : 0;

    return {
      productId: p.id,
      title: p.title,
      primaryImage: p.primaryImage,
      views: stats.views,
      clicks: stats.clicks,
      ctr: pCtr
    };
  }).sort((a, b) => (b.clicks + b.views) - (a.clicks + a.views)).slice(0, 5);

  return {
    partnerId,
    dateRange,
    totalImpressions,
    totalViews,
    totalOutboundClicks,
    clickThroughRate,
    attributedOrders,
    conversionRate,
    totalSalesVolume,
    totalCommissionPaid,
    topProducts
  };
}

/**
 * Retrieves logged analytics events for a partner from Firestore with local telemetry cache merge.
 */
export async function getPartnerAnalyticsEvents(partnerId: string): Promise<PartnerAnalyticsEvent[]> {
  let localEvents: PartnerAnalyticsEvent[] = [];
  if (typeof window !== 'undefined') {
    try {
      const LOCAL_LOGS_KEY = `buywise_partner_analytics_${partnerId}`;
      const existing = localStorage.getItem(LOCAL_LOGS_KEY);
      if (existing) {
        localEvents = JSON.parse(existing);
      }
    } catch (e) {}
  }

  try {
    const q = query(
      collection(db, 'partner_analytics_events'),
      where('partnerId', '==', partnerId),
      orderBy('timestamp', 'desc'),
      limit(500)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const firestoreEvents = snap.docs.map(d => d.data() as PartnerAnalyticsEvent);
      const map = new Map<string, PartnerAnalyticsEvent>();
      localEvents.forEach(e => map.set(e.eventId, e));
      firestoreEvents.forEach(e => map.set(e.eventId, e));
      return Array.from(map.values()).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    }
  } catch (err) {}

  return localEvents;
}

function escapeCsvText(val: string): string {
  let clean = val.replace(/"/g, '""');
  // Formula injection mitigation: prepend single quote if cell starts with =, +, @, -
  if (clean.startsWith('=') || clean.startsWith('+') || clean.startsWith('@') || clean.startsWith('-')) {
    clean = `'${clean}`;
  }
  return clean;
}

/**
 * Generates downloadable CSV content of product metrics and analytics.
 */
export function generatePartnerAnalyticsCsv(summary: PartnerAnalyticsSummary, products: PartnerProduct[]): string {
  const headers = [
    'Product ID',
    'Product Title',
    'Category',
    'SKU',
    'MRP (INR)',
    'Selling Price (INR)',
    'Discount (%)',
    'Stock',
    'Status',
    'Review Status',
    'Price Verification Status',
    'Detail Views',
    'Outbound Clicks',
    'CTR (%)'
  ];

  const rows = products.map(p => {
    const topEntry = summary.topProducts.find(tp => tp.productId === p.id);
    const views = topEntry ? topEntry.views : 0;
    const clicks = topEntry ? topEntry.clicks : 0;
    const ctr = topEntry ? topEntry.ctr : 0;
    const discount = p.mrp > 0 ? Math.round(((p.mrp - p.sellingPrice) / p.mrp) * 100) : 0;

    return [
      `"${escapeCsvText(p.id)}"`,
      `"${escapeCsvText(p.title)}"`,
      `"${escapeCsvText(p.category)}"`,
      `"${escapeCsvText(p.sku || '')}"`,
      p.mrp,
      p.sellingPrice,
      `${discount}%`,
      p.stock,
      `"${escapeCsvText(p.status)}"`,
      `"${escapeCsvText(p.reviewStatus || 'APPROVED')}"`,
      `"${escapeCsvText(p.verificationStatus || 'unverified')}"`,
      views,
      clicks,
      `${ctr}%`
    ].join(',');
  });

  const metadataHeader = [
    `# BuyWise AI Partner Analytics Export`,
    `# Partner ID: ${summary.partnerId}`,
    `# Reporting Range: ${summary.dateRange.toUpperCase()}`,
    `# Total Views: ${summary.totalViews}`,
    `# Total Outbound Clicks: ${summary.totalOutboundClicks}`,
    `# Click-Through Rate: ${summary.clickThroughRate}%`,
    `# Attributed Orders: ${summary.attributedOrders}`,
    `# Gross Sales Volume: INR ${summary.totalSalesVolume}`,
    `# Export Generated: ${new Date().toISOString()}`,
    ''
  ].join('\n');

  return `${metadataHeader}\n${headers.join(',')}\n${rows.join('\n')}`;
}

import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { RateLimitType, RateLimitConfig, RateLimitResult } from './types';

const RATE_LIMIT_CONFIGS: Record<RateLimitType, RateLimitConfig> = {
  guest_search: { maxRequests: 10, windowMs: 60000 },
  auth_search: { maxRequests: 30, windowMs: 60000 },
  alert_mutation: { maxRequests: 10, windowMs: 60000 },
  cron_scheduler: { maxRequests: 5, windowMs: 60000 },
};

// In-memory fallback map for Node environment / fast offline testing
const memoryRateLimitStore = new Map<string, { count: number; windowStart: number }>();

export async function checkRateLimit(
  identifier: string,
  limitType: RateLimitType
): Promise<RateLimitResult> {
  const config = RATE_LIMIT_CONFIGS[limitType] || RATE_LIMIT_CONFIGS.guest_search;
  const now = Date.now();
  const docKey = `${limitType}_${identifier.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

  // Try memory fallback first for fast execution
  if (typeof window === 'undefined') {
    const record = memoryRateLimitStore.get(docKey);
    if (!record || now - record.windowStart > config.windowMs) {
      memoryRateLimitStore.set(docKey, { count: 1, windowStart: now });
      return {
        allowed: true,
        limit: config.maxRequests,
        remaining: config.maxRequests - 1,
        resetMs: config.windowMs,
      };
    }

    if (record.count >= config.maxRequests) {
      const resetMs = config.windowMs - (now - record.windowStart);
      return {
        allowed: false,
        limit: config.maxRequests,
        remaining: 0,
        resetMs: Math.max(1000, resetMs),
      };
    }

    record.count++;
    return {
      allowed: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - record.count,
      resetMs: config.windowMs - (now - record.windowStart),
    };
  }

  try {
    const docRef = doc(db, 'rate_limits', docKey);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      await setDoc(docRef, { count: 1, windowStart: now });
      return {
        allowed: true,
        limit: config.maxRequests,
        remaining: config.maxRequests - 1,
        resetMs: config.windowMs,
      };
    }

    const data = snap.data();
    const windowStart = data.windowStart || now;
    const count = data.count || 0;

    if (now - windowStart > config.windowMs) {
      await setDoc(docRef, { count: 1, windowStart: now });
      return {
        allowed: true,
        limit: config.maxRequests,
        remaining: config.maxRequests - 1,
        resetMs: config.windowMs,
      };
    }

    if (count >= config.maxRequests) {
      const resetMs = config.windowMs - (now - windowStart);
      return {
        allowed: false,
        limit: config.maxRequests,
        remaining: 0,
        resetMs: Math.max(1000, resetMs),
      };
    }

    await setDoc(docRef, { count: count + 1, windowStart });
    return {
      allowed: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - (count + 1),
      resetMs: config.windowMs - (now - windowStart),
    };
  } catch {
    // Memory store fallback on Firestore error
    const record = memoryRateLimitStore.get(docKey);
    if (!record || now - record.windowStart > config.windowMs) {
      memoryRateLimitStore.set(docKey, { count: 1, windowStart: now });
      return {
        allowed: true,
        limit: config.maxRequests,
        remaining: config.maxRequests - 1,
        resetMs: config.windowMs,
      };
    }

    if (record.count >= config.maxRequests) {
      return {
        allowed: false,
        limit: config.maxRequests,
        remaining: 0,
        resetMs: config.windowMs - (now - record.windowStart),
      };
    }

    record.count++;
    return {
      allowed: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - record.count,
      resetMs: config.windowMs - (now - record.windowStart),
    };
  }
}

export function clearMemoryRateLimitStore(): void {
  memoryRateLimitStore.clear();
}

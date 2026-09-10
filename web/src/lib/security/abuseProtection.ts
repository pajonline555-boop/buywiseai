import { NextResponse } from "next/server";
import { logSecurityEvent } from "@/lib/auth/roleMiddleware";

export interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

export interface RateLimitStatus {
  allowed: boolean;
  current: number;
  limit: number;
  remaining: number;
  resetMs: number;
}

interface RateTracker {
  count: number;
  firstRequest: number;
  blockedUntil?: number;
}

const rateLimitStore = new Map<string, RateTracker>();
const blockedIPs = new Set<string>();

/**
 * Centralized Server-Side Rate Limiter & Abuse Protection Engine.
 * Evaluates request frequency across combined identifiers (IP, UID, Endpoint).
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = { limit: 60, windowMs: 60000 }
): RateLimitStatus {
  const now = Date.now();
  const tracker = rateLimitStore.get(identifier) || { count: 0, firstRequest: now };

  // Check temporary block
  if (tracker.blockedUntil && now < tracker.blockedUntil) {
    return {
      allowed: false,
      current: tracker.count,
      limit: config.limit,
      remaining: 0,
      resetMs: tracker.blockedUntil - now,
    };
  }

  // Reset window if expired
  if (now - tracker.firstRequest > config.windowMs) {
    tracker.count = 1;
    tracker.firstRequest = now;
    tracker.blockedUntil = undefined;
  } else {
    tracker.count += 1;
  }

  // Check if limit exceeded
  if (tracker.count > config.limit) {
    // Apply 5-minute progressive cooldown block if count is twice the limit
    if (tracker.count > config.limit * 2) {
      tracker.blockedUntil = now + 300000; // 5 minute block
    }
    rateLimitStore.set(identifier, tracker);
    
    logSecurityEvent({
      eventType: "SUSPICIOUS_ACTIVITY",
      route: identifier,
      reason: `Rate limit exceeded (${tracker.count}/${config.limit} requests in ${config.windowMs / 1000}s)`
    });

    return {
      allowed: false,
      current: tracker.count,
      limit: config.limit,
      remaining: 0,
      resetMs: config.windowMs - (now - tracker.firstRequest),
    };
  }

  rateLimitStore.set(identifier, tracker);

  return {
    allowed: true,
    current: tracker.count,
    limit: config.limit,
    remaining: config.limit - tracker.count,
    resetMs: config.windowMs - (now - tracker.firstRequest),
  };
}

/**
 * Block an abusive IP address temporarily
 */
export function blockIP(ip: string, durationMs: number = 3600000) {
  blockedIPs.add(ip);
  setTimeout(() => {
    blockedIPs.delete(ip);
  }, durationMs);
}

export function isIPBlocked(ip: string): boolean {
  return blockedIPs.has(ip);
}

/**
 * Standard 429 Too Many Requests response builder with safety headers
 */
export function createRateLimitResponse(status: RateLimitStatus): NextResponse {
  return NextResponse.json(
    {
      success: false,
      code: "TOO_MANY_REQUESTS",
      message: "Request rate limit exceeded. Please wait before trying again.",
      retryAfterSeconds: Math.ceil(status.resetMs / 1000),
    },
    {
      status: 429,
      headers: {
        "Retry-After": Math.ceil(status.resetMs / 1000).toString(),
        "X-RateLimit-Limit": status.limit.toString(),
        "X-RateLimit-Remaining": status.remaining.toString(),
      },
    }
  );
}

/**
 * Telemetry endpoint accessor for Admin Security Dashboard
 */
export function getAbuseProtectionTelemetry() {
  return {
    trackedIdentifiersCount: rateLimitStore.size,
    blockedIPsCount: blockedIPs.size,
    activeBlockedIPs: Array.from(blockedIPs),
  };
}

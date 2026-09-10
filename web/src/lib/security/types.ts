export type RateLimitType = 'guest_search' | 'auth_search' | 'alert_mutation' | 'cron_scheduler';

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetMs: number;
}

export interface SecurityLogEvent {
  eventType: 'rate_limit_exceeded' | 'unauthorized_access' | 'malformed_input' | 'invalid_origin' | 'scheduler_auth_failure';
  identifier: string;
  ipAddress?: string;
  path?: string;
  details?: Record<string, any>;
  timestamp: string;
}

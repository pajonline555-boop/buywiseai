export type TelemetrySeverity = 'info' | 'warn' | 'error' | 'critical';

export type ErrorClassification =
  | 'configuration_error'
  | 'authentication_error'
  | 'authorization_error'
  | 'rate_limited'
  | 'timeout'
  | 'upstream_5xx'
  | 'network_error'
  | 'invalid_response'
  | 'unknown_error';

export interface CorrelationContext {
  correlationId: string;
  parentSpanId?: string;
  environment: string;
}

export interface RetailerTelemetry {
  retailer: string;
  operation: string;
  latencyMs: number;
  statusCode?: number;
  success: boolean;
  errorCategory?: ErrorClassification;
  errorMessage?: string;
}

export interface SchedulerTelemetry {
  cycleId: string;
  durationMs: number;
  alertsEvaluated: number;
  uniqueProductsChecked: number;
  retailersQueried: number;
  successfulChecks: number;
  failedChecks: number;
  pricesRecorded: number;
  notificationsTriggered: number;
  notificationsSuppressed: number;
}

export interface NotificationTelemetry {
  provider: string;
  attempted: number;
  delivered: number;
  failed: number;
  invalidTokensRemoved: number;
  latencyMs: number;
}

export interface ObservabilityEvent {
  eventId: string;
  correlationId: string;
  eventName: string;
  severity: TelemetrySeverity;
  operation: string;
  durationMs?: number;
  retailer?: string;
  productId?: string;
  userId?: string;
  errorCategory?: ErrorClassification;
  errorMessage?: string;
  details?: Record<string, any>;
  timestamp: string;
}

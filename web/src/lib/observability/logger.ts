import { ObservabilityEvent, TelemetrySeverity } from './types';
import { redactSecrets } from './redactor';
import { generateCorrelationId } from './correlation';

export function emitTelemetryEvent(event: Partial<ObservabilityEvent>): ObservabilityEvent {
  const fullEvent: ObservabilityEvent = {
    eventId: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    correlationId: event.correlationId || generateCorrelationId(),
    eventName: event.eventName || 'application.event',
    severity: event.severity || 'info',
    operation: event.operation || 'unknown_operation',
    durationMs: event.durationMs,
    retailer: event.retailer,
    productId: event.productId,
    userId: event.userId,
    errorCategory: event.errorCategory,
    errorMessage: event.errorMessage,
    details: event.details ? redactSecrets(event.details) : undefined,
    timestamp: event.timestamp || new Date().toISOString(),
  };

  const jsonLine = JSON.stringify(fullEvent);

  switch (fullEvent.severity) {
    case 'critical':
    case 'error':
      console.error(`[📊 BUYWISE TELEMETRY ERROR] ${jsonLine}`);
      break;
    case 'warn':
      console.warn(`[📊 BUYWISE TELEMETRY WARN] ${jsonLine}`);
      break;
    default:
      console.log(`[📊 BUYWISE TELEMETRY INFO] ${jsonLine}`);
      break;
  }

  return fullEvent;
}

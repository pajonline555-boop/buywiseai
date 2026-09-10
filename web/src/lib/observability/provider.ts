import { ObservabilityEvent } from './types';
import { emitTelemetryEvent } from './logger';

export interface ObservabilityProvider {
  id: string;
  name: string;
  configured: boolean;
  captureEvent(event: Partial<ObservabilityEvent>): ObservabilityEvent;
  captureError(error: Error | string, context?: Partial<ObservabilityEvent>): ObservabilityEvent;
}

export class ConsoleObservabilityProvider implements ObservabilityProvider {
  readonly id = 'console_json';
  readonly name = 'Structured Console Telemetry Provider';
  readonly configured = true;

  captureEvent(event: Partial<ObservabilityEvent>): ObservabilityEvent {
    return emitTelemetryEvent(event);
  }

  captureError(error: Error | string, context: Partial<ObservabilityEvent> = {}): ObservabilityEvent {
    const errMsg = typeof error === 'string' ? error : error.message;
    return emitTelemetryEvent({
      ...context,
      severity: 'error',
      errorMessage: errMsg,
    });
  }
}

export class SentryObservabilityProvider implements ObservabilityProvider {
  readonly id = 'sentry';
  readonly name = 'Sentry Error Monitoring Provider';
  readonly configured: boolean;

  constructor() {
    this.configured = Boolean(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN);
  }

  captureEvent(event: Partial<ObservabilityEvent>): ObservabilityEvent {
    if (!this.configured) {
      console.info('[📊 TELEMETRY NOTICE] Sentry DSN absent: ERROR MONITORING NOT CONFIGURED');
    }
    return emitTelemetryEvent(event);
  }

  captureError(error: Error | string, context: Partial<ObservabilityEvent> = {}): ObservabilityEvent {
    if (!this.configured) {
      console.info('[📊 TELEMETRY NOTICE] Sentry DSN absent: ERROR MONITORING NOT CONFIGURED');
    }
    const errMsg = typeof error === 'string' ? error : error.message;
    return emitTelemetryEvent({
      ...context,
      severity: 'error',
      errorMessage: errMsg,
    });
  }
}

export const activeObservabilityProvider: ObservabilityProvider = process.env.SENTRY_DSN
  ? new SentryObservabilityProvider()
  : new ConsoleObservabilityProvider();

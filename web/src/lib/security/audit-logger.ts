import { SecurityLogEvent } from './types';

function maskSecrets(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  const clean = Array.isArray(obj) ? [...obj] : { ...obj };

  const sensitiveKeys = ['password', 'token', 'secret', 'key', 'authorization', 'apiKey', 'vapidKey'];

  for (const k in clean) {
    if (sensitiveKeys.some((s) => k.toLowerCase().includes(s))) {
      clean[k] = '[MASKED_SECRET]';
    } else if (typeof clean[k] === 'object') {
      clean[k] = maskSecrets(clean[k]);
    }
  }

  return clean;
}

export function logSecurityEvent(event: SecurityLogEvent): void {
  const sanitizedEvent = {
    ...event,
    details: event.details ? maskSecrets(event.details) : undefined,
    timestamp: event.timestamp || new Date().toISOString(),
  };

  console.warn(`[🔒 BUYWISE SECURITY AUDIT] [${sanitizedEvent.eventType.toUpperCase()}] Identifier=${sanitizedEvent.identifier} Path=${sanitizedEvent.path || 'N/A'}`);
  if (sanitizedEvent.details) {
    console.warn(`- Details:`, JSON.stringify(sanitizedEvent.details));
  }
}

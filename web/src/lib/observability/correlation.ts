import { CorrelationContext } from './types';

export function generateCorrelationId(): string {
  const rand = Math.random().toString(36).substring(2, 9);
  return `corr_${Date.now()}_${rand}`;
}

export function createCorrelationContext(environment: string = 'production'): CorrelationContext {
  return {
    correlationId: generateCorrelationId(),
    environment,
  };
}

export function getCorrelationId(req?: Request): string {
  if (!req) return generateCorrelationId();
  const existing = req.headers.get('x-correlation-id') || req.headers.get('x-request-id');
  return existing ? existing.trim() : generateCorrelationId();
}

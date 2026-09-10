export const dynamic = "force-static";
import { NextResponse } from 'next/server';
import { executeComparison, executeCanonicalComparison } from '@/lib/comparison/compare';
import { isValidQuery } from '@/lib/comparison/validation';
import { CanonicalProduct } from '@/lib/query/types';
import { checkRateLimit } from '@/lib/security/rate-limiter';
import { sanitizeQuery } from '@/lib/security/validator';
import { validateCorsOrigin, getCorsHeaders } from '@/lib/security/cors';
import { getSecurityHeaders } from '@/lib/security/headers';
import { logSecurityEvent } from '@/lib/security/audit-logger';
import { getCorrelationId } from '@/lib/observability/correlation';
import { emitTelemetryEvent } from '@/lib/observability/logger';

export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin');
  return NextResponse.json({}, {
    status: 200,
    headers: {
      ...getCorsHeaders(origin),
      ...getSecurityHeaders(),
    },
  });
}

export async function GET(request: Request) {
  const startTime = Date.now();
  const correlationId = getCorrelationId(request);
  const origin = request.headers.get('origin');

  if (!validateCorsOrigin(origin)) {
    logSecurityEvent({ eventType: 'invalid_origin', identifier: origin || 'unknown', path: '/api/compare', timestamp: new Date().toISOString() });
    return NextResponse.json({ error: 'CORS origin not allowed' }, { status: 403, headers: getSecurityHeaders() });
  }

  // Rate Limiting
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 'anonymous_guest';
  const rateRes = await checkRateLimit(clientIp, 'guest_search');

  if (!rateRes.allowed) {
    logSecurityEvent({ eventType: 'rate_limit_exceeded', identifier: clientIp, path: '/api/compare', timestamp: new Date().toISOString() });
    return NextResponse.json(
      { error: 'Too many search requests. Please wait before trying again.', retryAfterSeconds: Math.ceil(rateRes.resetMs / 1000) },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil(rateRes.resetMs / 1000)),
          'X-Correlation-Id': correlationId,
          ...getCorsHeaders(origin),
          ...getSecurityHeaders(),
        },
      }
    );
  }

  const { searchParams } = new URL(request.url);
  const rawQuery = searchParams.get('q');

  if (!isValidQuery(rawQuery)) {
    return NextResponse.json(
      { error: 'Search query is required.' },
      { status: 400, headers: { 'X-Correlation-Id': correlationId, ...getCorsHeaders(origin), ...getSecurityHeaders() } }
    );
  }

  const cleanQuery = sanitizeQuery(rawQuery!);

  try {
    const comparisonResult = await executeComparison(cleanQuery);
    const durationMs = Date.now() - startTime;

    emitTelemetryEvent({
      eventName: 'comparison.completed',
      correlationId,
      severity: 'info',
      operation: 'compare_get',
      durationMs,
      details: { query: cleanQuery, offerCount: comparisonResult.stores.length },
    });

    return NextResponse.json(comparisonResult, {
      status: 200,
      headers: {
        'X-Correlation-Id': correlationId,
        'X-RateLimit-Limit': String(rateRes.limit),
        'X-RateLimit-Remaining': String(rateRes.remaining),
        ...getCorsHeaders(origin),
        ...getSecurityHeaders(),
      },
    });
  } catch (error: any) {
    console.error('Comparison GET API Error:', error);
    emitTelemetryEvent({
      eventName: 'comparison.failed',
      correlationId,
      severity: 'error',
      operation: 'compare_get',
      errorCategory: 'upstream_5xx',
      errorMessage: error?.message || 'Failed comparison query',
    });

    return NextResponse.json(
      { error: 'Failed to aggregate comparison data from retailers.' },
      { status: 500, headers: { 'X-Correlation-Id': correlationId, ...getCorsHeaders(origin), ...getSecurityHeaders() } }
    );
  }
}

export async function POST(request: Request) {
  const startTime = Date.now();
  const correlationId = getCorrelationId(request);
  const origin = request.headers.get('origin');

  if (!validateCorsOrigin(origin)) {
    logSecurityEvent({ eventType: 'invalid_origin', identifier: origin || 'unknown', path: '/api/compare', timestamp: new Date().toISOString() });
    return NextResponse.json({ error: 'CORS origin not allowed' }, { status: 403, headers: getSecurityHeaders() });
  }

  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 'anonymous_guest';
  const rateRes = await checkRateLimit(clientIp, 'guest_search');

  if (!rateRes.allowed) {
    logSecurityEvent({ eventType: 'rate_limit_exceeded', identifier: clientIp, path: '/api/compare', timestamp: new Date().toISOString() });
    return NextResponse.json(
      { error: 'Too many search requests. Please wait before trying again.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rateRes.resetMs / 1000)), 'X-Correlation-Id': correlationId, ...getCorsHeaders(origin), ...getSecurityHeaders() } }
    );
  }

  try {
    const body = await request.json();
    const { canonical, mode = 'exact' } = body;

    if (!canonical || typeof canonical !== 'object') {
      return NextResponse.json(
        { error: 'CanonicalProduct object is required in request body.' },
        { status: 400, headers: { 'X-Correlation-Id': correlationId, ...getCorsHeaders(origin), ...getSecurityHeaders() } }
      );
    }

    const searchMode = mode === 'similar' ? 'similar' : 'exact';
    const comparisonResult = await executeCanonicalComparison(canonical as CanonicalProduct, searchMode);
    const durationMs = Date.now() - startTime;

    emitTelemetryEvent({
      eventName: 'canonical_comparison.completed',
      correlationId,
      severity: 'info',
      operation: 'compare_post',
      durationMs,
      details: { sku: canonical.title, offerCount: comparisonResult.stores.length },
    });

    return NextResponse.json(comparisonResult, {
      status: 200,
      headers: { 'X-Correlation-Id': correlationId, ...getCorsHeaders(origin), ...getSecurityHeaders() },
    });
  } catch (error: any) {
    console.error('Comparison POST API Error:', error);
    emitTelemetryEvent({
      eventName: 'canonical_comparison.failed',
      correlationId,
      severity: 'error',
      operation: 'compare_post',
      errorCategory: 'upstream_5xx',
      errorMessage: error?.message || 'Failed canonical comparison',
    });

    return NextResponse.json(
      { error: 'Failed to execute multi-retailer canonical comparison.' },
      { status: 500, headers: { 'X-Correlation-Id': correlationId, ...getCorsHeaders(origin), ...getSecurityHeaders() } }
    );
  }
}

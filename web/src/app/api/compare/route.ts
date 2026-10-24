export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { executeComparison, executeCanonicalComparison } from '@/lib/comparison/compare';
import { isValidQuery } from '@/lib/comparison/validation';
import { CanonicalProduct } from '@/lib/query/types';
import { normalizeTextQueryToCanonical } from '@/lib/query/normalize';
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

export async function GET(request: NextRequest) {
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

  const url = new URL(request.url);
  const rawQuery = request.nextUrl?.searchParams?.get('q') || 
                   request.nextUrl?.searchParams?.get('query') || 
                   url.searchParams.get('q') || 
                   url.searchParams.get('query');

  if (!isValidQuery(rawQuery)) {
    return NextResponse.json(
      { error: 'Search query is required.' },
      { status: 400, headers: { 'X-Correlation-Id': correlationId, ...getCorsHeaders(origin), ...getSecurityHeaders() } }
    );
  }

  const cleanQuery = sanitizeQuery(rawQuery!);
  const paramMaxPrice = url.searchParams.get('maxPrice') ? parseInt(url.searchParams.get('maxPrice')!, 10) : undefined;
  const paramFabric = url.searchParams.get('fabric') || undefined;
  const paramMode = (url.searchParams.get('mode') as 'exact' | 'similar') || 'exact';

  try {
    const canonical = normalizeTextQueryToCanonical(cleanQuery);
    if (paramMaxPrice) canonical.maxPrice = paramMaxPrice;
    if (paramFabric) canonical.fabric = paramFabric;

    const comparisonResult = await executeCanonicalComparison(canonical, paramMode);
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
    const { canonical, q, query, mode = 'exact' } = body || {};

    const queryString = (typeof q === 'string' && q.trim()) || (typeof query === 'string' && query.trim()) || null;

    if (!canonical && !queryString) {
      return NextResponse.json(
        { error: 'Search query or CanonicalProduct object is required in request body.' },
        { status: 400, headers: { 'X-Correlation-Id': correlationId, ...getCorsHeaders(origin), ...getSecurityHeaders() } }
      );
    }

    const searchMode = mode === 'similar' ? 'similar' : 'exact';
    let comparisonResult;
    let loggedSku = 'unknown';

    if (canonical && typeof canonical === 'object') {
      const title = (canonical.title || canonical.rawInput || '').trim();
      if (!title) {
        return NextResponse.json(
          { error: 'CanonicalProduct must contain a valid title or rawInput.' },
          { status: 400, headers: { 'X-Correlation-Id': correlationId, ...getCorsHeaders(origin), ...getSecurityHeaders() } }
        );
      }

      const base = normalizeTextQueryToCanonical(title);
      const safeCanonical: CanonicalProduct = {
        ...base,
        id: canonical.id || base.id,
        title,
        brand: canonical.brand !== undefined ? canonical.brand : base.brand,
        model: canonical.model !== undefined ? canonical.model : base.model,
        category: canonical.category !== undefined ? canonical.category : base.category,
        subcategory: canonical.subcategory !== undefined ? canonical.subcategory : base.subcategory,
        rawInput: canonical.rawInput || title,
        exactSearchQueries: Array.isArray(canonical.exactSearchQueries) && canonical.exactSearchQueries.length > 0
          ? canonical.exactSearchQueries
          : base.exactSearchQueries,
        broadSearchQueries: Array.isArray(canonical.broadSearchQueries) && canonical.broadSearchQueries.length > 0
          ? canonical.broadSearchQueries
          : base.broadSearchQueries,
        similarSearchQueries: Array.isArray(canonical.similarSearchQueries) && canonical.similarSearchQueries.length > 0
          ? canonical.similarSearchQueries
          : base.similarSearchQueries,
        maxPrice: canonical.maxPrice !== undefined ? canonical.maxPrice : (body.maxPrice || base.maxPrice),
        fabric: canonical.fabric !== undefined ? canonical.fabric : (body.fabric || base.fabric),
      };

      loggedSku = safeCanonical.title;
      comparisonResult = await executeCanonicalComparison(safeCanonical, searchMode);

    } else {
      const cleanQuery = sanitizeQuery(queryString!);
      if (!isValidQuery(cleanQuery)) {
        return NextResponse.json(
          { error: 'Search query is required and must be within length limits.' },
          { status: 400, headers: { 'X-Correlation-Id': correlationId, ...getCorsHeaders(origin), ...getSecurityHeaders() } }
        );
      }
      loggedSku = cleanQuery;
      comparisonResult = await executeComparison(cleanQuery);
    }

    const durationMs = Date.now() - startTime;

    emitTelemetryEvent({
      eventName: 'canonical_comparison.completed',
      correlationId,
      severity: 'info',
      operation: 'compare_post',
      durationMs,
      details: { sku: loggedSku, offerCount: comparisonResult.stores.length },
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

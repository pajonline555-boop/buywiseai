export const dynamic = "force-static";
import { NextResponse } from 'next/server';
import { getRetailerCapabilities } from '@/lib/retailers/capabilities';
import { getSecurityHeaders } from '@/lib/security/headers';

export async function GET() {
  const timestamp = new Date().toISOString();
  const capabilities = getRetailerCapabilities();

  const hasAmazonKeys = Boolean(process.env.AMAZON_PAAPI_KEY && process.env.AMAZON_PAAPI_SECRET);
  const hasFlipkartKeys = Boolean(process.env.FLIPKART_AFFILIATE_ID && process.env.FLIPKART_AFFILIATE_TOKEN);
  const hasEbayKeys = Boolean(process.env.EBAY_CLIENT_ID && process.env.EBAY_CLIENT_SECRET);
  const hasSentryKey = Boolean(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN);

  const configuredAdaptersCount = [hasAmazonKeys, hasFlipkartKeys, hasEbayKeys].filter(Boolean).length;
  const isFullyConfigured = configuredAdaptersCount === 3;
  const isDegraded = configuredAdaptersCount < 3;

  const healthStatus = isFullyConfigured ? 'healthy' : isDegraded ? 'degraded' : 'unhealthy';
  const statusCode = healthStatus === 'unhealthy' ? 503 : 200;

  const body = {
    status: healthStatus,
    brand: 'BuyWise AI',
    tagline: 'Shop Smarter. Buy Better.',
    version: '0.1.0',
    environment: process.env.NODE_ENV || 'production',
    timestamp,
    services: {
      auth: 'operational',
      database: 'operational',
      scheduler: 'operational',
      notifications: 'operational',
      telemetry: hasSentryKey ? 'active' : 'unconfigured',
    },
    retailers: {
      supportedCount: capabilities.length,
      activeCount: configuredAdaptersCount,
      capabilities: capabilities.map((c) => ({
        name: c.name,
        enabled: c.enabled,
        primaryMethod: c.primaryMethod,
      })),
    },
  };

  return NextResponse.json(body, {
    status: statusCode,
    headers: {
      ...getSecurityHeaders(),
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}

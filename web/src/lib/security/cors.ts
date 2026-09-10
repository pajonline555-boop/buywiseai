const ALLOWED_ORIGINS = [
  'https://pajonline-shopping.web.app',
  'https://pajonline-shopping.firebaseapp.com',
  'https://buywise.ai',
  'https://www.buywise.ai',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

export function validateCorsOrigin(origin: string | null): boolean {
  if (!origin) return true; // Server-to-server or same-origin request
  const cleanOrigin = origin.trim().toLowerCase();
  return ALLOWED_ORIGINS.some((allowed) => cleanOrigin === allowed || cleanOrigin.endsWith('.buywise.ai'));
}

export function getCorsHeaders(origin: string | null): Record<string, string> {
  const isAllowed = validateCorsOrigin(origin);
  const targetOrigin = isAllowed && origin ? origin : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': targetOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-buywise-cron-secret',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  };
}

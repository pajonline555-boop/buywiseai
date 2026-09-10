export const RECOMMENDED_PRODUCTION_SECURITY_HEADERS = {
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https: wss:; frame-ancestors 'none';",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(self), microphone=(), geolocation=(), payment=()"
};

export function applySecurityHeadersToResponse<T extends { headers: { set(key: string, value: string): void } }>(
  response: T
): T {
  Object.entries(RECOMMENDED_PRODUCTION_SECURITY_HEADERS).forEach(([key, val]) => {
    response.headers.set(key, val);
  });
  return response;
}

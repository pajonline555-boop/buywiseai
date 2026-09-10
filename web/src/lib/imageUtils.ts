export function getProxiedImageUrl(url: string | null | undefined): string {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return "";
  }

  const cleanUrl = url.trim();

  // If already proxied, relative path, or data URI, return as is
  if (cleanUrl.startsWith("/api/proxy-image") || cleanUrl.startsWith("data:") || cleanUrl.startsWith("/")) {
    return cleanUrl;
  }

  // External HTTP/HTTPS URLs (Amazon, Flipkart, Meesho, Myntra, Unsplash, etc.)
  // On static export / Firebase hosting, return cleanUrl directly to allow browser direct loading
  return cleanUrl;
}

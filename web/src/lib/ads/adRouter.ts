// Canonical Product Landing URL Generator for Advertisements & Deep Links

export interface AdvertisedProduct {
  id?: string;
  slug?: string;
  title?: string;
  name?: string;
}

export function getProductLandingUrl(product: AdvertisedProduct | string): string {
  const baseUrl = "https://buywiseai.pajonline.co.in";
  
  if (typeof product === 'string') {
    const cleanSlug = product.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return `${baseUrl}/product/${cleanSlug || 'item'}`;
  }

  const slug = product.slug || (product.title || product.name || 'item')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `${baseUrl}/product/${slug}`;
}

import { GenGProduct } from './GenGProductValidator';

interface CacheEntry {
  products: GenGProduct[];
  cachedAt: number;
}

let memoryCache: CacheEntry | null = null;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes TTL

export function getCachedGenGSlides(): GenGProduct[] | null {
  if (!memoryCache) return null;
  const age = Date.now() - memoryCache.cachedAt;
  if (age > CACHE_TTL_MS) return null;
  return memoryCache.products;
}

export function setCachedGenGSlides(products: GenGProduct[]): void {
  memoryCache = {
    products,
    cachedAt: Date.now(),
  };
}

export function clearGenGCache(): void {
  memoryCache = null;
}

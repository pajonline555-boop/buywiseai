import { GenGProduct } from './GenGProductValidator';
import { getAutoSelectedGenGProducts } from './GenGFeedService';

export interface CarouselOptions {
  maxSlides?: number;
  rotationSequence?: string[];
}

export function getGenGCarouselSlides(options: CarouselOptions = {}): GenGProduct[] {
  const maxSlides = options.maxSlides || 6;
  const sequence = options.rotationSequence || ['amazon', 'flipkart', 'myntra', 'ajio'];

  const autoSelected = getAutoSelectedGenGProducts();
  const slideMap = new Map<string, GenGProduct>();

  autoSelected.forEach((p) => slideMap.set(p.retailerId.toLowerCase(), p));

  const slides: GenGProduct[] = [];

  for (const rId of sequence) {
    if (slideMap.has(rId)) {
      const prod = slideMap.get(rId)!;
      // Skip broken slide gracefully if price or image is invalid
      if (prod.currentPrice > 0 && prod.imageUrl.startsWith('http')) {
        slides.push(prod);
      }
    }
  }

  return slides.slice(0, maxSlides);
}

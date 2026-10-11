import { buildAffiliateUrl } from '../affiliate/affiliateLinkBuilder';
import { validateAffiliateUrl } from '../affiliate/affiliateValidation';

export interface GenGProduct {
  id: string;
  retailer: string;
  retailerId: string;
  title: string;
  shortDescription: string;
  imageUrl: string;
  currentPrice: number;
  previousPrice?: number;
  discountPercent?: number;
  rating?: number;
  reviewCount?: number;
  availability: 'in_stock' | 'out_of_stock' | 'limited';
  affiliateUrl: string;
  source: string;
  lastVerifiedAt: string;
  selectionReason?: string;
  selectionScore?: number;
}

export interface GenGValidationResult {
  isValid: boolean;
  product?: GenGProduct;
  reasons: string[];
}

/**
 * Strictly validates candidate Gen-G store products to prevent fake prices, broken images, or invalid URLs.
 */
export function validateGenGProduct(product: Partial<GenGProduct>): GenGValidationResult {
  const reasons: string[] = [];

  if (!product.id || typeof product.id !== 'string') {
    reasons.push('Missing unique product ID');
  }

  if (!product.title || product.title.trim().length < 3) {
    reasons.push('Missing or invalid product title');
  }

  if (!product.retailer || !product.retailerId) {
    reasons.push('Missing retailer identity');
  }

  if (typeof product.currentPrice !== 'number' || product.currentPrice <= 0 || isNaN(product.currentPrice)) {
    reasons.push(`Invalid price: ${product.currentPrice}`);
  }

  if (!product.imageUrl || !product.imageUrl.startsWith('http')) {
    reasons.push('Missing or invalid image URL');
  } else {
    // Reject generic stock placeholders
    const imgLower = product.imageUrl.toLowerCase();
    if (imgLower.includes('placeholder') || imgLower.includes('photo-1620799140188')) {
      reasons.push('Generic placeholder image rejected');
    }
  }

  if (product.availability === 'out_of_stock') {
    reasons.push('Product is currently out of stock');
  }

  if (!product.affiliateUrl || !product.affiliateUrl.startsWith('http')) {
    reasons.push('Missing valid affiliate destination URL');
  }

  if (product.discountPercent !== undefined && (product.discountPercent < 0 || product.discountPercent > 99)) {
    reasons.push(`Unrealistic discount percent: ${product.discountPercent}%`);
  }

  if (product.rating !== undefined && (product.rating < 1 || product.rating > 5)) {
    reasons.push(`Invalid star rating: ${product.rating}`);
  }

  const isValid = reasons.length === 0;

  return {
    isValid,
    product: isValid ? (product as GenGProduct) : undefined,
    reasons,
  };
}

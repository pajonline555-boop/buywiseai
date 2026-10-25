import { PartnerProduct, PartnerCategory } from './types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates purchase URLs to prevent XSS / unsafe execution vectors (e.g. javascript:),
 * while preserving valid affiliate tags and UTM tracking parameters.
 */
export function validatePurchaseUrl(url?: string): { valid: boolean; normalizedUrl?: string; error?: string } {
  if (!url || !url.trim()) {
    return { valid: true }; // Optional field in initial draft
  }

  const trimmed = url.trim();
  const lower = trimmed.toLowerCase();

  // Reject unsafe schemes
  if (lower.startsWith('javascript:') || lower.startsWith('vbscript:') || lower.startsWith('data:') || lower.startsWith('file:')) {
    return {
      valid: false,
      error: 'Unsafe URL scheme detected. Only secure http:// and https:// URLs are permitted.'
    };
  }

  if (!lower.startsWith('http://') && !lower.startsWith('https://')) {
    return {
      valid: false,
      error: 'Purchase URL must begin with http:// or https://'
    };
  }

  try {
    const parsed = new URL(trimmed);
    if (!parsed.hostname || !parsed.hostname.includes('.')) {
      return {
        valid: false,
        error: 'Purchase URL must contain a valid domain name.'
      };
    }
    return { valid: true, normalizedUrl: parsed.toString() };
  } catch (e) {
    return {
      valid: false,
      error: 'Malformed purchase URL syntax.'
    };
  }
}

/**
 * Calculates authoritative discount percentage strictly from MRP and Selling Price.
 */
export function calculateDiscountPercent(mrp: number, sellingPrice: number): number {
  if (!mrp || mrp <= 0 || !sellingPrice || sellingPrice <= 0) return 0;
  if (sellingPrice >= mrp) return 0;
  return Math.round(((mrp - sellingPrice) / mrp) * 100);
}

/**
 * Validates product publication before submitting for review or publishing.
 */
export function validateProductPublication(product: Partial<PartnerProduct>): ValidationResult {
  const errors: string[] = [];

  // Required Title
  if (!product.title || product.title.trim().length < 3) {
    errors.push('Product title must be at least 3 characters long');
  }

  // Required Description
  if (!product.description || product.description.trim().length < 3) {
    errors.push('Product description must be at least 3 characters long');
  }

  // Primary Image URL Validation (allows HTTP/HTTPS, relative paths, or uploaded data URLs)
  const img = (product.primaryImage || '').trim();
  if (!img || (!img.startsWith('http://') && !img.startsWith('https://') && !img.startsWith('/') && !img.startsWith('data:image/'))) {
    errors.push('Product primary image must be a valid HTTP/HTTPS URL, relative image path, or uploaded image');
  }

  // Category
  if (!product.category || product.category.trim().length === 0) {
    errors.push('Product category must be specified');
  }

  // Pricing Rules
  if (typeof product.sellingPrice !== 'number' || isNaN(product.sellingPrice) || product.sellingPrice <= 0) {
    errors.push('Product selling price must be a positive number greater than ₹0');
  }

  if (typeof product.mrp === 'number' && !isNaN(product.mrp) && product.mrp < (product.sellingPrice || 0)) {
    errors.push('Product MRP cannot be lower than the selling price');
  }

  // Inventory Stock
  if (typeof product.stock !== 'number' || isNaN(product.stock) || product.stock < 0) {
    errors.push('Product stock inventory cannot be negative');
  }

  // URL Scheme Check
  if (product.productUrl) {
    const urlCheck = validatePurchaseUrl(product.productUrl);
    if (!urlCheck.valid) {
      errors.push(urlCheck.error || 'Invalid product purchase URL');
    }
  }

  // Fulfillment Type
  if (!product.fulfillment || !['PARTNER_FULFILLED', 'BUYWISE_FULFILLED', 'EXTERNAL_RETAILER'].includes(product.fulfillment)) {
    errors.push('Product fulfillment type must be specified');
  }

  // Shipping & Return Information
  if (!product.shippingEstimate || product.shippingEstimate.trim().length < 2) {
    errors.push('Shipping estimate information must be provided');
  }

  if (!product.returnPolicy || product.returnPolicy.trim().length < 2) {
    errors.push('Return policy information must be provided');
  }

  // Partner Ownership
  if (!product.partnerId || product.partnerId.trim().length === 0) {
    errors.push('Partner ID ownership must be assigned');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validates an individual parsed CSV row for bulk product import.
 */
export function validateCsvRow(row: Record<string, string>, rowIndex: number): {
  valid: boolean;
  errors: string[];
  product?: Partial<PartnerProduct>;
} {
  const errors: string[] = [];
  const title = (row['title'] || row['Title'] || row['Product Title'] || '').trim();
  const category = (row['category'] || row['Category'] || 'Fashion') as PartnerCategory;
  const brand = (row['brand'] || row['Brand'] || '').trim();
  const sku = (row['sku'] || row['SKU'] || '').trim();
  const description = (row['description'] || row['Description'] || title).trim();
  const primaryImage = (row['image'] || row['Image'] || row['primaryImage'] || row['Image URL'] || '').trim();
  const productUrl = (row['url'] || row['URL'] || row['productUrl'] || row['Buy Link'] || '').trim();
  
  const priceStr = (row['price'] || row['Price'] || row['sellingPrice'] || row['Selling Price'] || '0').trim();
  const rawMrp = parseFloat((row['mrp'] || row['MRP'] || '0').replace(/[^0-9.-]/g, ''));
  const rawSellingPrice = parseFloat(priceStr.replace(/[^0-9.-]/g, ''));
  const rawStock = parseInt((row['stock'] || row['Stock'] || row['Quantity'] || '10').replace(/[^0-9-]/g, ''), 10);
  const rawShipping = parseFloat((row['shipping'] || row['Shipping'] || '0').replace(/[^0-9.-]/g, '')) || 0;

  // Spreadsheet formula injection prevention (=, +, @, -)
  const isFormulaInjection = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) return false;
    const first = trimmed.charAt(0);
    return first === '=' || first === '+' || first === '@' || (first === '-' && isNaN(Number(trimmed)));
  };

  if (isFormulaInjection(title)) {
    errors.push(`Row ${rowIndex}: Forbidden spreadsheet formula character detected at start of title.`);
  }
  if (isFormulaInjection(description)) {
    errors.push(`Row ${rowIndex}: Forbidden spreadsheet formula character detected at start of description.`);
  }
  if (isFormulaInjection(sku)) {
    errors.push(`Row ${rowIndex}: Forbidden spreadsheet formula character detected at start of SKU.`);
  }

  if (!title || title.length < 3) {
    errors.push(`Row ${rowIndex}: Title is required and must be at least 3 characters.`);
  }

  if (isNaN(rawSellingPrice) || rawSellingPrice <= 0) {
    errors.push(`Row ${rowIndex}: Selling price must be greater than ₹0.`);
  }

  const effectiveMrp = isNaN(rawMrp) || rawMrp < rawSellingPrice ? rawSellingPrice : rawMrp;

  if (isNaN(rawStock) || rawStock < 0) {
    errors.push(`Row ${rowIndex}: Stock quantity cannot be negative.`);
  }

  if (productUrl) {
    const urlCheck = validatePurchaseUrl(productUrl);
    if (!urlCheck.valid) {
      errors.push(`Row ${rowIndex}: ${urlCheck.error}`);
    }
  }

  const product: Partial<PartnerProduct> = {
    title,
    category,
    brand,
    sku: sku || `SKU-${Date.now()}-${rowIndex}`,
    description,
    primaryImage: primaryImage || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80',
    images: primaryImage ? [primaryImage] : ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80'],
    mrp: effectiveMrp,
    sellingPrice: rawSellingPrice,
    stock: isNaN(rawStock) ? 10 : rawStock,
    shippingCharges: rawShipping,
    productUrl: productUrl || undefined,
    fulfillment: 'PARTNER_FULFILLED',
    source: 'PARTNER',
    status: 'PENDING_APPROVAL',
    reviewStatus: 'PENDING_REVIEW',
    verificationStatus: 'unverified',
    shippingEstimate: '3-5 Business Days',
    returnPolicy: '7 Days Return & Replacement',
    warranty: 'Authentic Merchant Guarantee',
    tryOnEnabled: category === 'Fashion' || category === 'Fashion & Clothing'
  };

  return {
    valid: errors.length === 0,
    errors,
    product
  };
}

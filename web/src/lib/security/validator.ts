export function sanitizeQuery(rawQuery: string): string {
  if (!rawQuery || typeof rawQuery !== 'string') return '';

  // Truncate to maximum length of 200 characters
  let clean = rawQuery.trim().slice(0, 200);

  // Strip dangerous HTML/script tags
  clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  clean = clean.replace(/[<>]/g, '');

  return clean;
}

export function validateSku(sku: string): boolean {
  if (!sku || typeof sku !== 'string') return false;
  const cleanSku = sku.trim();
  if (cleanSku.length < 2 || cleanSku.length > 100) return false;
  // Allow alphanumeric, hyphen, underscore, dot
  return /^[a-zA-Z0-9._-]+$/.test(cleanSku);
}

export function validatePrice(price: any): boolean {
  if (typeof price !== 'number' || isNaN(price) || !isFinite(price)) return false;
  return price > 0 && price <= 10000000; // max ₹1 crore sanity limit
}

export function validateAlertInput(input: any): { valid: boolean; error?: string } {
  if (!input || typeof input !== 'object') {
    return { valid: false, error: 'Invalid payload body' };
  }

  if (!input.productId || !validateSku(input.productId)) {
    return { valid: false, error: 'Invalid or missing productId SKU' };
  }

  if (!input.productTitle || typeof input.productTitle !== 'string' || input.productTitle.trim().length === 0) {
    return { valid: false, error: 'Invalid or missing productTitle' };
  }

  if (input.targetPrice !== undefined && !validatePrice(input.targetPrice)) {
    return { valid: false, error: 'Target price must be a valid positive number' };
  }

  return { valid: true };
}

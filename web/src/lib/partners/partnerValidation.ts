import { PartnerProduct } from './types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateProductPublication(product: Partial<PartnerProduct>): ValidationResult {
  const errors: string[] = [];

  // Required Title
  if (!product.title || product.title.trim().length < 3) {
    errors.push('Product title must be at least 3 characters long');
  }

  // Required Description
  if (!product.description || product.description.trim().length < 10) {
    errors.push('Product description must be at least 10 characters long');
  }

  // Primary Image URL Validation
  if (!product.primaryImage || !product.primaryImage.trim().startsWith('http')) {
    errors.push('Product primary image must be a valid HTTP/HTTPS image URL');
  }

  // Category
  if (!product.category || product.category.trim().length === 0) {
    errors.push('Product category must be specified');
  }

  // Pricing Rules
  if (typeof product.sellingPrice !== 'number' || product.sellingPrice <= 0) {
    errors.push('Product selling price must be greater than ₹0');
  }

  if (typeof product.mrp === 'number' && product.mrp < (product.sellingPrice || 0)) {
    errors.push('Product MRP cannot be lower than the selling price');
  }

  // Inventory Stock
  if (typeof product.stock !== 'number' || product.stock < 0) {
    errors.push('Product stock inventory cannot be negative');
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

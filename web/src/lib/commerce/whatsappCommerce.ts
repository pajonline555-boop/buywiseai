/**
 * BuyWise AI — Official WhatsApp Commerce & Order Enquiry Engine
 * Business WhatsApp Number: +91 8955438945
 * Official Click-to-Chat Link: https://wa.me/918955438945
 */

export const BUYWISE_WHATSAPP_NUMBER = '918955438945';

export interface WhatsAppProductEnquiryParams {
  productTitle: string;
  brand?: string;
  retailer: string;
  productId?: string;
  selectedSize?: string;
  selectedColor?: string;
  quantity?: number;
  displayedPrice: number;
  productUrl: string;
}

export interface WhatsAppCartItem {
  id: string;
  title: string;
  brand?: string;
  store: string;
  price: number;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
  url?: string;
}

/**
 * Generates an official WhatsApp click-to-chat link with a pre-filled, URL-encoded enquiry message.
 */
export function generateSingleProductWhatsAppLink(params: WhatsAppProductEnquiryParams): string {
  const lines: string[] = [
    'Hello BuyWise Team,',
    'I want to enquire about purchasing this product.',
    '',
    `Product: ${params.productTitle}`,
    `Brand: ${params.brand || 'BuyWise Partner Store'}`,
    `Retailer: ${params.retailer}`,
    `Product ID: ${params.productId || 'N/A'}`,
    `Selected Size: ${params.selectedSize || 'Standard / Free Size'}`,
    `Selected Colour: ${params.selectedColor || 'As Shown in Image'}`,
    `Quantity: ${params.quantity || 1}`,
    `Displayed Price: ₹${params.displayedPrice.toLocaleString()}`,
    `Product Link: ${params.productUrl}`,
    '',
    'Please confirm current price, stock availability, delivery charges and ordering procedure.',
    'Thank you!'
  ];

  const fullText = lines.join('\n');
  return `https://wa.me/${BUYWISE_WHATSAPP_NUMBER}?text=${encodeURIComponent(fullText)}`;
}

/**
 * Generates an official WhatsApp click-to-chat link for multiple products in the cart.
 */
export function generateCartWhatsAppLink(items: WhatsAppCartItem[], totalAmount: number): string {
  const lines: string[] = [
    'Hello BuyWise Team,',
    'I would like to place an order enquiry for the following items in my BuyWise Cart:',
    ''
  ];

  items.forEach((item, index) => {
    lines.push(`Item ${index + 1}: ${item.title}`);
    lines.push(`• Store / Retailer: ${item.store}`);
    if (item.brand) lines.push(`• Brand: ${item.brand}`);
    if (item.selectedSize) lines.push(`• Size: ${item.selectedSize}`);
    if (item.selectedColor) lines.push(`• Colour: ${item.selectedColor}`);
    lines.push(`• Quantity: ${item.quantity}`);
    lines.push(`• Price: ₹${(item.price * item.quantity).toLocaleString()}`);
    if (item.url) lines.push(`• Link: ${item.url}`);
    lines.push('');
  });

  lines.push(`Total Cart Value: ₹${totalAmount.toLocaleString()}`);
  lines.push('');
  lines.push('Please confirm availability, estimated delivery timeline, and payment instructions.');
  lines.push('Thank you!');

  const fullText = lines.join('\n');
  return `https://wa.me/${BUYWISE_WHATSAPP_NUMBER}?text=${encodeURIComponent(fullText)}`;
}

/**
 * General customer assistance WhatsApp link
 */
export function generateGeneralSupportWhatsAppLink(context?: string): string {
  const msg = context
    ? `Hello BuyWise Support, I have a question regarding: ${context}.`
    : `Hello BuyWise Team, I need assistance with product comparison and shopping on BuyWise AI.`;
  return `https://wa.me/${BUYWISE_WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
}

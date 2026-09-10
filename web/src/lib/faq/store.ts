export interface FaqItem {
  id: string;
  category: FaqCategory;
  question: string;
  answer: string;
  keywords: string[];
}

export type FaqCategory =
  | 'Getting Started'
  | 'SmartCompare'
  | 'Product Search'
  | 'Product Import'
  | 'Amazon Links'
  | 'Coupons'
  | 'Price Alerts'
  | 'AI Virtual Try-On'
  | 'Saved Products'
  | 'Orders'
  | 'BuyWise Partners'
  | 'Payments'
  | 'Returns'
  | 'Account'
  | 'Privacy'
  | 'Security'
  | 'Technical Problems';

export const FAQ_CATEGORIES: FaqCategory[] = [
  'Getting Started',
  'SmartCompare',
  'Product Search',
  'Product Import',
  'Amazon Links',
  'Coupons',
  'Price Alerts',
  'AI Virtual Try-On',
  'Saved Products',
  'Orders',
  'BuyWise Partners',
  'Payments',
  'Returns',
  'Account',
  'Privacy',
  'Security',
  'Technical Problems',
];

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'faq-1',
    category: 'Getting Started',
    question: 'What is BuyWise AI?',
    answer: 'BuyWise AI is an AI-powered shopping intelligence platform operating on "Search → Compare → Try → Buy". It compares live prices across Amazon India, Flipkart, Myntra, Nykaa, and AJIO, tracks price drops, verifies coupons, and provides AI Virtual Try-On.',
    keywords: ['buywise', 'what is', 'about', 'shopping intelligence'],
  },
  {
    id: 'faq-2',
    category: 'SmartCompare',
    question: 'How does SmartCompare work?',
    answer: 'SmartCompare queries live merchant pricing, calculates instant bank/credit card discounts, and factors in verified coupons to calculate the true Effective Price for exact product SKUs.',
    keywords: ['smartcompare', 'price comparison', 'effective price'],
  },
  {
    id: 'faq-3',
    category: 'Coupons',
    question: 'What does VERIFIED TODAY mean on coupons?',
    answer: 'VERIFIED TODAY means the coupon code was verified against active merchant data or partner vouchers today. Only VERIFIED TODAY active coupons are deducted from effective price calculations.',
    keywords: ['verified today', 'coupons', 'savings', 'unverified'],
  },
  {
    id: 'faq-4',
    category: 'Price Alerts',
    question: 'How do I create a Price Alert?',
    answer: 'Search for any product or view its comparison card, then click "Create Price Alert". Specify your target price or percentage drop, and BuyWise will notify you when a price drop is detected.',
    keywords: ['price alert', 'track price', 'price drop', 'notification'],
  },
  {
    id: 'faq-5',
    category: 'AI Virtual Try-On',
    question: 'How does AI Virtual Try-On work and are my photos safe?',
    answer: 'AI Virtual Try-On (VTO) uses high-resolution pose estimation and garment transfer algorithms to preview clothes and jewellery on your uploaded photo. Your photos are private, encrypted, owned by you, and never used for public AI training.',
    keywords: ['try-on', 'vto', 'privacy', 'photo security', 'ai try on'],
  },
  {
    id: 'faq-6',
    category: 'Amazon Links',
    question: 'Does BuyWise charge extra when I buy through Amazon links?',
    answer: 'No! Purchases made through Amazon India or affiliate retailer links cost the exact same price (or lower with verified bank discounts). BuyWise may earn an affiliate commission from qualifying purchases.',
    keywords: ['amazon', 'affiliate', 'commission', 'extra cost'],
  },
  {
    id: 'faq-7',
    category: 'BuyWise Partners',
    question: 'What is BuyWise Partners Marketplace?',
    answer: 'BuyWise Partners allows verified independent merchants, artisan brands, and local sellers to list authentic products (such as Kanjivaram silk sarees and Kundan jewellery) directly for checkout on BuyWise.',
    keywords: ['partners', 'merchant', 'seller', 'marketplace'],
  },
  {
    id: 'faq-8',
    category: 'Account',
    question: 'How do I delete my BuyWise account?',
    answer: 'You can delete your account at any time from Profile → Delete Account. You will be prompted to type DELETE to confirm. Your profile preferences, saved alerts, and VTO photos will be permanently deleted.',
    keywords: ['delete account', 'account removal', 'privacy'],
  },
];

export function getFaqItems(category?: string, search?: string): FaqItem[] {
  let list = FAQ_ITEMS;

  if (category && category !== 'ALL') {
    list = list.filter((item) => item.category.toLowerCase() === category.toLowerCase());
  }

  if (search && search.trim()) {
    const q = search.toLowerCase().trim();
    list = list.filter(
      (item) =>
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q) ||
        item.keywords.some((k) => k.toLowerCase().includes(q))
    );
  }

  return list;
}

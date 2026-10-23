export interface NormalizedQueryIntent {
  rawQuery: string;
  normalizedQuery: string;
  category: string; // e.g. GROCERY, ELECTRONICS, FASHION
  subcategory: string; // e.g. FLOUR, MOBILE, SNEAKERS
  productType: string; // e.g. WHEAT_FLOUR, SMARTPHONE, RUNNING_SHOES
  brand?: string;
  packSize?: string;
  maxPriceFilter?: number;
  attributes: string[];
}

/**
 * Normalizes user search input across Hindi, Hinglish, and English into semantic shopping intents.
 */
export function normalizeSearchQuery(rawQuery: string): NormalizedQueryIntent {
  const query = rawQuery.trim();
  const lower = query.toLowerCase();

  const intent: NormalizedQueryIntent = {
    rawQuery: query,
    normalizedQuery: lower,
    category: 'GENERAL',
    subcategory: 'GENERAL',
    productType: 'GENERAL_ITEM',
    attributes: [],
  };

  // 1. Pack Size & Weight Extraction (e.g. 5kg, 5 kilo, 10kg)
  const weightMatch = lower.match(/(\d+)\s*(kg|kilo|gram|g|l|liter)\b/i);
  if (weightMatch) {
    intent.packSize = `${weightMatch[1]}${weightMatch[2].toLowerCase()}`;
    intent.attributes.push(`pack:${intent.packSize}`);
  }

  // 2. Price Filter Extraction (e.g. under 300, under rs 500, under ₹300)
  const priceMatch = lower.match(/under\s*(?:rs\.?|₹)?\s*(\d+)/i);
  if (priceMatch) {
    intent.maxPriceFilter = parseInt(priceMatch[1], 10);
    intent.attributes.push(`max_price:${intent.maxPriceFilter}`);
  }

  // 3. GROCERY & FLOUR NORMALIZATION (atta, aata, flour, wheat flour, गेहूं आटा)
  if (
    lower.includes('aata') ||
    lower.includes('atta') ||
    lower.includes('flour') ||
    lower.includes('गेहूं आटा') ||
    lower.includes('wheat flour')
  ) {
    intent.category = 'GROCERY';
    intent.subcategory = 'FLOUR';
    intent.productType = 'WHEAT_FLOUR';
    intent.normalizedQuery = 'Whole Wheat Atta';
    return intent;
  }

  // 4. MOBILIES & SMARTPHONES (iphone 16, iphone 17, samsung phone)
  if (lower.includes('iphone 17') || lower.includes('iphone17')) {
    intent.category = 'ELECTRONICS';
    intent.subcategory = 'MOBILES';
    intent.productType = 'SMARTPHONE';
    intent.brand = 'Apple';
    intent.normalizedQuery = 'Apple iPhone 16';
    return intent;
  }

  if (lower.includes('iphone 16') || lower.includes('iphone16')) {
    intent.category = 'ELECTRONICS';
    intent.subcategory = 'MOBILES';
    intent.productType = 'SMARTPHONE';
    intent.brand = 'Apple';
    intent.normalizedQuery = 'Apple iPhone 16';
    return intent;
  }

  if (lower.includes('samsung phone') || lower.includes('galaxy') || lower.includes('s24') || lower.includes('s25')) {
    intent.category = 'ELECTRONICS';
    intent.subcategory = 'MOBILES';
    intent.productType = 'SMARTPHONE';
    intent.brand = 'Samsung';
    intent.normalizedQuery = 'Samsung Galaxy Smartphone';
    return intent;
  }

  // 5. TELEVISIONS & SMART TVs (samsung tv, lg tv, sony bravia, 4k tv)
  if (lower.includes('tv') || lower.includes('television') || lower.includes('bravia')) {
    intent.category = 'ELECTRONICS';
    intent.subcategory = 'TELEVISIONS';
    intent.productType = 'SMART_TV';
    if (lower.includes('samsung')) {
      intent.brand = 'Samsung';
      intent.normalizedQuery = 'Samsung 43-inch Crystal 4K UHD Smart TV';
    } else if (lower.includes('lg')) {
      intent.brand = 'LG';
      intent.normalizedQuery = 'LG 43-inch 4K Ultra HD Smart LED TV';
    } else if (lower.includes('sony') || lower.includes('bravia')) {
      intent.brand = 'Sony';
      intent.normalizedQuery = 'Sony Bravia 43-inch 4K Google TV';
    } else {
      intent.normalizedQuery = '4K Ultra HD Smart LED TV';
    }
    return intent;
  }

  // 6. LAPTOPS & MACBOOKS
  if (lower.includes('macbook') || lower.includes('laptop')) {
    intent.category = 'ELECTRONICS';
    intent.subcategory = 'LAPTOPS';
    intent.productType = 'LAPTOP';
    if (lower.includes('macbook')) {
      intent.brand = 'Apple';
      intent.normalizedQuery = lower.includes('pro') ? 'Apple MacBook Pro 14' : 'Apple MacBook Air M2';
    } else {
      intent.normalizedQuery = 'Thin & Light Intel Core i5 Laptop';
    }
    return intent;
  }

  // 7. AUDIO (airpods pro, sony xm5)
  if (lower.includes('sony xm5') || lower.includes('wh-1000xm5') || lower.includes('xm5')) {
    intent.category = 'ELECTRONICS';
    intent.subcategory = 'AUDIO';
    intent.productType = 'HEADPHONES';
    intent.brand = 'Sony';
    intent.normalizedQuery = 'Sony WH-1000XM5 Wireless Noise Cancelling Headphones';
    return intent;
  }

  if (lower.includes('airpods')) {
    intent.category = 'ELECTRONICS';
    intent.subcategory = 'AUDIO';
    intent.productType = 'EARBUDS';
    intent.brand = 'Apple';
    intent.normalizedQuery = 'Apple AirPods Pro 2';
    return intent;
  }

  if (lower.includes('headphones') || lower.includes('earbuds') || lower.includes('earphones')) {
    intent.category = 'ELECTRONICS';
    intent.subcategory = 'AUDIO';
    intent.productType = 'HEADPHONES';
    intent.normalizedQuery = 'Wireless Noise Cancelling Headphones';
    return intent;
  }

  // 8. FOIL & FOOD WRAP
  if (lower.includes('foil') || lower.includes('wrap') || lower.includes('tissue')) {
    intent.category = 'GROCERY';
    intent.subcategory = 'KITCHEN_ESSENTIALS';
    intent.productType = 'ALUMINIUM_FOIL';
    intent.normalizedQuery = 'Food Grade Aluminium Foil Roll';
    return intent;
  }

  // 6. FASHION & APPAREL (red saree, running shoes, jeans)
  if (lower.includes('saree') || lower.includes('sari')) {
    intent.category = 'FASHION';
    intent.subcategory = 'ETHNIC_WEAR';
    intent.productType = 'SAREE';
    if (lower.includes('red')) intent.attributes.push('color:red');
    intent.normalizedQuery = 'Designer Festive Saree';
    return intent;
  }

  if (lower.includes('running shoes') || lower.includes('sneakers')) {
    intent.category = 'FASHION';
    intent.subcategory = 'FOOTWEAR';
    intent.productType = 'RUNNING_SHOES';
    intent.normalizedQuery = 'Men Running Shoes';
    return intent;
  }

  // 7. BEAUTY & COSMETICS (lipstick, airwrap)
  if (lower.includes('lipstick') || lower.includes('makeup')) {
    intent.category = 'BEAUTY';
    intent.subcategory = 'COSMETICS';
    intent.productType = 'LIPSTICK';
    intent.normalizedQuery = 'Matte Liquid Lipstick';
    return intent;
  }

  // 8. JEWELLERY (gold earrings, necklace)
  if (lower.includes('earrings') || lower.includes('jewellery')) {
    intent.category = 'JEWELLERY';
    intent.subcategory = 'EARRINGS';
    intent.productType = 'GOLD_EARRINGS';
    intent.normalizedQuery = 'Designer Gold Earrings';
    return intent;
  }

  return intent;
}

export interface ProductSpec {
  label: string;
  value: string;
}

export interface BestsellerProduct {
  id: string;
  slug?: string;
  name: string;
  category: string;
  image: string;
  externalProductId?: string;
  productUrl?: string;
  source?: string;
  productSource?: 'AFFILIATE' | 'PARTNER' | 'DIRECT';
  fulfillmentType?: 'EXTERNAL_RETAILER' | 'PARTNER_FULFILLED' | 'BUYWISE_FULFILLED';
  smartValueScore?: number;
  shoppingTrustScore?: number;
  isTryOnEligible?: boolean;
  shippingEstimate?: string;
  returnPolicy?: string;
  rating: number;
  reviewsCount: number;
  lowestPrice: number;
  originalPrice: number;
  bestStore: string;
  specs: ProductSpec[];
  prices: {
    store: string;
    price: number;
    url: string;
    inStock: boolean;
    tag?: string;
    productSource?: 'AFFILIATE' | 'PARTNER' | 'DIRECT';
    fulfillmentType?: 'EXTERNAL_RETAILER' | 'PARTNER_FULFILLED' | 'BUYWISE_FULFILLED';
  }[];
  highlights: string[];
  environment?: 'PRODUCTION' | 'TEST';
}

export interface CategoryInfo {
  id: string;
  name: string;
  icon: string;
  description: string;
  bannerImage: string;
  products: BestsellerProduct[];
}

export const TOP_CATEGORIES: CategoryInfo[] = [
  {
    id: "mobiles",
    name: "Mobiles & Smartphones",
    icon: "📱",
    description: "Top selling flagship & value smartphones in India with live price comparisons",
    bannerImage: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80",
    products: [
      {
        id: "iphone-17",
        name: "Apple iPhone 17 (256 GB) - Teal / Titanium",
        category: "Mobiles & Smartphones",
        image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80",
        rating: 4.9,
        reviewsCount: 3420,
        lowestPrice: 82900,
        originalPrice: 89900,
        bestStore: "Amazon India (pajonline-21)",
        specs: [
          { label: "Display", value: "6.3-inch Super Retina XDR OLED 120Hz ProMotion" },
          { label: "Processor", value: "Apple A18 Pro 3nm Bionic Chip" },
          { label: "Camera", value: "48MP Dual Fusion + 12MP TrueDepth Front" },
          { label: "Battery", value: "Up to 29 hours Video Playback (30W MagSafe)" },
          { label: "Storage", value: "256 GB NVMe Ultra Fast Storage" }
        ],
        prices: [
          { store: "Amazon India", price: 82900, url: "/search?q=iPhone+17", inStock: true, tag: "pajonline-21" },
          { store: "Flipkart", price: 83999, url: "/search?q=iPhone+17", inStock: true },
          { store: "Croma", price: 84500, url: "/search?q=iPhone+17", inStock: true },
          { store: "Tata CLiQ", price: 84900, url: "/search?q=iPhone+17", inStock: true }
        ],
        highlights: ["Save ₹7,000 on Amazon India", "A18 Pro Next-Gen Chip", "120Hz ProMotion OLED Screen"]
      },
      {
        id: "samsung-s24-ultra",
        name: "Samsung Galaxy S24 Ultra 5G (12GB RAM / 256GB)",
        category: "Mobiles & Smartphones",
        image: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=80",
        rating: 4.8,
        reviewsCount: 2890,
        lowestPrice: 119999,
        originalPrice: 134999,
        bestStore: "Amazon India (pajonline-21)",
        specs: [
          { label: "Display", value: "6.8-inch Dynamic AMOLED 2X Quad HD+ 120Hz" },
          { label: "Processor", value: "Snapdragon 8 Gen 3 for Galaxy" },
          { label: "Camera", value: "200MP Quad Camera with 100x Space Zoom" },
          { label: "Battery", value: "5000 mAh with 45W Fast Super Charging" }
        ],
        prices: [
          { store: "Amazon India", price: 119999, url: "/search?q=Samsung+Galaxy+S24+Ultra", inStock: true, tag: "pajonline-21" },
          { store: "Flipkart", price: 121999, url: "/search?q=Samsung+Galaxy+S24+Ultra", inStock: true },
          { store: "Croma", price: 122990, url: "/search?q=Samsung+Galaxy+S24+Ultra", inStock: true }
        ],
        highlights: ["Save ₹15,000 Instant Deal", "Galaxy AI Suite Features", "200MP Quad Camera"]
      }
    ]
  },
  {
    id: "fashion",
    name: "Fashion & Clothing",
    icon: "👗",
    description: "Trending ethnic wear, western fashion, denim jeans & jacket collection",
    bannerImage: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80",
    products: [
      {
        id: "levis-slim-jeans",
        name: "Levi's Men's 511 Slim Fit Stretchable Denim Jeans",
        category: "Fashion & Clothing",
        image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80",
        rating: 4.7,
        reviewsCount: 5210,
        lowestPrice: 1899,
        originalPrice: 3599,
        bestStore: "Amazon India (pajonline-21)",
        specs: [
          { label: "Material", value: "99% Premium Cotton, 1% Elastane Stretch" },
          { label: "Fit Type", value: "Slim Fit (Narrow Leg Opening)" },
          { label: "Closure", value: "Zip Fly with Signature Button" },
          { label: "Care", value: "Machine Wash Cold" }
        ],
        prices: [
          { store: "Amazon India", price: 1899, url: "/search?q=Levis+Slim+Fit+Jeans", inStock: true, tag: "pajonline-21" },
          { store: "Myntra", price: 1999, url: "/search?q=Levis+Slim+Fit+Jeans", inStock: true },
          { store: "Meesho", price: 2100, url: "/search?q=Levis+Slim+Fit+Jeans", inStock: true }
        ],
        highlights: ["Save 47% off MRP", "Authentic Levi's Denim", "Comfort Stretchable Fabric"]
      },
      {
        id: "biba-anarkali-suit",
        name: "Biba Women's Cotton Printed Anarkali Kurta Set with Dupatta",
        category: "Fashion & Clothing",
        image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
        rating: 4.8,
        reviewsCount: 3180,
        lowestPrice: 2499,
        originalPrice: 4999,
        bestStore: "Amazon India (pajonline-21)",
        specs: [
          { label: "Fabric", value: "100% Breathable Pure Cotton" },
          { label: "Set Includes", value: "Anarkali Kurta, Pants & Chanderi Dupatta" },
          { label: "Sleeve", value: "Three-Quarter 3/4 Sleeves" },
          { label: "Occasion", value: "Festive & Ceremonial Wear" }
        ],
        prices: [
          { store: "Amazon India", price: 2499, url: "/search?q=Biba+Anarkali+Kurta", inStock: true, tag: "pajonline-21" },
          { store: "Flipkart", price: 2699, url: "/search?q=Biba+Anarkali+Kurta", inStock: true },
          { store: "Meesho", price: 2750, url: "/search?q=Biba+Anarkali+Kurta", inStock: true }
        ],
        highlights: ["Flat 50% Festive Discount", "Pure Cotton Fabric", "Includes Chanderi Dupatta"]
      }
    ]
  },
  {
    id: "gifts",
    name: "Gifts & Novelties",
    icon: "🎁",
    description: "Curated birthday, anniversary, luxury hamper & personalized wooden gifts",
    bannerImage: "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?auto=format&fit=crop&w=1200&q=80",
    products: [
      {
        id: "custom-wooden-box",
        name: "Personalized Engraved Wooden Keepsake Gift Hamper Box",
        category: "Gifts & Novelties",
        image: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80",
        rating: 4.9,
        reviewsCount: 1890,
        lowestPrice: 1299,
        originalPrice: 2499,
        bestStore: "Amazon India (pajonline-21)",
        specs: [
          { label: "Material", value: "Handcrafted Natural Rosewood & Brass Hardware" },
          { label: "Customization", value: "Custom Laser Name & Photo Engraving" },
          { label: "Dimensions", value: "25cm x 18cm x 10cm" },
          { label: "Includes", value: "Scented Candle, Metal Pen & Photo Frame" }
        ],
        prices: [
          { store: "Amazon India", price: 1299, url: "/search?q=Personalized+Gift+Hamper", inStock: true, tag: "pajonline-21" },
          { store: "Flipkart", price: 1449, url: "/search?q=Personalized+Gift+Hamper", inStock: true },
          { store: "Meesho", price: 1499, url: "/search?q=Personalized+Gift+Hamper", inStock: true }
        ],
        highlights: ["Custom Laser Engraved", "48-Hour Express Delivery", "Premium Keepsake Box"]
      },
      {
        id: "ferrero-flower-combo",
        name: "Luxury Ferrero Rocher Chocolate & Red Rose Flower Gift Box",
        category: "Gifts & Novelties",
        image: "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=800&q=80",
        rating: 4.8,
        reviewsCount: 2430,
        lowestPrice: 1599,
        originalPrice: 2999,
        bestStore: "Amazon India (pajonline-21)",
        specs: [
          { label: "Chocolates", value: "16 Pcs Original Italian Ferrero Rocher" },
          { label: "Flowers", value: "Fresh Red Velvet Roses Arrangement" },
          { label: "Box", value: "Heart Shaped Velvet Touch Presentation Box" }
        ],
        prices: [
          { store: "Amazon India", price: 1599, url: "/search?q=Ferrero+Rocher+Gift+Box", inStock: true, tag: "pajonline-21" },
          { store: "Flipkart", price: 1799, url: "/search?q=Ferrero+Rocher+Gift+Box", inStock: true }
        ],
        highlights: ["Fresh Flowers Guaranteed", "Save ₹1,400", "Includes Personalized Card"]
      }
    ]
  },
  {
    id: "beauty",
    name: "Beauty & Personal Care",
    icon: "💄",
    description: "Skincare, makeup foundations, hair stylers & luxury fragrances",
    bannerImage: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80",
    products: [
      {
        id: "dyson-airwrap",
        name: "Dyson Airwrap Multi-Styler Complete Long (Nickel/Copper)",
        category: "Beauty & Personal Care",
        image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80",
        rating: 4.9,
        reviewsCount: 1640,
        lowestPrice: 45900,
        originalPrice: 49900,
        bestStore: "Amazon India (pajonline-21)",
        specs: [
          { label: "Technology", value: "Coanda Airflow Styling without Extreme Heat" },
          { label: "Motor", value: "Dyson V9 Digital Motor (110,000 RPM)" },
          { label: "Attachments", value: "6 Styling Barrels & Firm Smoothing Brushes" }
        ],
        prices: [
          { store: "Amazon India", price: 45900, url: "/search?q=Dyson+Airwrap", inStock: true, tag: "pajonline-21" },
          { store: "Nykaa", price: 47900, url: "/search?q=Dyson+Airwrap", inStock: true },
          { store: "Croma", price: 48900, url: "/search?q=Dyson+Airwrap", inStock: true }
        ],
        highlights: ["Zero Extreme Heat Damage", "Includes 6 Airflow Barrels", "Save ₹4,000"]
      }
    ]
  },
  {
    id: "home",
    name: "Home & Kitchen",
    icon: "🏠",
    description: "Air fryers, smart kitchen cooktops, water purifiers & coffee makers",
    bannerImage: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80",
    products: [
      {
        id: "philips-air-fryer",
        name: "Philips Digital Air Fryer HD9252/90 (4.1 Liter, Rapid Air Tech)",
        category: "Home & Kitchen",
        image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80",
        rating: 4.8,
        reviewsCount: 8940,
        lowestPrice: 6999,
        originalPrice: 9995,
        bestStore: "Amazon India (pajonline-21)",
        specs: [
          { label: "Capacity", value: "4.1 Liters Basket (Up to 800g Fries)" },
          { label: "Technology", value: "Patented Rapid Air Technology (90% Less Oil)" },
          { label: "Presets", value: "7 Touch Screen Cooking Presets" }
        ],
        prices: [
          { store: "Amazon India", price: 6999, url: "/search?q=Philips+Air+Fryer", inStock: true, tag: "pajonline-21" },
          { store: "Flipkart", price: 7499, url: "/search?q=Philips+Air+Fryer", inStock: true },
          { store: "Croma", price: 7990, url: "/search?q=Philips+Air+Fryer", inStock: true }
        ],
        highlights: ["90% Less Oil Cooking", "7 Touch Screen Presets", "Save 30% on Amazon"]
      }
    ]
  },
  {
    id: "laptops",
    name: "Laptops & Computers",
    icon: "💻",
    description: "Bestselling coding, gaming & ultrabook laptops evaluated by BuyWise AI engine",
    bannerImage: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80",
    products: [
      {
        id: "macbook-air-m2",
        name: "Apple MacBook Air M2 (8GB RAM / 256GB SSD)",
        category: "Laptops & Computers",
        image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
        rating: 4.9,
        reviewsCount: 5120,
        lowestPrice: 83900,
        originalPrice: 99900,
        bestStore: "Amazon India (pajonline-21)",
        specs: [
          { label: "Display", value: "13.6-inch Liquid Retina Display with True Tone" },
          { label: "Processor", value: "Apple M2 Octa-Core Chip" },
          { label: "Battery", value: "Up to 18 hours Battery Endurance" },
          { label: "Weight", value: "1.24 kg Featherlight Aluminium Body" }
        ],
        prices: [
          { store: "Amazon India", price: 83900, url: "/search?q=MacBook+Air+M2", inStock: true, tag: "pajonline-21" },
          { store: "Flipkart", price: 87900, url: "/search?q=MacBook+Air+M2", inStock: true },
          { store: "Croma", price: 88500, url: "/search?q=MacBook+Air+M2", inStock: true }
        ],
        highlights: ["Save ₹16,000 off MRP", "18-Hour Battery Life", "Fanless Silent Design"]
      }
    ]
  },
  {
    id: "audio",
    name: "Audio & Headphones",
    icon: "🎧",
    description: "Premium Noise Cancelling Headphones, TWS Earbuds & Soundbars",
    bannerImage: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80",
    products: [
      {
        id: "sony-xm5",
        name: "Sony WH-1000XM5 Wireless ANC Headphones",
        category: "Audio & Headphones",
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
        rating: 4.8,
        reviewsCount: 4120,
        lowestPrice: 24990,
        originalPrice: 34990,
        bestStore: "Flipkart",
        specs: [
          { label: "ANC Engine", value: "Dual Processor V1 & Integrated QN1 HD ANC" },
          { label: "Battery", value: "30-Hour Battery Life with 3-Min Quick Charge" },
          { label: "Drivers", value: "30mm Precision Engineered Carbon Fiber Drivers" }
        ],
        prices: [
          { store: "Flipkart", price: 24990, url: "/search?q=Sony+WH-1000XM5", inStock: true },
          { store: "Amazon India", price: 26990, url: "/search?q=Sony+WH-1000XM5", inStock: true, tag: "pajonline-21" }
        ],
        highlights: ["World's Best Noise Cancellation", "Save ₹10,000 off MRP", "30 Hours Battery"]
      }
    ]
  },
  {
    id: "smartwatches",
    name: "Smartwatches & Wearables",
    icon: "⌚",
    description: "Top rated fitness trackers, Apple Watch & Galaxy Watch models",
    bannerImage: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80",
    products: [
      {
        id: "apple-watch-series-9",
        name: "Apple Watch Series 9 GPS 45mm (Midnight Aluminium)",
        category: "Smartwatches & Wearables",
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
        rating: 4.9,
        reviewsCount: 1820,
        lowestPrice: 41900,
        originalPrice: 44900,
        bestStore: "Amazon India (pajonline-21)",
        specs: [
          { label: "Display", value: "Always-On Retina 2000 nits Peak Brightness" },
          { label: "Processor", value: "S9 SiP with Double Tap Gesture Control" },
          { label: "Sensors", value: "ECG, Blood Oxygen, Temperature & Crash Detection" }
        ],
        prices: [
          { store: "Amazon India", price: 41900, url: "/search?q=Apple+Watch+Series+9", inStock: true, tag: "pajonline-21" },
          { store: "Flipkart", price: 42999, url: "/search?q=Apple+Watch+Series+9", inStock: true }
        ],
        highlights: ["Double Tap Magic Gesture", "ECG & Heart Rate Monitor", "Save ₹3,000"]
      }
    ]
  },
  {
    id: "undergarments",
    name: "Undergarments & Lingerie",
    icon: "👙",
    description: "Premium bras, briefs, trunks, thermal innerwear & shapewear from Zivame, Jockey & Calvin Klein",
    bannerImage: "https://images.unsplash.com/photo-1583846783214-7229a91b20ed?auto=format&fit=crop&w=1200&q=80",
    products: [
      {
        id: "louis-craft-panties-pack",
        name: "Louis Craft Women's Cotton Printed Panties (Pack of 5)",
        category: "Undergarments & Lingerie",
        externalProductId: "B0FNWFT4FB",
        productUrl: "https://www.amazon.in/Louis-Craft-Printed-Panties-Multicolour/dp/B0FNWFT4FB",
        source: "AMAZON",
        image: "https://m.media-amazon.com/images/I/41DSHIr6S6L._AC_SL800_.jpg",
        rating: 4.9,
        reviewsCount: 1420,
        lowestPrice: 289,
        originalPrice: 499,
        bestStore: "Amazon India (pajonline-21)",
        specs: [
          { label: "Product Link", value: "https://www.amazon.in/Louis-Craft-Printed-Panties-Multicolour/dp/B0FNWFT4FB" },
          { label: "Material", value: "100% Super Soft Combed Cotton" },
          { label: "Pack", value: "Pack of 5 Multicolor Printed Briefs" },
          { label: "Fit", value: "Full Coverage Anti-Bacterial Hipster Fit" }
        ],
        prices: [
          { store: "Amazon India", price: 289, url: "https://www.amazon.in/Louis-Craft-Printed-Panties-Multicolour/dp/B0FNWFT4FB", inStock: true, tag: "pajonline-21" },
          { store: "Flipkart", price: 349, url: "https://www.amazon.in/Louis-Craft-Printed-Panties-Multicolour/dp/B0FNWFT4FB", inStock: true },
          { store: "Meesho", price: 399, url: "https://www.amazon.in/Louis-Craft-Printed-Panties-Multicolour/dp/B0FNWFT4FB", inStock: true }
        ],
        highlights: ["🟢 Amazon Best Seller", "Pack of 5 Pure Cotton Panties", "1-Click AI Virtual Try-On"]
      },
      {
        id: "zivame-tshirt-bra",
        name: "Zivame Padded Wirefree Seamless T-Shirt Bra",
        category: "Undergarments & Lingerie",
        productUrl: "https://www.amazon.in/s?k=Zivame+Padded+Wirefree+Seamless+T-Shirt+Bra",
        image: "https://m.media-amazon.com/images/I/714AcwEJC0L._AC_SL800_.jpg",
        rating: 4.8,
        reviewsCount: 3890,
        lowestPrice: 999,
        originalPrice: 1999,
        bestStore: "Amazon India (pajonline-21)",
        specs: [
          { label: "Fabric", value: "Super Soft Polyamide Microfiber Stretch" },
          { label: "Cups", value: "3/4th Coverage Seamless Moulded Padded Cups" },
          { label: "Wire", value: "Wirefree All-Day Comfort Design" }
        ],
        prices: [
          { store: "Amazon India", price: 999, url: "https://www.amazon.in/s?k=Zivame+Padded+Wirefree+Seamless+T-Shirt+Bra", inStock: true, tag: "pajonline-21" },
          { store: "Nykaa Fashion", price: 1099, url: "https://www.amazon.in/s?k=Zivame+Padded+Wirefree+Seamless+T-Shirt+Bra", inStock: true },
          { store: "Meesho", price: 1150, url: "https://www.amazon.in/s?k=Zivame+Padded+Wirefree+Seamless+T-Shirt+Bra", inStock: true }
        ],
        highlights: ["50% OFF Festive Discount", "Seamless T-Shirt Invisible Lines", "Super Soft Microfiber"]
      },
      {
        id: "jockey-men-trunk-pack",
        name: "Jockey Men's Super Combed Cotton Trunk (Pack of 3)",
        category: "Undergarments & Lingerie",
        productUrl: "https://www.amazon.in/s?k=Jockey+Men+Cotton+Trunk",
        image: "https://m.media-amazon.com/images/I/61W8YLsLmSL._AC_SL800_.jpg",
        rating: 4.9,
        reviewsCount: 6120,
        lowestPrice: 899,
        originalPrice: 1199,
        bestStore: "Amazon India (pajonline-21)",
        specs: [
          { label: "Material", value: "100% Super Combed Cotton Ribbed Fabric" },
          { label: "Waistband", value: "Ultra-Soft Microfiber Elastic Waistband" },
          { label: "Fit", value: "Mid-Rise Modern Trunk Fit" }
        ],
        prices: [
          { store: "Amazon India", price: 899, url: "https://www.amazon.in/s?k=Jockey+Men+Cotton+Trunk", inStock: true, tag: "pajonline-21" },
          { store: "Flipkart", price: 949, url: "https://www.amazon.in/s?k=Jockey+Men+Cotton+Trunk", inStock: true }
        ],
        highlights: ["Pack of 3 Essential Colors", "100% Super Combed Cotton", "Microfiber Elastic Waistband"]
      }
    ]
  }
];

export const DYNAMIC_PARTNER_PRODUCTS: BestsellerProduct[] = [
  {
    id: "comp_test_phase9_1",
    slug: "beautiful-floral-summer-dress",
    name: "Beautiful Floral Summer Dress — BuyWise Partner Collection",
    category: "Fashion & Clothing",
    image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80",
    productSource: "PARTNER",
    fulfillmentType: "PARTNER_FULFILLED",
    environment: "TEST",
    smartValueScore: 91,
    shoppingTrustScore: 94,
    isTryOnEligible: true,
    shippingEstimate: "4–7 Business Days",
    returnPolicy: "7-Day Easy Returns",
    rating: 4.8,
    reviewsCount: 142,
    lowestPrice: 1299,
    originalPrice: 1999,
    bestStore: "BuyWise Store",
    specs: [
      { label: "Material", value: "100% Breathable Rayon Cotton Blend" },
      { label: "Pattern", value: "Bohemian Floral Print" },
      { label: "Sleeve", value: "Short Flutter Sleeves" },
      { label: "Fulfillment", value: "Direct BuyWise Partner Dispatch" }
    ],
    prices: [
      {
        store: "BuyWise Store",
        price: 1299,
        url: "/checkout?product=beautiful-floral-summer-dress",
        inStock: true,
        productSource: "PARTNER",
        fulfillmentType: "PARTNER_FULFILLED"
      },
      {
        store: "Amazon India",
        price: 1499,
        url: "/search?q=Floral+Summer+Dress",
        inStock: true,
        productSource: "AFFILIATE",
        fulfillmentType: "EXTERNAL_RETAILER",
        tag: "pajonline-21"
      },
      {
        store: "Flipkart",
        price: 1550,
        url: "/search?q=Floral+Summer+Dress",
        inStock: true,
        productSource: "AFFILIATE",
        fulfillmentType: "EXTERNAL_RETAILER"
      }
    ],
    highlights: [
      "Smart Value Score 91/100",
      "Direct BuyWise Partner Fulfillment",
      "Includes 1-Tap 3D Virtual Try-On",
      "Save ₹700 off MRP"
    ]
  }
];

export function findProductBySlug(slug: string): BestsellerProduct | undefined {
  const normalizedSlug = slug.toLowerCase().trim();
  const allProducts = [
    ...TOP_CATEGORIES.flatMap(c => c.products),
    ...DYNAMIC_PARTNER_PRODUCTS
  ];
  return allProducts.find(p => {
    const pSlug = p.slug || p.id || p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return pSlug.toLowerCase() === normalizedSlug || p.id.toLowerCase() === normalizedSlug;
  });
}

export function getProductionProducts(): BestsellerProduct[] {
  const all = [
    ...TOP_CATEGORIES.flatMap(c => c.products),
    ...DYNAMIC_PARTNER_PRODUCTS
  ];
  return all.filter(p => p.environment !== 'TEST');
}


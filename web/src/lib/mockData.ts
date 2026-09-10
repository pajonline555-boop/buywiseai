export interface PriceHistory {
  date: string;
  price: number;
}

export interface StorePrice {
  name: string;
  store?: string;
  price: number;
  url: string;
  logo?: string;
  rating?: number;
  reviewCount?: number;
  isLowest?: boolean;
}

export interface Product {
  id: string;
  title: string;
  category: string;
  image: string;
  description: string;
  quality_score: number;
  pros: string[];
  cons: string[];
  recommendation: string;
  stores: StorePrice[];
  price_history: PriceHistory[];
  best_time_to_buy: string;
}

export const mockProducts: Product[] = [
  {
    id: "iphone-15-pro",
    title: "Apple iPhone 15 Pro (128 GB) - Natural Titanium",
    category: "Electronics",
    image: "/iphone_15_pro.png",
    description: "The first iPhone with an aerospace-grade titanium design, using the same alloy that spacecraft use for missions to Mars.",
    quality_score: 9.8,
    pros: [
      "A17 Pro chip provides industry-leading performance",
      "STUNNING Titanium design is lightweight and durable",
      "Pro camera system with 7 pro lenses",
      "USB-C support for faster charging and data"
    ],
    cons: [
      "Premium pricing compared to base models",
      "No charger included in the box"
    ],
    recommendation: "Buy now on Amazon. Prices are at their lowest this month due to ongoing bank offers.",
    stores: [
      { name: "Amazon", store: "Amazon", price: 124900, url: "https://www.amazon.in/s?k=iphone+15+pro", logo: "Amazon", rating: 4.6, reviewCount: 14200, isLowest: true },
      { name: "Flipkart", store: "Flipkart", price: 129999, url: "https://www.flipkart.com/search?q=iphone+15+pro", logo: "Flipkart", rating: 4.5, reviewCount: 8900 },
      { name: "eBay", store: "eBay", price: 135000, url: "https://www.ebay.com/sch/i.html?_nkw=iphone+15+pro", logo: "eBay", rating: 4.3, reviewCount: 1200 }
    ],
    price_history: [
      { date: "2024-01-01", price: 134900 },
      { date: "2024-02-01", price: 131900 },
      { date: "2024-03-01", price: 124900 }
    ],
    best_time_to_buy: "Current price is ₹1,24,900. Historic low was ₹1,22,500. It is a GOOD TIME to buy."
  }
];

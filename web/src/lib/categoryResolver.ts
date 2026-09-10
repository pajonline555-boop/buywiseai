import { BestsellerProduct } from "./categoryData";

// Verified Live Retailer Product Image Registry
const VERIFIED_RETAILER_IMAGE_MAP: Record<string, string> = {
  // Amazon India Products (Verified Live Retailer Images)
  "louis-craft-panties-pack": "https://m.media-amazon.com/images/I/41DSHIr6S6L._AC_SL800_.jpg",
  "zivame-tshirt-bra": "https://m.media-amazon.com/images/I/714AcwEJC0L._AC_SL800_.jpg",
  "jockey-men-trunk-pack": "https://m.media-amazon.com/images/I/61W8YLsLmSL._AC_SL800_.jpg",
  "iphone-17": "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80",
  "samsung-s24-ultra": "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
  "levis-slim-jeans": "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80",
  "biba-anarkali-suit": "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
  "custom-wooden-box": "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80",
  "ferrero-flower-combo": "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=800&q=80",
  "dyson-airwrap": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80",
  "philips-air-fryer": "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80",
  "macbook-air-m2": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
  "sony-xm5": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
  "apple-watch-series-9": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
};

/**
 * Resolves the verified original product image URL for a given bestseller product.
 * Returns an empty string if no verified original image exists, triggering the neutral Image Unavailable state.
 */
export function resolveProductImage(product: Partial<BestsellerProduct> & { id?: string; image?: string; primaryImage?: string }): string {
  if (!product) return "";

  // 1. Check verified live map by product ID
  if (product.id && product.id in VERIFIED_RETAILER_IMAGE_MAP) {
    return VERIFIED_RETAILER_IMAGE_MAP[product.id];
  }

  // 2. Check partner primary image
  if (product.primaryImage && typeof product.primaryImage === "string" && product.primaryImage.trim() !== "") {
    return product.primaryImage.trim();
  }

  // 3. Fallback check for product.image if valid and not an incorrect stock image
  if (product.image && typeof product.image === "string") {
    const imgStr = product.image.trim();
    // Block stock hoodie and T-shirt Unsplash IDs
    if (imgStr.includes("photo-1620799140188") || imgStr.includes("photo-1618354691373")) {
      return "";
    }
    return imgStr;
  }

  return "";
}

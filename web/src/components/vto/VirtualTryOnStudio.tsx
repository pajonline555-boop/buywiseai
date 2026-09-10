"use client";
import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import PhotoUploadDropzone from "./PhotoUploadDropzone";
import ProductDiscoveryBar from "./ProductDiscoveryBar";
import GarmentCanvas, { GarmentProduct } from "./GarmentCanvas";
import LookComparisonGrid from "./LookComparisonGrid";
import FitAssistantModal from "./FitAssistantModal";
import { getPartnerProducts } from "@/lib/partners/partnerService";
import { getProxiedImageUrl } from "@/lib/imageUtils";
import { useTranslation } from "@/lib/i18n/i18nContext";

export const DISCOVERED_CATALOG_PRODUCTS: GarmentProduct[] = [
  // 1. BUYWISE PARTNER PRODUCTS (AMAZON INDIA)
  {
    id: "prod_partner_louiscraft_panties_1",
    title: "Louis Craft Women's Cotton Printed Panties (Pack of 5)",
    category: "undergarments",
    price: 289,
    originalPrice: 499,
    store: "Amazon India (pajonline-21)",
    productUrl: "https://www.amazon.in/Louis-Craft-Printed-Panties-Multicolour/dp/B0FNWFT4FB",
    imageUrl: "https://m.media-amazon.com/images/I/41DSHIr6S6L._AC_SL800_.jpg",
    colors: ["Multicolor Printed"],
    smartValueScore: 98,
    trustScore: 99
  },
  {
    id: "prod_partner_zivame_bra_1",
    title: "Zivame Padded Wirefree Seamless T-Shirt Bra",
    category: "undergarments",
    price: 999,
    originalPrice: 1999,
    store: "Amazon India (pajonline-21)",
    productUrl: "https://www.amazon.in/s?k=Zivame+Padded+Wirefree+Seamless+T-Shirt+Bra",
    imageUrl: "https://m.media-amazon.com/images/I/714AcwEJC0L._AC_SL800_.jpg",
    colors: ["Nude Beige", "Midnight Black"],
    smartValueScore: 96,
    trustScore: 98
  },
  {
    id: "prod_partner_jockey_trunk_1",
    title: "Jockey Men's Super Combed Cotton Trunk (Pack of 3)",
    category: "undergarments",
    price: 899,
    originalPrice: 1199,
    store: "Amazon India (pajonline-21)",
    productUrl: "https://www.amazon.in/s?k=Jockey+Men+Cotton+Trunk",
    imageUrl: "https://m.media-amazon.com/images/I/61W8YLsLmSL._AC_SL800_.jpg",
    colors: ["Navy, Black & Grey"],
    smartValueScore: 97,
    trustScore: 99
  },

  // 2. MEN'S SUITS & BLAZERS
  {
    id: "suit-raymond-1",
    title: "Raymond Men's Tailored Executive Slim Fit Blazer Suit",
    category: "mens_suits",
    price: 3999,
    originalPrice: 7999,
    store: "Amazon India",
    productUrl: "/search?q=Raymond+Blazer",
    imageUrl: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80",
    colors: ["Charcoal Black", "Navy Blue", "Wine Red"],
    smartValueScore: 89,
    trustScore: 93
  },
  {
    id: "suit-peterengland-2",
    title: "Peter England Tuxedo Double Breasted Suit Set",
    category: "mens_suits",
    price: 5499,
    originalPrice: 9999,
    store: "Flipkart",
    productUrl: "/search?q=Peter+England+Tuxedo",
    imageUrl: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80",
    colors: ["Classic Tuxedo Black", "Midnight Blue"],
    smartValueScore: 88,
    trustScore: 92
  },
  {
    id: "suit-vanheusen-3",
    title: "Van Heusen Men's 2-Piece Wool Blend Formal Suit",
    category: "mens_suits",
    price: 7999,
    originalPrice: 12999,
    store: "Myntra",
    productUrl: "/search?q=Van+Heusen+Suit",
    imageUrl: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80",
    colors: ["Executive Navy", "Charcoal Grey"],
    smartValueScore: 91,
    trustScore: 95
  },

  // 3. MEN'S SHERWANIS & KURTAS
  {
    id: "sherwani-manyavar-1",
    title: "Manyavar Royal Silk Wedding Sherwani with Embroidered Dupatta & Stole",
    category: "sherwanis",
    price: 14999,
    originalPrice: 22999,
    store: "Amazon India",
    productUrl: "/search?q=Manyavar+Sherwani",
    imageUrl: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80",
    colors: ["Cream Gold & Maroon", "Royal Ivory"],
    smartValueScore: 92,
    trustScore: 95
  },
  {
    id: "sherwani-urbanloom-partner-2",
    title: "Saffron Thread Royal Jacquard Kurta Sherwani Set",
    category: "sherwanis",
    price: 3499,
    originalPrice: 6499,
    store: "🟢 UrbanLoom Studio (BuyWise Partner)",
    productUrl: "/partners",
    imageUrl: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80",
    colors: ["Emerald Green", "Mustard Gold"],
    smartValueScore: 94,
    trustScore: 97
  },
  {
    id: "sherwani-raymond-3",
    title: "Raymond Royal Velvet Indo-Western Sherwani Set",
    category: "sherwanis",
    price: 9999,
    originalPrice: 15999,
    store: "Flipkart",
    productUrl: "/search?q=Raymond+Indo+Western",
    imageUrl: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80",
    colors: ["Royal Navy", "Wine Velvet"],
    smartValueScore: 89,
    trustScore: 93
  },

  // 4. SAREES & ETHNIC WEAR
  {
    id: "saree-kanjivaram-1",
    title: "Manyavar Crimson Kanjivaram Silk Saree with Woven Gold Zari",
    category: "sarees",
    price: 3499,
    originalPrice: 6999,
    store: "Amazon India",
    productUrl: "/search?q=Manyavar+Kanjivaram+Saree",
    imageUrl: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80",
    colors: ["Crimson Red & Gold", "Royal Emerald", "Majestic Magenta"],
    smartValueScore: 88,
    trustScore: 92,
    drapeStyle: "nivi",
    isSaree: true
  },
  {
    id: "saree-banarasi-2",
    title: "Royal Banarasi Handloom Yellow Gold Zari Silk Saree",
    category: "sarees",
    price: 2999,
    originalPrice: 5499,
    store: "Amazon India",
    productUrl: "/search?q=Banarasi+Silk+Saree",
    imageUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
    colors: ["Mustard Gold", "Peacock Blue", "Ruby Maroon"],
    smartValueScore: 85,
    trustScore: 90,
    drapeStyle: "bengali",
    isSaree: true
  },

  // 5. SALWAR SUITS & ANARKALI (WOMEN'S ETHNIC)
  {
    id: "anarkali-biba-3",
    title: "Biba Velvet Royal Emerald Anarkali Kurta & Dupatta Set",
    category: "anarkali",
    price: 2899,
    originalPrice: 5999,
    store: "Myntra",
    productUrl: "/search?q=Biba+Anarkali",
    imageUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
    colors: ["Emerald Green", "Royal Ruby", "Midnight Navy"],
    smartValueScore: 90,
    trustScore: 94
  },
  {
    id: "suit-wforwoman-4",
    title: "W for Woman Floor Length Chanderi Anarkali Suit Set",
    category: "anarkali",
    price: 3299,
    originalPrice: 6499,
    store: "Amazon India",
    productUrl: "/search?q=W+Anarkali+Suit",
    imageUrl: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80",
    colors: ["Peach Pink", "Golden Yellow"],
    smartValueScore: 89,
    trustScore: 93
  },

  // 6. WESTERN DRESSES & GOWNS
  {
    id: "gown-zara-4",
    title: "Zara Floral Georgette Tiered Evening Party Gown",
    category: "western",
    price: 2490,
    originalPrice: 4290,
    store: "Amazon India",
    productUrl: "/search?q=Zara+Maxi+Dress",
    imageUrl: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80",
    colors: ["Floral Pink", "Lavender Sky", "Sunflower Yellow"],
    smartValueScore: 87,
    trustScore: 91
  },
  {
    id: "dress-mango-5",
    title: "Mango Satin Wrap Evening Cocktail Party Dress",
    category: "western",
    price: 3990,
    originalPrice: 6990,
    store: "Myntra",
    productUrl: "/search?q=Mango+Dress",
    imageUrl: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80",
    colors: ["Emerald Satin", "Classic Black"],
    smartValueScore: 91,
    trustScore: 95
  },

  // 7. JEWELLERY & ACCESSORIES
  {
    id: "jewellery-tanishq-5",
    title: "Tanishq 22K Royal Kundan & Pearl Bridal Necklace Set",
    category: "jewellery",
    price: 145000,
    originalPrice: 165000,
    store: "Amazon India",
    productUrl: "/search?q=Tanishq+Kundan+Necklace",
    imageUrl: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80",
    colors: ["22K Royal Gold", "Rose Gold"],
    smartValueScore: 94,
    trustScore: 98
  },

  // 8. UNDERGARMENTS & LINGERIE
  {
    id: "undergarment-zivame-1",
    title: "Zivame Seamless Padded Wirefree T-Shirt Bra Set",
    category: "undergarments",
    price: 999,
    originalPrice: 1999,
    store: "Amazon India",
    productUrl: "/search?q=Zivame+Tshirt+Bra",
    imageUrl: "https://images.unsplash.com/photo-1583846783214-7229a91b20ed?auto=format&fit=crop&w=800&q=80",
    colors: ["Nude Beige", "Midnight Black"],
    smartValueScore: 91,
    trustScore: 95
  },
  {
    id: "undergarment-jockey-men-2",
    title: "Jockey Men's Super Combed Cotton Trunk (Pack of 3)",
    category: "undergarments",
    price: 899,
    originalPrice: 1199,
    store: "Amazon India",
    productUrl: "/search?q=Jockey+Men+Trunk",
    imageUrl: "https://images.unsplash.com/photo-1583846783214-7229a91b20ed?auto=format&fit=crop&w=800&q=80",
    colors: ["Navy, Black & Grey"],
    smartValueScore: 94,
    trustScore: 97
  }
];

function VirtualTryOnContent() {
  const searchParams = useSearchParams();
  const [userPhotoUrl, setUserPhotoUrl] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [catalog, setCatalog] = useState<GarmentProduct[]>(DISCOVERED_CATALOG_PRODUCTS);
  const [activeProduct, setActiveProduct] = useState<GarmentProduct>(DISCOVERED_CATALOG_PRODUCTS[0]);
  const [comparedProducts, setComparedProducts] = useState<GarmentProduct[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState<boolean>(false);
  const [isFitAssistantOpen, setIsFitAssistantOpen] = useState<boolean>(false);
  const { t } = useTranslation();

  // Dynamic Partner Loading & Query Parameter Listener
  useEffect(() => {
    async function loadDynamicPartners() {
      try {
        const partnerItems = await getPartnerProducts();
        if (partnerItems.length > 0) {
          const mappedPartners: GarmentProduct[] = partnerItems.map(p => ({
            id: p.id,
            title: p.title,
            category: p.category.toLowerCase().includes("jewel") ? "jewellery" :
                      p.category.toLowerCase().includes("undergarment") || p.category.toLowerCase().includes("lingerie") ? "undergarments" :
                      p.subcategory?.toLowerCase().includes("saree") ? "sarees" :
                      p.category.toLowerCase().includes("fashion") ? "sarees" : "all",
            price: p.sellingPrice,
            originalPrice: p.mrp,
            store: `🟢 ${p.partnerName} (BuyWise Partner)`,
            productUrl: `/partners`,
            imageUrl: p.primaryImage,
            colors: p.colors || ["Standard Color"],
            smartValueScore: 95,
            trustScore: 98,
            isSaree: p.garmentCategory === "saree"
          }));

          const existingIds = new Set(DISCOVERED_CATALOG_PRODUCTS.map(item => item.id));
          const newPartners = mappedPartners.filter(mp => !existingIds.has(mp.id));
          setCatalog([...newPartners, ...DISCOVERED_CATALOG_PRODUCTS]);
        }
      } catch (err) {
        console.warn("VTO dynamic partners load notice:", err);
      }
    }
    loadDynamicPartners();
  }, []);

  // Pre-select product if passed from URL query params
  useEffect(() => {
    const garmentUrl = searchParams.get("garmentUrl");
    const title = searchParams.get("title");
    if (garmentUrl && title) {
      const customProd: GarmentProduct = {
        id: `custom_${Date.now()}`,
        title: decodeURIComponent(title),
        category: "all",
        price: 3999,
        store: "🟢 BuyWise Partner Direct",
        productUrl: "/partners",
        imageUrl: decodeURIComponent(garmentUrl),
        smartValueScore: 96,
        trustScore: 99
      };
      setActiveProduct(customProd);
    }
  }, [searchParams]);

  // Strict & Precise Category Filtering Function
  const isMatchForCategory = (p: GarmentProduct, catId: string) => {
    if (catId === "all") return true;
    const catLower = catId.toLowerCase();
    const pCatLower = (p.category || "").toLowerCase();
    const pTitleLower = (p.title || "").toLowerCase();

    if (catLower === "mens_suits") {
      const isWomenItem = pTitleLower.includes("woman") || pTitleLower.includes("women") || pTitleLower.includes("anarkali") || pTitleLower.includes("georgette") || pTitleLower.includes("dupatta") || pTitleLower.includes("salwar") || pTitleLower.includes("saree") || pTitleLower.includes("chanderi");
      if (isWomenItem) return false;
      return pCatLower === "mens_suits" || pTitleLower.includes("raymond") || pTitleLower.includes("peter england") || pTitleLower.includes("blazer") || pTitleLower.includes("tuxedo") || (pTitleLower.includes("men") && pTitleLower.includes("suit"));
    }

    if (catLower === "sherwanis") {
      const isWomenItem = pTitleLower.includes("woman") || pTitleLower.includes("anarkali");
      if (isWomenItem) return false;
      return pCatLower === "sherwanis" || pTitleLower.includes("sherwani") || (pTitleLower.includes("kurta") && !pTitleLower.includes("women"));
    }

    if (catLower === "anarkali") {
      return pCatLower === "anarkali" || pTitleLower.includes("anarkali") || pTitleLower.includes("salwar");
    }

    if (catLower === "sarees") {
      return pCatLower === "sarees" || pTitleLower.includes("saree") || (pTitleLower.includes("silk") && !pTitleLower.includes("suit") && !pTitleLower.includes("blazer"));
    }

    if (catLower === "western") {
      return pCatLower === "western" || pTitleLower.includes("gown") || pTitleLower.includes("dress");
    }

    if (catLower === "jewellery") {
      return pCatLower === "jewellery" || pTitleLower.includes("necklace") || pTitleLower.includes("kundan") || pTitleLower.includes("earring");
    }

    if (catLower === "undergarments") {
      return pCatLower === "undergarments" || pTitleLower.includes("undergarment") || pTitleLower.includes("lingerie") || pTitleLower.includes("bra") || pTitleLower.includes("trunk") || pTitleLower.includes("brief") || pTitleLower.includes("panty");
    }

    return pCatLower === catLower;
  };

  const filteredProducts = catalog.filter((p) => isMatchForCategory(p, activeCategory));
  const displayProducts = filteredProducts.length > 0 ? filteredProducts : catalog;

  const handleCategorySelect = (catId: string) => {
    setActiveCategory(catId);
    const firstMatch = catalog.find((p) => isMatchForCategory(p, catId));
    if (firstMatch) {
      setActiveProduct(firstMatch);
    }
  };

  const handleImportUrl = (url: string) => {
    let storeName = "Amazon India";
    if (url.includes("flipkart.com")) storeName = "Flipkart";
    else if (url.includes("meesho.com")) storeName = "Meesho";
    else if (url.includes("myntra.com")) storeName = "Myntra";
    else if (url.includes("ebay.com")) storeName = "eBay";
    else if (url.includes("buywise") || url.includes("partner")) storeName = "🟢 BuyWise Partner";

    let derivedTitle = `${storeName} Imported Product`;
    try {
      const parsed = new URL(url);
      const pathSegments = parsed.pathname.split('/').filter(Boolean);
      if (pathSegments.length > 0) {
        const slug = pathSegments[0].replace(/-/g, ' ');
        if (slug.length > 3 && !slug.includes('.html')) {
          derivedTitle = slug.charAt(0).toUpperCase() + slug.slice(1);
        }
      }
    } catch (e) {
      // Ignore
    }

    const importedProd: GarmentProduct = {
      id: `imported_${Date.now()}`,
      title: derivedTitle,
      category: "all",
      price: 2999,
      originalPrice: 4999,
      store: storeName,
      productUrl: url,
      imageUrl: url.match(/\.(jpeg|jpg|gif|png|webp)/i) 
        ? url 
        : "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80",
      smartValueScore: 92,
      trustScore: 95
    };

    setCatalog(prev => [importedProd, ...prev]);
    setActiveProduct(importedProd);
  };

  const handleAddToCompare = (product: GarmentProduct) => {
    if (!comparedProducts.find(p => p.id === product.id)) {
      setComparedProducts([...comparedProducts, product]);
    }
    setIsCompareOpen(true);
  };

  const handleRemoveFromCompare = (id: string) => {
    setComparedProducts(comparedProducts.filter(p => p.id !== id));
  };

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "20px" }}>
      {/* Studio Banner */}
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 18px", background: "var(--gradient-accent)", borderRadius: "20px", marginBottom: "14px" }}>
          <span style={{ color: "white", fontWeight: 900, fontSize: "13px" }}>✨ {t("launch_try_on")}</span>
          <span style={{ color: "#00ff88", fontWeight: 800, fontSize: "13px" }}>Multi-Store Shopping & AI Fitting</span>
        </div>

        <h1 style={{ fontSize: "42px", fontWeight: 900, marginBottom: "10px" }}>
          {t("ai_virtual_trial_room")}
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "16px", maxWidth: "700px", margin: "0 auto" }}>
          {t("virtual_trial_desc")}
        </p>
      </div>

      {/* STEP 1 & STEP 3: Photo Upload Dropzone */}
      <PhotoUploadDropzone
        userPhotoUrl={userPhotoUrl}
        onPhotoSelected={(url) => setUserPhotoUrl(url)}
        onPhotoDeleted={() => setUserPhotoUrl(null)}
      />

      {/* STEP 4 & STEP 5: Search Bar & Multi-Store Discovery Pills */}
      <ProductDiscoveryBar
        onSearch={(query) => {
          const match = catalog.find(p => p.title.toLowerCase().includes(query.toLowerCase()));
          if (match) setActiveProduct(match);
        }}
        onImportUrl={handleImportUrl}
        activeCategory={activeCategory}
        onCategorySelect={handleCategorySelect}
      />

      {/* STEP 6, 7, 8: Master Try-On Workspace Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1.25fr 1.1fr", gap: "32px", marginBottom: "40px" }}>
        {/* Left Column: Visual Try-On Garment Canvas */}
        <GarmentCanvas
          userPhotoUrl={userPhotoUrl}
          product={activeProduct}
          onCompareAddToLook={handleAddToCompare}
          onOpenFitAssistant={() => setIsFitAssistantOpen(true)}
        />

        {/* Right Column: Multi-Store Discovered Products Catalog */}
        <div className="glass" style={{ padding: "24px", borderRadius: "24px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--glass-border)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "19px", fontWeight: 800, color: "white" }}>
                🛍️ {t("Discovered Products")} ({displayProducts.length})
              </h3>
              {comparedProducts.length > 0 && (
                <button
                  onClick={() => setIsCompareOpen(true)}
                  style={{ padding: "6px 14px", borderRadius: "14px", border: "1px solid #00ff88", background: "rgba(0,255,136,0.15)", color: "#00ff88", fontSize: "12px", fontWeight: 800, cursor: "pointer" }}
                >
                  📊 {t("Compare Looks")} ({comparedProducts.length})
                </button>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px", maxHeight: "560px", overflowY: "auto", paddingRight: "6px" }}>
              {displayProducts.map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => setActiveProduct(prod)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    padding: "14px",
                    borderRadius: "18px",
                    background: activeProduct.id === prod.id ? "rgba(138,43,226,0.2)" : "rgba(255,255,255,0.03)",
                    border: activeProduct.id === prod.id ? "2px solid #00ff88" : "1px solid var(--glass-border)",
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                >
                  <div style={{ position: "relative", width: "80px", height: "80px", borderRadius: "12px", overflow: "hidden", flexShrink: 0 }}>
                    <Image src={getProxiedImageUrl(prod.imageUrl)} alt={prod.title} fill unoptimized referrerPolicy="no-referrer" style={{ objectFit: "cover" }} />
                  </div>

                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: "11px", fontWeight: 800, color: prod.store.includes("Partner") ? "#00ff88" : "#00d4ff", textTransform: "uppercase" }}>{prod.store}</span>
                    <h4 style={{ fontSize: "14px", fontWeight: 800, color: "white", marginBottom: "4px", lineHeight: 1.3 }}>{t(prod.title)}</h4>
                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                      <span style={{ fontSize: "16px", fontWeight: 900, color: "#00ff88" }}>₹{prod.price.toLocaleString('en-IN')}</span>
                      {prod.originalPrice && (
                        <span style={{ fontSize: "12px", color: "var(--text-secondary)", textDecoration: "line-through" }}>
                          ₹{prod.originalPrice.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    className="btn-primary"
                    style={{ padding: "8px 16px", fontSize: "12px", fontWeight: 800, borderRadius: "20px", background: "var(--gradient-accent)" }}
                  >
                    ✨ {t("nav_try_on")}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* STEP 13: Look Comparison Grid Modal */}
      <LookComparisonGrid
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        comparedProducts={comparedProducts}
        userPhotoUrl={userPhotoUrl}
        onRemoveProduct={handleRemoveFromCompare}
      />

      {/* STEP 16: Size & Fit Assistant Modal */}
      <FitAssistantModal
        isOpen={isFitAssistantOpen}
        onClose={() => setIsFitAssistantOpen(false)}
        product={activeProduct}
      />
    </div>
  );
}

export default function VirtualTryOnStudio() {
  return (
    <Suspense fallback={<div style={{ textAlign: "center", padding: "60px", color: "white" }}>Loading AI Trial Room...</div>}>
      <VirtualTryOnContent />
    </Suspense>
  );
}

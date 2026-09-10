"use client"
import { useState, useEffect } from "react";
import { TOP_CATEGORIES, BestsellerProduct } from "@/lib/categoryData";
import { getPartnerProducts } from "@/lib/partners/partnerService";
import { PartnerProduct } from "@/lib/partners/types";
import Link from "next/link";
import Image from "next/image";
import { getProxiedImageUrl } from "@/lib/imageUtils";
import SafeProductImage from "@/components/SafeProductImage";
import { resolveProductImage } from "@/lib/categoryResolver";
import SelfieDressTryOnModal from "@/components/SelfieDressTryOnModal";
import { calculateEffectivePrice } from "@/lib/coupons/couponService";
import { useTranslation } from "@/lib/i18n/i18nContext";

export default function CategoriesPage() {
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState<BestsellerProduct | null>(null);
  const [isSelfieModalOpen, setIsSelfieModalOpen] = useState(false);
  const [partnerProducts, setPartnerProducts] = useState<PartnerProduct[]>([]);
  const { t } = useTranslation();

  useEffect(() => {
    async function loadLivePartnerProducts() {
      try {
        const liveData = await getPartnerProducts();
        if (liveData && liveData.length > 0) {
          setPartnerProducts(liveData);
        }
      } catch (err) {
        console.warn("Categories page partner products fetch notice:", err);
      }
    }
    loadLivePartnerProducts();
  }, []);

  const decodeHtmlEntities = (str: string) => {
    if (!str) return '';
    return str
      .replace(/&#x27;/g, "'")
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');
  };

  // Map live PartnerProduct items to BestsellerProduct format
  const convertedPartnerProducts: BestsellerProduct[] = partnerProducts.map(p => {
    const pCatLower = (p.category || '').toLowerCase();
    const pTextLower = (p.title + ' ' + (p.description || '') + ' ' + (p.brand || '') + ' ' + (p.sku || '')).toLowerCase();
    
    let targetCatName = p.category || "Fashion & Clothing";
    if (pCatLower.includes('undergarment') || pCatLower.includes('lingerie') ||
        pTextLower.includes('panty') || pTextLower.includes('panties') || pTextLower.includes('bra') ||
        pTextLower.includes('lingerie') || pTextLower.includes('underwear') || pTextLower.includes('brief') ||
        pTextLower.includes('trunk') || pTextLower.includes('bloomer') || pTextLower.includes('thong')) {
      targetCatName = "Undergarments & Lingerie";
    }

    const productPageUrl = p.productUrl || (p.description?.includes('http') ? p.description.replace(/.*?(https?:\/\/[^\s]+).*/, '$1') : `/partners`);

    return {
      id: p.id,
      name: decodeHtmlEntities(p.title),
      category: targetCatName,
      image: p.primaryImage || p.images[0] || "https://images.unsplash.com/photo-1583846783214-7229a91b20ed?w=800&auto=format&fit=crop&q=80",
      rating: p.rating || 4.9,
      reviewsCount: p.reviewCount || 34,
      lowestPrice: p.sellingPrice,
      originalPrice: p.mrp || Math.round(p.sellingPrice * 1.5),
      bestStore: `${p.brand || p.partnerName || 'Amazon India'}`,
      specs: [
        { label: "Product Link", value: productPageUrl },
        { label: "Brand / Store", value: p.brand || p.partnerName || "Gen-G Partner" },
        { label: "Delivery", value: "Express Seller Fulfillment & Packaging" },
        { label: "Return Policy", value: p.returnPolicy || "7 Days Refund & Return Guaranteed" }
      ],
      prices: [
        { store: p.brand || p.partnerName || "Amazon India", price: p.sellingPrice, url: productPageUrl, inStock: (p.stock || 50) > 0, tag: "pajonline-21" }
      ],
      highlights: ["🟢 Gen-G Partner Item", "✨ 1-Click AI Virtual Try-On", "Verified Direct Link Product"]
    };
  });

  // Calculate products for the selected category tab
  const staticProducts = selectedCategoryId === "all" 
    ? TOP_CATEGORIES.flatMap(c => c.products) 
    : (TOP_CATEGORIES.find(c => c.id === selectedCategoryId)?.products || []);

  const matchingPartnerProducts = convertedPartnerProducts.filter(p => {
    if (selectedCategoryId === "all") return true;
    
    if (selectedCategoryId === "undergarments") {
      const text = (p.name + ' ' + p.category).toLowerCase();
      return p.category === "Undergarments & Lingerie" ||
             p.category.toLowerCase().includes("undergarment") ||
             p.category.toLowerCase().includes("lingerie") ||
             text.includes("panty") || text.includes("panties") || text.includes("bra") ||
             text.includes("lingerie") || text.includes("underwear") || text.includes("brief") ||
             text.includes("trunk") || text.includes("undergarment");
    }
    
    const catObj = TOP_CATEGORIES.find(c => c.id === selectedCategoryId);
    if (!catObj) return false;
    return p.category.toLowerCase().includes(catObj.name.toLowerCase()) || 
           catObj.name.toLowerCase().includes(p.category.toLowerCase());
  });

  // Deduplicate products by id with partner products placed at top
  const allProductMap = new Map<string, BestsellerProduct>();
  matchingPartnerProducts.forEach(p => allProductMap.set(p.id, p));
  staticProducts.forEach(p => {
    if (!allProductMap.has(p.id)) {
      allProductMap.set(p.id, p);
    }
  });

  const displayProducts = Array.from(allProductMap.values());

  return (
    <main style={{ paddingTop: "20px", paddingBottom: "100px" }} suppressHydrationWarning>
      <div className="container" suppressHydrationWarning>
        
        {/* Amazon-style Category Navigation Bar */}
        <div 
          className="glass"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "10px 20px",
            borderRadius: "20px",
            marginBottom: "30px",
            overflowX: "auto",
            scrollbarWidth: "none",
            background: "rgba(12, 10, 20, 0.9)",
            border: "1px solid var(--glass-border)"
          }}
        >
          <button
            onClick={() => setSelectedCategoryId("all")}
            style={{
              padding: "8px 18px",
              borderRadius: "14px",
              border: selectedCategoryId === "all" ? "1px solid var(--primary)" : "1px solid transparent",
              background: selectedCategoryId === "all" ? "var(--gradient-accent)" : "rgba(255, 255, 255, 0.05)",
              color: "white",
              fontWeight: 800,
              fontSize: "13px",
              cursor: "pointer",
              whiteSpace: "nowrap"
            }}
          >
            {t("all_bestsellers")}
          </button>

          {TOP_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
              style={{
                padding: "8px 18px",
                borderRadius: "14px",
                border: selectedCategoryId === cat.id ? "1px solid var(--primary)" : "1px solid transparent",
                background: selectedCategoryId === cat.id ? "var(--gradient-accent)" : "rgba(255, 255, 255, 0.05)",
                color: "white",
                fontWeight: 700,
                fontSize: "13px",
                cursor: "pointer",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <span>{cat.icon}</span>
              <span>{t(cat.name)}</span>
            </button>
          ))}
        </div>

        {/* AI Selfie Virtual Dress Try-On Trigger Banner */}
        <div
          className="glass"
          style={{
            padding: "28px 36px",
            borderRadius: "24px",
            marginBottom: "44px",
            background: "linear-gradient(135deg, rgba(255, 0, 128, 0.15), rgba(121, 40, 202, 0.2))",
            border: "1px solid rgba(255, 0, 128, 0.4)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "20px"
          }}
        >
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 14px", background: "rgba(255, 0, 128, 0.2)", borderRadius: "12px", marginBottom: "8px" }}>
              <span style={{ color: "#ff0080", fontWeight: 800, fontSize: "12px" }}>NEW FEATURE ✨</span>
              <span style={{ color: "white", fontSize: "12px" }}>AI Selfie Fashion & Outfit Studio</span>
            </div>
            <h2 style={{ fontSize: "28px", fontWeight: 900, color: "white", marginBottom: "6px" }}>
              📸 {t("virtual_trial_desc")}
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "15px", maxWidth: "650px" }}>
              Upload your photo to instantly preview dresses, sarees, suits & outfits across Amazon India, Myntra, Flipkart, Meesho & Tata CLiQ!
            </p>
          </div>

          <button
            onClick={() => setIsSelfieModalOpen(true)}
            className="btn-primary"
            style={{
              padding: "14px 32px",
              fontSize: "15px",
              fontWeight: 800,
              borderRadius: "30px",
              background: "var(--gradient-accent)",
              boxShadow: "0 10px 30px rgba(255, 0, 128, 0.4)"
            }}
          >
            📸 {t("open_ai_trial_room")}
          </button>
        </div>

        {/* Category Banner Title */}
        <div style={{ textAlign: "center", marginBottom: "50px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 16px", background: "rgba(0, 255, 136, 0.12)", border: "1px solid rgba(0, 255, 136, 0.3)", borderRadius: "20px", marginBottom: "16px" }}>
            <span style={{ color: "#00ff88", fontWeight: 800, fontSize: "13px" }}>{t("top_selling_bestsellers")}</span>
            <span style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{t("full_specs_live_prices")}</span>
          </div>

          <h1 style={{ fontSize: "52px", fontWeight: 900, marginBottom: "14px" }}>
            {t("explore_top_products")}
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "17px", maxWidth: "650px", margin: "0 auto" }}>
            {t("explore_products_desc")}
          </p>
        </div>

        {/* Product Cards Grid with Pics, Specs & Store Prices */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "32px" }}>
          {displayProducts.map((prod) => (
            <div
              key={prod.id}
              className="glass glass-card"
              style={{
                borderRadius: "24px",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                border: "1px solid var(--glass-border)",
                background: "var(--glass-bg)",
                transition: "all 0.3s ease"
              }}
            >
              {/* Product Picture Container */}
              <div style={{ position: "relative", width: "100%", height: "240px", background: "#080612" }}>
                <SafeProductImage
                  src={resolveProductImage(prod)}
                  alt={prod.name}
                  style={{ width: "100%", height: "100%" }}
                />
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "linear-gradient(to bottom, transparent 50%, rgba(12, 10, 20, 0.95))", pointerEvents: "none" }}></div>
                
                <span style={{ position: "absolute", top: "16px", left: "16px", fontSize: "11px", fontWeight: 800, padding: "4px 12px", borderRadius: "12px", background: "rgba(0,0,0,0.75)", color: "#00ff88", border: "1px solid rgba(0, 255, 128, 0.3)" }}>
                  {t(prod.category)}
                </span>

                <span style={{ position: "absolute", top: "16px", right: "16px", fontSize: "12px", fontWeight: 800, padding: "4px 10px", borderRadius: "10px", background: "rgba(255, 215, 0, 0.2)", color: "#ffd700", border: "1px solid rgba(255, 215, 0, 0.4)" }}>
                  ⭐ {prod.rating} ({prod.reviewsCount.toLocaleString()})
                </span>
              </div>

              {/* Product Info & Specifications */}
              <div style={{ padding: "26px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <h2 style={{ fontSize: "20px", fontWeight: 800, color: "white", marginBottom: "12px", lineHeight: 1.4 }}>
                    {prod.name}
                  </h2>

                  {/* Highlights Pill */}
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "18px" }}>
                    {prod.highlights.map((h, hIdx) => (
                      <span key={hIdx} style={{ fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "8px", background: "rgba(138, 43, 226, 0.15)", color: "#c084fc", border: "1px solid rgba(138, 43, 226, 0.3)" }}>
                        ✓ {t(h)}
                      </span>
                    ))}
                  </div>

                  {/* Specifications Preview */}
                  <div style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid var(--glass-border)", borderRadius: "14px", padding: "14px", marginBottom: "20px" }}>
                    <div style={{ fontSize: "12px", fontWeight: 800, color: "var(--text-secondary)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {t("key_product_details")}
                    </div>
                    {prod.specs.filter(sp => sp.label !== "Product Link").slice(0, 3).map((sp, sIdx) => (
                      <div key={sIdx} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
                        <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>{t(sp.label)}:</span>
                        <span style={{ color: "white", fontWeight: 700, textAlign: "right", maxWidth: "60%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sp.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Price & Retailer Store Comparison */}
                <div>
                  {(() => {
                    const effCalc = calculateEffectivePrice(prod.lowestPrice, prod.category, prod.bestStore);
                    return (
                      <div style={{ padding: "12px", background: "rgba(0, 255, 136, 0.08)", border: "1px solid rgba(0, 255, 136, 0.3)", borderRadius: "16px", marginBottom: "16px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                          <div>
                            <span style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block" }}>{t("sticker_price")}</span>
                            <span style={{ fontSize: "18px", fontWeight: 800, color: "white" }}>₹{prod.lowestPrice.toLocaleString('en-IN')}</span>
                            <span style={{ fontSize: "12px", color: "var(--text-secondary)", textDecoration: "line-through", marginLeft: "6px" }}>₹{prod.originalPrice.toLocaleString('en-IN')}</span>
                          </div>
                          <span style={{ fontSize: "11px", color: "#00d4ff", fontWeight: 700 }}>on {prod.bestStore}</span>
                        </div>

                        {effCalc.hasCoupon && effCalc.bestCoupon ? (
                          <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "8px", marginTop: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                              <span style={{ fontSize: "10px", fontWeight: 800, background: "rgba(0, 255, 136, 0.2)", color: "#00ff88", border: "1px solid rgba(0, 255, 136, 0.4)", padding: "2px 6px", borderRadius: "6px", display: "inline-block", marginBottom: "2px" }}>
                                🎟️ {effCalc.bestCoupon.code} (-₹{effCalc.savingsAmount})
                              </span>
                              <span style={{ fontSize: "10px", color: "#00ff88", display: "block" }}>✓ Verified {effCalc.bestCoupon.lastVerifiedAt}</span>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <span style={{ fontSize: "10px", color: "#00ff88", fontWeight: 800, display: "block", textTransform: "uppercase" }}>🏆 REAL EFFECTIVE PRICE</span>
                              <span style={{ fontSize: "22px", fontWeight: 900, color: "#00ff88" }}>₹{effCalc.effectivePrice.toLocaleString('en-IN')}</span>
                            </div>
                          </div>
                        ) : (
                          <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "6px", marginTop: "6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Best Live Price</span>
                            <span style={{ fontSize: "22px", fontWeight: 900, color: "#00ff88" }}>₹{prod.lowestPrice.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <button
                      onClick={() => setSelectedProduct(prod)}
                      className="btn-primary"
                      style={{ flex: 1, padding: "12px", fontSize: "13px", fontWeight: 800, background: "var(--gradient-accent)" }}
                    >
                      {t("view_complete_specs")}
                    </button>
                    {prod.prices[0]?.url && prod.prices[0]?.url.startsWith('http') && (
                      <a
                        href={prod.prices[0].url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: "12px 18px",
                          fontSize: "13px",
                          fontWeight: 800,
                          borderRadius: "16px",
                          background: "linear-gradient(90deg, #00ff88, #00d4ff)",
                          color: "#080612",
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px"
                        }}
                      >
                        🛒 Open Link ↗
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Full Product Specifications Modal */}
        {selectedProduct && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.88)",
              backdropFilter: "blur(14px)",
              zIndex: 99999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px"
            }}
            onClick={() => setSelectedProduct(null)}
          >
            <div
              className="glass"
              style={{
                maxWidth: "800px",
                width: "100%",
                maxHeight: "90vh",
                overflowY: "auto",
                borderRadius: "28px",
                border: "1px solid var(--primary)",
                background: "#0c0a14",
                color: "white",
                position: "relative"
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ position: "relative", width: "100%", height: "260px" }}>
                <SafeProductImage
                  src={resolveProductImage(selectedProduct)}
                  alt={selectedProduct.name}
                  style={{ width: "100%", height: "100%" }}
                />
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "linear-gradient(to bottom, transparent 30%, #0c0a14 100%)", pointerEvents: "none" }}></div>
                
                <button
                  onClick={() => setSelectedProduct(null)}
                  style={{ position: "absolute", top: "20px", right: "20px", background: "rgba(0, 0, 0, 0.7)", border: "1px solid rgba(255,255,255,0.2)", color: "white", width: "40px", height: "40px", borderRadius: "50%", cursor: "pointer", fontSize: "20px" }}
                >
                  ✕
                </button>
              </div>

              <div style={{ padding: "0 36px 36px 36px", marginTop: "-30px", position: "relative", zIndex: 2 }}>
                <span style={{ background: "var(--gradient-accent)", color: "#ffffff", padding: "4px 14px", borderRadius: "12px", fontSize: "12px", fontWeight: 800 }}>
                  {t(selectedProduct.category)}
                </span>

                <h1 style={{ fontSize: "30px", fontWeight: 900, margin: "14px 0", lineHeight: 1.3 }}>
                  {selectedProduct.name}
                </h1>

                <h3 style={{ fontSize: "18px", fontWeight: 800, marginTop: "24px", marginBottom: "14px", color: "#00ff88" }}>
                  ⚙️ Complete Specifications & Product Details
                </h3>
                <div style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid var(--glass-border)", borderRadius: "18px", overflow: "hidden", marginBottom: "28px" }}>
                  {selectedProduct.specs.map((sp, idx) => (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "14px 20px", borderBottom: idx < selectedProduct.specs.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none", fontSize: "14px" }}>
                      <span style={{ color: "var(--text-secondary)", fontWeight: 700 }}>{t(sp.label)}</span>
                      <span style={{ color: "white", fontWeight: 800, textAlign: "right" }}>{sp.value}</span>
                    </div>
                  ))}
                </div>

                <h3 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "14px", color: "var(--primary)" }}>
                  🏪 Compare Live Store Prices
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "30px" }}>
                  {selectedProduct.prices.map((st, idx) => (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--glass-border)", borderRadius: "16px" }}>
                      <div>
                        <span style={{ fontWeight: 800, color: "white", fontSize: "15px", display: "block" }}>{st.store}</span>
                        {st.tag && <span style={{ fontSize: "11px", color: "#00ff88", fontWeight: 700 }}>Associate Tag: {st.tag}</span>}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <span style={{ fontSize: "20px", fontWeight: 900, color: idx === 0 ? "#00ff88" : "white" }}>
                          ₹{st.price.toLocaleString('en-IN')}
                        </span>

                        <Link href={st.url} style={{ textDecoration: "none" }}>
                          <button className="btn-primary" style={{ padding: "8px 18px", fontSize: "13px", fontWeight: 800, background: "var(--gradient-accent)" }}>
                            Buy on {st.store} ↗
                          </button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    onClick={() => setSelectedProduct(null)}
                    style={{
                      padding: "12px 28px",
                      borderRadius: "30px",
                      border: "1px solid rgba(255, 255, 255, 0.3)",
                      background: "rgba(255, 255, 255, 0.12)",
                      color: "#ffffff",
                      fontWeight: 800,
                      fontSize: "14px",
                      cursor: "pointer"
                    }}
                  >
                    Close Specifications
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Selfie Dress Try-On Modal */}
        <SelfieDressTryOnModal
          isOpen={isSelfieModalOpen}
          onClose={() => setIsSelfieModalOpen(false)}
        />
      </div>
    </main>
  );
}

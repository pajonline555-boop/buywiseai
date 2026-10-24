"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import PhotoUploadModal from "@/components/PhotoUploadModal";
import VoiceSearchModal from "@/components/VoiceSearchModal";
import { ComparisonResponse, StoreOffer } from "@/lib/retailers/types";
import { useAuth } from "@/lib/AuthContext";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import SafeProductImage from "@/components/SafeProductImage";
import { parseSearchIntent } from "@/lib/search/ProductIntentParser";
import { getCategoryCapabilities } from "@/lib/search/CategoryCapabilityMatrix";

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const queryParam = searchParams.get("q");
  const visionQueryParam = searchParams.get("visionQuery");
  const modeParam = searchParams.get("mode") || "exact";

  const searchQuery = visionQueryParam || queryParam || "";

  const [data, setData] = useState<ComparisonResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("score-desc");
  const [viewMode, setViewMode] = useState<"tiles" | "list">("tiles");
  const [tierFilter, setTierFilter] = useState<"ALL" | "PREMIUM" | "LUXURY">("ALL");
  const [selectedBrand, setSelectedBrand] = useState<string>("ALL");
  const [searchInput, setSearchInput] = useState(searchQuery);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    setSearchInput(searchQuery);
    if (searchQuery) {
      fetchComparison();
    } else {
      setLoading(false);
    }
  }, [searchQuery, modeParam]);

  const fetchComparison = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/compare?q=${encodeURIComponent(searchQuery)}`);
      const result = await res.json();
      if (!res.ok) {
        setError(result.error || "Failed to fetch comparison data.");
      } else {
        setData(result);
      }
    } catch (err: any) {
      console.error("Fetch comparison error:", err);
      setError("Network error while connecting to comparison engine.");
    } finally {
      setLoading(false);
    }
  };

  const handleTextSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  const sortOffers = (offers: StoreOffer[] = []) => {
    return [...offers].sort((a, b) => {
      const priceA = a.effectivePayablePrice || a.price;
      const priceB = b.effectivePayablePrice || b.price;
      if (sortBy === "score-desc") return (b.smartValueScore || 0) - (a.smartValueScore || 0);
      if (sortBy === "price-asc") return priceA - priceB;
      if (sortBy === "price-desc") return priceB - priceA;
      if (sortBy === "match-desc") return (b.matchConfidence || 0) - (a.matchConfidence || 0);
      return 0;
    });
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ height: "100vh", flexDirection: "column" }}>
        <div style={{ fontSize: "14px", color: "var(--accent)", fontWeight: 800, letterSpacing: "1.5px", marginBottom: "8px" }}>
          BUYWISE AI INDIA
        </div>
        <div className="text-gradient" style={{ fontSize: "28px", fontWeight: 800, marginBottom: "24px" }}>
          Searching Amazon, Flipkart, Myntra & Verified Retailers...
        </div>
        <div style={{ width: "240px", height: "4px", background: "var(--glass-border)", borderRadius: "2px", overflow: "hidden" }}>
          <div style={{ width: "50%", height: "100%", background: "var(--gradient-accent)", animation: "pulse-glow 1.2s infinite linear" }}></div>
        </div>
      </div>
    );
  }

  // Filter offers by tier & brand
  const allRawOffers = data?.stores || [];
  const uniqueBrands = Array.from(new Set(allRawOffers.map((o) => o.brand).filter(Boolean))) as string[];

  const filteredOffers = allRawOffers.filter((o) => {
    if (tierFilter === "PREMIUM" && o.tier !== "PREMIUM") return false;
    if (tierFilter === "LUXURY" && o.tier !== "LUXURY") return false;
    if (selectedBrand !== "ALL" && o.brand !== selectedBrand) return false;
    return true;
  });

  const sortedOffers = sortOffers(filteredOffers);
  const exactOffers = sortedOffers.filter((o) => o.matchType === "exact");
  const variantOffers = sortedOffers.filter((o) => o.matchType === "variant");
  const similarOffers = sortedOffers.filter((o) => o.matchType === "similar");

  const bestValueOffer = sortedOffers.find((o) => o.isBestValue) || sortedOffers[0];
  const premiumCount = data?.groupedOffers?.premium?.length || allRawOffers.filter((o) => o.tier === "PREMIUM").length;
  const luxuryCount = data?.groupedOffers?.luxury?.length || allRawOffers.filter((o) => o.tier === "LUXURY").length;

  return (
    <main style={{ paddingTop: "110px", paddingBottom: "100px" }}>
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div style={{
          position: "fixed",
          bottom: "30px",
          right: "30px",
          zIndex: 9999,
          background: "linear-gradient(135deg, #111, #1a0033)",
          border: "2px solid #00ff88",
          boxShadow: "0 10px 40px rgba(0, 255, 136, 0.4)",
          padding: "16px 24px",
          borderRadius: "20px",
          color: "white",
          maxWidth: "420px",
          fontSize: "14px",
          fontWeight: 700,
          animation: "pulse-glow 1s ease"
        }}>
          {toastMessage}
          <div style={{ marginTop: "8px" }}>
            <button 
              onClick={() => router.push("/alerts")}
              style={{ background: "#00ff88", color: "#111", border: "none", padding: "4px 12px", borderRadius: "10px", fontWeight: 800, cursor: "pointer", fontSize: "12px" }}
            >
              View My Alerts ➔
            </button>
          </div>
        </div>
      )}

      <div className="container">
        {/* Top Header & Search Bar */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px", marginBottom: "16px" }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "4px 14px", background: "rgba(138, 43, 226, 0.12)", border: "1px solid var(--glass-border)", borderRadius: "20px", marginBottom: "8px" }}>
                <span style={{ color: "var(--primary)", fontWeight: 800, fontSize: "12px" }}>BUYWISE AI INDIA 🇮🇳</span>
                <span style={{ color: "var(--text-secondary)", fontSize: "12px" }}>Verified Retailer Comparison</span>
              </div>
              <h1 style={{ fontSize: "32px", fontWeight: 800 }}>
                Comparison Results for &quot;<span className="text-gradient">{searchQuery || "All Products"}</span>&quot;
              </h1>
            </div>

            {/* View Mode & Sort Controls */}
            <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
              <div className="glass" style={{ padding: "4px", borderRadius: "16px", display: "flex", gap: "4px" }}>
                <button
                  onClick={() => setViewMode("tiles")}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "12px",
                    border: "none",
                    background: viewMode === "tiles" ? "var(--gradient-accent)" : "transparent",
                    color: "white",
                    fontWeight: 700,
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  📱 Tiles Mode
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "12px",
                    border: "none",
                    background: viewMode === "list" ? "var(--gradient-accent)" : "transparent",
                    color: "white",
                    fontWeight: 700,
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  📋 List Mode
                </button>
              </div>

              <div className="glass" style={{ padding: "8px 18px", borderRadius: "16px", display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>SORT:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{ background: "transparent", color: "white", border: "none", outline: "none", fontWeight: 700, cursor: "pointer", fontSize: "14px" }}
                >
                  <option value="score-desc" style={{ background: "#111" }}>Smart Value Score</option>
                  <option value="price-asc" style={{ background: "#111" }}>Lowest Effective Price</option>
                  <option value="price-desc" style={{ background: "#111" }}>Highest Price</option>
                  <option value="match-desc" style={{ background: "#111" }}>Highest Match</option>
                </select>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleTextSearch} className="glass" style={{ display: "flex", alignItems: "center", padding: "6px 12px", borderRadius: "50px", maxWidth: "680px" }}>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search Indian products or paste query..."
              style={{ flex: 1, background: "transparent", border: "none", color: "white", padding: "10px 18px", outline: "none", fontSize: "15px" }}
            />
            <button
              type="button"
              onClick={() => setIsVoiceModalOpen(true)}
              title="Voice Search"
              style={{
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid var(--glass-border)",
                borderRadius: "50%",
                width: "40px",
                height: "40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "18px",
                cursor: "pointer",
                marginRight: "8px",
              }}
            >
              🎙️
            </button>
            <button
              type="button"
              onClick={() => setIsPhotoModalOpen(true)}
              title="Search by Photo"
              style={{
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid var(--glass-border)",
                borderRadius: "50%",
                width: "40px",
                height: "40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "18px",
                cursor: "pointer",
                marginRight: "8px",
              }}
            >
              📷
            </button>
            <button type="submit" className="btn-primary" style={{ padding: "10px 24px" }}>Search</button>
          </form>
        </div>

        {/* 🌟 CUSTOMER-FACING CATEGORY TABS: PREMIUM VS LUXURY */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "20px" }}>
          <button
            onClick={() => setTierFilter("ALL")}
            style={{
              padding: "10px 20px",
              borderRadius: "20px",
              border: tierFilter === "ALL" ? "2px solid #00d4ff" : "1px solid var(--glass-border)",
              background: tierFilter === "ALL" ? "rgba(0, 212, 255, 0.15)" : "var(--glass-bg)",
              color: tierFilter === "ALL" ? "#00d4ff" : "white",
              fontWeight: 800,
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            🌟 All Deals ({allRawOffers.length})
          </button>
          <button
            onClick={() => setTierFilter("PREMIUM")}
            style={{
              padding: "10px 20px",
              borderRadius: "20px",
              border: tierFilter === "PREMIUM" ? "2px solid #00ff88" : "1px solid var(--glass-border)",
              background: tierFilter === "PREMIUM" ? "rgba(0, 255, 136, 0.15)" : "var(--glass-bg)",
              color: tierFilter === "PREMIUM" ? "#00ff88" : "white",
              fontWeight: 800,
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            ⚡ PREMIUM — Best-Value & Verified Low Prices ({premiumCount})
          </button>
          <button
            onClick={() => setTierFilter("LUXURY")}
            style={{
              padding: "10px 20px",
              borderRadius: "20px",
              border: tierFilter === "LUXURY" ? "2px solid #a78bfa" : "1px solid var(--glass-border)",
              background: tierFilter === "LUXURY" ? "rgba(167, 139, 250, 0.2)" : "var(--glass-bg)",
              color: tierFilter === "LUXURY" ? "#c4b5fd" : "white",
              fontWeight: 800,
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            💎 LUXURY — Branded & Heritage Authentic ({luxuryCount})
          </button>
        </div>

        {/* Brand Filter Chips if available */}
        {uniqueBrands.length > 1 && (
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px", alignItems: "center" }}>
            <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 700 }}>BRAND:</span>
            <button
              onClick={() => setSelectedBrand("ALL")}
              style={{
                padding: "4px 12px",
                borderRadius: "14px",
                fontSize: "11.5px",
                fontWeight: selectedBrand === "ALL" ? 800 : 500,
                border: selectedBrand === "ALL" ? "1px solid white" : "1px solid var(--glass-border)",
                background: selectedBrand === "ALL" ? "rgba(255,255,255,0.15)" : "transparent",
                color: "white",
                cursor: "pointer",
              }}
            >
              All Brands
            </button>
            {uniqueBrands.map((b) => (
              <button
                key={b}
                onClick={() => setSelectedBrand(b)}
                style={{
                  padding: "4px 12px",
                  borderRadius: "14px",
                  fontSize: "11.5px",
                  fontWeight: selectedBrand === b ? 800 : 500,
                  border: selectedBrand === b ? "1px solid #00ff88" : "1px solid var(--glass-border)",
                  background: selectedBrand === b ? "rgba(0, 255, 136, 0.15)" : "transparent",
                  color: selectedBrand === b ? "#00ff88" : "white",
                  cursor: "pointer",
                }}
              >
                {b}
              </button>
            ))}
          </div>
        )}

        {/* Retailer Connection Status Bar */}
        {data?.providerStatuses && data.providerStatuses.length > 0 && (
          <div className="glass" style={{ padding: "10px 18px", borderRadius: "14px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap", fontSize: "11.5px" }}>
            <span style={{ color: "var(--text-secondary)", fontWeight: 700 }}>RETAILER FEEDS:</span>
            {data.providerStatuses.slice(0, 5).map((ps) => {
              const isLive = ps.status === "LIVE" || ps.status === "PARTNER_LIVE";
              const isReq = ps.status === "CREDENTIALS_REQUIRED";
              return (
                <div key={ps.retailerId} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: isLive ? "#00ff88" : isReq ? "#f59e0b" : "#64748b" }} />
                  <span style={{ fontWeight: 600, color: "white" }}>{ps.retailerName}</span>
                  <span style={{ color: isLive ? "#00ff88" : isReq ? "#f59e0b" : "#94a3b8", fontSize: "10px" }}>
                    {isLive ? "Live" : isReq ? "Credentials Required" : "API Unavailable"}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* 🏆 Best Value Recommendation Card */}
        {bestValueOffer && (
          <div className="glass animate-fade-in" style={{ padding: "24px 28px", borderRadius: "20px", marginBottom: "32px", border: "1px solid var(--primary)", background: "linear-gradient(135deg, rgba(138, 43, 226, 0.14), transparent)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "20px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "10px" }}>
                  <span style={{ background: "var(--gradient-accent)", padding: "4px 12px", borderRadius: "20px", fontSize: "11.5px", fontWeight: 800, color: "white" }}>
                    🏆 BEST VALUE RECOMMENDATION
                  </span>
                  <span style={{ background: "rgba(0, 255, 128, 0.15)", border: "1px solid #00ff80", color: "#00ff80", padding: "4px 10px", borderRadius: "20px", fontSize: "11.5px", fontWeight: 800 }}>
                    SMART VALUE: {bestValueOffer.smartValueScore || 92}/100
                  </span>
                  {bestValueOffer.brand && (
                    <span style={{ background: "rgba(255,255,255,0.08)", padding: "4px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: 700 }}>
                      {bestValueOffer.brand}
                    </span>
                  )}
                </div>

                <h3 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "8px", color: "white" }}>
                  {bestValueOffer.store} — ₹{(bestValueOffer.effectivePayablePrice || bestValueOffer.price).toLocaleString()}
                </h3>

                <p style={{ fontSize: "14px", color: "var(--text-secondary)", maxWidth: "620px", lineHeight: 1.5, marginBottom: "14px" }}>
                  {data?.recommendation || `BuyWise AI identifies ${bestValueOffer.store} as the Best Value choice combining price competitiveness, authentic retailer listing, and verified attributes.`}
                </p>
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "11px", color: bestValueOffer.isSearchLinkOnly ? "#ffaa00" : "var(--text-secondary)", marginBottom: "2px", fontWeight: 700 }}>
                  {bestValueOffer.isSearchLinkOnly ? "ESTIMATED MARKET REFERENCE" : "VERIFIED EFFECTIVE PAYABLE"}
                </div>
                <div style={{ fontSize: "32px", fontWeight: 900, color: bestValueOffer.isSearchLinkOnly ? "#ffaa00" : "#00ff88" }}>
                  ₹{(bestValueOffer.effectivePayablePrice || bestValueOffer.price).toLocaleString()}
                </div>
                {bestValueOffer.isSearchLinkOnly ? (
                  <div style={{ fontSize: "10px", color: "var(--text-secondary)", marginTop: "2px" }}>
                    *Verify live price directly on {bestValueOffer.store}
                  </div>
                ) : bestValueOffer.shippingFee && bestValueOffer.shippingFee > 0 ? (
                  <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                    (Listed ₹{bestValueOffer.price.toLocaleString()} + ₹{bestValueOffer.shippingFee} Delivery)
                  </div>
                ) : (
                  <div style={{ fontSize: "11px", color: "#00ff88" }}>Free Delivery Included</div>
                )}
                <a href={bestValueOffer.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", display: "inline-block", marginTop: "10px" }}>
                  <button className="btn-primary" style={{ padding: "10px 24px", fontSize: "14px" }}>
                    {bestValueOffer.isDirectProductLink && !bestValueOffer.isSearchLinkOnly ? "View Direct Deal ↗" : `Search ${bestValueOffer.store} ↗`}
                  </button>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* 🎯 EXACT MATCHES SECTION */}
        {exactOffers.length > 0 && (
          <div style={{ marginBottom: "40px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
              <span style={{ fontSize: "22px" }}>🎯</span>
              <h2 style={{ fontSize: "22px", fontWeight: 800 }}>Verified Exact Matches ({exactOffers.length})</h2>
              <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>• True apples-to-apples price comparison</span>
            </div>

            {viewMode === "tiles" ? (
              <div className="comparison-grid">
                {exactOffers.map((offer) => (
                  <OfferTileCard key={`${offer.store}_${offer.productId || offer.id}_${offer.price}`} offer={offer} searchQuery={searchQuery} user={user} triggerToast={triggerToast} />
                ))}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {exactOffers.map((offer) => (
                  <OfferListCard key={`${offer.store}_${offer.productId || offer.id}_${offer.price}`} offer={offer} searchQuery={searchQuery} user={user} triggerToast={triggerToast} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* 🔄 CLOSE MATCHES (VARIANTS) SECTION */}
        {variantOffers.length > 0 && (
          <div style={{ marginBottom: "40px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
              <span style={{ fontSize: "22px" }}>🔄</span>
              <h2 style={{ fontSize: "22px", fontWeight: 800 }}>Size & Color Variant Deals ({variantOffers.length})</h2>
              <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>• Same model, different size or colorway</span>
            </div>

            {viewMode === "tiles" ? (
              <div className="comparison-grid">
                {variantOffers.map((offer) => (
                  <OfferTileCard key={`${offer.store}_${offer.productId || offer.id}_${offer.price}`} offer={offer} searchQuery={searchQuery} user={user} triggerToast={triggerToast} />
                ))}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {variantOffers.map((offer) => (
                  <OfferListCard key={`${offer.store}_${offer.productId || offer.id}_${offer.price}`} offer={offer} searchQuery={searchQuery} user={user} triggerToast={triggerToast} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* 🎨 SIMILAR ALTERNATIVE PRODUCTS SECTION */}
        {similarOffers.length > 0 && (
          <div style={{ marginBottom: "40px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
              <span style={{ fontSize: "22px" }}>🎨</span>
              <h2 style={{ fontSize: "22px", fontWeight: 800 }}>Similar Category Alternatives ({similarOffers.length})</h2>
              <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>• Distinct models presented separately</span>
            </div>

            {viewMode === "tiles" ? (
              <div className="comparison-grid">
                {similarOffers.map((offer) => (
                  <OfferTileCard key={`${offer.store}_${offer.productId || offer.id}_${offer.price}`} offer={offer} searchQuery={searchQuery} user={user} triggerToast={triggerToast} />
                ))}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {similarOffers.map((offer) => (
                  <OfferListCard key={`${offer.store}_${offer.productId || offer.id}_${offer.price}`} offer={offer} searchQuery={searchQuery} user={user} triggerToast={triggerToast} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Empty Result State */}
        {!loading && sortedOffers.length === 0 && (
          <div className="glass" style={{ padding: "60px 20px", textAlign: "center", borderRadius: "24px" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔍</div>
            <h3 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "8px" }}>No Verified Store Offers Found</h3>
            <p style={{ color: "var(--text-secondary)", maxWidth: "520px", margin: "0 auto 24px auto" }}>
              We couldn&apos;t retrieve live store listings for this product under the selected filters. BuyWise AI strictly does not fabricate prices or results when live feeds are unavailable.
            </p>
            <button onClick={fetchComparison} className="btn-primary">Retry Search</button>
          </div>
        )}

        {/* Affiliate Disclosure */}
        <div style={{ marginTop: "40px", padding: "16px 20px", borderRadius: "14px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--glass-border)", fontSize: "11px", color: "var(--text-secondary)", lineHeight: 1.5, textAlign: "center" }}>
          ℹ️ <strong>Transparency & Affiliate Disclosure:</strong> BuyWise AI compares product offerings across verified retailer feeds. When you purchase through links on our site, we may earn an affiliate commission at no extra cost to you. We strictly do not alter price rankings or favor stores based on commission.
        </div>
      </div>

      <PhotoUploadModal isOpen={isPhotoModalOpen} onClose={() => setIsPhotoModalOpen(false)} />
      <VoiceSearchModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onTranscript={(text) => {
          if (text && text.trim()) {
            setSearchInput(text.trim());
            router.push(`/search?q=${encodeURIComponent(text.trim())}`);
          }
        }}
      />
    </main>
  );
}

// 📱 TILES MODE CARD COMPONENT
function OfferTileCard({ offer, searchQuery, user, triggerToast }: { offer: StoreOffer; searchQuery: string; user: any; triggerToast: (msg: string) => void }) {
  const matchPercentage = Math.round((offer.matchConfidence || 0.85) * 100);
  const [alertSaved, setAlertSaved] = useState(false);

  const payablePrice = offer.effectivePayablePrice || offer.price;

  const handleSaveAlert = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const newAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      userId: user?.uid || "guest_user",
      productTitle: offer.title,
      query: searchQuery || offer.title,
      store: offer.store,
      currentPrice: payablePrice,
      targetPrice: Math.round(payablePrice * 0.95),
      lowestPriceSeen: payablePrice,
      smartValueScore: offer.smartValueScore || 95,
      trustScore: 92,
      status: "active",
      logo: offer.logo,
      url: offer.url,
      createdAt: new Date().toISOString(),
      notifyEveryDrop: true,
    };

    try {
      await addDoc(collection(db, "alerts"), {
        ...newAlert,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.log("Firestore alert fallback:", err);
    }

    try {
      const existing = JSON.parse(localStorage.getItem("buywise_alerts") || "[]");
      localStorage.setItem("buywise_alerts", JSON.stringify([newAlert, ...existing]));
    } catch {}

    setAlertSaved(true);
    triggerToast(`🔔 Price Drop Alert Saved for ${offer.store} — ${offer.title} at ₹${payablePrice.toLocaleString()}!`);
  };

  return (
    <div className="glass glass-card" style={{ padding: "22px", display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%", borderRadius: "20px", border: offer.isLowest ? "1.5px solid #00ff88" : "1px solid var(--glass-border)", background: offer.isBestValue ? "rgba(138, 43, 226, 0.08)" : "var(--glass-bg)" }}>
      <div>
        {/* Top Badges Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "6px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "6px", background: "white", color: "#111", fontWeight: 900, fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {offer.store[0]}
            </div>
            <span style={{ fontWeight: 800, fontSize: "14px", color: "white" }}>{offer.store}</span>
          </div>

          <div style={{ display: "flex", gap: "6px" }}>
            {offer.tier === "LUXURY" ? (
              <span style={{ background: "rgba(167, 139, 250, 0.2)", border: "1px solid #a78bfa", color: "#c4b5fd", padding: "2px 8px", borderRadius: "10px", fontSize: "10px", fontWeight: 800 }}>
                💎 LUXURY
              </span>
            ) : (
              <span style={{ background: "rgba(0, 255, 136, 0.15)", border: "1px solid #00ff88", color: "#00ff88", padding: "2px 8px", borderRadius: "10px", fontSize: "10px", fontWeight: 800 }}>
                ⚡ PREMIUM
              </span>
            )}
            <span style={{ background: "rgba(0, 212, 255, 0.15)", border: "1px solid #00d4ff", color: "#00d4ff", padding: "2px 8px", borderRadius: "10px", fontSize: "10px", fontWeight: 800 }}>
              {matchPercentage}% MATCH
            </span>
          </div>
        </div>

        {/* Product Thumbnail - Dedicated per product record */}
        <div style={{ marginBottom: "12px" }}>
          <SafeProductImage src={offer.imageUrl} alt={offer.title} height={160} />
        </div>

        {/* Brand Tag if present */}
        {offer.brand && (
          <div style={{ fontSize: "11px", fontWeight: 800, color: "var(--accent)", letterSpacing: "0.5px", marginBottom: "4px" }}>
            {offer.brand.toUpperCase()}
          </div>
        )}

        {/* Product Title */}
        <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "10px", lineHeight: 1.4, color: "white", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {offer.title}
        </h3>

        {/* Variant Info (Size / Color) */}
        {offer.variant && (offer.variant.size || offer.variant.color) && (
          <div style={{ fontSize: "11.5px", color: "var(--text-secondary)", marginBottom: "8px" }}>
            {offer.variant.size && <span>Size: <strong style={{ color: "white" }}>{offer.variant.size}</strong></span>}
            {offer.variant.size && offer.variant.color && <span> • </span>}
            {offer.variant.color && <span>Color: <strong style={{ color: "white" }}>{offer.variant.color}</strong></span>}
          </div>
        )}

        {/* Rating & Award Badges */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginBottom: "14px" }}>
          {offer.rating && (
            <span style={{ color: "#f1c40f", fontSize: "12px", fontWeight: 700 }}>
              ★ {offer.rating.toFixed(1)} {offer.reviewCount ? `(${offer.reviewCount.toLocaleString()})` : ""}
            </span>
          )}

          {offer.isLowest && !offer.isSearchLinkOnly && offer.verificationStatus === 'verified_live' && (
            <span style={{ background: "rgba(0, 255, 136, 0.2)", border: "1px solid #00ff88", color: "#00ff88", padding: "2px 6px", borderRadius: "8px", fontSize: "10px", fontWeight: 800 }}>
              👑 LOWEST VERIFIED PRICE
            </span>
          )}

          {offer.isSearchLinkOnly && (
            <span style={{ background: "rgba(255, 170, 0, 0.15)", border: "1px solid #ffaa00", color: "#ffaa00", padding: "2px 6px", borderRadius: "8px", fontSize: "10px", fontWeight: 800 }}>
              🔗 SEARCH LINK ONLY
            </span>
          )}

          {offer.isBestValue && (
            <span style={{ background: "var(--gradient-accent)", color: "white", padding: "2px 6px", borderRadius: "8px", fontSize: "10px", fontWeight: 800 }}>
              🏆 BEST VALUE
            </span>
          )}

          {offer.isDirectProductLink && !offer.isSearchLinkOnly && (
            <span style={{ background: "rgba(0, 212, 255, 0.15)", color: "#00d4ff", padding: "2px 6px", borderRadius: "8px", fontSize: "10px", fontWeight: 700 }}>
              ✓ Direct Product Link
            </span>
          )}
        </div>
      </div>

      <div>
        {/* Transparent Price Breakdown */}
        <div style={{ padding: "12px 14px", background: "rgba(255,255,255,0.03)", borderRadius: "14px", marginBottom: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <div style={{ fontSize: "10px", color: offer.isSearchLinkOnly ? "#ffaa00" : "var(--text-secondary)", fontWeight: 700 }}>
                {offer.isSearchLinkOnly ? "ESTIMATED MARKET REFERENCE" : "EFFECTIVE PAYABLE PRICE"}
              </div>
              <div style={{ fontSize: "24px", fontWeight: 900, color: offer.isLowest && !offer.isSearchLinkOnly ? "#00ff88" : "white" }}>
                ₹{payablePrice.toLocaleString()}
              </div>
              {offer.isSearchLinkOnly && (
                <div style={{ fontSize: "9.5px", color: "var(--text-secondary)", marginTop: "2px" }}>
                  *Prices verified live on {offer.store}
                </div>
              )}
            </div>
            {offer.originalPrice && offer.originalPrice > payablePrice && (
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "11px", color: "var(--text-secondary)", textDecoration: "line-through" }}>
                  ₹{offer.originalPrice.toLocaleString()}
                </div>
                <div style={{ fontSize: "10.5px", color: "#00ff88", fontWeight: 700 }}>
                  Save ₹{(offer.originalPrice - payablePrice).toLocaleString()}
                </div>
              </div>
            )}
          </div>
          {offer.shippingFee && offer.shippingFee > 0 ? (
            <div style={{ fontSize: "10px", color: "#f59e0b", marginTop: "4px" }}>
              (Item: ₹{offer.price.toLocaleString()} + ₹{offer.shippingFee} Shipping)
            </div>
          ) : !offer.isSearchLinkOnly ? (
            <div style={{ fontSize: "10px", color: "var(--text-secondary)", marginTop: "4px" }}>
              ✓ Free Delivery on this listing
            </div>
          ) : null}
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: "8px" }}>
          <button 
            onClick={handleSaveAlert}
            className="btn-secondary" 
            style={{ 
              flex: 1, 
              padding: "9px", 
              fontSize: "11.5px", 
              border: alertSaved ? "1px solid #00ff88" : "1px solid var(--glass-border)", 
              background: alertSaved ? "rgba(0, 255, 136, 0.15)" : "rgba(255,255,255,0.05)", 
              color: alertSaved ? "#00ff88" : "white", 
              borderRadius: "10px", 
              cursor: "pointer", 
              fontWeight: 800,
            }}
          >
            {alertSaved ? "✅ Saved" : "🔔 Alert"}
          </button>
          <a href={offer.url} target="_blank" rel="noopener noreferrer" style={{ flex: 2, textDecoration: "none" }}>
            <button className="btn-primary" style={{ width: "100%", padding: "9px", fontSize: "12px", fontWeight: 700 }}>
              {offer.isDirectProductLink && !offer.isSearchLinkOnly ? "View Direct Deal ↗" : `Search ${offer.store} ↗`}
            </button>
          </a>
        </div>
      </div>
    </div>
  );
}

// 📋 LIST MODE CARD COMPONENT
function OfferListCard({ offer, searchQuery, user, triggerToast }: { offer: StoreOffer; searchQuery: string; user: any; triggerToast: (msg: string) => void }) {
  const matchPercentage = Math.round((offer.matchConfidence || 0.8) * 100);
  const [alertSaved, setAlertSaved] = useState(false);
  const payablePrice = offer.effectivePayablePrice || offer.price;

  const handleSaveAlert = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const newAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      userId: user?.uid || "guest_user",
      productTitle: offer.title,
      query: searchQuery || offer.title,
      store: offer.store,
      currentPrice: payablePrice,
      targetPrice: Math.round(payablePrice * 0.95),
      lowestPriceSeen: payablePrice,
      smartValueScore: offer.smartValueScore || 95,
      trustScore: 92,
      status: "active",
      logo: offer.logo,
      url: offer.url,
      createdAt: new Date().toISOString(),
      notifyEveryDrop: true,
    };

    try {
      await addDoc(collection(db, "alerts"), {
        ...newAlert,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.log("Firestore alert fallback:", err);
    }

    try {
      const existing = JSON.parse(localStorage.getItem("buywise_alerts") || "[]");
      localStorage.setItem("buywise_alerts", JSON.stringify([newAlert, ...existing]));
    } catch {}

    setAlertSaved(true);
    triggerToast(`🔔 Price Drop Alert Saved for ${offer.store} — ${offer.title} at ₹${payablePrice.toLocaleString()}!`);
  };

  return (
    <div
      className="glass"
      style={{
        padding: "18px 22px",
        borderRadius: "16px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "16px",
        background: offer.isBestValue ? "rgba(138, 43, 226, 0.08)" : "transparent",
        border: offer.isLowest ? "1.5px solid #00ff88" : "1px solid var(--glass-border)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1, minWidth: "280px" }}>
        <div style={{ width: "56px", height: "56px", flexShrink: 0 }}>
          <SafeProductImage src={offer.imageUrl} alt={offer.title} width={56} height={56} aspectRatio="1/1" />
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
            <span style={{ fontWeight: 800, fontSize: "15px", color: "white" }}>{offer.store}</span>
            {offer.brand && (
              <span style={{ fontSize: "10.5px", fontWeight: 700, padding: "2px 6px", borderRadius: "6px", background: "rgba(255,255,255,0.08)" }}>
                {offer.brand}
              </span>
            )}
            <span style={{ fontSize: "10.5px", fontWeight: 700, padding: "2px 6px", borderRadius: "6px", background: "rgba(0, 255, 128, 0.15)", color: "#00ff80" }}>
              {matchPercentage}% Match
            </span>
            {offer.isLowest && !offer.isSearchLinkOnly && offer.verificationStatus === 'verified_live' && (
              <span style={{ fontSize: "10.5px", fontWeight: 800, padding: "2px 6px", borderRadius: "6px", background: "rgba(0, 255, 128, 0.2)", border: "1px solid #00ff80", color: "#00ff80" }}>
                👑 LOWEST
              </span>
            )}
            {offer.isSearchLinkOnly && (
              <span style={{ fontSize: "10.5px", fontWeight: 800, padding: "2px 6px", borderRadius: "6px", background: "rgba(255, 170, 0, 0.15)", border: "1px solid #ffaa00", color: "#ffaa00" }}>
                🔗 Search Link
              </span>
            )}
            {offer.tier === "LUXURY" && (
              <span style={{ fontSize: "10.5px", fontWeight: 800, padding: "2px 6px", borderRadius: "6px", background: "rgba(167, 139, 250, 0.2)", color: "#c4b5fd" }}>
                💎 LUXURY
              </span>
            )}
          </div>
          <div style={{ fontSize: "13.5px", color: "var(--text-secondary)", maxWidth: "480px" }}>
            {offer.title}
          </div>
          {offer.variant?.size && (
            <div style={{ fontSize: "11px", color: "#00d4ff", marginTop: "2px" }}>
              Size: {offer.variant.size}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "10px", color: offer.isSearchLinkOnly ? "#ffaa00" : "var(--text-secondary)", fontWeight: 700 }}>
            {offer.isSearchLinkOnly ? "ESTIMATED REFERENCE" : "EFFECTIVE PAYABLE"}
          </div>
          <div style={{ fontSize: "22px", fontWeight: 900, color: offer.isLowest && !offer.isSearchLinkOnly ? "#00ff88" : "white" }}>
            ₹{payablePrice.toLocaleString()}
          </div>
          {offer.isSearchLinkOnly ? (
            <div style={{ fontSize: "9px", color: "var(--text-secondary)" }}>Verify on {offer.store}</div>
          ) : offer.shippingFee && offer.shippingFee > 0 ? (
            <div style={{ fontSize: "9.5px", color: "#f59e0b" }}>+₹{offer.shippingFee} Delivery</div>
          ) : null}
        </div>

        <button
          onClick={handleSaveAlert}
          className="btn-secondary"
          style={{
            padding: "8px 14px",
            fontSize: "12px",
            border: alertSaved ? "1px solid #00ff88" : "1px solid var(--glass-border)",
            background: alertSaved ? "rgba(0, 255, 136, 0.15)" : "rgba(255,255,255,0.05)",
            color: alertSaved ? "#00ff88" : "white",
            borderRadius: "10px",
            cursor: "pointer",
            fontWeight: 800,
          }}
        >
          {alertSaved ? "✅ Saved" : "🔔 Alert"}
        </button>

        <a href={offer.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
          <button className="btn-primary" style={{ padding: "8px 18px", fontSize: "13px" }}>
            {offer.isDirectProductLink && !offer.isSearchLinkOnly ? "View Direct Deal ↗" : `Search ${offer.store} ↗`}
          </button>
        </a>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-center" style={{ height: "100vh", flexDirection: "column" }}>
          <div className="text-gradient" style={{ fontSize: "28px", fontWeight: 800, marginBottom: "20px" }}>
            Loading BuyWise AI India...
          </div>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}

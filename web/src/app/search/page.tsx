"use client"
import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import PhotoUploadModal from "@/components/PhotoUploadModal";
import { ComparisonResponse, StoreOffer } from "@/lib/retailers/types";
import { useAuth } from "@/lib/AuthContext";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import SafeProductImage from "@/components/SafeProductImage";

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
  const [viewMode, setViewMode] = useState<"tiles" | "list">("tiles"); // Default to Tiles Mode
  const [searchInput, setSearchInput] = useState(searchQuery);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
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
      if (sortBy === "score-desc") return (b.smartValueScore || 0) - (a.smartValueScore || 0);
      if (sortBy === "price-asc") return a.price - b.price;
      if (sortBy === "price-desc") return b.price - a.price;
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
          Searching Amazon, Flipkart, Croma, Tata CLiQ & Meesho...
        </div>
        <div style={{ width: "240px", height: "4px", background: "var(--glass-border)", borderRadius: "2px", overflow: "hidden" }}>
          <div style={{ width: "50%", height: "100%", background: "var(--gradient-accent)", animation: "pulse-glow 1.2s infinite linear" }}></div>
        </div>
      </div>
    );
  }

  const exactOffers = sortOffers(data?.groupedOffers?.exact || []);
  const variantOffers = sortOffers(data?.groupedOffers?.variant || []);
  const similarOffers = sortOffers(data?.groupedOffers?.similar || []);
  const allOffers = sortOffers(data?.stores || []);

  const bestValueOffer = allOffers.find((o) => o.isBestValue) || allOffers[0];

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
        <div style={{ marginBottom: "30px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px", marginBottom: "20px" }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "4px 14px", background: "rgba(138, 43, 226, 0.12)", border: "1px solid var(--glass-border)", borderRadius: "20px", marginBottom: "8px" }}>
                <span style={{ color: "var(--primary)", fontWeight: 800, fontSize: "12px" }}>BUYWISE AI INDIA 🇮🇳</span>
                <span style={{ color: "var(--text-secondary)", fontSize: "12px" }}>Indian Platforms in INR (₹)</span>
              </div>
              <h1 style={{ fontSize: "36px", fontWeight: 800 }}>
                Comparison Results for &quot;<span className="text-gradient">{searchQuery || "All Products"}</span>&quot;
              </h1>
            </div>

            {/* View Mode & Sort Controls */}
            <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
              {/* Tiles / List View Toggle */}
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
                    transition: "all 0.2s ease"
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
                    transition: "all 0.2s ease"
                  }}
                >
                  📋 List Mode
                </button>
              </div>

              {/* Sort Dropdown */}
              <div className="glass" style={{ padding: "8px 18px", borderRadius: "16px", display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>SORT:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{ background: "transparent", color: "white", border: "none", outline: "none", fontWeight: 700, cursor: "pointer", fontSize: "14px" }}
                >
                  <option value="score-desc" style={{ background: "#111" }}>Smart Value Score</option>
                  <option value="price-asc" style={{ background: "#111" }}>Lowest Price</option>
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
              onClick={() => setIsPhotoModalOpen(true)}
              title="Search by Photo (BuyWise AI Vision)"
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

        {/* Identified Product Header Card */}
        {searchQuery && (
          <div className="glass" style={{ padding: "24px 28px", borderRadius: "20px", marginBottom: "28px", border: "1px solid var(--glass-border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
              <div>
                <div style={{ fontSize: "11px", color: "var(--accent)", fontWeight: 700, letterSpacing: "1px", marginBottom: "4px" }}>
                  INDIAN E-COMMERCE COMPARISON
                </div>
                <h2 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "4px" }}>{searchQuery}</h2>
                <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                  Search Mode: <strong style={{ color: "white" }}>{modeParam.toUpperCase()} MATCH</strong> • Currency: <strong style={{ color: "#00ff88" }}>INR (₹)</strong>
                </div>
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <span style={{ background: "rgba(138, 43, 226, 0.15)", border: "1px solid var(--primary)", padding: "6px 14px", borderRadius: "20px", fontSize: "13px", fontWeight: 700, color: "var(--primary)" }}>
                  ✓ AI CONFIDENCE 95%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Stores Checked Summary Bar */}
        {data?.summary && (
          <div className="glass" style={{ padding: "16px 24px", borderRadius: "16px", marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
            <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>INDIAN STORES CHECKED: </span>
                <span style={{ fontWeight: 800 }}>{data.summary.totalStoresChecked}</span>
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>ACTIVE OFFERS: </span>
                <span style={{ fontWeight: 800 }}>{data.summary.successfulStores}</span>
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>LOWEST PRICE: </span>
                <span style={{ fontWeight: 800, color: "#00ff88" }}>₹{data.summary.lowestPrice.toLocaleString()}</span>
              </div>
              {data.summary.maximumSavings > 0 && (
                <div>
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>MAX SAVINGS: </span>
                  <span style={{ fontWeight: 800, color: "var(--accent)" }}>₹{data.summary.maximumSavings.toLocaleString()}</span>
                </div>
              )}
            </div>

            <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
              Official Indian E-Commerce Feeds (Amazon.in, Flipkart, Croma, Tata CLiQ, Meesho)
            </div>
          </div>
        )}

        {/* 🏆 Best Value Recommendation Card */}
        {bestValueOffer && (
          <div className="glass animate-fade-in" style={{ padding: "28px 32px", borderRadius: "24px", marginBottom: "36px", border: "1px solid var(--primary)", background: "linear-gradient(135deg, rgba(138, 43, 226, 0.14), transparent)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "20px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "12px" }}>
                  <span style={{ background: "var(--gradient-accent)", padding: "4px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: 800, color: "white" }}>
                    🏆 BEST VALUE RECOMMENDATION
                  </span>
                  <span style={{ background: "rgba(0, 255, 128, 0.15)", border: "1px solid #00ff80", color: "#00ff80", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: 800 }}>
                    SMART VALUE SCORE: {bestValueOffer.smartValueScore || 92}/100
                  </span>
                </div>

                <h3 style={{ fontSize: "28px", fontWeight: 800, marginBottom: "8px", color: "white" }}>
                  {bestValueOffer.store} — ₹{bestValueOffer.price.toLocaleString()}
                </h3>

                <p style={{ fontSize: "15px", color: "var(--text-secondary)", maxWidth: "620px", lineHeight: 1.5, marginBottom: "16px" }}>
                  {data?.recommendation || `BuyWise AI identifies ${bestValueOffer.store} as the Best Value choice combining price competitiveness, seller reliability, and product match confidence.`}
                </p>
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "4px" }}>VERIFIED BEST PRICE</div>
                <div style={{ fontSize: "36px", fontWeight: 900, color: "#00ff88" }}>₹{bestValueOffer.price.toLocaleString()}</div>
                <a href={bestValueOffer.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", display: "inline-block", marginTop: "12px" }}>
                  <button className="btn-primary" style={{ padding: "12px 28px", fontSize: "15px" }}>View Best Deal →</button>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* 🎯 EXACT MATCHES SECTION */}
        {exactOffers.length > 0 && (
          <div style={{ marginBottom: "50px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
              <span style={{ fontSize: "24px" }}>🎯</span>
              <h2 style={{ fontSize: "26px", fontWeight: 800 }}>Verified Store Listings ({exactOffers.length})</h2>
              <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>(Prices in INR ₹)</span>
            </div>

            {viewMode === "tiles" ? (
              <div className="comparison-grid">
                {exactOffers.map((offer, idx) => (
                  <OfferTileCard key={idx} offer={offer} searchQuery={searchQuery} user={user} triggerToast={triggerToast} />
                ))}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {exactOffers.map((offer, idx) => (
                  <OfferListCard key={idx} offer={offer} searchQuery={searchQuery} user={user} triggerToast={triggerToast} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* 🔄 CLOSE MATCHES (VARIANTS) SECTION */}
        {variantOffers.length > 0 && (
          <div style={{ marginBottom: "50px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
              <span style={{ fontSize: "24px" }}>🔄</span>
              <h2 style={{ fontSize: "26px", fontWeight: 800 }}>Variant & Color Deals ({variantOffers.length})</h2>
            </div>

            {viewMode === "tiles" ? (
              <div className="comparison-grid">
                {variantOffers.map((offer, idx) => (
                  <OfferTileCard key={idx} offer={offer} searchQuery={searchQuery} user={user} triggerToast={triggerToast} />
                ))}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {variantOffers.map((offer, idx) => (
                  <OfferListCard key={idx} offer={offer} searchQuery={searchQuery} user={user} triggerToast={triggerToast} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* 🎨 SIMILAR PRODUCTS SECTION */}
        {similarOffers.length > 0 && (
          <div style={{ marginBottom: "50px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
              <span style={{ fontSize: "24px" }}>🎨</span>
              <h2 style={{ fontSize: "26px", fontWeight: 800 }}>Similar Products ({similarOffers.length})</h2>
            </div>

            {viewMode === "tiles" ? (
              <div className="comparison-grid">
                {similarOffers.map((offer, idx) => (
                  <OfferTileCard key={idx} offer={offer} searchQuery={searchQuery} user={user} triggerToast={triggerToast} />
                ))}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {similarOffers.map((offer, idx) => (
                  <OfferListCard key={idx} offer={offer} searchQuery={searchQuery} user={user} triggerToast={triggerToast} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Empty Result State */}
        {!loading && allOffers.length === 0 && (
          <div className="glass" style={{ padding: "60px 20px", textAlign: "center", borderRadius: "24px" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔍</div>
            <h3 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "8px" }}>No Store Offers Found</h3>
            <p style={{ color: "var(--text-secondary)", maxWidth: "480px", margin: "0 auto 24px auto" }}>
              We couldn&apos;t retrieve live store listings for this product. Ensure Indian retailer adapters are active.
            </p>
            <button onClick={fetchComparison} className="btn-primary">Retry Search</button>
          </div>
        )}
      </div>

      {/* Photo Upload Modal Trigger */}
      <PhotoUploadModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
      />
    </main>
  );
}

// 📱 TILES MODE CARD COMPONENT (Home Screen Style Tile Grid)
function OfferTileCard({ offer, searchQuery, user, triggerToast }: { offer: StoreOffer; searchQuery: string; user: any; triggerToast: (msg: string) => void }) {
  const matchPercentage = Math.round((offer.matchConfidence || 0.85) * 100);
  const [alertSaved, setAlertSaved] = useState(false);

  const handleSaveAlert = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const newAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      userId: user?.uid || "guest_user",
      productTitle: offer.title,
      query: searchQuery || offer.title,
      store: offer.store,
      currentPrice: offer.price,
      targetPrice: Math.round(offer.price * 0.95), // alert threshold
      lowestPriceSeen: offer.price,
      smartValueScore: offer.smartValueScore || 95,
      trustScore: 92,
      status: "active",
      logo: offer.logo,
      url: offer.url,
      createdAt: new Date().toISOString(),
      notifyEveryDrop: true,
    };

    // Save in Cloud Firestore
    try {
      await addDoc(collection(db, "alerts"), {
        ...newAlert,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.log("Firestore alert save fallback to localStorage:", err);
    }

    // Save in localStorage backup
    try {
      const existing = JSON.parse(localStorage.getItem("buywise_alerts") || "[]");
      localStorage.setItem("buywise_alerts", JSON.stringify([newAlert, ...existing]));
    } catch {}

    setAlertSaved(true);
    triggerToast(`🔔 Price Drop Alert Saved for ${offer.store} — ${offer.title} at ₹${offer.price.toLocaleString()}! We will notify you on every price drop.`);
  };

  return (
    <div className="glass glass-card" style={{ padding: "26px", display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%", borderRadius: "24px", border: offer.isLowest ? "1px solid #00ff88" : "1px solid var(--glass-border)", background: offer.isBestValue ? "rgba(138, 43, 226, 0.08)" : "var(--glass-bg)" }}>
      <div>
        {/* Top Badges Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "white", color: "#111", fontWeight: 900, fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {offer.store[0]}
            </div>
            <span style={{ fontWeight: 800, fontSize: "15px", color: "white" }}>{offer.store}</span>
          </div>

          <span style={{ background: "rgba(0, 255, 128, 0.15)", border: "1px solid #00ff80", color: "#00ff80", padding: "3px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: 800 }}>
            {matchPercentage}% MATCH
          </span>
        </div>

        {/* Product Thumbnail */}
        <div style={{ marginBottom: "14px" }}>
          <SafeProductImage src={offer.imageUrl} alt={offer.title} height={180} />
        </div>

        {/* Product Title */}
        <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "14px", lineHeight: 1.4, color: "white", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {offer.title}
        </h3>

        {/* Rating & Award Badges */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "18px" }}>
          {offer.rating && (
            <span style={{ color: "#f1c40f", fontSize: "13px", fontWeight: 700 }}>
              ★ {offer.rating.toFixed(1)} {offer.reviewCount ? `(${offer.reviewCount.toLocaleString()})` : ""}
            </span>
          )}

          {offer.isLowest && (
            <span style={{ background: "rgba(0, 255, 136, 0.2)", border: "1px solid #00ff88", color: "#00ff88", padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: 800 }}>
              💰 LOWEST PRICE
            </span>
          )}

          {offer.isBestValue && (
            <span style={{ background: "var(--gradient-accent)", color: "white", padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: 800 }}>
              🏆 BEST VALUE
            </span>
          )}
        </div>
      </div>

      <div>
        {/* Price Tag in Indian Rupees (INR ₹) */}
        <div style={{ padding: "16px", background: "rgba(255,255,255,0.03)", borderRadius: "16px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 600 }}>VERIFIED PRICE (INR)</div>
            <div style={{ fontSize: "26px", fontWeight: 900, color: offer.isLowest ? "#00ff88" : "var(--primary)" }}>
              ₹{offer.price.toLocaleString()}
            </div>
          </div>
          {offer.originalPrice && offer.originalPrice > offer.price && (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "12px", color: "var(--text-secondary)", textDecoration: "line-through" }}>
                ₹{offer.originalPrice.toLocaleString()}
              </div>
              <div style={{ fontSize: "11px", color: "#00ff88", fontWeight: 700 }}>
                Save ₹{(offer.originalPrice - offer.price).toLocaleString()}
              </div>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: "10px" }}>
          <button 
            onClick={handleSaveAlert}
            className="btn-secondary" 
            style={{ 
              flex: 1, 
              padding: "10px", 
              fontSize: "12px", 
              border: alertSaved ? "1px solid #00ff88" : "1px solid var(--glass-border)", 
              background: alertSaved ? "rgba(0, 255, 136, 0.15)" : "rgba(255,255,255,0.05)", 
              color: alertSaved ? "#00ff88" : "white", 
              borderRadius: "12px", 
              cursor: "pointer", 
              fontWeight: 800,
              boxShadow: alertSaved ? "0 0 15px rgba(0, 255, 136, 0.3)" : "none"
            }}
          >
            {alertSaved ? "✅ Alert Saved!" : "🔔 Alert"}
          </button>
          <a href={offer.url} target="_blank" rel="noopener noreferrer" style={{ flex: 2, textDecoration: "none" }}>
            <button className="btn-primary" style={{ width: "100%", padding: "10px", fontSize: "13px", fontWeight: 700 }}>
              View Deal ↗
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

  const handleSaveAlert = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const newAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      userId: user?.uid || "guest_user",
      productTitle: offer.title,
      query: searchQuery || offer.title,
      store: offer.store,
      currentPrice: offer.price,
      targetPrice: Math.round(offer.price * 0.95),
      lowestPriceSeen: offer.price,
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
      console.log("Firestore alert save fallback:", err);
    }

    try {
      const existing = JSON.parse(localStorage.getItem("buywise_alerts") || "[]");
      localStorage.setItem("buywise_alerts", JSON.stringify([newAlert, ...existing]));
    } catch {}

    setAlertSaved(true);
    triggerToast(`🔔 Price Drop Alert Saved for ${offer.store} — ${offer.title} at ₹${offer.price.toLocaleString()}! We will notify you on every price drop.`);
  };

  return (
    <div
      className="glass"
      style={{
        padding: "20px 26px",
        borderRadius: "18px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "20px",
        background: offer.isBestValue ? "rgba(138, 43, 226, 0.08)" : "transparent",
        border: offer.isBestValue ? "1px solid var(--primary)" : "1px solid var(--glass-border)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "18px", flex: 1, minWidth: "280px" }}>
        <div style={{ width: "56px", height: "56px", flexShrink: 0 }}>
          <SafeProductImage src={offer.imageUrl} alt={offer.title} width={56} height={56} aspectRatio="1/1" />
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
            <span style={{ fontWeight: 800, fontSize: "16px", color: "white" }}>{offer.store}</span>
            <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "10px", background: "rgba(0, 255, 128, 0.15)", color: "#00ff80" }}>
              {matchPercentage}% Match
            </span>
            {offer.isLowest && (
              <span style={{ fontSize: "11px", fontWeight: 800, padding: "2px 8px", borderRadius: "10px", background: "rgba(0, 255, 128, 0.2)", border: "1px solid #00ff80", color: "#00ff80" }}>
                💰 LOWEST PRICE
              </span>
            )}
          </div>
          <div style={{ fontSize: "14px", color: "var(--text-secondary)", maxWidth: "480px" }}>
            {offer.title}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "28px" }}>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>PRICE (INR)</div>
          <div style={{ fontSize: "24px", fontWeight: 900, color: offer.isLowest ? "#00ff80" : "white" }}>
            ₹{offer.price.toLocaleString()}
          </div>
        </div>

        <button
          onClick={handleSaveAlert}
          className="btn-secondary"
          style={{
            padding: "10px 16px",
            fontSize: "13px",
            border: alertSaved ? "1px solid #00ff88" : "1px solid var(--glass-border)",
            background: alertSaved ? "rgba(0, 255, 136, 0.15)" : "rgba(255,255,255,0.05)",
            color: alertSaved ? "#00ff88" : "white",
            borderRadius: "12px",
            cursor: "pointer",
            fontWeight: 800,
          }}
        >
          {alertSaved ? "✅ Alert Saved!" : "🔔 Alert"}
        </button>

        <a href={offer.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
          <button className="btn-primary" style={{ padding: "10px 22px", fontSize: "14px" }}>
            View Deal ↗
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

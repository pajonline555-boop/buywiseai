"use client"
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PhotoUploadModal from "@/components/PhotoUploadModal";
import GenGStoreSlideshow from "@/components/GenGStoreSlideshow";
import Hero3DShowcase from "@/components/Hero3DShowcase";
import { TOP_CATEGORIES } from "@/lib/categoryData";
import SafeProductImage from "@/components/SafeProductImage";
import { resolveProductImage } from "@/lib/categoryResolver";
import { calculateEffectivePrice } from "@/lib/coupons/couponService";
import BrandPillars from "@/components/BrandPillars";
import { useTranslation } from "@/lib/i18n/i18nContext";
import { getActiveCompetition, getCompetitions, getWinnerSubmission } from "@/lib/competition/store";

export default function Home() {
  const [query, setQuery] = useState("");
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [activeCategoryTab, setActiveCategoryTab] = useState("mobiles");
  const router = useRouter();
  const { t } = useTranslation();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  const selectedCategoryObj = TOP_CATEGORIES.find(c => c.id === activeCategoryTab) || TOP_CATEGORIES[0];

  return (
    <main style={{ paddingTop: '20px' }} suppressHydrationWarning>
      
      {/* Hero Section */}
      <section className="container section-padding animate-fade-in" style={{ display: 'flex', alignItems: 'center', gap: '60px', minHeight: '75vh', paddingTop: '40px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', background: 'rgba(168, 85, 247, 0.18)', border: '1px solid rgba(168, 85, 247, 0.4)', borderRadius: '20px', marginBottom: '20px' }}>
            <span style={{ color: 'var(--primary)', fontWeight: 900, fontSize: '13px', letterSpacing: '0.05em' }}>BUYWISE AI</span>
            <span style={{ color: '#cbd5e1', fontSize: '13px', fontWeight: 700 }}>{t('app_tagline')}</span>
          </div>
          
          <h1 style={{ fontSize: '60px', lineHeight: 1.1, marginBottom: '24px', fontWeight: 900, color: '#ffffff' }}>
            {t('hero_title_1')} <br />
            <span className="text-gradient">{t('hero_title_2')}</span> {t('hero_title_3')}
          </h1>
          <p style={{ fontSize: '18px', color: '#cbd5e1', marginBottom: '40px', maxWidth: '540px', lineHeight: 1.7 }}>
            {t('hero_desc')}
          </p>
          
          <form onSubmit={handleSearch} className="glass" style={{ display: 'flex', alignItems: 'center', padding: '8px', borderRadius: '50px', maxWidth: '540px', marginBottom: '40px', background: 'rgba(18, 14, 36, 0.95)', border: '1px solid rgba(255, 255, 255, 0.25)' }}>
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('search_placeholder')}
              style={{ flex: 1, background: 'transparent', border: 'none', color: '#ffffff', padding: '12px 20px', outline: 'none', fontSize: '16px', fontWeight: 600 }}
            />
            
            <button
              type="button"
              onClick={() => setIsPhotoModalOpen(true)}
              title="Search by Photo (BuyWise AI Vision)"
              style={{
                background: 'rgba(255, 255, 255, 0.12)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '50%',
                width: '44px',
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontSize: '20px',
                cursor: 'pointer',
                marginRight: '8px',
                transition: 'all 0.2s ease'
              }}
            >
              📷
            </button>

            <button type="submit" className="btn-primary" style={{ borderRadius: '50px', padding: '12px 30px', fontWeight: 800 }}>
              {t('compare_btn')}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => setIsPhotoModalOpen(true)}
              className="glass"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 24px',
                borderRadius: '16px',
                background: 'rgba(255, 0, 127, 0.15)',
                border: '1px solid rgba(255, 0, 127, 0.4)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <span style={{ fontSize: '24px' }}>📷</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '14px', fontWeight: 900, color: 'var(--primary)' }}>{t('upload_photo_title')}</div>
                <div style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 600 }}>{t('upload_photo_sub')}</div>
              </div>
            </button>

            <Link href="/categories" style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 24px',
                borderRadius: '16px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                cursor: 'pointer'
              }}>
                <span style={{ fontSize: '24px' }}>🛍️</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '14px', fontWeight: 900, color: '#ffffff' }}>{t('explore_catalog')}</div>
                  <div style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 600 }}>{t('explore_catalog_sub')}</div>
                </div>
              </div>
            </Link>
          </div>
        </div>
        
        <div style={{ flex: 1, width: '100%', minWidth: '320px' }}>
          <Hero3DShowcase />
        </div>
      </section>

      {/* Category Bar Header (After Hero Banner, Before Exclusive Gen G Showcase) */}
      <section style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: '10px', marginBottom: '30px', padding: '0 20px' }}>
        <div 
          className="glass"
          style={{
            width: '100%',
            maxWidth: '1200px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 24px',
            borderRadius: '24px',
            overflowX: 'auto',
            scrollbarWidth: 'none',
            background: 'rgba(14, 10, 26, 0.96)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(24px)',
            boxShadow: '0 12px 35px rgba(0, 0, 0, 0.8)'
          }}
        >
          <span style={{ fontSize: '13px', fontWeight: 900, color: 'var(--primary)', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px', letterSpacing: '0.05em' }}>
            <span>☰</span> {t('categories_title')}
          </span>

          <Link href="/categories" style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: '13px', fontWeight: 900, padding: '8px 18px', borderRadius: '14px', background: 'var(--gradient-accent)', color: '#ffffff', whiteSpace: 'nowrap', boxShadow: '0 4px 15px rgba(255, 0, 127, 0.4)' }}>
              {t('all_bestsellers')}
            </span>
          </Link>

          <Link href="/coupons" style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: '13px', fontWeight: 900, padding: '8px 18px', borderRadius: '14px', background: 'linear-gradient(90deg, #a855f7, #38bdf8)', color: '#ffffff', whiteSpace: 'nowrap', boxShadow: '0 4px 15px rgba(168, 85, 247, 0.4)' }}>
              {t('coupons_offers')}
            </span>
          </Link>

          {TOP_CATEGORIES.map((cat) => (
            <Link key={cat.id} href="/categories" style={{ textDecoration: 'none' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, padding: '8px 16px', borderRadius: '14px', background: 'rgba(255, 255, 255, 0.08)', color: '#ffffff', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid rgba(255, 255, 255, 0.18)' }}>
                <span>{cat.icon}</span>
                <span>{t(cat.name)}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Gen-G Store Auto-Rotating Product Showcase Slideshow */}
      <GenGStoreSlideshow />

      {/* Official BuyWise AI Brand Pillars Banner */}
      <BrandPillars />

      {/* 🏆 Weekly BuyWise Try-On Challenge & Winner Spotlight Section */}
      <section className="container section-padding" style={{ paddingTop: '30px', paddingBottom: '30px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '30px', alignItems: 'stretch' }}>
          
          {/* Card 1: Active Weekly Challenge Banner */}
          {(() => {
            const activeComp = getActiveCompetition();
            if (!activeComp) return null;

            return (
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.12), rgba(138, 43, 226, 0.2))',
                  border: '1px solid rgba(255, 215, 0, 0.4)',
                  borderRadius: '28px',
                  padding: '28px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 14px', borderRadius: '16px', background: 'rgba(255, 215, 0, 0.2)', border: '1px solid rgba(255, 215, 0, 0.5)' }}>
                      <span style={{ fontSize: '12px', fontWeight: 900, color: '#ffd700' }}>🏆 THIS WEEK&apos;S BUYWISE CHALLENGE</span>
                    </div>
                    <span style={{ fontSize: '11px', color: '#00ff88', fontWeight: 800, background: 'rgba(0, 255, 136, 0.15)', padding: '4px 10px', borderRadius: '12px', border: '1px solid rgba(0, 255, 136, 0.3)' }}>
                      🆓 Free Entry • 🔞 18+ Only
                    </span>
                  </div>

                  <h3 style={{ fontSize: '24px', fontWeight: 900, color: 'white', marginBottom: '8px' }}>
                    {activeComp.title}
                  </h3>
                  <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '16px', lineHeight: 1.5 }}>
                    Featured: <strong>{activeComp.featuredProductTitle}</strong> (₹{activeComp.featuredProductPrice.toLocaleString()})
                  </p>

                  <div style={{ position: 'relative', width: '100%', height: '180px', borderRadius: '18px', overflow: 'hidden', marginBottom: '20px' }}>
                    <Image src={activeComp.featuredProductImage} alt={activeComp.featuredProductTitle} fill unoptimized style={{ objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', bottom: '12px', left: '12px', padding: '4px 12px', borderRadius: '10px', background: 'rgba(0,0,0,0.8)', color: '#00ff88', fontWeight: 900, fontSize: '11px' }}>
                      🎁 Prize: {activeComp.prizeDescription}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <Link href="/try-on" style={{ flex: 1, textDecoration: 'none' }}>
                    <button style={{ width: '100%', padding: '12px', borderRadius: '16px', background: 'linear-gradient(135deg, #ffd700, #ff8c00)', color: '#000', fontWeight: 900, fontSize: '13px', border: 'none', cursor: 'pointer' }}>
                      ✨ Try Product
                    </button>
                  </Link>
                  <Link href="/competition" style={{ flex: 1, textDecoration: 'none' }}>
                    <button style={{ width: '100%', padding: '12px', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', color: 'white', fontWeight: 900, fontSize: '13px', cursor: 'pointer' }}>
                      🗳️ Vote Entries
                    </button>
                  </Link>
                </div>
              </div>
            );
          })()}

          {/* Card 2: Sunday Winner Spotlight */}
          {(() => {
            const comps = getCompetitions();
            const pastComp = comps.find(c => c.status === 'WINNER_DECLARED');
            if (!pastComp) return null;
            const winner = getWinnerSubmission(pastComp.id);
            if (!winner) return null;

            return (
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.12), rgba(12, 10, 20, 0.95))',
                  border: '1px solid rgba(0, 255, 136, 0.4)',
                  borderRadius: '28px',
                  padding: '28px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
                }}
              >
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 14px', borderRadius: '16px', background: 'rgba(0, 255, 136, 0.2)', border: '1px solid rgba(0, 255, 136, 0.5)', marginBottom: '14px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 900, color: '#00ff88' }}>👑 SUNDAY WINNER SPOTLIGHT</span>
                  </div>

                  <h3 style={{ fontSize: '24px', fontWeight: 900, color: 'white', marginBottom: '8px' }}>
                    Congratulations, {winner.userName}! 🎉
                  </h3>
                  <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '16px' }}>
                    Winner of <strong>{pastComp.title}</strong> with <strong>{winner.voteCount.toLocaleString()} votes</strong>!
                  </p>

                  <div style={{ position: 'relative', width: '100%', height: '180px', borderRadius: '18px', overflow: 'hidden', marginBottom: '20px' }}>
                    <Image src={winner.vtoResultImage} alt={winner.userName} fill unoptimized style={{ objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', top: '12px', right: '12px', padding: '4px 12px', borderRadius: '10px', background: '#ffd700', color: '#000', fontWeight: 900, fontSize: '11px' }}>
                      ❤️ {winner.voteCount} Votes
                    </div>
                  </div>
                </div>

                <Link href="/competition" style={{ textDecoration: 'none' }}>
                  <button style={{ width: '100%', padding: '12px', borderRadius: '16px', background: 'linear-gradient(135deg, #00ff88, #00d4ff)', color: '#000', fontWeight: 900, fontSize: '13px', border: 'none', cursor: 'pointer' }}>
                    🏆 View BuyWise Fashion Wall ➔
                  </button>
                </Link>
              </div>
            );
          })()}

        </div>
      </section>

      {/* Top Selling Category Bestsellers Section */}
      <section className="container section-padding">
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 16px", background: "rgba(0, 255, 136, 0.16)", border: "1px solid rgba(0, 255, 136, 0.4)", borderRadius: "20px", marginBottom: "16px" }}>
            <span style={{ color: "#00ff88", fontWeight: 900, fontSize: "13px" }}>{t('top_selling_bestsellers')}</span>
            <span style={{ color: "#cbd5e1", fontSize: "13px", fontWeight: 700 }}>{t('full_specs_live_prices')}</span>
          </div>

          <h2 style={{ fontSize: '42px', fontWeight: 900, marginBottom: '14px', color: '#ffffff' }}>
            {t('explore_top_products')}
          </h2>
          <p style={{ color: '#cbd5e1', fontSize: '17px', maxWidth: '600px', margin: '0 auto' }}>
            {t('explore_products_desc')}
          </p>
        </div>

        {/* Category Tabs */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '40px', flexWrap: 'wrap' }}>
          {TOP_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategoryTab(cat.id)}
              style={{
                padding: "10px 22px",
                borderRadius: "20px",
                border: activeCategoryTab === cat.id ? "1px solid var(--primary)" : "1px solid rgba(255, 255, 255, 0.18)",
                background: activeCategoryTab === cat.id ? "var(--gradient-accent)" : "rgba(255, 255, 255, 0.08)",
                color: "#ffffff",
                fontWeight: 900,
                fontSize: "14px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.2s ease"
              }}
            >
              <span>{cat.icon}</span>
              <span>{t(cat.name)}</span>
            </button>
          ))}
        </div>

        {/* Bestsellers Cards Showcase Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '30px' }}>
          {selectedCategoryObj.products.filter((prod) => resolveProductImage(prod) !== "").map((prod) => (
            <div
              key={prod.id}
              className="glass glass-card"
              style={{
                borderRadius: "24px",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                border: "1px solid rgba(255, 255, 255, 0.18)",
                background: "rgba(14, 10, 26, 0.95)"
              }}
            >
              {/* Product Cover Picture */}
              <div style={{ position: "relative", width: "100%", height: "210px", background: "#080612" }}>
                <SafeProductImage
                  src={resolveProductImage(prod)}
                  alt={prod.name}
                  style={{ width: "100%", height: "100%" }}
                />
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "linear-gradient(to bottom, transparent 40%, rgba(14, 10, 26, 0.98))", pointerEvents: "none" }}></div>
                
                <span style={{ position: "absolute", top: "16px", left: "16px", fontSize: "11px", fontWeight: 900, padding: "4px 12px", borderRadius: "12px", background: "rgba(8,6,18,0.9)", color: "#00ff88", border: "1px solid rgba(0, 255, 128, 0.4)" }}>
                  {t(prod.category)}
                </span>

                <span style={{ position: "absolute", top: "16px", right: "16px", fontSize: "12px", fontWeight: 900, padding: "4px 10px", borderRadius: "10px", background: "rgba(255, 215, 0, 0.25)", color: "#ffd700", border: "1px solid rgba(255, 215, 0, 0.5)" }}>
                  ⭐ {prod.rating}
                </span>
              </div>

              {/* Specs & Info */}
              <div style={{ padding: "24px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <h3 style={{ fontSize: "19px", fontWeight: 900, color: "#ffffff", marginBottom: "12px" }}>
                    {prod.name}
                  </h3>

                  {/* Specifications Summary */}
                  <div style={{ background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.15)", borderRadius: "14px", padding: "14px", marginBottom: "18px" }}>
                    <div style={{ fontSize: "11px", fontWeight: 900, color: "var(--primary)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {t('key_product_details')}
                    </div>
                    {prod.specs.slice(0, 2).map((sp, idx) => (
                      <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
                        <span style={{ color: "#cbd5e1" }}>{t(sp.label)}:</span>
                        <span style={{ color: "#ffffff", fontWeight: 800 }}>{sp.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  {(() => {
                    const effCalc = calculateEffectivePrice(prod.lowestPrice, prod.category, prod.bestStore);
                    return (
                      <div style={{ marginBottom: "16px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                          <div>
                            <span style={{ fontSize: "11px", color: "#cbd5e1", display: "block" }}>{t('sticker_price')}</span>
                            <span style={{ fontSize: "20px", fontWeight: 900, color: "#ffffff" }}>₹{prod.lowestPrice.toLocaleString('en-IN')}</span>
                          </div>
                          <span style={{ fontSize: "12px", color: "#38bdf8", fontWeight: 800 }}>{prod.bestStore}</span>
                        </div>

                        {effCalc.hasCoupon && effCalc.bestCoupon && (
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(0, 255, 136, 0.18)", border: "1px solid rgba(0, 255, 136, 0.4)", padding: "6px 12px", borderRadius: "10px", marginTop: "6px" }}>
                            <span style={{ fontSize: "11px", fontWeight: 900, color: "#00ff88" }}>🎟️ {effCalc.bestCoupon.code} (-₹{effCalc.savingsAmount})</span>
                            <span style={{ fontSize: "15px", fontWeight: 900, color: "#00ff88" }}>₹{effCalc.effectivePrice.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  <Link href="/categories" style={{ textDecoration: "none" }}>
                    <button className="btn-primary" style={{ width: "100%", padding: "12px", fontSize: "14px", fontWeight: 900, background: "var(--gradient-accent)" }}>
                      {t('view_complete_specs')}
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trending Comparisons */}
      <section className="container section-padding">
        <h2 style={{ fontSize: '40px', textAlign: 'center', marginBottom: '16px', fontWeight: 900, color: '#ffffff' }}>{t('trending_title')}</h2>
        <p style={{ textAlign: 'center', color: '#cbd5e1', marginBottom: '50px', fontSize: '16px' }}>{t('trending_desc')}</p>
        
        <div className="comparison-grid">
          <ProductCard 
            id="iphone-17"
            searchQuery="iPhone 17"
            title="iPhone 17 (256 GB)"
            amazonPrice="₹82,900"
            flipkartPrice="₹83,999"
            recommendation="Amazon (₹82,900 Best Price)"
            score={9.9}
            tag={t('latest_trending')}
          />
          <ProductCard 
            id="iphone-15-pro"
            searchQuery="iPhone 15 Pro"
            title="iPhone 15 Pro"
            amazonPrice="₹1,24,900"
            flipkartPrice="₹1,29,999"
            recommendation="Amazon (Best Deal)"
            score={9.8}
            tag={t('top_rated')}
          />
          <ProductCard 
            id="macbook-air-m2"
            searchQuery="MacBook Air M2"
            title="MacBook Air M2"
            amazonPrice="₹83,900"
            flipkartPrice="₹87,900"
            recommendation="Amazon (Lowest Price)"
            score={9.7}
            tag={t('best_laptop')}
          />
          <ProductCard 
            id="samsung-s24-ultra"
            searchQuery="Samsung Galaxy S24 Ultra"
            title="Samsung S24 Ultra"
            amazonPrice="₹1,19,999"
            flipkartPrice="₹1,21,999"
            recommendation="Amazon (₹1,19,999 Deal)"
            score={9.6}
            tag={t('android_flagship')}
          />
        </div>
      </section>

      {/* Photo Upload Modal Trigger */}
      <PhotoUploadModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
      />
    </main>
  );
}

function ProductCard({ searchQuery, title, amazonPrice, flipkartPrice, recommendation, score, tag }: any) {
  const { t } = useTranslation();

  return (
    <Link href={`/search?q=${encodeURIComponent(searchQuery)}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className="glass glass-card" style={{ padding: '30px', height: '100%', cursor: 'pointer', transition: 'transform 0.2s ease', background: 'rgba(14, 10, 26, 0.95)', border: '1px solid rgba(255, 255, 255, 0.18)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
          <span style={{ background: 'var(--gradient-accent)', color: '#ffffff', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 900 }}>#{score} {t('ai_score')}</span>
          {tag && <span style={{ fontSize: '11px', background: 'rgba(255, 0, 127, 0.2)', border: '1px solid rgba(255, 0, 127, 0.4)', padding: '3px 10px', borderRadius: '12px', color: '#ff77c2', fontWeight: 900 }}>{tag}</span>}
        </div>
        <h3 style={{ fontSize: '24px', marginBottom: '20px', fontWeight: 900, color: '#ffffff' }}>{title}</h3>
        
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ color: '#cbd5e1', fontSize: '14px' }}>Amazon</span>
            <span style={{ fontWeight: 900, color: '#00ff88', fontSize: '15px' }}>{amazonPrice}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ color: '#cbd5e1', fontSize: '14px' }}>Flipkart</span>
            <span style={{ fontWeight: 800, color: '#ffffff', fontSize: '15px' }}>{flipkartPrice}</span>
          </div>
        </div>
        
        <div style={{ padding: '15px', background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '14px', marginBottom: '24px' }}>
          <div style={{ fontSize: '11px', color: '#ff007f', fontWeight: 900, marginBottom: '4px', letterSpacing: '0.05em' }}>{t('our_recommendation')}</div>
          <div style={{ fontWeight: 800, color: '#ffffff', fontSize: '14px' }}>{recommendation}</div>
        </div>
        
        <button className="btn-primary" style={{ width: '100%', padding: '12px', fontWeight: 900, background: 'var(--gradient-accent)' }}>
          {t('view_live_comparison')}
        </button>
      </div>
    </Link>
  );
}

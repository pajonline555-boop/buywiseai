"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BuyWiseCoupon, RetailerName } from '@/lib/coupons/types';
import { getCoupons, calculateEffectivePrice } from '@/lib/coupons/couponService';
import { useTranslation } from '@/lib/i18n/i18nContext';

export default function PublicCouponsPage() {
  const [coupons, setCoupons] = useState<BuyWiseCoupon[]>([]);
  const [selectedRetailer, setSelectedRetailer] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const { t } = useTranslation();

  // Real Effective Price Simulator State
  const [inputPrice, setInputPrice] = useState<number>(3999);
  const [simCategory, setSimCategory] = useState<string>('Undergarments & Lingerie');

  useEffect(() => {
    async function loadData() {
      const data = await getCoupons('ACTIVE');
      setCoupons(data);
    }
    loadData();
  }, []);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 3000);
  };

  // Filter coupons
  const filteredCoupons = coupons.filter(c => {
    if (selectedRetailer !== 'ALL' && c.retailer !== selectedRetailer) return false;
    if (selectedCategory !== 'ALL' && !c.category.toLowerCase().includes(selectedCategory.toLowerCase())) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return c.code.toLowerCase().includes(q) || c.title.toLowerCase().includes(q) || c.retailer.toLowerCase().includes(q);
    }
    return true;
  });

  // Effective price calculations across stores
  const amazonCalc = calculateEffectivePrice(inputPrice, simCategory, 'Amazon India');
  const flipkartCalc = calculateEffectivePrice(inputPrice, simCategory, 'Flipkart');
  const meeshoCalc = calculateEffectivePrice(inputPrice, simCategory, 'Meesho');
  const myntraCalc = calculateEffectivePrice(inputPrice, simCategory, 'Myntra');
  const nykaaCalc = calculateEffectivePrice(inputPrice, simCategory, 'Nykaa');
  const ajioCalc = calculateEffectivePrice(inputPrice, simCategory, 'AJIO');
  const partnerCalc = calculateEffectivePrice(inputPrice, simCategory, 'BuyWise Partner Store');

  const comparisons = [
    { store: 'Amazon India', calc: amazonCalc, tag: 'pajonline-21' },
    { store: 'Flipkart', calc: flipkartCalc },
    { store: 'Meesho', calc: meeshoCalc },
    { store: 'Myntra', calc: myntraCalc, badge: '✨ Fashion VTO' },
    { store: 'Nykaa', calc: nykaaCalc, badge: '💄 Beauty' },
    { store: 'AJIO', calc: ajioCalc },
    { store: 'BuyWise Partner Store', calc: partnerCalc, badge: '🟢 Direct Seller' }
  ];

  // Best Effective Price
  const bestOffer = comparisons.reduce((prev, curr) => 
    curr.calc.effectivePrice < prev.calc.effectivePrice ? curr : prev
  );

  return (
    <main style={{ paddingTop: '40px', paddingBottom: '100px' }} suppressHydrationWarning>
      <div className="container" suppressHydrationWarning>

        {/* Hero Header */}
        <div style={{ textAlign: 'center', marginBottom: '44px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 18px', background: 'rgba(0, 255, 136, 0.12)', border: '1px solid rgba(0, 255, 136, 0.3)', borderRadius: '20px', marginBottom: '16px' }}>
            <span style={{ color: '#00ff88', fontWeight: 800, fontSize: '13px' }}>🎟️ FRESHNESS-VERIFIED COUPONS &amp; OFFERS</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>100% Valid Codes • Updated Today</span>
          </div>

          <h1 style={{ fontSize: '52px', fontWeight: 900, marginBottom: '14px' }}>
            Get the <span className="text-gradient">Real Effective Price</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '17px', maxWidth: '720px', margin: '0 auto' }}>
            BuyWise AI automatically verifies working coupon codes from Amazon, Flipkart, Meesho, Myntra, Nykaa, AJIO, Etsy &amp; Partner Stores—calculating net savings before checkout.
          </p>
        </div>

        {/* REAL EFFECTIVE PRICE CALCULATOR SIMULATOR WIDGET */}
        <div 
          className="glass"
          style={{
            borderRadius: '28px',
            padding: '32px',
            marginBottom: '50px',
            border: '1px solid rgba(0, 255, 136, 0.35)',
            background: 'linear-gradient(135deg, rgba(12, 10, 26, 0.95), rgba(7, 5, 16, 0.95))',
            boxShadow: '0 20px 50px rgba(0, 255, 136, 0.1)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
            <div>
              <span style={{ fontSize: '12px', color: '#00ff88', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                💰 LIVE REAL EFFECTIVE PRICE SIMULATOR
              </span>
              <h2 style={{ fontSize: '26px', fontWeight: 900, color: 'white', marginTop: '4px' }}>
                {t('real_effective_price')}
              </h2>
            </div>

            <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>{t('sticker_price')} (₹)</label>
                <input
                  type="number"
                  value={inputPrice}
                  onChange={(e) => setInputPrice(Number(e.target.value))}
                  style={{ width: '130px', padding: '10px 14px', borderRadius: '14px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--glass-border)', color: '#00ff88', fontWeight: 900, fontSize: '16px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Category</label>
                <select
                  value={simCategory}
                  onChange={(e) => setSimCategory(e.target.value)}
                  style={{ padding: '10px 14px', borderRadius: '14px', background: '#120f24', border: '1px solid var(--glass-border)', color: 'white', fontWeight: 800, fontSize: '13px', outline: 'none' }}
                >
                  <option value="Undergarments & Lingerie">Undergarments &amp; Lingerie</option>
                  <option value="Fashion & Clothing">Fashion &amp; Clothing</option>
                  <option value="Mobiles & Tech">Mobiles &amp; Tech</option>
                  <option value="Beauty & Personal Care">Beauty &amp; Personal Care</option>
                </select>
              </div>
            </div>
          </div>

          {/* Store Comparison Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' }}>
            {comparisons.map((c, idx) => {
              const isBest = c.store === bestOffer.store;
              return (
                <div
                  key={idx}
                  style={{
                    padding: '20px',
                    borderRadius: '20px',
                    background: isBest ? 'rgba(0, 255, 136, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                    border: isBest ? '2px solid #00ff88' : '1px solid var(--glass-border)',
                    position: 'relative'
                  }}
                >
                  {isBest && (
                    <span style={{ position: 'absolute', top: '-12px', right: '16px', background: 'var(--gradient-accent)', color: 'white', fontSize: '10px', fontWeight: 900, padding: '3px 10px', borderRadius: '10px' }}>
                      🏆 BEST EFFECTIVE PRICE
                    </span>
                  )}

                  <div style={{ fontSize: '14px', fontWeight: 800, color: 'white', marginBottom: '8px' }}>
                    {c.store} {c.badge && <span style={{ fontSize: '11px', color: '#00ff88' }}>{c.badge}</span>}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Listed Price:</span>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)', textDecoration: 'line-through' }}>₹{inputPrice.toLocaleString('en-IN')}</span>
                  </div>

                  {c.calc.bestCoupon ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', padding: '6px 10px', background: 'rgba(0, 255, 136, 0.15)', borderRadius: '10px' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 900, color: '#00ff88', fontSize: '12px' }}>🎟️ {c.calc.bestCoupon.code}</span>
                      <span style={{ color: '#00ff88', fontWeight: 800, fontSize: '12px' }}>-₹{c.calc.savingsAmount.toLocaleString('en-IN')}</span>
                    </div>
                  ) : (
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '10px', fontStyle: 'italic' }}>No min coupon reached</div>
                  )}

                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 700 }}>Effective Price:</span>
                    <span style={{ fontSize: '24px', fontWeight: 900, color: isBest ? '#00ff88' : 'white' }}>
                      ₹{c.calc.effectivePrice.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div 
          className="glass"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            padding: '16px 24px',
            borderRadius: '22px',
            marginBottom: '36px',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ flex: 1, minWidth: '240px' }}>
            <input
              type="text"
              placeholder="🔍 Search verified coupons e.g. MYNTRA300, NYKAA15, SAVE10, Etsy..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 18px',
                borderRadius: '16px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--glass-border)',
                color: 'white',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <select
              value={selectedRetailer}
              onChange={(e) => setSelectedRetailer(e.target.value)}
              style={{ padding: '12px 16px', borderRadius: '16px', background: '#120f24', border: '1px solid var(--glass-border)', color: 'white', fontSize: '13px', fontWeight: 700 }}
            >
              <option value="ALL">🛒 All Retailers</option>
              <option value="Amazon India">Amazon India</option>
              <option value="Flipkart">Flipkart</option>
              <option value="Meesho">Meesho</option>
              <option value="Myntra">Myntra</option>
              <option value="Nykaa">Nykaa</option>
              <option value="AJIO">AJIO</option>
              <option value="Tata CLiQ">Tata CLiQ</option>
              <option value="Etsy">Etsy</option>
              <option value="Cuelinks Network">Cuelinks Network</option>
              <option value="BuyWise Partner Store">BuyWise Partner Store</option>
            </select>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{ padding: '12px 16px', borderRadius: '16px', background: '#120f24', border: '1px solid var(--glass-border)', color: 'white', fontSize: '13px', fontWeight: 700 }}
            >
              <option value="ALL">📦 All Categories</option>
              <option value="Undergarments">👙 Undergarments &amp; Lingerie</option>
              <option value="Fashion">👗 Fashion &amp; Apparel</option>
              <option value="Beauty">💄 Beauty &amp; Personal Care</option>
              <option value="Mobiles">📱 Mobiles &amp; Tech</option>
            </select>
          </div>
        </div>

        {/* Toast Alert on Copy */}
        {copiedCode && (
          <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 9999, background: 'linear-gradient(90deg, #00ff88, #00d4ff)', color: '#080612', padding: '14px 28px', borderRadius: '30px', fontWeight: 900, boxShadow: '0 10px 30px rgba(0, 255, 136, 0.4)' }}>
            ✓ Coupon Code "{copiedCode}" Copied to Clipboard!
          </div>
        )}

        {/* Coupons Showcase Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '28px' }}>
          {filteredCoupons.map((c) => (
            <div
              key={c.id}
              className="glass glass-card"
              style={{
                borderRadius: '24px',
                padding: '26px',
                border: '1px solid var(--glass-border)',
                background: 'rgba(15, 12, 28, 0.85)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 12px', borderRadius: '12px', background: 'rgba(0, 212, 255, 0.15)', color: '#00d4ff', border: '1px solid rgba(0, 212, 255, 0.3)' }}>
                    {c.retailer}
                  </span>

                  {c.freshnessStatus === 'VERIFIED_TODAY' ? (
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#00ff88', background: 'rgba(0, 255, 136, 0.1)', padding: '4px 10px', borderRadius: '12px', border: '1px solid rgba(0, 255, 136, 0.3)' }}>
                      🟢 VERIFIED TODAY ({c.lastVerifiedAt})
                    </span>
                  ) : (
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#aaa', background: 'rgba(255, 255, 255, 0.05)', padding: '4px 10px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
                      ⚪ UNVERIFIED ({c.lastVerifiedAt})
                    </span>
                  )}
                </div>

                <h3 style={{ fontSize: '20px', fontWeight: 900, color: 'white', marginBottom: '8px', lineHeight: 1.3 }}>
                  {t(c.title)}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '18px', lineHeight: 1.5 }}>
                  {t(c.description)}
                </p>

                {/* Terms Pill */}
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--glass-border)', borderRadius: '14px', padding: '12px', marginBottom: '20px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Min Order Value:</span>
                    <span style={{ color: 'white', fontWeight: 700 }}>₹{c.minOrderValue.toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Max Discount:</span>
                    <span style={{ color: '#00ff88', fontWeight: 800 }}>{c.maxDiscount ? `₹${c.maxDiscount}` : 'No Limit'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Payment Terms:</span>
                    <span style={{ color: 'white', fontWeight: 600 }}>{c.paymentRestrictions || 'All Payments'}</span>
                  </div>
                </div>
              </div>

              {/* Copy Code & Shop Button Action Row */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  onClick={() => handleCopyCode(c.code)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '16px',
                    border: '1px dashed #00ff88',
                    background: 'rgba(0, 255, 136, 0.12)',
                    color: '#00ff88',
                    fontWeight: 900,
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <span>🎟️ {c.code}</span>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', background: 'rgba(0, 255, 136, 0.2)', padding: '2px 6px', borderRadius: '6px' }}>
                    {copiedCode === c.code ? 'COPIED!' : 'COPY'}
                  </span>
                </button>

                <Link href={c.source === 'PARTNER' ? '/partners' : '/categories'} style={{ textDecoration: 'none' }}>
                  <button className="btn-primary" style={{ padding: '12px 18px', fontSize: '13px', fontWeight: 800, borderRadius: '16px', background: 'var(--gradient-accent)' }}>
                    Shop Now ➔
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>

      </div>
    </main>
  );
}

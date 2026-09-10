"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CheckoutModal from '@/components/CheckoutModal';
import { PartnerProduct, PartnerCategory } from '@/lib/partners/types';
import { getPartnerProducts } from '@/lib/partners/partnerService';
import { getProxiedImageUrl } from '@/lib/imageUtils';
import { useTranslation } from '@/lib/i18n/i18nContext';

const CATEGORY_TABS: { id: string; label: string; icon: string }[] = [
  { id: 'All', label: '⚡ All Gen-G Store Items', icon: '⚡' },
  { id: 'Featured', label: '⭐ Featured Products', icon: '⭐' },
  { id: 'Deals', label: '🔥 Partner Deals', icon: '🔥' },
  { id: 'Undergarments & Lingerie', label: '👙 Undergarments & Lingerie', icon: '👙' },
  { id: 'Fashion', label: '👗 Fashion', icon: '👗' },
  { id: 'Jewellery', label: '💎 Jewellery', icon: '💎' },
  { id: 'Home & Living', label: '🏠 Home & Living', icon: '🏠' },
  { id: 'Electronics', label: '📱 Electronics', icon: '📱' },
  { id: 'Beauty & Personal Care', label: '🧴 Beauty', icon: '🧴' },
  { id: 'Local Brands', label: '🛍️ Local Brands', icon: '🛍️' },
  { id: 'Exclusive Offers', label: '🌟 Exclusive Offers', icon: '🌟' }
];

export default function PartnersStorefront() {
  const [activeTab, setActiveTab] = useState('All');
  const [products, setProducts] = useState<PartnerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProductForCheckout, setSelectedProductForCheckout] = useState<PartnerProduct | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await getPartnerProducts();
      setProducts(data);
      setLoading(false);
    }
    loadData();
  }, []);

  const filteredProducts = products.filter(p => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Featured') return p.rating && p.rating >= 4.8;
    if (activeTab === 'Deals') return (p.mrp - p.sellingPrice) >= 1000;
    if (activeTab === 'Undergarments & Lingerie') {
      const text = (p.title + ' ' + (p.category || '') + ' ' + (p.description || '')).toLowerCase();
      return p.category === 'Undergarments & Lingerie' ||
             text.includes('panty') || text.includes('panties') || text.includes('bra') ||
             text.includes('lingerie') || text.includes('underwear') || text.includes('brief') ||
             text.includes('trunk') || text.includes('undergarment');
    }
    return p.category.toLowerCase() === activeTab.toLowerCase();
  });

  const handleTryOn = (product: PartnerProduct) => {
    router.push(`/try-on?garmentUrl=${encodeURIComponent(product.primaryImage)}&title=${encodeURIComponent(product.title)}`);
  };

  const handleBuyNow = (product: PartnerProduct) => {
    setSelectedProductForCheckout(product);
    setIsCheckoutOpen(true);
  };

  return (
    <main style={{ minHeight: '100vh', paddingBottom: '80px', background: '#070510', color: 'white' }}>
      
      {/* Hero Workspace Banner */}
      <section style={{
        background: 'radial-gradient(circle at 50% 20%, rgba(0, 212, 255, 0.15), transparent 70%), linear-gradient(180deg, #0e0a22 0%, #070510 100%)',
        padding: '60px 20px 40px 20px',
        borderBottom: '1px solid var(--glass-border)',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 18px', background: 'rgba(0, 255, 136, 0.12)', border: '1px solid rgba(0, 255, 136, 0.3)', borderRadius: '20px', marginBottom: '20px' }}>
            <span style={{ color: '#00ff88', fontWeight: 900, fontSize: '13px' }}>⚡ BUYWISE GEN-G STORE</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{t('Direct Seller-Fulfilled Marketplace')}</span>
          </div>

          <h1 style={{ fontSize: '52px', fontWeight: 900, marginBottom: '16px', lineHeight: 1.15 }}>
            {t('Exclusive')} <span className="text-gradient">{t('Gen-G Store Collection')}</span> 🛍️
          </h1>

          <p style={{ color: 'var(--text-secondary)', fontSize: '18px', maxWidth: '750px', margin: '0 auto 30px auto' }}>
            {t('Shop authentic handpicked products directly from verified partner brands. Enjoy AI Virtual Try-On, guaranteed stock, direct partner packing, fast delivery & dedicated customer support.')}
          </p>

          {/* Key Value Props Pill Badges */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ padding: '10px 18px', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700 }}>
              <span style={{ fontSize: '16px' }}>🟢</span> {t('Verified Direct Partner Brands')}
            </div>
            <div style={{ padding: '10px 18px', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700 }}>
              <span style={{ fontSize: '16px' }}>👗</span> {t('1-Click AI Virtual Try-On')}
            </div>
            <div style={{ padding: '10px 18px', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700 }}>
              <span style={{ fontSize: '16px' }}>🚚</span> {t('Seller-Fulfilled Expedited Delivery')}
            </div>
          </div>
        </div>
      </section>

      {/* Category Tabs Section */}
      <section className="container" style={{ paddingTop: '30px', paddingBottom: '30px' }}>
        <div style={{
          display: 'flex',
          gap: '12px',
          overflowX: 'auto',
          paddingBottom: '10px',
          scrollbarWidth: 'none'
        }}>
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 22px',
                borderRadius: '20px',
                border: activeTab === tab.id ? '1px solid var(--primary)' : '1px solid var(--glass-border)',
                background: activeTab === tab.id ? 'var(--gradient-accent)' : 'rgba(255, 255, 255, 0.04)',
                color: 'white',
                fontWeight: 800,
                fontSize: '14px',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>{t(tab.label)}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Product Catalog Grid */}
      <section className="container">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
            {t('Loading partner catalog...')}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px solid var(--glass-border)' }}>
            <h3 style={{ fontSize: '20px', marginBottom: '10px' }}>{t('No partner products found in this section')}</h3>
            <p style={{ color: 'var(--text-secondary)' }}>{t('Select another category tab or view All Partners.')}</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '30px' }}>
            {filteredProducts.map((prod) => {
              const discountPercent = Math.round(((prod.mrp - prod.sellingPrice) / prod.mrp) * 100);
              return (
                <div
                  key={prod.id}
                  className="glass glass-card"
                  style={{
                    borderRadius: '24px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    border: '1px solid var(--glass-border)',
                    background: 'rgba(15, 12, 28, 0.75)'
                  }}
                >
                  {/* Image Header with Badges */}
                  <div style={{ position: 'relative', width: '100%', height: '260px', background: '#05030a' }}>
                    <Image
                      src={getProxiedImageUrl(prod.primaryImage)}
                      alt={prod.title}
                      fill
                      unoptimized
                      referrerPolicy="no-referrer"
                      style={{ objectFit: 'cover' }}
                    />
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to bottom, transparent 50%, rgba(7, 5, 16, 0.95))' }}></div>

                    {/* BuyWise Partner Badge */}
                    <span style={{
                      position: 'absolute',
                      top: '16px',
                      left: '16px',
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '6px 12px',
                      borderRadius: '14px',
                      background: 'rgba(5, 3, 12, 0.85)',
                      color: '#00ff88',
                      border: '1px solid rgba(0, 255, 136, 0.4)',
                      backdropFilter: 'blur(10px)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <span>🟢</span> {t('BuyWise Partner')}
                    </span>

                    {/* Rating Badge */}
                    <span style={{
                      position: 'absolute',
                      top: '16px',
                      right: '16px',
                      fontSize: '12px',
                      fontWeight: 800,
                      padding: '4px 10px',
                      borderRadius: '10px',
                      background: 'rgba(255, 215, 0, 0.2)',
                      color: '#ffd700',
                      border: '1px solid rgba(255, 215, 0, 0.4)'
                    }}>
                      ⭐ {prod.rating || 4.9} ({prod.reviewCount || 20})
                    </span>
                  </div>

                  {/* Product Details & Actions */}
                  <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#00d4ff', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                        {prod.partnerName}
                      </div>

                      <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'white', marginBottom: '10px', lineHeight: 1.35, height: '48px', overflow: 'hidden' }}>
                        {t(prod.title)}
                      </h3>

                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '18px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {t(prod.description)}
                      </p>
                    </div>

                    <div>
                      {/* Price Section */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '18px', background: 'rgba(255,255,255,0.03)', padding: '12px 16px', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                        <div>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>{t('Partner Price')}</span>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                            <span style={{ fontSize: '24px', fontWeight: 900, color: '#00ff88' }}>₹{prod.sellingPrice.toLocaleString('en-IN')}</span>
                            <span style={{ fontSize: '13px', textDecoration: 'line-through', color: 'var(--text-secondary)' }}>₹{prod.mrp.toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 800, padding: '4px 8px', borderRadius: '8px', background: 'rgba(255, 0, 128, 0.15)', color: '#ff007f', border: '1px solid rgba(255, 0, 128, 0.3)' }}>
                          {discountPercent}% {t('OFF')}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div style={{ display: 'grid', gridTemplateColumns: prod.tryOnEnabled ? '1fr 1fr' : '1fr', gap: '12px' }}>
                        {prod.tryOnEnabled && (
                          <button
                            onClick={() => handleTryOn(prod)}
                            style={{
                              padding: '12px',
                              borderRadius: '14px',
                              border: '1px solid rgba(255, 0, 128, 0.4)',
                              background: 'linear-gradient(135deg, rgba(255, 0, 128, 0.2), rgba(121, 40, 202, 0.2))',
                              color: 'white',
                              fontWeight: 800,
                              fontSize: '13px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px'
                            }}
                          >
                            ✨ {t('nav_try_on')}
                          </button>
                        )}

                        <button
                          onClick={() => handleBuyNow(prod)}
                          className="btn-primary"
                          style={{
                            padding: '12px',
                            borderRadius: '14px',
                            fontSize: '13px',
                            fontWeight: 800,
                            background: 'linear-gradient(90deg, #00ff88, #00d4ff)',
                            color: '#070510'
                          }}
                        >
                          {t('buy_now_btn')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        product={selectedProductForCheckout}
      />
    </main>
  );
}

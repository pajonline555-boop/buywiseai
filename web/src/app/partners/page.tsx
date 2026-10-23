"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CheckoutModal from '@/components/CheckoutModal';
import { PartnerProduct, PartnerCategory } from '@/lib/partners/types';
import { getPartnerProducts, getYoutubeEmbedUrl } from '@/lib/partners/partnerService';
import { getProxiedImageUrl } from '@/lib/imageUtils';
import { useTranslation } from '@/lib/i18n/i18nContext';
import { buildAffiliateUrl } from '@/lib/affiliate/affiliateLinkBuilder';

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
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<{ url: string; title: string } | null>(null);
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
    // Strictly exclude any paused or non-live products
    if (p.status !== 'LIVE' && (p.status as any) !== 'ACTIVE') return false;
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
    const targetUrl = product.productUrl && product.productUrl.startsWith('http')
      ? product.productUrl
      : (product.brand || product.partnerName || '').toLowerCase().includes('flipkart')
      ? `https://www.flipkart.com/search?q=${encodeURIComponent(product.title)}`
      : `https://www.amazon.in/s?k=${encodeURIComponent(product.title)}`;
    if (typeof window !== 'undefined') {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleShareProduct = async (product: PartnerProduct) => {
    const slug = product.slug || product.id || product.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const shareUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/product/${slug}`
      : `https://buywiseai.pajonline.co.in/product/${slug}`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: product.title,
          text: `Check out ${product.title} on BuyWise AI! Compare prices & try on:`,
          url: shareUrl,
        });
        return;
      } catch (err) {}
    }

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        setCopiedId(product.id);
        setTimeout(() => setCopiedId(null), 2500);
      }
    } catch (e) {}
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
                  <Link 
                    href={`/product/${prod.slug || prod.id}`}
                    style={{ position: 'relative', width: '100%', height: '260px', background: '#05030a', display: 'block' }}
                  >
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
                  </Link>

                  {/* Product Details & Actions */}
                  <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#00d4ff', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                        {prod.partnerName}
                      </div>

                      <Link href={`/product/${prod.slug || prod.id}`} style={{ textDecoration: 'none' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'white', marginBottom: '10px', lineHeight: 1.35, height: '48px', overflow: 'hidden', cursor: 'pointer' }}>
                          {t(prod.title)}
                        </h3>
                      </Link>

                      {prod.youtubeUrl && (
                        <div style={{ marginBottom: '10px' }}>
                          <button
                            type="button"
                            onClick={() => setSelectedVideoUrl({ url: prod.youtubeUrl!, title: prod.title })}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '5px 12px',
                              borderRadius: '10px',
                              background: 'rgba(255, 0, 77, 0.2)',
                              border: '1px solid #ff004d',
                              color: '#ff4d79',
                              fontSize: '11px',
                              fontWeight: 800,
                              cursor: 'pointer'
                            }}
                          >
                            <span>▶️</span> Watch Video Demo
                          </button>
                        </div>
                      )}

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
                      <div style={{ display: 'grid', gridTemplateColumns: prod.tryOnEnabled ? '1fr 1.2fr 44px' : '1fr 44px', gap: '10px', alignItems: 'center' }}>
                        {prod.tryOnEnabled && (
                          <button
                            onClick={() => handleTryOn(prod)}
                            title="Try on with AI"
                            style={{
                              padding: '12px 8px',
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
                          title="View Now on Verified Partner Store"
                          style={{
                            padding: '12px 10px',
                            borderRadius: '14px',
                            fontSize: '13px',
                            fontWeight: 900,
                            background: 'var(--gradient-accent)',
                            color: '#ffffff',
                            cursor: 'pointer'
                          }}
                        >
                          🛍️ {t('buy_now_btn')}
                        </button>

                        <button
                          onClick={() => handleShareProduct(prod)}
                          title="Share Product Link"
                          style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '14px',
                            border: copiedId === prod.id ? '1px solid #00ff88' : '1px solid var(--glass-border)',
                            background: copiedId === prod.id ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                            color: copiedId === prod.id ? '#00ff88' : '#ffffff',
                            fontSize: '14px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {copiedId === prod.id ? '✓' : '🔗'}
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

      {/* Embedded YouTube Video Demo Modal */}
      {selectedVideoUrl && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0, 0, 0, 0.88)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div className="glass" style={{
            width: '100%',
            maxWidth: '720px',
            background: 'rgba(15, 12, 30, 0.98)',
            borderRadius: '24px',
            border: '1px solid rgba(255, 77, 77, 0.4)',
            padding: '24px',
            boxShadow: '0 25px 60px rgba(255, 0, 77, 0.25)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 900, color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>▶️</span> {selectedVideoUrl.title}
              </h3>
              <button
                onClick={() => setSelectedVideoUrl(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  color: 'white',
                  fontSize: '16px',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>
            {getYoutubeEmbedUrl(selectedVideoUrl.url) ? (
              <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <iframe
                  src={getYoutubeEmbedUrl(selectedVideoUrl.url)!}
                  title={selectedVideoUrl.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                />
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '30px' }}>
                <a
                  href={selectedVideoUrl.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                  style={{ padding: '12px 24px', borderRadius: '14px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  ▶️ Watch Video on YouTube ➔
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

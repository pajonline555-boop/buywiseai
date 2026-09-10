"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CheckoutModal from '@/components/CheckoutModal';
import { PartnerProduct } from '@/lib/partners/types';
import { getPartnerProducts, MOCK_PARTNER_PRODUCTS } from '@/lib/partners/partnerService';
import SafeProductImage from '@/components/SafeProductImage';
import { useTranslation } from '@/lib/i18n/i18nContext';

export default function GenGStoreSlideshow() {
  const [products, setProducts] = useState<PartnerProduct[]>(MOCK_PARTNER_PRODUCTS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedProductForCheckout, setSelectedProductForCheckout] = useState<PartnerProduct | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    async function loadData() {
      try {
        const liveProds = await getPartnerProducts();
        if (liveProds.length > 0) {
          const withImagesOnly = liveProds.filter(p => p.primaryImage && typeof p.primaryImage === "string" && p.primaryImage.trim() !== "");
          setProducts(withImagesOnly);
        }
      } catch (err) {
        console.warn('Gen-G Store slideshow data notice:', err);
      }
    }
    loadData();
  }, []);

  const validProducts = products.filter(p => p.primaryImage && typeof p.primaryImage === "string" && p.primaryImage.trim() !== "");

  // Auto-play slideshow timer (3 seconds rotation)
  useEffect(() => {
    if (isPaused || validProducts.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % validProducts.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [isPaused, validProducts.length]);

  if (validProducts.length === 0) return null;

  const currentProduct = validProducts[currentIndex] || validProducts[0];
  if (!currentProduct) return null;

  const mrp = currentProduct.mrp ?? currentProduct.sellingPrice ?? 2999;
  const sellingPrice = currentProduct.sellingPrice ?? 1999;
  const discountPercent = mrp > 0 ? Math.round(((mrp - sellingPrice) / mrp) * 100) : 0;

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % products.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);
  };

  const handleTryOn = (prod: PartnerProduct) => {
    router.push(`/try-on?garmentUrl=${encodeURIComponent(prod.primaryImage)}&title=${encodeURIComponent(prod.title)}`);
  };

  const handleBuyNow = (prod: PartnerProduct) => {
    setSelectedProductForCheckout(prod);
    setIsCheckoutOpen(true);
  };

  return (
    <section 
      className="container"
      style={{ marginBottom: '50px', marginTop: '20px' }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Section Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', background: 'rgba(0, 255, 136, 0.15)', border: '1px solid rgba(0, 255, 136, 0.3)', borderRadius: '20px', marginBottom: '8px' }}>
            <span style={{ color: '#00ff88', fontWeight: 900, fontSize: '12px' }}>{t('exclusive_geng_showcase')}</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{t('verified_partner_brands')}</span>
          </div>
          <h2 style={{ fontSize: '36px', fontWeight: 900, lineHeight: 1.2 }}>
            {t('trending_in_geng')}
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link href="/partners" style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#00ff88', display: 'flex', alignItems: 'center', gap: '4px' }}>
              {t('view_all_geng')}
            </span>
          </Link>

          {/* Prev/Next Controls */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handlePrev}
              title="Previous Slide"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid var(--glass-border)',
                color: 'white',
                fontSize: '16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
            >
              ◀
            </button>
            <button
              onClick={handleNext}
              title="Next Slide"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid var(--glass-border)',
                color: 'white',
                fontSize: '16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
            >
              ▶
            </button>
          </div>
        </div>
      </div>

      {/* Main Slideshow Showcase Box */}
      <div 
        className="glass"
        style={{
          borderRadius: '32px',
          overflow: 'hidden',
          border: '1px solid rgba(0, 255, 136, 0.3)',
          background: 'linear-gradient(135deg, rgba(15, 12, 30, 0.95), rgba(7, 5, 16, 0.95))',
          boxShadow: '0 25px 60px rgba(0, 255, 136, 0.1)',
          position: 'relative'
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', minHeight: '440px' }}>
          
          {/* Slide Image Side */}
          <div style={{ position: 'relative', width: '100%', minHeight: '380px', background: '#05030a' }}>
            <SafeProductImage
              key={currentProduct.id}
              src={currentProduct.primaryImage}
              alt={currentProduct.title}
              style={{ width: '100%', height: '100%', minHeight: '380px' }}
            />
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to right, transparent 60%, rgba(15, 12, 30, 0.95))', pointerEvents: 'none' }}></div>

            {/* Gen-G Partner Badge */}
            <span style={{
              position: 'absolute',
              top: '20px',
              left: '20px',
              fontSize: '12px',
              fontWeight: 800,
              padding: '6px 14px',
              borderRadius: '16px',
              background: 'rgba(5, 3, 12, 0.85)',
              color: '#00ff88',
              border: '1px solid rgba(0, 255, 136, 0.4)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span>⚡</span> {t('geng_partner')}
            </span>

            {/* Discount Badge */}
            <span style={{
              position: 'absolute',
              bottom: '20px',
              left: '20px',
              fontSize: '13px',
              fontWeight: 900,
              padding: '6px 14px',
              borderRadius: '12px',
              background: 'rgba(255, 0, 128, 0.25)',
              color: '#ff007f',
              border: '1px solid rgba(255, 0, 128, 0.5)',
              backdropFilter: 'blur(10px)'
            }}>
              {discountPercent}% {t('off_special_deal')}
            </span>
          </div>

          {/* Slide Product Details Side */}
          <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', color: '#38bdf8', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {currentProduct.partnerName}
                </span>
                <span style={{ fontSize: '13px', fontWeight: 900, padding: '4px 10px', borderRadius: '10px', background: 'rgba(255, 215, 0, 0.25)', color: '#ffd700', border: '1px solid rgba(255, 215, 0, 0.5)' }}>
                  ⭐ {currentProduct.rating || 4.9} ({currentProduct.reviewCount || 24} {t('reviews')})
                </span>
              </div>

              <h3 style={{ fontSize: '26px', fontWeight: 900, color: '#ffffff', marginBottom: '14px', lineHeight: 1.25 }}>
                {currentProduct.title}
              </h3>

              <p style={{ fontSize: '14px', color: '#cbd5e1', marginBottom: '24px', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {currentProduct.description}
              </p>
            </div>

            <div>
              {/* Pricing Box */}
              <div style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.18)', padding: '16px 20px', borderRadius: '20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#cbd5e1', display: 'block', marginBottom: '2px', fontWeight: 700 }}>{t('geng_store_price')}</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                    <span style={{ fontSize: '32px', fontWeight: 900, color: '#00ff88' }}>₹{sellingPrice.toLocaleString('en-IN')}</span>
                    <span style={{ fontSize: '15px', textDecoration: 'line-through', color: '#cbd5e1' }}>₹{mrp.toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '12px', color: '#00ff88', fontWeight: 900, display: 'block' }}>{t('free_express_delivery')}</span>
                  <span style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 700 }}>{t('direct_partner_fulfillment')}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <button
                  onClick={() => handleTryOn(currentProduct)}
                  style={{
                    padding: '14px',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 0, 128, 0.5)',
                    background: 'linear-gradient(135deg, rgba(255, 0, 128, 0.25), rgba(121, 40, 202, 0.25))',
                    color: 'white',
                    fontWeight: 800,
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {t('ai_try_on_btn')}
                </button>

                <button
                  onClick={() => handleBuyNow(currentProduct)}
                  className="btn-primary"
                  style={{
                    padding: '14px',
                    borderRadius: '16px',
                    fontSize: '14px',
                    fontWeight: 900,
                    background: 'var(--gradient-accent)',
                    color: '#ffffff'
                  }}
                >
                  {t('buy_now_btn')}
                </button>
              </div>
            </div>

          </div>

        </div>

        {/* Slideshow Progress Bar & Dots */}
        <div style={{
          padding: '12px 30px',
          background: 'rgba(0,0,0,0.4)',
          borderTop: '1px solid var(--glass-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {validProducts.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                style={{
                  width: idx === currentIndex ? '24px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  background: idx === currentIndex ? 'var(--primary)' : 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              />
            ))}
          </div>

          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 800 }}>
            <span>{t('slide')} {String(currentIndex + 1).padStart(2, '0')} / {String(validProducts.length).padStart(2, '0')}</span>
            <span style={{ marginLeft: '12px', color: isPaused ? '#ffd700' : 'var(--primary)' }}>
              {isPaused ? t('paused_on_hover') : t('auto_playing')}
            </span>
          </div>
        </div>
      </div>

      {/* Direct Order Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        product={selectedProductForCheckout}
      />
    </section>
  );
}

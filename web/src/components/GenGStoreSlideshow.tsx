"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CheckoutModal from '@/components/CheckoutModal';
import { PartnerProduct } from '@/lib/partners/types';
import { getPartnerProducts, MOCK_PARTNER_PRODUCTS, getCategoryFallbackImage, getYoutubeEmbedUrl } from '@/lib/partners/partnerService';
import SafeProductImage from '@/components/SafeProductImage';
import { useTranslation } from '@/lib/i18n/i18nContext';
import { buildAffiliateUrl } from '@/lib/affiliate/affiliateLinkBuilder';

export default function GenGStoreSlideshow() {
  const [products, setProducts] = useState<PartnerProduct[]>(() =>
    MOCK_PARTNER_PRODUCTS.filter(p => (p.status === 'LIVE' || (p.status as any) === 'ACTIVE') && p.primaryImage)
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedProductForCheckout, setSelectedProductForCheckout] = useState<PartnerProduct | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    async function loadData() {
      try {
        const liveProds = await getPartnerProducts();
        if (liveProds.length > 0) {
          const withImagesOnly = liveProds.filter(
            p => (p.status === 'LIVE' || (p.status as any) === 'ACTIVE') &&
                 p.primaryImage && typeof p.primaryImage === "string" && p.primaryImage.trim() !== ""
          );
          setProducts(withImagesOnly);
        }
      } catch (err) {
        console.warn('Gen-G Store slideshow data notice:', err);
      }
    }
    loadData();
  }, []);

  const validProducts = products
    .filter(
      p => (p.status === 'LIVE' || (p.status as any) === 'ACTIVE') &&
           p.primaryImage && typeof p.primaryImage === "string" && p.primaryImage.trim() !== ""
    )
    .sort((a, b) => {
      if (a.showInSlideshow && !b.showInSlideshow) return -1;
      if (!a.showInSlideshow && b.showInSlideshow) return 1;
      const isBeltA = a.id.includes('kamarbandh') || a.title.includes('Navratri') || a.title.includes('Kamarbandh');
      const isBeltB = b.id.includes('kamarbandh') || b.title.includes('Navratri') || b.title.includes('Kamarbandh');
      if (isBeltA && !isBeltB) return -1;
      if (!isBeltA && isBeltB) return 1;
      return 0;
    });

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

  const OFFICIAL_YOUTUBE_SHORTS_URL = 'https://www.youtube.com/@BUYWISEAI-u8n/shorts';
  const activeYoutubeUrl = OFFICIAL_YOUTUBE_SHORTS_URL;

  const mrp = currentProduct.mrp ?? currentProduct.sellingPrice ?? 2999;
  const sellingPrice = currentProduct.sellingPrice ?? 1999;
  const discountPercent = mrp > 0 ? Math.round(((mrp - sellingPrice) / mrp) * 100) : 0;

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % products.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);
  };

  const handleTryOn = (prod: PartnerProduct, size?: string) => {
    const sizeParam = size ? `&size=${encodeURIComponent(size)}` : '';
    router.push(`/try-on?garmentUrl=${encodeURIComponent(prod.primaryImage)}&title=${encodeURIComponent(prod.title)}${sizeParam}`);
  };

  const handleBuyNow = (prod: PartnerProduct) => {
    // Send user directly to proper retailer outbound destination
    const targetUrl = prod.productUrl && prod.productUrl.startsWith('http')
      ? prod.productUrl
      : (prod.brand || prod.partnerName || '').toLowerCase().includes('flipkart')
      ? `https://www.flipkart.com/search?q=${encodeURIComponent(prod.title)}`
      : `https://www.amazon.in/s?k=${encodeURIComponent(prod.title)}`;
    if (typeof window !== 'undefined') {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleShareProduct = async (prod: PartnerProduct) => {
    const slug = prod.slug || prod.id || prod.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const shareUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/product/${slug}`
      : `https://buywiseai.pajonline.co.in/product/${slug}`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: prod.title,
          text: `Check out ${prod.title} on BuyWise AI! Compare prices & try on with AI:`,
          url: shareUrl,
        });
        return;
      } catch (err) {
        // User cancelled share sheet or not supported; proceed to clipboard copy
      }
    }

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        setCopiedShare(true);
        setTimeout(() => setCopiedShare(false), 2500);
      }
    } catch (e) {
      console.warn('Share copy error:', e);
    }
  };

  return (
    <section 
      id="trending-geng"
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
          
          {/* Slide Image Side - Full Product Presentation with Ambient Glow */}
          <Link 
            href={`/product/${currentProduct.slug || currentProduct.id}`}
            style={{ 
              position: 'relative', 
              width: '100%', 
              minHeight: '420px', 
              background: '#070512', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              overflow: 'hidden', 
              textDecoration: 'none' 
            }}
          >
            {/* Ambient Blurred Glow Backdrop */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentProduct.primaryImage}
              alt=""
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: '-20px',
                left: '-20px',
                width: 'calc(100% + 40px)',
                height: 'calc(100% + 40px)',
                objectFit: 'cover',
                filter: 'blur(35px) brightness(0.28)',
                transform: 'scale(1.15)',
                pointerEvents: 'none',
              }}
            />

            {/* Pristine Full Product Image - Never Cropped */}
            <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', minHeight: '380px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
              <SafeProductImage
                key={currentProduct.id}
                src={currentProduct.primaryImage}
                alt={currentProduct.title}
                fallbackSrc={getCategoryFallbackImage(currentProduct.category, currentProduct.title)}
                objectFit="contain"
                style={{ width: '100%', height: '100%', maxHeight: '420px' }}
              />
            </div>

            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to right, transparent 65%, rgba(15, 12, 30, 0.95))', pointerEvents: 'none', zIndex: 2 }}></div>

            {/* Gen-G Partner Badge */}
            <span style={{
              position: 'absolute',
              top: '20px',
              left: '20px',
              fontSize: '12px',
              fontWeight: 800,
              padding: '6px 14px',
              borderRadius: '16px',
              background: 'rgba(5, 3, 12, 0.88)',
              color: '#00ff88',
              border: '1px solid rgba(0, 255, 136, 0.4)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              zIndex: 3
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
              background: 'rgba(255, 0, 128, 0.3)',
              color: '#ff007f',
              border: '1px solid rgba(255, 0, 128, 0.6)',
              backdropFilter: 'blur(10px)',
              zIndex: 3
            }}>
              {discountPercent}% {t('off_special_deal')}
            </span>
          </Link>

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

              <Link href={`/product/${currentProduct.slug || currentProduct.id}`} style={{ textDecoration: 'none' }}>
                <h3 style={{ fontSize: '26px', fontWeight: 900, color: '#ffffff', marginBottom: '14px', lineHeight: 1.25, cursor: 'pointer' }}>
                  {currentProduct.title}
                </h3>
              </Link>

              {/* Auto Multi-Size Try-On Selector (Petite S, Regular M, Curvy L, Plus XXL) */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255, 215, 0, 0.08)', border: '1px solid rgba(255, 215, 0, 0.35)', padding: '10px 14px', borderRadius: '14px', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 900, color: '#ffd700' }}>
                  👗 Auto Multi-Size Try-On:
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[
                    { label: 'S', title: 'Petite S' },
                    { label: 'M', title: 'Regular M' },
                    { label: 'L', title: 'Dusky L' },
                    { label: 'XXL', title: 'Curvy XXL' }
                  ].map(sz => (
                    <button
                      key={sz.label}
                      onClick={() => handleTryOn(currentProduct, sz.label)}
                      title={`Auto-Try ${sz.title} (${sz.label})`}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 215, 0, 0.6)',
                        background: 'linear-gradient(135deg, rgba(40, 25, 60, 0.9), rgba(20, 15, 35, 0.9))',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 900,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {sz.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Official YouTube Shorts Channel Link ONLY */}
              <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <a
                  href={OFFICIAL_YOUTUBE_SHORTS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Watch Official BuyWise AI YouTube Shorts Channel"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, rgba(255, 0, 77, 0.35), rgba(255, 60, 0, 0.25))',
                    border: '1px solid #ff004d',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 900,
                    textDecoration: 'none',
                    boxShadow: '0 4px 15px rgba(255, 0, 77, 0.35)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span>▶️</span> YouTube Shorts Channel (@BUYWISEAI-u8n) ↗
                </a>
              </div>

              <p style={{ fontSize: '14px', color: '#cbd5e1', marginBottom: '24px', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {currentProduct.description}
              </p>
            </div>

            <div>
              {/* Pricing Box */}
              <div style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.18)', padding: '16px 20px', borderRadius: '20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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

              {/* Action Buttons Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 0.9fr', gap: '10px' }}>
                <button
                  onClick={() => handleTryOn(currentProduct)}
                  title="Try on with BuyWise AI"
                  style={{
                    padding: '13px 10px',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 0, 128, 0.5)',
                    background: 'linear-gradient(135deg, rgba(255, 0, 128, 0.25), rgba(121, 40, 202, 0.25))',
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
                  {t('ai_try_on_btn')}
                </button>

                <button
                  onClick={() => handleBuyNow(currentProduct)}
                  className="btn-primary"
                  title="View Now on Verified Partner Store"
                  style={{
                    padding: '13px 10px',
                    borderRadius: '16px',
                    fontSize: '14px',
                    fontWeight: 900,
                    background: 'var(--gradient-accent)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <span>🛍️</span> {t('buy_now_btn')}
                </button>

                <button
                  onClick={() => handleShareProduct(currentProduct)}
                  title="Copy shareable link for social media"
                  style={{
                    padding: '13px 10px',
                    borderRadius: '16px',
                    border: copiedShare ? '1px solid #00ff88' : '1px solid rgba(255, 255, 255, 0.25)',
                    background: copiedShare ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                    color: copiedShare ? '#00ff88' : '#ffffff',
                    fontWeight: 800,
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span>{copiedShare ? '✓' : '🔗'}</span>
                  <span>{copiedShare ? 'Copied!' : 'Share'}</span>
                </button>
              </div>

              {/* Quick Social Media Direct Share Row */}
              <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', fontSize: '11px', color: '#94a3b8' }}>
                <span style={{ fontWeight: 700 }}>Share to Social Media:</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out ${currentProduct.title} on BuyWise AI! Compare prices & try on: ${typeof window !== 'undefined' ? window.location.origin : 'https://buywiseai.pajonline.co.in'}/product/${currentProduct.slug || currentProduct.id}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '4px 10px',
                      borderRadius: '10px',
                      background: 'rgba(37, 211, 102, 0.15)',
                      border: '1px solid rgba(37, 211, 102, 0.4)',
                      color: '#25d366',
                      fontWeight: 800,
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>💬</span> WhatsApp
                  </a>
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out ${currentProduct.title} on BuyWise AI!`)}&url=${encodeURIComponent(`${typeof window !== 'undefined' ? window.location.origin : 'https://buywiseai.pajonline.co.in'}/product/${currentProduct.slug || currentProduct.id}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '4px 10px',
                      borderRadius: '10px',
                      background: 'rgba(29, 161, 242, 0.15)',
                      border: '1px solid rgba(29, 161, 242, 0.4)',
                      color: '#38bdf8',
                      fontWeight: 800,
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>🐦</span> X / Twitter
                  </a>
                </div>
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

      {/* Embedded YouTube Video Demo Modal */}
      {isVideoModalOpen && activeYoutubeUrl && (
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
                <span>▶️</span> {currentProduct.title}
              </h3>
              <button
                onClick={() => setIsVideoModalOpen(false)}
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
            {getYoutubeEmbedUrl(activeYoutubeUrl) ? (
              <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <iframe
                  src={getYoutubeEmbedUrl(activeYoutubeUrl)!}
                  title={currentProduct.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                />
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '30px' }}>
                <a
                  href={activeYoutubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                  style={{ padding: '12px 24px', borderRadius: '14px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  ▶️ Watch Video on YouTube ➔
                </a>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <a
                href={activeYoutubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: '#ff4d79',
                  fontSize: '13px',
                  fontWeight: 800,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>🔗</span> Open Video on YouTube in new tab ↗
              </a>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                Official Verified Partner Demo
              </span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

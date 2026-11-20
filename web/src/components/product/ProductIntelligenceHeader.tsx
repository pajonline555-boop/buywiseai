"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { BestsellerProduct } from '@/lib/categoryData';
import { generateBuyWiseShareUrl } from '@/lib/affiliate/affiliateLinkBuilder';
import { addToCart } from '@/lib/cart/cartStore';
import { generateSingleProductWhatsAppLink } from '@/lib/commerce/whatsappCommerce';

interface ProductIntelligenceHeaderProps {
  product: BestsellerProduct;
  onTryOnClick?: () => void;
  onBuyNowClick?: () => void;
}

function isWearableProduct(name: string, category: string): boolean {
  const lower = (name + " " + category).toLowerCase().trim();

  const nonWearables = [
    "foil", "paper", "wrap", "tissue", "kitchen", "phone", "iphone", "samsung",
    "macbook", "laptop", "headphone", "airpod", "earbud", "charger", "gadget",
    "tv", "appliance", "fryer", "tool", "grocery", "cleaner", "soap", "shampoo",
    "bottle", "cover", "case", "cable", "battery", "mouse", "keyboard", "hamper", "chocolates"
  ];
  if (nonWearables.some(nw => lower.includes(nw))) {
    return false;
  }

  const wearables = [
    "saree", "dress", "shirt", "t-shirt", "top", "jeans", "pant", "trousers",
    "kurti", "lehenga", "suit", "jacket", "coat", "hoodie", "sweater", "cardigan",
    "skirt", "outfit", "gown", "innerwear", "bra", "trunk", "pajama", "ethnic",
    "shoe", "sneaker", "boot", "sandal", "heel", "wear", "apparel", "clothing",
    "necklace", "jewellery", "jewelry", "ring", "earring", "bangle", "bracelet"
  ];
  return wearables.some(w => lower.includes(w));
}

export default function ProductIntelligenceHeader({
  product,
  onTryOnClick,
}: ProductIntelligenceHeaderProps) {
  const [addedToCart, setAddedToCart] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Multiple Gallery Images
  const galleryImages: string[] = Array.from(new Set([
    product.image,
    ...(product.images || []),
  ])).filter(Boolean);

  const isFootwear = (product.category || '').toLowerCase().includes('shoe') || (product.name || '').toLowerCase().includes('shoe') || (product.name || '').toLowerCase().includes('sneaker');
  const isClothing = isWearableProduct(product.name, product.category) && !isFootwear;

  // Available Sizes (Strict Rule: only display sizes returned by the retailer or partner product)
  const hasVerifiedSizes = Boolean(product.availableSizes && product.availableSizes.length > 0);
  const availableSizes = hasVerifiedSizes ? product.availableSizes! : [];
  const [selectedSize, setSelectedSize] = useState<string>(availableSizes[0] || '');

  // Available Colors (Strict Rule: only display colors returned by the retailer or partner product)
  const hasVerifiedColors = Boolean(product.availableColors && product.availableColors.length > 0);
  const availableColors = hasVerifiedColors ? product.availableColors! : [];
  const [selectedColor, setSelectedColor] = useState<string>(availableColors[0] || '');

  const [isSaved, setIsSaved] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(`buywise_saved_${product.id}`) === "true";
    }
    return false;
  });

  const smartValueScore = product.smartValueScore || Math.min(99, Math.floor(product.rating * 19 + 5));
  const shoppingTrustScore = product.shoppingTrustScore || Math.min(98, Math.floor(product.rating * 18 + 8));
  const isPartner = product.productSource === 'PARTNER' || product.source === 'PARTNER';
  const isTryOn = product.isTryOnEligible !== false && isWearableProduct(product.name, product.category);
  const savingsAmount = product.originalPrice > product.lowestPrice ? product.originalPrice - product.lowestPrice : 0;
  const savingsPercent = product.originalPrice > product.lowestPrice ? Math.round((savingsAmount / product.originalPrice) * 100) : 0;

  const currentDisplayImage = galleryImages[activeImageIndex] || product.image;

  const storeLower = (product.bestStore || '').toLowerCase();
  const defaultSearchUrl = storeLower.includes('flipkart')
    ? `https://www.flipkart.com/search?q=${encodeURIComponent(product.name)}`
    : storeLower.includes('croma')
    ? `https://www.croma.com/searchB?q=${encodeURIComponent(product.name)}`
    : storeLower.includes('myntra')
    ? `https://www.myntra.com/${encodeURIComponent(product.name)}`
    : `https://www.amazon.in/s?k=${encodeURIComponent(product.name)}`;

  const outboundAffiliateUrl = (product.prices?.[0]?.url && product.prices[0].url.startsWith('http'))
    ? product.prices[0].url
    : product.productUrl || defaultSearchUrl;

  const handleAddToCart = () => {
    addToCart({
      productId: product.id,
      title: product.name,
      brand: product.bestStore || 'BuyWise Store',
      store: product.bestStore,
      retailerId: (product.bestStore || 'buywise').toLowerCase(),
      price: product.lowestPrice,
      originalPrice: product.originalPrice,
      imageUrl: currentDisplayImage,
      selectedSize: selectedSize || undefined,
      selectedColor: selectedColor || undefined,
      quantity: 1,
      itemType: isPartner ? 'PARTNER' : 'EXTERNAL_RETAILER',
      productUrl: typeof window !== 'undefined' ? window.location.href : `/product/${product.slug || product.id}`,
      affiliateUrl: outboundAffiliateUrl,
      inStock: true,
    });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2500);
  };

  const whatsAppOrderUrl = generateSingleProductWhatsAppLink({
    productTitle: product.name,
    brand: product.bestStore || 'BuyWise Store',
    retailer: product.bestStore,
    productId: product.id,
    selectedSize: selectedSize || undefined,
    selectedColor: selectedColor || undefined,
    quantity: 1,
    displayedPrice: product.lowestPrice,
    productUrl: typeof window !== 'undefined' ? window.location.href : `https://buywiseai.pajonline.co.in/product/${product.slug || product.id}`,
  });

  const handleCopyShareLink = async () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://buywiseai.pajonline.co.in';
    const shareUrl = generateBuyWiseShareUrl(product.slug || product.id, origin);
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `Check out ${product.name} on BuyWise AI! Compare prices & try on:`,
          url: shareUrl,
        });
        return;
      } catch {
        // Fallback to clipboard if share was dismissed or unsupported
      }
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleSaveProduct = () => {
    const newState = !isSaved;
    setIsSaved(newState);
    if (typeof window !== "undefined") {
      localStorage.setItem(`buywise_saved_${product.id}`, newState ? "true" : "false");
      try {
        const existing: BestsellerProduct[] = JSON.parse(localStorage.getItem("buywise_saved_products") || "[]");
        if (newState) {
          localStorage.setItem("buywise_saved_products", JSON.stringify([product, ...existing]));
        } else {
          localStorage.setItem("buywise_saved_products", JSON.stringify(existing.filter((p) => p.id !== product.id)));
        }
      } catch (err) {
        console.error("Save product localStorage error:", err);
      }
    }
  };

  return (
    <section 
      className="glass"
      style={{
        width: '100%',
        borderRadius: '28px',
        padding: '32px',
        marginBottom: '32px',
        background: 'rgba(18, 14, 36, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)'
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '40px', alignItems: 'start' }}>
        
        {/* Left Column: High-Res Image Gallery with Thumbnail Switcher */}
        <div>
          <div style={{ position: 'relative', width: '100%', minHeight: '400px', height: '420px', borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.12)', background: '#0a0818', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
            {/* Ambient Blurred Colored Glow in the background */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentDisplayImage}
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

            <Image
              src={currentDisplayImage}
              alt={product.name}
              fill
              unoptimized
              style={{ objectFit: 'contain', padding: '16px', zIndex: 1 }}
            />

            {/* Source Badge */}
            <div style={{ position: 'absolute', top: '16px', left: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap', zIndex: 2 }}>
              {isPartner ? (
                <span style={{ fontSize: '11px', fontWeight: 900, padding: '6px 14px', borderRadius: '14px', background: 'linear-gradient(135deg, #a855f7, #ff007f)', color: '#ffffff', boxShadow: '0 4px 15px rgba(255, 0, 127, 0.5)' }}>
                  🛍️ BUYWISE STORE
                </span>
              ) : (
                <span style={{ fontSize: '11px', fontWeight: 900, padding: '6px 14px', borderRadius: '14px', background: 'rgba(0, 0, 0, 0.8)', color: '#00ff88', border: '1px solid rgba(0, 255, 136, 0.4)' }}>
                  🛒 {product.bestStore.toUpperCase()}
                </span>
              )}

              {isTryOn && (
                <span style={{ fontSize: '11px', fontWeight: 900, padding: '6px 14px', borderRadius: '14px', background: 'rgba(0, 212, 255, 0.25)', color: '#00d4ff', border: '1px solid #00d4ff' }}>
                  ✨ 3D TRY-ON READY
                </span>
              )}
            </div>
          </div>

          {/* Multiple Image Thumbnail Strip */}
          {galleryImages.length > 1 && (
            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '6px' }}>
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  style={{
                    position: 'relative',
                    width: '64px',
                    height: '64px',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    border: activeImageIndex === idx ? '2px solid #00ff88' : '1px solid rgba(255, 255, 255, 0.15)',
                    background: '#0a0818',
                    cursor: 'pointer',
                    padding: 0,
                    flexShrink: 0,
                    opacity: activeImageIndex === idx ? 1 : 0.65,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Image src={img} alt="" fill unoptimized style={{ objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Intelligence Analysis & Conversion CTAs */}
        <div>
          <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.08em', marginBottom: '8px' }}>
            BUYWISE PRODUCT INTELLIGENCE • {product.category.toUpperCase()}
          </div>

          <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#ffffff', marginBottom: '16px', lineHeight: 1.3 }}>
            {product.name}
          </h1>

          {/* BuyWise Intelligence Scores Row */}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '24px' }}>
            <div style={{ background: 'rgba(0, 255, 136, 0.12)', border: '1px solid rgba(0, 255, 136, 0.4)', padding: '10px 18px', borderRadius: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#00ff88' }}>{smartValueScore}/100</div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#cbd5e1' }}>Smart Value Score</div>
            </div>

            <div style={{ background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.4)', padding: '10px 18px', borderRadius: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#38bdf8' }}>{shoppingTrustScore}/100</div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#cbd5e1' }}>Shopping Trust Score</div>
            </div>

            <div style={{ background: 'rgba(255, 215, 0, 0.12)', border: '1px solid rgba(255, 215, 0, 0.4)', padding: '10px 18px', borderRadius: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#ffd700' }}>★ {product.rating}</div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#cbd5e1' }}>{product.reviewsCount.toLocaleString()} Verified Reviews</div>
            </div>
          </div>

          {/* Pricing Row */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '13px', color: '#cbd5e1', fontWeight: 600, marginBottom: '4px' }}>Best Live Price Today</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px' }}>
              <span style={{ fontSize: '38px', fontWeight: 900, color: '#ffffff' }}>₹{product.lowestPrice.toLocaleString()}</span>
              {product.originalPrice > product.lowestPrice && (
                <>
                  <span style={{ fontSize: '20px', color: 'rgba(255, 255, 255, 0.4)', textDecoration: 'line-through', fontWeight: 600 }}>
                    ₹{product.originalPrice.toLocaleString()}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 900, color: '#00ff88', background: 'rgba(0, 255, 136, 0.15)', padding: '4px 10px', borderRadius: '10px' }}>
                    SAVE ₹{savingsAmount.toLocaleString()} ({savingsPercent}% OFF)
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Dynamic Variant Selector: Size Selection (Strictly when verified by retailer/partner) */}
          {hasVerifiedSizes ? (
            <div style={{ marginBottom: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>
                  SELECT {isFootwear ? 'SHOE SIZE' : 'SIZE'}: <strong style={{ color: '#00ff88' }}>{selectedSize}</strong>
                </span>
                <span style={{ fontSize: '11px', color: '#00ff88' }}>✓ Verified Retailer In-Stock Sizing</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {availableSizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    style={{
                      padding: '8px 18px',
                      borderRadius: '12px',
                      border: selectedSize === size ? '2px solid #00ff88' : '1px solid rgba(255, 255, 255, 0.2)',
                      background: selectedSize === size ? 'rgba(0, 255, 136, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                      color: selectedSize === size ? '#00ff88' : '#ffffff',
                      fontWeight: 800,
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          ) : (isClothing || isFootwear) ? (
            <div style={{ marginBottom: '18px', padding: '10px 16px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.12)', fontSize: '12px', color: '#94a3b8' }}>
              📏 <strong>Sizing Note:</strong> Real-time size availability is verified directly on {product.bestStore}. Select your size when visiting the retailer page.
            </div>
          ) : null}

          {/* Dynamic Variant Selector: Color Selection */}
          {hasVerifiedColors && (
            <div style={{ marginBottom: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>
                  SELECT COLOUR: <strong style={{ color: '#00ff88' }}>{selectedColor}</strong>
                </span>
                <span style={{ fontSize: '11px', color: '#00ff88' }}>✓ Verified Colour Options</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {availableColors.map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setSelectedColor(col)}
                    style={{
                      padding: '8px 18px',
                      borderRadius: '12px',
                      border: selectedColor === col ? '2px solid #00ff88' : '1px solid rgba(255, 255, 255, 0.2)',
                      background: selectedColor === col ? 'rgba(0, 255, 136, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                      color: selectedColor === col ? '#00ff88' : '#ffffff',
                      fontWeight: 800,
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {col}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Primary Action Buttons: Add to Cart & Buy Now WhatsApp */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '18px' }}>
            {/* Add to Cart */}
            <button
              onClick={handleAddToCart}
              style={{
                flex: 1,
                minWidth: '160px',
                padding: '16px 24px',
                borderRadius: '18px',
                background: addedToCart ? 'rgba(0, 255, 136, 0.25)' : 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: addedToCart ? '#00ff88' : '#ffffff',
                fontWeight: 900,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {addedToCart ? '✓ ADDED TO CART' : '🛒 ADD TO CART'}
            </button>

            {/* Buy Now via WhatsApp (Official Number +91 8955438945) */}
            <a
              href={whatsAppOrderUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ flex: 1.2, minWidth: '200px', textDecoration: 'none' }}
            >
              <button
                style={{
                  width: '100%',
                  padding: '16px 24px',
                  borderRadius: '18px',
                  background: 'linear-gradient(135deg, #25d366, #128c7e)',
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: '14px',
                  border: 'none',
                  boxShadow: '0 8px 25px rgba(37, 211, 102, 0.4)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <span>💬</span>
                <span>BUY NOW VIA WHATSAPP ➔</span>
              </button>
            </a>

            {!isPartner && (
              <a
                href={outboundAffiliateUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ flex: 1, minWidth: '160px', textDecoration: 'none' }}
              >
                <button
                  style={{
                    width: '100%',
                    padding: '16px 24px',
                    borderRadius: '18px',
                    background: 'var(--gradient-accent)',
                    color: '#ffffff',
                    fontWeight: 900,
                    fontSize: '14px',
                    border: 'none',
                    boxShadow: '0 8px 25px rgba(255, 0, 127, 0.4)',
                    cursor: 'pointer',
                  }}
                >
                  VIEW ON {product.bestStore.toUpperCase()} ➔
                </button>
              </a>
            )}

            <button
              onClick={handleSaveProduct}
              style={{
                padding: '16px 20px',
                borderRadius: '18px',
                background: isSaved ? 'rgba(255, 0, 127, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                border: isSaved ? '1px solid #ff007f' : '1px solid rgba(255, 255, 255, 0.25)',
                color: isSaved ? '#ff007f' : '#ffffff',
                fontWeight: 900,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {isSaved ? '❤️ SAVED TO MY BUYWISE' : '🤍 SAVE PRODUCT TO MY BUYWISE'}
            </button>

            <button
              onClick={handleCopyShareLink}
              style={{
                padding: '16px 20px',
                borderRadius: '18px',
                background: copiedLink ? 'rgba(0, 255, 136, 0.25)' : 'rgba(255, 255, 255, 0.1)',
                border: copiedLink ? '1px solid #00ff88' : '1px solid rgba(255, 255, 255, 0.25)',
                color: copiedLink ? '#00ff88' : '#ffffff',
                fontWeight: 900,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {copiedLink ? '✓ LINK COPIED!' : '🔗 SHARE STORE LINK'}
            </button>

            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out ${product.name} on BuyWise AI! Compare prices & try on: ${typeof window !== 'undefined' ? window.location.origin : 'https://buywiseai.pajonline.co.in'}/product/${product.slug || product.id}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none' }}
            >
              <button
                style={{
                  padding: '16px 20px',
                  borderRadius: '18px',
                  background: 'rgba(37, 211, 102, 0.15)',
                  border: '1px solid rgba(37, 211, 102, 0.4)',
                  color: '#25d366',
                  fontWeight: 900,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>💬</span> WHATSAPP
              </button>
            </a>

            {/* Open in Mobile App via Android Intent */}
            <a
              href={`intent://product/${product.slug || product.id}#Intent;scheme=buywise;package=com.pajonline.buywiseai;S.browser_fallback_url=${encodeURIComponent(`https://buywiseai.pajonline.co.in/product/${product.slug || product.id}`)};end`}
              style={{ textDecoration: 'none' }}
              title="Open product directly in the BuyWise Android App"
            >
              <button
                style={{
                  padding: '16px 20px',
                  borderRadius: '18px',
                  background: 'rgba(0, 212, 255, 0.12)',
                  border: '1px solid rgba(0, 212, 255, 0.5)',
                  color: '#00d4ff',
                  fontWeight: 900,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>📲</span> OPEN IN APP
              </button>
            </a>

            {isTryOn && (
              <Link href="/try-on" style={{ textDecoration: 'none' }}>
                <button
                  onClick={onTryOnClick}
                  style={{
                    padding: '16px 24px',
                    borderRadius: '18px',
                    background: 'rgba(0, 212, 255, 0.15)',
                    border: '1px solid #00d4ff',
                    color: '#00d4ff',
                    fontWeight: 900,
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  ✨ TRY ON IN 3D
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

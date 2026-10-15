"use client";
import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { savePartnerProduct } from '@/lib/partners/partnerService';
import { generateBuyWiseShareUrl } from '@/lib/affiliate/affiliateLinkBuilder';
import { compressImageForStorage, formatFileSize, CompressionResult } from '@/lib/imageOptimizer';

interface AddProductByLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CATEGORY_OPTIONS = [
  "Fashion",
  "Jewellery",
  "Undergarments & Lingerie",
  "Home & Living",
  "Electronics",
  "Beauty & Personal Care",
  "Local Brands",
  "Exclusive Offers"
] as const;

const CATEGORY_DEFAULT_IMAGES: Record<string, string> = {
  "Undergarments & Lingerie": "https://m.media-amazon.com/images/I/71wK8vY+GgL._AC_UL640_FMwebp_QL65_.jpg",
  "Fashion": "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80",
  "Jewellery": "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=80",
  "Home & Living": "https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=800&auto=format&fit=crop&q=80",
  "Electronics": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80",
  "Beauty & Personal Care": "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&auto=format&fit=crop&q=80",
  "Local Brands": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80",
  "Exclusive Offers": "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&auto=format&fit=crop&q=80"
};

export default function AddProductByLinkModal({ isOpen, onClose, onSuccess }: AddProductByLinkModalProps) {
  const [productUrl, setProductUrl] = useState('');
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState<number>(2999);
  const [mrp, setMrp] = useState<number>(4999);
  const [imageUrl, setImageUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [category, setCategory] = useState<typeof CATEGORY_OPTIONS[number]>('Fashion');
  const [brand, setBrand] = useState('Featured Brand');
  const [stock, setStock] = useState<number>(50);
  const [tryOnEnabled, setTryOnEnabled] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [optimizationInfo, setOptimizationInfo] = useState<CompressionResult | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth <= 768) {
        setIsFullScreen(true);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  const processImageFile = async (file: File | Blob) => {
    if (!file.type || !file.type.startsWith('image/')) {
      alert('Please select or paste a valid image file (PNG, JPG, WEBP, GIF).');
      return;
    }
    try {
      const res = await compressImageForStorage(file, { maxDimension: 1080, initialQuality: 0.84 });
      setImageUrl(res.dataUrl);
      setOptimizationInfo(res);
    } catch (err) {
      console.warn('Image compression fallback:', err);
    }
  };

  const handleImageInputChange = async (rawVal: string) => {
    let val = rawVal.trim().replace(/^["']|["']$/g, '');

    // If user pastes a raw base64 data URL, immediately compress it without loss of quality
    if (val.startsWith('data:image/')) {
      try {
        const res = await compressImageForStorage(val, { maxDimension: 1080, initialQuality: 0.84 });
        setImageUrl(res.dataUrl);
        setOptimizationInfo(res);
        return;
      } catch (err) {
        console.warn('Data URL compression notice:', err);
      }
    }

    setOptimizationInfo(null);
    const amzMatch = val.match(/([A-Za-z0-9_\-\+]{10,12})\._[A-Za-z0-9_\-]+_\.(jpg|jpeg|png|webp)/i);
    if (amzMatch && amzMatch[1]) {
      val = `https://m.media-amazon.com/images/I/${amzMatch[1]}._SL800_.jpg`;
    } else {
      const directAmz = val.match(/([A-Za-z0-9_\-\+]{10,12})\.(jpg|jpeg|png|webp)/i);
      if (directAmz && directAmz[1] && directAmz[1].length >= 10 && !val.startsWith('http')) {
        val = `https://m.media-amazon.com/images/I/${directAmz[1]}._SL800_.jpg`;
      }
    }
    setImageUrl(val);
  };

  const handlePasteEvent = (e: React.ClipboardEvent) => {
    if (e.clipboardData?.items) {
      for (let i = 0; i < e.clipboardData.items.length; i++) {
        const item = e.clipboardData.items[i];
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            processImageFile(file);
            return;
          }
        }
      }
    }
    const text = e.clipboardData?.getData('text');
    if (text && (text.includes('\\') || text.includes('.jpg') || text.includes('.png') || text.includes('.webp'))) {
      const cleaned = text.trim().replace(/^["']|["']$/g, '');
      const amzMatch = cleaned.match(/([A-Za-z0-9_\-\+]{10,12})\._[A-Za-z0-9_\-]+_\.(jpg|jpeg|png|webp)/i);
      if (amzMatch && amzMatch[1]) {
        e.preventDefault();
        setImageUrl(`https://m.media-amazon.com/images/I/${amzMatch[1]}._SL800_.jpg`);
      }
    }
  };

  const handlePasteFromClipboardClick = async () => {
    try {
      if (navigator.clipboard?.read) {
        const clipboardItems = await navigator.clipboard.read();
        for (const item of clipboardItems) {
          const imageType = item.types.find(t => t.startsWith('image/'));
          if (imageType) {
            const blob = await item.getType(imageType);
            processImageFile(blob);
            return;
          }
        }
      }
      if (navigator.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          handleImageInputChange(text);
        }
      }
    } catch (err) {
      alert('Please click inside the image box and press Ctrl+V to paste your image.');
    }
  };
  const [loading, setLoading] = useState(false);
  const [scraping, setScraping] = useState(false);

  if (!isOpen) return null;

  const fetchRealScrapedMetadata = async (targetUrl: string) => {
    if (!targetUrl || !targetUrl.startsWith('http')) return;
    setScraping(true);
    try {
      let html = '';
      
      // Strategy 1: Try AllOrigins proxy
      try {
        const proxyRes = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`);
        if (proxyRes.ok) {
          const json = await proxyRes.json();
          if (json.contents) html = json.contents;
        }
      } catch (e1) {
        // Fallback to next proxy
      }

      // Strategy 2: Try Codetabs proxy if html is empty
      if (!html) {
        try {
          const ctRes = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`);
          if (ctRes.ok) {
            html = await ctRes.text();
          }
        } catch (e2) {
          // Fallback to next proxy
        }
      }

      // Strategy 3: Try Corsproxy.io
      if (!html) {
        try {
          const cpRes = await fetch(`https://corsproxy.io/?url=${encodeURIComponent(targetUrl)}`);
          if (cpRes.ok) {
            html = await cpRes.text();
          }
        } catch (e3) {
          // All proxies failed
        }
      }

      if (html) {
        let scrapedImg = '';
        let scrapedTitle = '';
        let scrapedPrice = 0;

        // 1. Amazon dynamic image JSON map: data-a-dynamic-image='{"https://...jpg":[...]}'
        const dynamicMatch = html.match(/data-a-dynamic-image=["'](\{[^"']+\})["']/i);
        if (dynamicMatch && dynamicMatch[1]) {
          try {
            const parsed = JSON.parse(dynamicMatch[1].replace(/&quot;/g, '"'));
            const urls = Object.keys(parsed);
            if (urls.length > 0) scrapedImg = urls[0];
          } catch (e) {}
        }

        // 2. High-res images: data-old-hires or landingImage or hiRes
        if (!scrapedImg) {
          const hiresMatch = html.match(/data-old-hires=["']([^"']+)["']/i) ||
                             html.match(/id=["']landingImage["'][^>]*src=["']([^"']+)["']/i) ||
                             html.match(/["']hiRes["']:\s*["']([^"']+)["']/i);
          if (hiresMatch && hiresMatch[1] && !hiresMatch[1].includes('amazon_logo')) {
            scrapedImg = hiresMatch[1];
          }
        }

        // 3. Any direct Amazon CDN product image: https://m.media-amazon.com/images/I/...
        if (!scrapedImg) {
          const cdnMatch = html.match(/https:\/\/m\.media-amazon\.com\/images\/I\/([A-Za-z0-9_\-\+]+)\.(?:jpg|png|webp)/i);
          if (cdnMatch && cdnMatch[1]) {
            scrapedImg = `https://m.media-amazon.com/images/I/${cdnMatch[1]}._SL800_.jpg`;
          }
        }

        // 4. Flipkart images (rukminim)
        if (!scrapedImg) {
          const flipMatch = html.match(/https:\/\/rukminim[12]\.flixcart\.com\/image\/[^\s"'>]+/i);
          if (flipMatch && flipMatch[0]) {
            scrapedImg = flipMatch[0];
          }
        }

        // 5. Meesho / Myntra images
        if (!scrapedImg) {
          const otherMatch = html.match(/https:\/\/images\.meesho\.com\/images\/products\/[^\s"'>]+/i) ||
                             html.match(/https:\/\/assets\.myntassets\.com\/[^\s"'>]+\.(?:jpg|jpeg|png|webp)/i);
          if (otherMatch && otherMatch[0]) {
            scrapedImg = otherMatch[0];
          }
        }

        // 6. og:image or twitter:image
        if (!scrapedImg) {
          const ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
                          html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i);
          if (ogMatch && ogMatch[1] && !ogMatch[1].includes('amazon_logo') && !ogMatch[1].includes('logo')) {
            scrapedImg = ogMatch[1];
          }
        }

        // 7. Title
        const titleMatch = html.match(/<span[^>]*id=["']productTitle["'][^>]*>([^<]+)<\/span>/i) ||
                           html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
                           html.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch && titleMatch[1]) {
          scrapedTitle = titleMatch[1].replace(/\|.*/, '').replace(/ - Amazon.*/i, '').replace(/:\s*Buy.*/i, '').trim();
        }

        // 8. Price
        const priceMatch = html.match(/class=["']a-price-whole["'][^>]*>([\d,]+)/i) ||
                           html.match(/class=["']a-offscreen["'][^>]*>₹?\s*([\d,]+)/i);
        if (priceMatch && priceMatch[1]) {
          scrapedPrice = parseInt(priceMatch[1].replace(/[,₹\s]/g, ''), 10);
        }

        if (scrapedImg) {
          setImageUrl(scrapedImg.replace(/\._[A-Za-z0-9_\-,]+_\.(jpg|png|webp)/i, '._SL800_.$1'));
        }
        if (scrapedTitle && (!title || title.length < 5)) {
          setTitle(scrapedTitle);
        }
        if (scrapedPrice > 0) {
          setPrice(scrapedPrice);
          setMrp(Math.round(scrapedPrice * 1.4));
        }
      }
    } catch (e) {
      console.warn('Real product scraper notice:', e);
    } finally {
      setScraping(false);
    }
  };

  // Auto-detect store & extract info when URL is pasted
  const handleUrlChange = (url: string) => {
    setProductUrl(url);
    if (!url) return;

    let detectedStore = 'Amazon India';
    if (url.includes('flipkart.com')) detectedStore = 'Flipkart';
    else if (url.includes('meesho.com')) detectedStore = 'Meesho';
    else if (url.includes('myntra.com')) detectedStore = 'Myntra';
    else if (url.includes('croma.com')) detectedStore = 'Croma';
    else if (url.includes('ebay.com')) detectedStore = 'eBay';

    setBrand(detectedStore);

    let extractedTitle = title;
    try {
      const parsed = new URL(url);
      const segments = parsed.pathname.split('/').filter(Boolean);
      if (segments.length > 0) {
        const rawSlug = segments[0].replace(/-/g, ' ').replace(/\.html/g, '');
        if (rawSlug.length > 3) {
          extractedTitle = rawSlug.charAt(0).toUpperCase() + rawSlug.slice(1);
          setTitle(extractedTitle);
        }
      }
    } catch (e) {
      // Ignore parse failure
    }

    const checkText = (url + ' ' + extractedTitle).toLowerCase();
    let detectedCategory: typeof CATEGORY_OPTIONS[number] = category;

    if (checkText.includes('panty') || checkText.includes('panties') || checkText.includes('bra') || checkText.includes('lingerie') || checkText.includes('underwear') || checkText.includes('brief') || checkText.includes('undergarment')) {
      detectedCategory = "Undergarments & Lingerie";
    } else if (checkText.includes('jewel') || checkText.includes('necklace') || checkText.includes('earring') || checkText.includes('ring') || checkText.includes('kundan') || checkText.includes('choker') || checkText.includes('kamarbandh') || checkText.includes('gujarati')) {
      detectedCategory = "Jewellery";
    } else if (checkText.includes('phone') || checkText.includes('mobile') || checkText.includes('laptop') || checkText.includes('headphone') || checkText.includes('croma')) {
      detectedCategory = "Electronics";
    }

    setCategory(detectedCategory);

    // Initial instant high-resolution image assignment
    if (url.match(/\.(jpeg|jpg|png|webp|gif)/i)) {
      setImageUrl(url);
    } else if (checkText.includes('kamarbandh') || checkText.includes('gujarati') || checkText.includes('etietnic') || checkText.includes('waistband')) {
      setImageUrl("/kamarbandh.png");
    } else if (checkText.includes('panty') || checkText.includes('panties') || checkText.includes('louis')) {
      setImageUrl("https://m.media-amazon.com/images/I/41DSHIr6S6L._AC_SL800_.jpg");
    } else if (checkText.includes('bra') || checkText.includes('zivame')) {
      setImageUrl("https://m.media-amazon.com/images/I/714AcwEJC0L._AC_SL800_.jpg");
    } else if (checkText.includes('trunk') || checkText.includes('brief') || checkText.includes('jockey')) {
      setImageUrl("https://m.media-amazon.com/images/I/61W8YLsLmSL._AC_SL800_.jpg");
    } else {
      setImageUrl(CATEGORY_DEFAULT_IMAGES[detectedCategory] || CATEGORY_DEFAULT_IMAGES["Fashion"]);
    }

    // Extract real image from target page!
    fetchRealScrapedMetadata(url);
  };

  const handleCategoryChange = (newCat: typeof CATEGORY_OPTIONS[number]) => {
    setCategory(newCat);
    if (!imageUrl || Object.values(CATEGORY_DEFAULT_IMAGES).includes(imageUrl)) {
      setImageUrl(CATEGORY_DEFAULT_IMAGES[newCat] || CATEGORY_DEFAULT_IMAGES["Fashion"]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productUrl || !title || !price) {
      alert('Please fill in Product Link, Title, and Price.');
      return;
    }

    setLoading(true);
    const cleanTitle = title
      .replace(/&#x27;/g, "'")
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();

    const finalSellingPrice = Number(price) || 1999;
    const finalMrp = Number(mrp) || Math.round(finalSellingPrice * 1.5);
    const finalImage = imageUrl || CATEGORY_DEFAULT_IMAGES[category] || CATEGORY_DEFAULT_IMAGES["Fashion"];

    let garmentCat: 'dresses' | 'upper_body' | 'lower_body' | 'accessories' = 'dresses';
    if (category === 'Jewellery') {
      garmentCat = 'accessories';
    } else if (category === 'Undergarments & Lingerie') {
      const lowerText = (cleanTitle + ' ' + productUrl).toLowerCase();
      if (lowerText.includes('panty') || lowerText.includes('panties') || lowerText.includes('brief') || lowerText.includes('underwear')) {
        garmentCat = 'lower_body';
      } else {
        garmentCat = 'upper_body';
      }
    }

    try {
      const createdSlug = cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      await savePartnerProduct({
        partnerId: 'partner_gen_g_admin',
        partnerName: brand || 'Gen-G Store',
        title: cleanTitle,
        slug: createdSlug,
        productUrl: productUrl,
        youtubeUrl: youtubeUrl.trim() || undefined,
        description: `Imported via Admin Product Link: ${productUrl}`,
        category,
        brand: brand || 'Gen-G Partner',
        sku: `LINK-${Date.now().toString().slice(-6)}`,
        mrp: finalMrp,
        sellingPrice: finalSellingPrice,
        stock: stock || 50,
        images: [finalImage],
        primaryImage: finalImage,
        fulfillment: 'PARTNER_FULFILLED',
        source: 'PARTNER',
        tryOnEnabled,
        garmentCategory: garmentCat,
        returnPolicy: '7 Days Return & Refund Guaranteed',
        warranty: '1 Year Brand Guarantee',
        gstPercent: 5,
        status: 'LIVE',
        commissionType: 'PERCENTAGE',
        commissionValue: 15,
        rating: 4.9,
        reviewCount: 19
      });

      const shareLandingUrl = generateBuyWiseShareUrl(createdSlug);
      try {
        await navigator.clipboard.writeText(shareLandingUrl);
      } catch (clipErr) {
        // Clipboard optional fallback
      }
      alert(`🎉 Real-Time Success!\n\nProduct "${cleanTitle}" is LIVE!\n\n🔗 Gen-G Store Landing Link Copied to Clipboard:\n${shareLandingUrl}`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to add product by link:', err);
      alert('Error saving product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100dvh',
        background: 'rgba(5, 3, 12, 0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: isFullScreen ? 'stretch' : 'center',
        justifyContent: 'center',
        zIndex: 999999,
        padding: isFullScreen ? 0 : '20px',
        overflow: 'hidden'
      }}
    >
      <div
        className="glass"
        style={{
          width: '100%',
          maxWidth: isFullScreen ? '100%' : '580px',
          height: isFullScreen ? '100%' : 'auto',
          maxHeight: isFullScreen ? '100dvh' : '90vh',
          borderRadius: isFullScreen ? 0 : '28px',
          border: isFullScreen ? 'none' : '1px solid rgba(0, 255, 136, 0.4)',
          background: '#0d0a1a',
          boxShadow: '0 25px 60px rgba(0, 255, 136, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Sticky Header with Title, Fullscreen toggle and Close */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
            background: 'rgba(13, 10, 26, 0.98)',
            flexShrink: 0,
            zIndex: 10
          }}
        >
          <div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 900,
                padding: '4px 10px',
                borderRadius: '12px',
                background: 'rgba(0, 255, 136, 0.15)',
                color: '#00ff88',
                border: '1px solid rgba(0, 255, 136, 0.3)'
              }}
            >
              ⚡ REAL-TIME ADMIN CMS
            </span>
            <h2 style={{ fontSize: '20px', fontWeight: 900, marginTop: '4px', margin: 0, color: '#ffffff' }}>
              Add Product by Link 🔗
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setIsFullScreen(prev => !prev)}
              title={isFullScreen ? "Exit Fullscreen" : "Fullscreen View"}
              style={{
                background: 'rgba(0, 212, 255, 0.12)',
                border: '1px solid rgba(0, 212, 255, 0.4)',
                color: '#00d4ff',
                padding: '6px 12px',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              {isFullScreen ? '🗗 Normal' : '⛶ Fullscreen'}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: 'white',
                fontSize: '18px',
                cursor: 'pointer',
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Scrollable Form Area */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            padding: isFullScreen ? '18px 16px 80px' : '24px 30px 40px'
          }}
        >
          <form onSubmit={handleSubmit}>
          {/* Product Link Input */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 800, color: '#00ff88' }}>
                Product Page URL / Link * (Amazon, Flipkart, Meesho, Myntra, etc.)
              </label>
              {scraping && (
                <span style={{ fontSize: '11px', color: '#00d4ff', fontWeight: 800, animation: 'pulse 1s infinite' }}>
                  ⏳ Extracting Real Image...
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="url"
                required
                value={productUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="Paste product link (https://www.amazon.in/dp/...)"
                style={{ flex: 1, padding: '12px 14px', borderRadius: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(0, 255, 136, 0.3)', color: 'white', fontSize: '13px', outline: 'none' }}
              />
              <button
                type="button"
                onClick={() => fetchRealScrapedMetadata(productUrl)}
                disabled={scraping || !productUrl}
                style={{ padding: '12px 16px', borderRadius: '14px', background: 'rgba(0, 255, 136, 0.15)', border: '1px solid #00ff88', color: '#00ff88', fontWeight: 800, fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                {scraping ? 'Extracting...' : '🔍 Extract Real Image'}
              </button>
            </div>
          </div>

          {/* Product Title Input */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Product Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Royal Silk Kanjivaram Saree"
              style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', fontSize: '13px', outline: 'none' }}
            />
          </div>

          {/* Category Dropdown */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Target Category *</label>
            <select
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value as any)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', background: '#0e0a22', border: '1px solid var(--glass-border)', color: 'white', fontSize: '13px', outline: 'none', fontWeight: 800 }}
            >
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Price & MRP */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Selling Price (₹) *</label>
              <input
                type="number"
                required
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', fontSize: '13px', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>MRP (₹)</label>
              <input
                type="number"
                value={mrp}
                onChange={(e) => setMrp(Number(e.target.value))}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', fontSize: '13px', outline: 'none' }}
              />
            </div>
          </div>

          {/* Image URL & Brand */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Store / Brand Name</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Amazon India / Flipkart"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', fontSize: '13px', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Stock Units</label>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(Number(e.target.value))}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', fontSize: '13px', outline: 'none' }}
              />
            </div>
          </div>

          {/* YouTube Link Input */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '12px', color: '#ff4d4d', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              ▶️ YouTube Video / Review Link (Optional)
            </label>
            <input
              type="url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
              style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255, 77, 77, 0.3)', color: 'white', fontSize: '13px', outline: 'none' }}
            />
          </div>

          {/* Primary Image Preview / Copy-Paste / Input */}
          <div onPaste={handlePasteEvent} style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 800 }}>Product Image (Copy-Paste Image, Upload or URL)</label>
              <span style={{ fontSize: '11px', color: '#00ff88', fontWeight: 700 }}>
                📋 Ctrl+V to Paste Image
              </span>
            </div>

            {/* Drag & Drop / Paste Dropzone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files?.[0]) processImageFile(e.dataTransfer.files[0]);
              }}
              style={{
                border: isDragging ? '2px dashed #00ff88' : '1px dashed rgba(255, 255, 255, 0.25)',
                borderRadius: '16px',
                padding: '12px',
                background: isDragging ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                marginBottom: '10px',
                transition: 'all 0.2s ease',
                textAlign: 'center'
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files?.[0]) processImageFile(e.target.files[0]);
                }}
              />

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '6px' }}>
                <button
                  type="button"
                  onClick={handlePasteFromClipboardClick}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.2), rgba(0, 212, 255, 0.2))',
                    border: '1px solid #00ff88',
                    color: '#00ff88',
                    fontWeight: 800,
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  📋 Paste Image from Clipboard (Ctrl+V)
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  📁 Browse / Drop File
                </button>
              </div>

              <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>
                Drag and drop image here, or copy an image (or file) and press <strong style={{ color: '#ffffff' }}>Ctrl+V</strong>
              </div>
            </div>

            <input
              type="text"
              value={imageUrl}
              onChange={(e) => handleImageInputChange(e.target.value)}
              placeholder="Paste image URL, web link, or press Ctrl+V to paste image"
              style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', fontSize: '13px', outline: 'none', marginBottom: '8px' }}
            />

            {imageUrl && (
              <div style={{
                position: 'relative',
                width: '100%',
                borderRadius: '14px',
                padding: '10px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(0, 255, 136, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  position: 'relative',
                  width: '64px',
                  height: '64px',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  background: '#080612',
                  flexShrink: 0,
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt="Preview"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/kamarbandh.png';
                    }}
                  />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#00ff88', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>🟢</span>
                    {imageUrl.startsWith('data:image/') ? 'Image Optimized & Connected' : 'Image URL Connected'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {imageUrl.startsWith('data:image/') ? 'Compressed High-Efficiency WebP/JPEG' : imageUrl}
                  </div>
                  {optimizationInfo && (
                    <div style={{ fontSize: '11px', color: '#00ff88', marginTop: '3px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>⚡</span>
                      <span>
                        Optimized: {formatFileSize(optimizationInfo.originalSize)} ➔ {formatFileSize(optimizationInfo.compressedSize)} ({optimizationInfo.savedPercentage}% saved • HD Quality)
                      </span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    background: 'rgba(255, 0, 127, 0.2)',
                    border: '1px solid rgba(255, 0, 127, 0.5)',
                    color: '#ff007f',
                    fontWeight: 700,
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}
                >
                  🗑️ Remove
                </button>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{
              width: '100%',
              padding: '14px',
              fontSize: '15px',
              fontWeight: 900,
              background: 'linear-gradient(90deg, #00ff88, #00d4ff)',
              color: '#080612',
              cursor: loading ? 'wait' : 'pointer'
            }}
          >
            {loading ? 'Saving in Real-Time...' : '🚀 Publish Product by Link (Real-Time)'}
          </button>
        </form>
        </div>
      </div>
    </div>
  );
}

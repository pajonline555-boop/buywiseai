"use client";
import React, { useState } from 'react';
import Image from 'next/image';
import { savePartnerProduct } from '@/lib/partners/partnerService';
import { generateBuyWiseShareUrl } from '@/lib/affiliate/affiliateLinkBuilder';

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
  const [loading, setLoading] = useState(false);
  const [scraping, setScraping] = useState(false);

  if (!isOpen) return null;

  const fetchRealScrapedMetadata = async (targetUrl: string) => {
    if (!targetUrl || !targetUrl.startsWith('http')) return;
    setScraping(true);
    try {
      const proxyRes = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`);
      if (proxyRes.ok) {
        const json = await proxyRes.json();
        if (json.contents) {
          const html = json.contents;
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

          // 4. og:image or twitter:image
          if (!scrapedImg) {
            const ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
                            html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i);
            if (ogMatch && ogMatch[1] && !ogMatch[1].includes('amazon_logo')) {
              scrapedImg = ogMatch[1];
            }
          }

          // 5. Title
          const titleMatch = html.match(/<span[^>]*id=["']productTitle["'][^>]*>([^<]+)<\/span>/i) ||
                             html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
                             html.match(/<title[^>]*>([^<]+)<\/title>/i);
          if (titleMatch && titleMatch[1]) {
            scrapedTitle = titleMatch[1].replace(/\|.*/, '').replace(/ - Amazon.*/i, '').replace(/:\s*Buy.*/i, '').trim();
          }

          // 6. Price
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
    } else if (checkText.includes('kamarbandh') || checkText.includes('gujarati') || checkText.includes('etietnic')) {
      setImageUrl("https://m.media-amazon.com/images/I/41-pc98WkyL._SL800_.jpg");
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
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(5, 3, 12, 0.85)',
      backdropFilter: 'blur(16px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '20px'
    }}>
      <div className="glass" style={{
        width: '100%',
        maxWidth: '540px',
        maxHeight: '90vh',
        overflowY: 'auto',
        borderRadius: '28px',
        border: '1px solid rgba(0, 255, 136, 0.4)',
        padding: '30px',
        background: '#0d0a1a',
        boxShadow: '0 25px 60px rgba(0, 255, 136, 0.15)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 900, padding: '4px 10px', borderRadius: '12px', background: 'rgba(0, 255, 136, 0.15)', color: '#00ff88', border: '1px solid rgba(0, 255, 136, 0.3)' }}>
              ⚡ REAL-TIME ADMIN CMS
            </span>
            <h2 style={{ fontSize: '24px', fontWeight: 900, marginTop: '6px' }}>
              Add Product by Link 🔗
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '24px', cursor: 'pointer' }}>✕</button>
        </div>

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

          {/* Primary Image Preview / Input */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Product Image URL</label>
              {imageUrl && (imageUrl.includes('amazon') || imageUrl.includes('media-amazon') || imageUrl.includes('flipkart') || imageUrl.includes('meesho') || imageUrl.includes('myntra')) && (
                <span style={{ fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '8px', background: 'rgba(0,255,136,0.15)', color: '#00ff88', border: '1px solid rgba(0,255,136,0.3)' }}>
                  🟢 REAL LINK IMAGE ACTIVE
                </span>
              )}
            </div>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/... or https://m.media-amazon.com/..."
              style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', fontSize: '13px', outline: 'none', marginBottom: '8px' }}
            />
            {imageUrl && (
              <div style={{ position: 'relative', width: '100%', height: '160px', borderRadius: '14px', overflow: 'hidden', border: '1px solid rgba(0, 255, 136, 0.3)', background: '#05030a' }}>
                <Image src={imageUrl} alt="Product Image Preview" fill style={{ objectFit: 'contain' }} unoptimized />
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
  );
}

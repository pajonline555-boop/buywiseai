"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { getProductionProducts, BestsellerProduct } from '@/lib/categoryData';
import { getPartnerProducts, mapPartnerProductToBestsellerProduct } from '@/lib/partners/partnerService';

export default function BuyWiseStorePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [products, setProducts] = useState<BestsellerProduct[]>(getProductionProducts());

  useEffect(() => {
    getPartnerProducts().then((partnerProds) => {
      const activePartnerItems = partnerProds
        .filter(p => p.status === 'LIVE' || (p.status as any) === 'ACTIVE')
        .map(mapPartnerProductToBestsellerProduct)
        .filter(p => p.environment !== 'TEST');

      const existingIds = new Set(activePartnerItems.map(p => p.id));
      const staticProduction = getProductionProducts().filter(p => !existingIds.has(p.id));
      
      setProducts([...activePartnerItems, ...staticProduction]);
    });
  }, []);

  const filteredProducts = selectedCategory === 'ALL'
    ? products
    : products.filter(p => p.category.toLowerCase().includes(selectedCategory.toLowerCase()));

  return (
    <main style={{ paddingTop: '30px', paddingBottom: '60px' }}>
      <div className="container">
        
        {/* Storefront Hero Header */}
        <section 
          className="glass"
          style={{
            width: '100%',
            borderRadius: '28px',
            padding: '36px',
            marginBottom: '32px',
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(255, 0, 127, 0.2))',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            textAlign: 'center'
          }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '20px', marginBottom: '14px' }}>
            <span style={{ fontSize: '13px', fontWeight: 900, color: 'var(--primary)' }}>🛍️ BUYWISE STORE</span>
            <span style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 700 }}>Direct Partner Fulfillment &amp; Verified Deals</span>
          </div>

          <h1 style={{ fontSize: '42px', fontWeight: 900, color: '#ffffff', marginBottom: '12px' }}>
            Shop Smart. Buy Better.
          </h1>
          <p style={{ fontSize: '16px', color: '#cbd5e1', maxWidth: '640px', margin: '0 auto 24px', lineHeight: 1.6 }}>
            Browse curated products with AI Smart Value Scores, Verified Coupons, and 1-Tap 3D Virtual Try-On integration.
          </p>

          {/* Category Filter Pills */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {['ALL', 'Fashion', 'Mobiles', 'Gifts', 'Beauty', 'Laptops', 'Audio'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '14px',
                  background: selectedCategory === cat ? 'var(--gradient-accent)' : 'rgba(255, 255, 255, 0.08)',
                  border: selectedCategory === cat ? 'none' : '1px solid rgba(255, 255, 255, 0.18)',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                {cat === 'ALL' ? '📦 All Items' : cat}
              </button>
            ))}
          </div>
        </section>

        {/* Merchandising Collections Bar */}
        <section 
          className="glass"
          style={{
            borderRadius: '24px',
            padding: '20px 24px',
            marginBottom: '32px',
            background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.08), rgba(121, 40, 202, 0.08))',
            border: '1px solid rgba(255, 215, 0, 0.25)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '11px', fontWeight: 900, color: '#ffd700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              ⭐ CURATED MERCHANDISING COLLECTIONS
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
            {[
              { name: 'BuyWise Select', slug: 'select', badge: '⭐ PRIMARY' },
              { name: 'Red Carpet Edit', slug: 'red-carpet', badge: '✨ OCCASION' },
              { name: 'Executive Edit', slug: 'executive', badge: '👔 WORK' },
              { name: 'Signature Collection', slug: 'signature', badge: '🏆 QUALITY' },
              { name: 'Luxe Fashion', slug: 'luxe', badge: '👗 ELEGANT' },
              { name: 'Wedding & Occasion', slug: 'wedding-occasion', badge: '💒 FESTIVE' },
              { name: 'Elite Home', slug: 'elite-home', badge: '🏡 LIVING' },
              { name: 'Premium Tech', slug: 'premium-tech', badge: '📱 FLAGSHIP' },
              { name: 'Gifts & Prestige', slug: 'gifts-prestige', badge: '🎁 GIFTS' },
            ].map(col => (
              <Link key={col.slug} href={`/store/${col.slug}`} style={{ textDecoration: 'none' }}>
                <div 
                  style={{
                    padding: '10px 16px',
                    borderRadius: '14px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 215, 0, 0.3)',
                    color: 'white',
                    fontWeight: 800,
                    fontSize: '13px',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span>{col.name}</span>
                  <span style={{ fontSize: '10px', fontWeight: 900, padding: '2px 6px', borderRadius: '6px', background: 'rgba(255, 215, 0, 0.2)', color: '#ffd700' }}>
                    {col.badge}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Product Grid */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
          {filteredProducts.map((product) => {
            const slug = product.slug || product.id;
            const isPartner = product.productSource === 'PARTNER' || product.source === 'PARTNER';

            return (
              <div 
                key={product.id}
                className="glass animate-fade-in"
                style={{
                  borderRadius: '24px',
                  padding: '16px',
                  background: 'rgba(18, 14, 36, 0.95)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s ease'
                }}
              >
                <div>
                  {/* Image Container */}
                  <div style={{ position: 'relative', width: '100%', height: '220px', borderRadius: '18px', overflow: 'hidden', marginBottom: '14px' }}>
                    <Image src={product.image} alt={product.name} fill unoptimized style={{ objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', top: '10px', left: '10px' }}>
                      {isPartner ? (
                        <span style={{ fontSize: '10px', fontWeight: 900, padding: '4px 10px', borderRadius: '10px', background: 'linear-gradient(135deg, #a855f7, #ff007f)', color: '#ffffff' }}>
                          🛍️ BUYWISE STORE
                        </span>
                      ) : (
                        <span style={{ fontSize: '10px', fontWeight: 900, padding: '4px 10px', borderRadius: '10px', background: 'rgba(0,0,0,0.8)', color: '#00ff88' }}>
                          🛒 {product.bestStore.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '4px' }}>
                    {product.category}
                  </div>

                  <Link href={`/product/${slug}`} style={{ textDecoration: 'none' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', marginBottom: '8px', lineHeight: 1.4, height: '44px', overflow: 'hidden' }}>
                      {product.name}
                    </h3>
                  </Link>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '14px' }}>
                    <span style={{ fontSize: '20px', fontWeight: 900, color: '#ffffff' }}>₹{product.lowestPrice.toLocaleString()}</span>
                    {product.originalPrice > product.lowestPrice && (
                      <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.4)', textDecoration: 'line-through' }}>
                        ₹{product.originalPrice.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <Link href={`/product/${slug}`} style={{ flex: 1, textDecoration: 'none' }}>
                    <button style={{ width: '100%', padding: '10px', borderRadius: '14px', background: 'var(--gradient-accent)', border: 'none', color: '#ffffff', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}>
                      INTELLIGENCE PAGE
                    </button>
                  </Link>

                  <Link href="/try-on" style={{ textDecoration: 'none' }}>
                    <button style={{ padding: '10px 14px', borderRadius: '14px', background: 'rgba(0, 212, 255, 0.15)', border: '1px solid #00d4ff', color: '#00d4ff', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}>
                      ✨ TRY ON
                    </button>
                  </Link>
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </main>
  );
}

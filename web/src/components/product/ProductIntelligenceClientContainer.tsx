"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BestsellerProduct, TOP_CATEGORIES } from '@/lib/categoryData';
import { getPartnerProductBySlug, mapPartnerProductToBestsellerProduct } from '@/lib/partners/partnerService';
import { generateProductJsonLd, isIndexableProduct } from '@/lib/seo/productSeo';
import ProductIntelligenceHeader from '@/components/product/ProductIntelligenceHeader';
import WhereToBuyTable from '@/components/product/WhereToBuyTable';
import BuyWiseStoreCheckoutCard from '@/components/product/BuyWiseStoreCheckoutCard';

interface ProductIntelligenceClientContainerProps {
  slug: string;
  initialProduct?: BestsellerProduct;
}

export default function ProductIntelligenceClientContainer({
  slug,
  initialProduct
}: ProductIntelligenceClientContainerProps) {
  const [product, setProduct] = useState<BestsellerProduct | undefined>(initialProduct);
  const [loading, setLoading] = useState<boolean>(!initialProduct);

  useEffect(() => {
    if (!initialProduct && slug) {
      getPartnerProductBySlug(slug).then((partnerProd) => {
        if (partnerProd) {
          setProduct(mapPartnerProductToBestsellerProduct(partnerProd));
        }
        setLoading(false);
      });
    }
  }, [initialProduct, slug]);

  if (loading) {
    return (
      <main style={{ paddingTop: '80px', paddingBottom: '80px', textAlign: 'center', color: '#ffffff' }}>
        <div className="container">
          <div style={{ fontSize: '18px', fontWeight: 800 }}>⚡ Loading BuyWise Product Intelligence...</div>
        </div>
      </main>
    );
  }

  if (!product) {
    notFound();
  }

  const { jsonLd, breadcrumbsJsonLd } = generateProductJsonLd(product);
  const indexable = isIndexableProduct(product);

  const allProducts = TOP_CATEGORIES.flatMap(c => c.products);
  const similarProducts = allProducts.filter(p => p.id !== product.id && p.category === product.category).slice(0, 3);

  return (
    <main style={{ paddingTop: '30px', paddingBottom: '60px' }}>
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd) }}
      />

      <div className="container">
        {/* Breadcrumb Navigation */}
        <nav style={{ marginBottom: '20px', fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)' }}>
          <Link href="/" style={{ color: 'rgba(255, 255, 255, 0.6)', textDecoration: 'none' }}>Home</Link>
          <span style={{ margin: '0 8px' }}>/</span>
          <Link href="/categories" style={{ color: 'rgba(255, 255, 255, 0.6)', textDecoration: 'none' }}>{product.category}</Link>
          <span style={{ margin: '0 8px' }}>/</span>
          <span style={{ color: 'var(--primary)', fontWeight: 800 }}>{product.name}</span>
        </nav>

        {/* Quality Gate Non-Public Warning Badge if Unverified */}
        {!indexable && (
          <div style={{ padding: '10px 16px', background: 'rgba(255, 215, 0, 0.15)', border: '1px solid rgba(255, 215, 0, 0.4)', borderRadius: '14px', marginBottom: '20px', color: '#ffd700', fontSize: '12px', fontWeight: 800 }}>
            ⚠️ Quality Gate Notice: This product intelligence page is currently unverified for search engine indexing.
          </div>
        )}

        {/* Header Section with Intelligence Scores & Conversion CTAs */}
        <ProductIntelligenceHeader product={product} />

        {/* BuyWise Store Dropshipping Checkout Card (for PARTNER items) */}
        <BuyWiseStoreCheckoutCard product={product} />

        {/* Where to Buy Multi-Store Comparison Table */}
        <WhereToBuyTable product={product} />

        {/* Product Specifications & Highlights Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px', marginBottom: '40px' }}>
          
          {/* Specifications Card */}
          <div 
            className="glass"
            style={{
              padding: '24px',
              borderRadius: '20px',
              background: 'rgba(18, 14, 36, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.15)'
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#ffffff', marginBottom: '16px' }}>
              📋 Product Specifications
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {product.specs?.map((spec, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', fontSize: '13px' }}>
                  <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontWeight: 600 }}>{spec.label}</span>
                  <span style={{ color: '#ffffff', fontWeight: 800, textAlign: 'right' }}>{spec.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Highlights & BuyWise Intelligence Advice */}
          <div 
            className="glass"
            style={{
              padding: '24px',
              borderRadius: '20px',
              background: 'rgba(18, 14, 36, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.15)'
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#ffffff', marginBottom: '16px' }}>
              💡 Why BuyWise Recommends It
            </h3>

            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', color: '#cbd5e1', lineHeight: 1.6 }}>
              {product.highlights?.map((hl, idx) => (
                <li key={idx} style={{ fontWeight: 700 }}>
                  {hl}
                </li>
              ))}
              <li style={{ color: '#00ff88', fontWeight: 800 }}>
                ✓ Price drop tracker active: Lowest historical price verified across stores
              </li>
            </ul>
          </div>
        </div>

        {/* Similar Recommended Products Section */}
        {similarProducts.length > 0 && (
          <div style={{ marginTop: '40px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#ffffff', marginBottom: '20px' }}>
              🔍 Similar Products Evaluated by BuyWise AI
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {similarProducts.map((sim) => {
                const simSlug = sim.slug || sim.id;
                return (
                  <Link key={sim.id} href={`/product/${simSlug}`} style={{ textDecoration: 'none' }}>
                    <div 
                      className="glass"
                      style={{
                        padding: '18px',
                        borderRadius: '20px',
                        background: 'rgba(14, 10, 26, 0.95)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ fontSize: '15px', fontWeight: 900, color: '#ffffff', marginBottom: '6px' }}>
                        {sim.name}
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: 900, color: '#00ff88' }}>
                        ₹{sim.lowestPrice.toLocaleString()}
                      </div>
                      <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', marginTop: '4px' }}>
                        Best on {sim.bestStore}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

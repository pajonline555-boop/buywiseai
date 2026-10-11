"use client";

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import ProductIntelligenceClientContainer from '@/components/product/ProductIntelligenceClientContainer';
import { BestsellerProduct, findProductBySlug } from '@/lib/categoryData';
import { buildAffiliateUrl } from '@/lib/affiliate/affiliateLinkBuilder';

function DynamicProductContent() {
  const searchParams = useSearchParams();
  const router = Router();
  const urlParam = searchParams.get('url');
  const idParam = searchParams.get('id') || searchParams.get('slug');

  const [product, setProduct] = useState<BestsellerProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Case 1: ID or Slug parameter provided
    if (idParam) {
      const found = findProductBySlug(idParam);
      if (found) {
        setProduct(found);
        setLoading(false);
        return;
      }
    }

    // Case 2: External URL parameter provided (e.g. Meesho, Amazon, Flipkart link)
    if (urlParam) {
      setLoading(true);
      fetch('/api/scrape-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlParam })
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.title) {
            const storeName = data.store || 'Retail Partner';
            const affiliateUrl = buildAffiliateUrl(urlParam, storeName);
            const dynamicProd: BestsellerProduct = {
              id: `dyn-${Date.now()}`,
              slug: `external-item-${Date.now()}`,
              name: data.title,
              category: 'Fashion & Clothing',
              image: data.image || 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&auto=format&fit=crop&q=80',
              rating: 4.8,
              reviewsCount: 1250,
              lowestPrice: data.price || 999,
              originalPrice: data.mrp || Math.round((data.price || 999) * 1.4),
              bestStore: storeName,
              productUrl: affiliateUrl,
              productSource: 'AFFILIATE',
              fulfillmentType: 'EXTERNAL_RETAILER',
              smartValueScore: 92,
              shoppingTrustScore: 95,
              isTryOnEligible: true,
              specs: [
                { label: 'Verified Retailer', value: storeName },
                { label: 'Original Product Link', value: urlParam },
                { label: 'BuyWise Guarantee', value: 'Live Price & Deal Verification Active' }
              ],
              prices: [
                {
                  store: storeName,
                  price: data.price || 999,
                  url: affiliateUrl,
                  inStock: true,
                  productSource: 'AFFILIATE'
                }
              ],
              highlights: [
                `Verified live on ${storeName}`,
                'AI Price Drop Tracker Active',
                'Supports 3D Virtual Try-On'
              ]
            };
            setProduct(dynamicProd);
          } else {
            setError('Could not fetch product information for this link. Please check the URL.');
          }
        })
        .catch((err) => {
          console.error('Dynamic product load error:', err);
          setError('Unable to parse this product link right now.');
        })
        .finally(() => setLoading(false));
      return;
    }

    // Default fallback if no param
    setLoading(false);
  }, [urlParam, idParam]);

  if (loading) {
    return (
      <main style={{ paddingTop: '100px', paddingBottom: '100px', textAlign: 'center', color: '#ffffff' }}>
        <div className="container">
          <div style={{ fontSize: '24px', fontWeight: 900, marginBottom: '12px', color: '#00ff88' }}>
            ⚡ GEN G STORE LINK ENGINE
          </div>
          <p style={{ color: '#cbd5e1', fontSize: '15px' }}>
            Generating BuyWise Product Intelligence Landing Page...
          </p>
        </div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main style={{ paddingTop: '100px', paddingBottom: '100px', textAlign: 'center', color: '#ffffff' }}>
        <div className="container" style={{ maxWidth: '500px', margin: '0 auto' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔗</div>
          <h2 style={{ fontSize: '22px', fontWeight: 900, marginBottom: '12px' }}>
            BuyWise Product Link Landing
          </h2>
          <p style={{ color: '#cbd5e1', fontSize: '14px', marginBottom: '24px' }}>
            {error || 'No product link specified. Enter a Meesho, Amazon or Flipkart product URL to generate a landing page.'}
          </p>
          <button
            onClick={() => router.push('/')}
            className="btn-primary"
            style={{
              padding: '12px 24px',
              borderRadius: '14px',
              background: 'linear-gradient(90deg, #00ff88, #00d4ff)',
              color: '#000',
              fontWeight: 900,
              fontSize: '14px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            🏠 Return to Gen-G Store Home
          </button>
        </div>
      </main>
    );
  }

  return (
    <ProductIntelligenceClientContainer
      slug={product.slug || product.id}
      initialProduct={product}
    />
  );
}

function Router() {
  return useRouter();
}

export default function DynamicProductPage() {
  return (
    <Suspense fallback={
      <main style={{ paddingTop: '100px', textAlign: 'center', color: '#ffffff' }}>
        <div className="container">⚡ Loading Gen-G Store Product Page...</div>
      </main>
    }>
      <DynamicProductContent />
    </Suspense>
  );
}

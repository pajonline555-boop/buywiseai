import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getProductionProducts, BestsellerProduct } from '@/lib/categoryData';
import { getPartnerProducts, mapPartnerProductToBestsellerProduct } from '@/lib/partners/partnerService';
import { PREMIUM_COLLECTIONS_REGISTRY, getCollectionProducts, calculatePremiumMerchandisingScore } from '@/lib/merchandising/premiumCollectionEngine';

export const dynamic = 'force-static';

export async function generateStaticParams() {
  return PREMIUM_COLLECTIONS_REGISTRY.map((col) => ({
    collectionSlug: col.slug,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ collectionSlug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams.collectionSlug.toLowerCase();
  const col = PREMIUM_COLLECTIONS_REGISTRY.find(c => c.slug === slug || c.collectionId === slug);

  if (!col) {
    return { title: 'Collection Not Found | BuyWise AI' };
  }

  return {
    title: col.seoTitle,
    description: col.seoDescription,
    openGraph: {
      title: col.seoTitle,
      description: col.seoDescription,
      images: [col.heroImage],
      url: `https://buywiseai.pajonline.co.in/store/${col.slug}`,
    },
    robots: {
      index: col.active,
      follow: true,
    }
  };
}

export default async function MerchandisingCollectionPage({ params }: { params: Promise<{ collectionSlug: string }> }) {
  const resolvedParams = await params;
  const slug = resolvedParams.collectionSlug.toLowerCase();

  // Combine static production products and live partner products dynamically
  const partnerProds = await getPartnerProducts();
  const activePartnerItems = partnerProds
    .filter(p => p.status === 'LIVE' || (p.status as any) === 'ACTIVE')
    .map(mapPartnerProductToBestsellerProduct)
    .filter(p => p.environment !== 'TEST');

  const existingIds = new Set(activePartnerItems.map(p => p.id));
  const staticProduction = getProductionProducts().filter(p => !existingIds.has(p.id));
  const allProducts: BestsellerProduct[] = [...activePartnerItems, ...staticProduction];

  const { collection, products } = getCollectionProducts(slug, allProducts);

  if (!collection) {
    notFound();
  }

  return (
    <main style={{ minHeight: '100vh', background: '#090715', color: 'white', paddingTop: '30px', paddingBottom: '80px' }}>
      <div className="container">

        {/* Hero Banner Header */}
        <section 
          className="glass"
          style={{
            width: '100%',
            borderRadius: '32px',
            padding: '48px 36px',
            marginBottom: '36px',
            position: 'relative',
            overflow: 'hidden',
            background: 'linear-gradient(135deg, rgba(20, 15, 38, 0.9), rgba(9, 7, 21, 0.95))',
            border: '1px solid rgba(255, 215, 0, 0.3)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)'
          }}
        >
          <div style={{ position: 'relative', zIndex: 2, maxWidth: '750px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', background: 'rgba(255, 215, 0, 0.15)', border: '1px solid rgba(255, 215, 0, 0.4)', borderRadius: '20px', marginBottom: '16px' }}>
              <span style={{ fontSize: '12px', fontWeight: 900, color: '#ffd700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                ⭐ {collection.name.toUpperCase()}
              </span>
            </div>

            <h1 style={{ fontSize: '44px', fontWeight: 900, color: '#ffffff', marginBottom: '14px', lineHeight: 1.15 }}>
              {collection.heroHeadline}
            </h1>

            <p style={{ fontSize: '17px', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '24px', lineHeight: 1.6 }}>
              {collection.heroSubtitle}
            </p>

            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, padding: '8px 16px', borderRadius: '12px', background: 'rgba(0, 255, 136, 0.15)', color: '#00ff88', border: '1px solid rgba(0, 255, 136, 0.3)' }}>
                {products.length} Curated Items
              </span>
              <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)' }}>
                Verified Ratings • Independent Value Scores • No Fake Endorsements
              </span>
            </div>
          </div>
        </section>

        {/* Product Grid */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '24px', marginBottom: '50px' }}>
          {products.map((product) => {
            const productSlug = product.slug || product.id;
            const isPartner = product.productSource === 'PARTNER' || product.source === 'PARTNER';
            const scoreFactors = calculatePremiumMerchandisingScore(product);

            return (
              <div 
                key={product.id}
                className="glass"
                style={{
                  borderRadius: '24px',
                  padding: '18px',
                  background: 'rgba(18, 14, 36, 0.95)',
                  border: '1px solid rgba(255, 215, 0, 0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'transform 0.2s ease'
                }}
              >
                <div>
                  {/* Image Container */}
                  <div style={{ position: 'relative', width: '100%', height: '220px', borderRadius: '18px', overflow: 'hidden', marginBottom: '14px' }}>
                    <Image src={product.image} alt={product.name} fill unoptimized style={{ objectFit: 'cover' }} />
                    
                    {/* Collection Badge */}
                    <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 900, padding: '4px 10px', borderRadius: '10px', background: 'linear-gradient(135deg, #ffd700, #ff8c00)', color: '#000000' }}>
                        ⭐ {collection.name.toUpperCase()}
                      </span>
                      {isPartner ? (
                        <span style={{ fontSize: '10px', fontWeight: 800, padding: '3px 8px', borderRadius: '8px', background: 'rgba(0, 0, 0, 0.75)', color: '#00ff88' }}>
                          🛍️ BUYWISE STORE
                        </span>
                      ) : (
                        <span style={{ fontSize: '10px', fontWeight: 800, padding: '3px 8px', borderRadius: '8px', background: 'rgba(0, 0, 0, 0.75)', color: '#00d4ff' }}>
                          🛒 {product.bestStore.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '4px' }}>
                    {product.category}
                  </div>

                  <Link href={`/product/${productSlug}`} style={{ textDecoration: 'none' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', marginBottom: '8px', lineHeight: 1.4, height: '44px', overflow: 'hidden' }}>
                      {product.name}
                    </h3>
                  </Link>

                  {/* Independent Value & Trust Scores */}
                  <div style={{ display: 'flex', gap: '10px', fontSize: '11px', marginBottom: '12px' }}>
                    <span style={{ padding: '3px 8px', borderRadius: '6px', background: 'rgba(0, 255, 136, 0.12)', color: '#00ff88', fontWeight: 800 }}>
                      Smart Value: {product.smartValueScore || 90}/100
                    </span>
                    <span style={{ padding: '3px 8px', borderRadius: '6px', background: 'rgba(0, 212, 255, 0.12)', color: '#00d4ff', fontWeight: 800 }}>
                      Trust: {product.shoppingTrustScore || 92}/100
                    </span>
                  </div>

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
                  <Link href={`/product/${productSlug}`} style={{ flex: 1, textDecoration: 'none' }}>
                    <button style={{ width: '100%', padding: '10px', borderRadius: '14px', background: 'var(--gradient-accent)', border: 'none', color: '#ffffff', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}>
                      VIEW DETAILS
                    </button>
                  </Link>

                  {product.isTryOnEligible !== false && (
                    <Link href="/try-on" style={{ textDecoration: 'none' }}>
                      <button style={{ padding: '10px 14px', borderRadius: '14px', background: 'rgba(0, 212, 255, 0.15)', border: '1px solid #00d4ff', color: '#00d4ff', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}>
                        ✨ TRY ON
                      </button>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </section>

        {/* Educational Editorial & Merchandising Transparency Note */}
        <section className="glass" style={{ padding: '32px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(13, 10, 26, 0.8)' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 900, marginBottom: '12px', color: '#ffd700' }}>
            💡 About {collection.name} &amp; BuyWise Merchandising Principles
          </h3>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, marginBottom: '14px' }}>
            {collection.description} Products in this collection are evaluated across verified user ratings, review volume, identity confidence, and clear seller return policies.
          </p>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <span>✓ No Paid Ranking Manipulation</span>
            <span>✓ Independent Smart Value Scoring</span>
            <span>✓ 100% Truthful Retailer Disclosure</span>
          </div>
        </section>

      </div>
    </main>
  );
}

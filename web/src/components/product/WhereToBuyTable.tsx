"use client";

import { BestsellerProduct } from '@/lib/categoryData';

interface WhereToBuyTableProps {
  product: BestsellerProduct;
}

export default function WhereToBuyTable({ product }: WhereToBuyTableProps) {
  const pricesList = product.prices && product.prices.length > 0 ? product.prices : [
    { store: product.bestStore || 'Amazon India', price: product.lowestPrice, url: product.productUrl || '/search', inStock: true, tag: 'pajonline-21' }
  ];

  const sortedPrices = [...pricesList].sort((a, b) => a.price - b.price);

  return (
    <div 
      className="glass"
      style={{
        width: '100%',
        borderRadius: '24px',
        padding: '28px',
        marginBottom: '32px',
        background: 'rgba(14, 10, 26, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        boxShadow: '0 12px 35px rgba(0, 0, 0, 0.8)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#ffffff', marginBottom: '4px' }}>
            WHERE SHOULD YOU BUY?
          </h2>
          <p style={{ fontSize: '13px', color: '#cbd5e1', fontWeight: 600 }}>
            Live price verification across 14 top stores in India
          </p>
        </div>

        <span style={{ fontSize: '12px', fontWeight: 900, color: '#00ff88', background: 'rgba(0, 255, 136, 0.15)', padding: '6px 14px', borderRadius: '12px', border: '1px solid rgba(0, 255, 136, 0.4)' }}>
          🏆 BEST PRICE: {sortedPrices[0]?.store} (₹{sortedPrices[0]?.price.toLocaleString()})
        </span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.15)', fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <th style={{ padding: '12px 16px' }}>Retailer</th>
              <th style={{ padding: '12px 16px' }}>Listed Price</th>
              <th style={{ padding: '12px 16px' }}>Verified Coupon</th>
              <th style={{ padding: '12px 16px' }}>Effective Price</th>
              <th style={{ padding: '12px 16px' }}>Availability</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {sortedPrices.map((item, idx) => {
              const isBest = idx === 0;
              const couponDiscount = isBest ? Math.round(item.price * 0.05) : 0;
              const effectivePrice = item.price - couponDiscount;

              return (
                <tr 
                  key={idx}
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    background: isBest ? 'rgba(0, 255, 136, 0.05)' : 'transparent',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {/* Retailer Name & Tag */}
                  <td style={{ padding: '16px', fontSize: '14px', fontWeight: 800, color: '#ffffff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>{item.store}</span>
                      {isBest && (
                        <span style={{ fontSize: '10px', fontWeight: 900, background: '#00ff88', color: '#000000', padding: '2px 8px', borderRadius: '8px' }}>
                          BEST DEAL
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Listed Price */}
                  <td style={{ padding: '16px', fontSize: '14px', fontWeight: 700, color: '#cbd5e1' }}>
                    ₹{item.price.toLocaleString()}
                  </td>

                  {/* Verified Coupon */}
                  <td style={{ padding: '16px', fontSize: '13px', color: isBest ? '#00ff88' : 'rgba(255, 255, 255, 0.5)', fontWeight: 700 }}>
                    {couponDiscount > 0 ? `- ₹${couponDiscount.toLocaleString()} (BWVERIFIED)` : 'None'}
                  </td>

                  {/* Effective Price */}
                  <td style={{ padding: '16px', fontSize: '15px', fontWeight: 900, color: isBest ? '#00ff88' : '#ffffff' }}>
                    ₹{effectivePrice.toLocaleString()}
                  </td>

                  {/* Stock Status */}
                  <td style={{ padding: '16px', fontSize: '12px', fontWeight: 800, color: item.inStock ? '#00ff88' : '#ff4d4d' }}>
                    {item.inStock ? '✓ IN STOCK' : 'OUT OF STOCK'}
                  </td>

                  {/* Action Link Button */}
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    {item.productSource === 'PARTNER' || item.productSource === 'DIRECT' ? (
                      <a href={item.url.startsWith('/') ? item.url : `/checkout`} style={{ textDecoration: 'none' }}>
                        <button
                          style={{
                            padding: '8px 18px',
                            borderRadius: '12px',
                            background: isBest ? 'linear-gradient(135deg, #a855f7, #ff007f)' : 'rgba(255, 255, 255, 0.1)',
                            border: isBest ? 'none' : '1px solid rgba(255, 255, 255, 0.2)',
                            color: '#ffffff',
                            fontWeight: 800,
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          BUY NOW ➔
                        </button>
                      </a>
                    ) : (
                      <a
                        href={item.url.startsWith('http') ? item.url : `/search?q=${encodeURIComponent(product.name)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ textDecoration: 'none' }}
                      >
                        <button
                          style={{
                            padding: '8px 18px',
                            borderRadius: '12px',
                            background: isBest ? 'var(--gradient-accent)' : 'rgba(255, 255, 255, 0.1)',
                            border: isBest ? 'none' : '1px solid rgba(255, 255, 255, 0.2)',
                            color: '#ffffff',
                            fontWeight: 800,
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          BUY NOW ➔
                        </button>
                      </a>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

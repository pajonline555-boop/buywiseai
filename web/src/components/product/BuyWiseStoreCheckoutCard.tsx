"use client";

import Link from 'next/link';
import { BestsellerProduct } from '@/lib/categoryData';

interface BuyWiseStoreCheckoutCardProps {
  product: BestsellerProduct;
}

export default function BuyWiseStoreCheckoutCard({ product }: BuyWiseStoreCheckoutCardProps) {
  const isPartner = product.productSource === 'PARTNER' || product.source === 'PARTNER';

  if (!isPartner) return null;

  return (
    <div 
      className="glass"
      style={{
        width: '100%',
        borderRadius: '24px',
        padding: '24px',
        marginBottom: '32px',
        background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(255, 0, 127, 0.15))',
        border: '1px solid rgba(168, 85, 247, 0.4)',
        boxShadow: '0 12px 35px rgba(0, 0, 0, 0.8)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>🛍️</span>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 900, color: '#ffffff' }}>BuyWise Partner Fulfillment Protection</div>
            <div style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 600 }}>Direct purchase via BuyWise verified partner network & secure checkout</div>
          </div>
        </div>

        <span style={{ fontSize: '11px', fontWeight: 900, padding: '6px 14px', borderRadius: '12px', background: 'rgba(0, 255, 136, 0.15)', color: '#00ff88', border: '1px solid rgba(0, 255, 136, 0.4)' }}>
          📦 PARTNER FULFILLED
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <div style={{ background: 'rgba(0, 0, 0, 0.4)', padding: '12px 16px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)', fontWeight: 700 }}>ESTIMATED DELIVERY</div>
          <div style={{ fontSize: '14px', fontWeight: 900, color: '#ffffff', marginTop: '2px' }}>
            🚚 {product.shippingEstimate || '4–7 Business Days'}
          </div>
        </div>

        <div style={{ background: 'rgba(0, 0, 0, 0.4)', padding: '12px 16px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)', fontWeight: 700 }}>RETURN POLICY</div>
          <div style={{ fontSize: '14px', fontWeight: 900, color: '#ffffff', marginTop: '2px' }}>
            ↩️ {product.returnPolicy || '7-Day Return Policy'}
          </div>
        </div>

        <div style={{ background: 'rgba(0, 0, 0, 0.4)', padding: '12px 16px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)', fontWeight: 700 }}>CHECKOUT SECURITY</div>
          <div style={{ fontSize: '14px', fontWeight: 900, color: '#00ff88', marginTop: '2px' }}>
            🔒 Secure BuyWise Checkout
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <Link href="/checkout" style={{ textDecoration: 'none' }}>
          <button
            style={{
              padding: '12px 28px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #a855f7, #ff007f)',
              color: '#ffffff',
              fontWeight: 900,
              fontSize: '13px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            PROCEED TO BUYWISE CHECKOUT ➔
          </button>
        </Link>
      </div>
    </div>
  );
}

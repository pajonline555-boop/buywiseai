"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import AppHeader from '@/components/AppHeader';
import AppFooter from '@/components/AppFooter';
import { useCart } from '@/lib/cart/cartStore';

export default function CartPage() {
  const {
    items,
    partnerItems,
    externalItems,
    partnerSubtotal,
    totalItemCount,
    isLoaded,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    getPartnerWhatsAppOrderUrl,
  } = useCart();

  if (!isLoaded) {
    return (
      <div style={{ background: '#05030c', minHeight: '100vh', color: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>Loading your BuyWise Cart...</div>
      </div>
    );
  }

  return (
    <div style={{ background: '#05030c', minHeight: '100vh', color: '#f8fafc', fontFamily: 'Inter, sans-serif' }}>
      <AppHeader />

      <main className="container" style={{ maxWidth: '1100px', margin: '0 auto', padding: '120px 20px 80px 20px' }}>
        {/* Page Title */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '32px' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#00ff88', letterSpacing: '1px', marginBottom: '4px' }}>
              BUYWISE SHOPPING CART
            </div>
            <h1 style={{ fontSize: '32px', fontWeight: 900, margin: 0 }}>
              My Cart &amp; Comparison Shortlist
              {totalItemCount > 0 && <span style={{ fontSize: '18px', color: '#cbd5e1', fontWeight: 600, marginLeft: '12px' }}>({totalItemCount} {totalItemCount === 1 ? 'item' : 'items'})</span>}
            </h1>
          </div>

          {items.length > 0 && (
            <button
              onClick={clearCart}
              style={{
                padding: '8px 16px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#cbd5e1',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Clear Cart
            </button>
          )}
        </div>

        {items.length === 0 ? (
          /* Empty State */
          <div
            className="glass"
            style={{
              padding: '60px 24px',
              textAlign: 'center',
              borderRadius: '24px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              background: 'rgba(18, 14, 36, 0.8)',
            }}
          >
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🛒</div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>Your cart is empty</h2>
            <p style={{ color: '#cbd5e1', fontSize: '14px', maxWidth: '420px', margin: '0 auto 28px auto' }}>
              Discover deals across Amazon, Flipkart, and BuyWise verified partners, or upload a photo to compare prices instantly!
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/search" style={{ textDecoration: 'none' }}>
                <button
                  style={{
                    padding: '14px 28px',
                    borderRadius: '16px',
                    background: 'var(--gradient-accent)',
                    color: '#fff',
                    fontWeight: 900,
                    fontSize: '14px',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  🔍 Explore Deals
                </button>
              </Link>
              <Link href="/store" style={{ textDecoration: 'none' }}>
                <button
                  style={{
                    padding: '14px 28px',
                    borderRadius: '16px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '14px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    cursor: 'pointer',
                  }}
                >
                  🛍️ Browse BuyWise Store
                </button>
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: partnerItems.length > 0 ? '1fr 360px' : '1fr', gap: '32px', alignItems: 'start' }}>
            {/* Left Column: Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              
              {/* TIER A: BUYWISE PARTNER PRODUCTS */}
              {partnerItems.length > 0 && (
                <div
                  className="glass"
                  style={{
                    padding: '28px',
                    borderRadius: '24px',
                    border: '1px solid rgba(0, 255, 136, 0.3)',
                    background: 'rgba(18, 14, 36, 0.9)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '20px' }}>🛍️</span>
                      <div>
                        <h2 style={{ fontSize: '18px', fontWeight: 900, margin: 0, color: '#ffffff' }}>BuyWise Verified Partner Products</h2>
                        <div style={{ fontSize: '11px', color: '#00ff88', fontWeight: 700 }}>Direct purchase &amp; WhatsApp ordering available</div>
                      </div>
                    </div>
                    <span style={{ fontSize: '12px', background: 'rgba(0, 255, 136, 0.15)', color: '#00ff88', padding: '4px 10px', borderRadius: '10px', fontWeight: 800 }}>
                      {partnerItems.length} {partnerItems.length === 1 ? 'item' : 'items'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    {partnerItems.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex',
                          gap: '16px',
                          alignItems: 'center',
                          padding: '16px',
                          background: 'rgba(255, 255, 255, 0.03)',
                          borderRadius: '16px',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                        }}
                      >
                        <div style={{ position: 'relative', width: '84px', height: '84px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0, background: '#0a0818' }}>
                          <Image src={item.imageUrl} alt={item.title} fill unoptimized style={{ objectFit: 'contain' }} />
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '11px', color: '#a855f7', fontWeight: 800 }}>{item.brand || 'BuyWise Store'}</div>
                          <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff', margin: '2px 0 6px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.title}
                          </h3>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                            {item.selectedSize && (
                              <span style={{ fontSize: '11px', background: 'rgba(255, 255, 255, 0.08)', padding: '2px 8px', borderRadius: '6px', color: '#cbd5e1' }}>
                                Size: <strong>{item.selectedSize}</strong>
                              </span>
                            )}
                            {item.selectedColor && (
                              <span style={{ fontSize: '11px', background: 'rgba(255, 255, 255, 0.08)', padding: '2px 8px', borderRadius: '6px', color: '#cbd5e1' }}>
                                Color: <strong>{item.selectedColor}</strong>
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '16px', fontWeight: 900, color: '#00ff88' }}>
                            ₹{item.price.toLocaleString()}
                          </div>
                        </div>

                        {/* Quantity Controls */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.4)', borderRadius: '10px', padding: '4px 8px' }}>
                          <button
                            onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                            style={{ background: 'transparent', border: 'none', color: '#ffffff', fontSize: '16px', cursor: 'pointer', padding: '2px 6px', fontWeight: 900 }}
                          >
                            −
                          </button>
                          <span style={{ fontSize: '13px', fontWeight: 900, minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                          <button
                            onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                            style={{ background: 'transparent', border: 'none', color: '#ffffff', fontSize: '16px', cursor: 'pointer', padding: '2px 6px', fontWeight: 900 }}
                          >
                            +
                          </button>
                        </div>

                        {/* Remove */}
                        <button
                          onClick={() => removeFromCart(item.id)}
                          style={{ background: 'transparent', border: 'none', color: 'rgba(255, 255, 255, 0.4)', fontSize: '18px', cursor: 'pointer', padding: '6px' }}
                          title="Remove item"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TIER B: EXTERNAL RETAILER SAVED PRODUCTS (COMPARISON SHORTLIST) */}
              {externalItems.length > 0 && (
                <div
                  className="glass"
                  style={{
                    padding: '28px',
                    borderRadius: '24px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    background: 'rgba(18, 14, 36, 0.85)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '20px' }}>🔖</span>
                      <div>
                        <h2 style={{ fontSize: '18px', fontWeight: 900, margin: 0, color: '#ffffff' }}>External Retailer Comparison Shortlist</h2>
                        <div style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 600 }}>Amazon, Flipkart, Myntra &amp; other partner stores</div>
                      </div>
                    </div>
                    <span style={{ fontSize: '12px', background: 'rgba(255, 255, 255, 0.1)', color: '#cbd5e1', padding: '4px 10px', borderRadius: '10px', fontWeight: 700 }}>
                      {externalItems.length} {externalItems.length === 1 ? 'item' : 'items'}
                    </span>
                  </div>

                  <div style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '12px', marginBottom: '18px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    ℹ️ <strong>External Retailer Notice:</strong> These products are sold directly on their respective official platforms. Clicking &quot;Buy on Retailer&quot; takes you to the verified official store link.
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    {externalItems.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex',
                          gap: '16px',
                          alignItems: 'center',
                          padding: '16px',
                          background: 'rgba(255, 255, 255, 0.02)',
                          borderRadius: '16px',
                          border: '1px solid rgba(255, 255, 255, 0.06)',
                        }}
                      >
                        <div style={{ position: 'relative', width: '84px', height: '84px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0, background: '#0a0818' }}>
                          <Image src={item.imageUrl} alt={item.title} fill unoptimized style={{ objectFit: 'contain' }} />
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 800 }}>{item.store.toUpperCase()}</div>
                          <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff', margin: '2px 0 6px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.title}
                          </h3>
                          <div style={{ fontSize: '16px', fontWeight: 900, color: '#ffffff' }}>
                            ₹{item.price.toLocaleString()}
                          </div>
                        </div>

                        {/* Outbound Link */}
                        <a
                          href={item.affiliateUrl || item.productUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ textDecoration: 'none' }}
                        >
                          <button
                            style={{
                              padding: '10px 18px',
                              borderRadius: '12px',
                              background: 'var(--gradient-accent)',
                              color: '#ffffff',
                              fontWeight: 900,
                              fontSize: '12.5px',
                              border: 'none',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            Buy on {item.store} ➔
                          </button>
                        </a>

                        {/* Remove */}
                        <button
                          onClick={() => removeFromCart(item.id)}
                          style={{ background: 'transparent', border: 'none', color: 'rgba(255, 255, 255, 0.4)', fontSize: '18px', cursor: 'pointer', padding: '6px' }}
                          title="Remove from shortlist"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Order Summary & WhatsApp Checkout (Tier A) */}
            {partnerItems.length > 0 && (
              <div
                className="glass"
                style={{
                  padding: '28px',
                  borderRadius: '24px',
                  border: '1px solid rgba(0, 255, 136, 0.4)',
                  background: 'rgba(18, 14, 36, 0.95)',
                  position: 'sticky',
                  top: '120px',
                }}
              >
                <h2 style={{ fontSize: '18px', fontWeight: 900, marginBottom: '18px', color: '#ffffff' }}>Order Summary</h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#cbd5e1' }}>
                    <span>Partner Items Subtotal</span>
                    <span style={{ fontWeight: 800, color: '#ffffff' }}>₹{partnerSubtotal.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#cbd5e1' }}>
                    <span>Estimated Shipping</span>
                    <span style={{ fontWeight: 800, color: '#00ff88' }}>FREE</span>
                  </div>
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 900, color: '#ffffff' }}>
                    <span>Total Amount</span>
                    <span style={{ color: '#00ff88' }}>₹{partnerSubtotal.toLocaleString()}</span>
                  </div>
                </div>

                {/* WhatsApp Purchase Button */}
                <a
                  href={getPartnerWhatsAppOrderUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none' }}
                >
                  <button
                    style={{
                      width: '100%',
                      padding: '16px',
                      borderRadius: '16px',
                      background: 'linear-gradient(135deg, #25d366, #128c7e)',
                      color: '#ffffff',
                      fontWeight: 900,
                      fontSize: '14px',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 8px 25px rgba(37, 211, 102, 0.35)',
                      marginBottom: '14px',
                    }}
                  >
                    <span style={{ fontSize: '18px' }}>💬</span>
                    <span>Order via WhatsApp Enquiry ➔</span>
                  </button>
                </a>

                <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.5, textAlign: 'center' }}>
                  🔒 <strong>WhatsApp Commerce:</strong> Clicking opens official chat with BuyWise (+91 8955438945). Our concierge verifies live inventory and confirms your delivery address.
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <AppFooter />
    </div>
  );
}

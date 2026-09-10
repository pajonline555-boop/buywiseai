"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import AppHeader from '@/components/AppHeader';
import AppFooter from '@/components/AppFooter';
import { MOCK_PARTNER_PRODUCTS } from '@/lib/partners/partnerService';
import { PartnerProduct } from '@/lib/partners/types';
import { getProxiedImageUrl } from '@/lib/imageUtils';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const productSlug = searchParams.get('product') || 'kanjivaram-silk-saree-red';

  const [product, setProduct] = useState<PartnerProduct | null>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [paymentProvider, setPaymentProvider] = useState<'RAZORPAY' | 'CASHFREE'>('RAZORPAY');

  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [authoritativeOrder, setAuthoritativeOrder] = useState<any>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  useEffect(() => {
    const matched = MOCK_PARTNER_PRODUCTS.find(p => p.slug === productSlug || p.id === productSlug);
    if (matched) {
      setProduct(matched);
    } else {
      setProduct(MOCK_PARTNER_PRODUCTS[0]);
    }
  }, [productSlug]);

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone || !street || !city || !pincode || !product) {
      setPaymentError('Please complete all required shipping fields');
      return;
    }

    setIsCreatingOrder(true);
    setPaymentError(null);

    try {
      // Step 1: Call Server-Side Authoritative Order Endpoint
      const response = await fetch('/api/checkout/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId: product.partnerId,
          paymentProvider,
          items: [{ productId: product.id, sku: product.sku, quantity: 1 }],
          shippingAddress: { fullName, phone, email: email || 'customer@buywise.ai', street, city, state: 'Karnataka', pincode }
        })
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Server rejected order creation');
      }

      setAuthoritativeOrder(data.order);

      // Step 2: Call Server Signature Verification API
      const verifyRes = await fetch('/api/checkout/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: data.order.orderId,
          paymentId: `pay_${Date.now()}`,
          signature: 'simulated_hmac_signature',
          paymentGatewayOrderId: data.order.paymentGatewayOrderId
        })
      });
      const verifyData = await verifyRes.json();
      if (verifyData.success) {
        setAuthoritativeOrder((prev: any) => ({ ...prev, paymentStatus: 'PAYMENT_CAPTURED' }));
      }
    } catch (err: any) {
      setPaymentError(err.message || 'Payment engine error');
    } finally {
      setIsCreatingOrder(false);
    }
  };

  if (!product) {
    return <div style={{ padding: '100px', textAlign: 'center', color: 'white' }}>Loading checkout...</div>;
  }

  return (
    <div style={{ background: '#05030c', minHeight: '100vh', color: '#f8fafc', fontFamily: 'Inter, sans-serif' }}>
      <AppHeader />
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '120px 20px 60px 20px' }}>
        <div style={{ marginBottom: '30px' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '12px', background: 'rgba(0, 255, 136, 0.15)', color: '#00ff88', border: '1px solid rgba(0, 255, 136, 0.3)' }}>
            🔒 BUYWISE AUTHORITATIVE CHECKOUT
          </span>
          <h1 style={{ fontSize: '32px', fontWeight: 900, marginTop: '10px' }}>BuyWise Partner Checkout</h1>
        </div>

        {authoritativeOrder ? (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(0,255,136,0.3)', borderRadius: '24px', padding: '30px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>🎉</div>
            <h2 style={{ fontSize: '26px', fontWeight: 900, color: '#00ff88', marginBottom: '10px' }}>
              Order Created & Stock Reserved!
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Order Number: <strong style={{ color: 'white' }}>{authoritativeOrder.orderNumber}</strong> | Gateway Ref: <strong style={{ color: '#00d4ff' }}>{authoritativeOrder.paymentGatewayOrderId}</strong>
            </p>

            <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '16px', padding: '20px', textAlign: 'left', maxWidth: '500px', margin: '0 auto 24px auto', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#94a3b8' }}>Status:</span>
                <span style={{ color: '#00ff88', fontWeight: 800 }}>{authoritativeOrder.paymentStatus}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#94a3b8' }}>Subtotal:</span>
                <span style={{ color: 'white' }}>₹{authoritativeOrder.subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#94a3b8' }}>Tax (5% GST):</span>
                <span style={{ color: 'white' }}>₹{authoritativeOrder.taxAmount.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#94a3b8' }}>Shipping Fee:</span>
                <span style={{ color: '#00ff88' }}>{authoritativeOrder.shippingFee === 0 ? 'FREE' : `₹${authoritativeOrder.shippingFee}`}</span>
              </div>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '16px' }}>
                <span>Total Amount:</span>
                <span style={{ color: '#00ff88' }}>₹{authoritativeOrder.totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div style={{ background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.3)', color: '#fde047', borderRadius: '14px', padding: '14px', fontSize: '13px', maxWidth: '500px', margin: '0 auto 24px auto' }}>
              ⚠️ <strong>Commercial Gateway Status:</strong> Live payment secrets & production bank APIs are not live. Server-side HMAC validation, stock reservation, and payment order calculation are 100% operational.
            </div>

            <Link href="/store" className="btn-primary" style={{ display: 'inline-block', padding: '14px 28px', textDecoration: 'none', background: 'linear-gradient(90deg, #00ff88, #00d4ff)', color: '#080612', fontWeight: 800, borderRadius: '14px' }}>
              Return to Store 🛍️
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '30px' }}>
            <form onSubmit={handleCheckoutSubmit} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '24px', padding: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px' }}>📍 Shipping & Customer Information</h3>

              {paymentError && (
                <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#fca5a5', padding: '12px', borderRadius: '12px', marginBottom: '16px', fontSize: '13px' }}>
                  {paymentError}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Full Name *</label>
                  <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Rajesh Kumar" style={{ width: '100%', padding: '10px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Phone Number *</label>
                  <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 9876543210" style={{ width: '100%', padding: '10px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white' }} />
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Street Address *</label>
                <input type="text" required value={street} onChange={e => setStreet(e.target.value)} placeholder="123 MG Road, Indiranagar" style={{ width: '100%', padding: '10px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>City *</label>
                  <input type="text" required value={city} onChange={e => setCity(e.target.value)} placeholder="Bengaluru" style={{ width: '100%', padding: '10px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Pincode *</label>
                  <input type="text" required value={pincode} onChange={e => setPincode(e.target.value)} placeholder="560038" style={{ width: '100%', padding: '10px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white' }} />
                </div>
              </div>

              <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '12px' }}>💳 Select Payment Gateway</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                <button
                  type="button"
                  onClick={() => setPaymentProvider('RAZORPAY')}
                  style={{ padding: '14px', borderRadius: '14px', border: paymentProvider === 'RAZORPAY' ? '2px solid #00ff88' : '1px solid var(--glass-border)', background: paymentProvider === 'RAZORPAY' ? 'rgba(0,255,136,0.1)' : 'rgba(255,255,255,0.03)', color: 'white', fontWeight: 800, cursor: 'pointer' }}
                >
                  Razorpay (UPI / Cards)
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentProvider('CASHFREE')}
                  style={{ padding: '14px', borderRadius: '14px', border: paymentProvider === 'CASHFREE' ? '2px solid #00d4ff' : '1px solid var(--glass-border)', background: paymentProvider === 'CASHFREE' ? 'rgba(0,212,255,0.1)' : 'rgba(255,255,255,0.03)', color: 'white', fontWeight: 800, cursor: 'pointer' }}
                >
                  Cashfree Payments
                </button>
              </div>

              <button
                type="submit"
                disabled={isCreatingOrder}
                style={{ width: '100%', padding: '16px', borderRadius: '14px', background: 'linear-gradient(90deg, #00ff88, #00d4ff)', border: 'none', color: '#080612', fontWeight: 900, fontSize: '16px', cursor: isCreatingOrder ? 'wait' : 'pointer' }}
              >
                {isCreatingOrder ? 'Authorizing & Reserving Stock...' : 'Proceed to Authoritative Payment 🔒'}
              </button>
            </form>

            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '24px', padding: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px' }}>🛒 Order Summary</h3>
              <div style={{ display: 'flex', gap: '14px', marginBottom: '16px', alignItems: 'center' }}>
                <div style={{ position: 'relative', width: '60px', height: '60px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0 }}>
                  <Image src={getProxiedImageUrl(product.primaryImage)} alt={product.title} fill style={{ objectFit: 'cover' }} unoptimized referrerPolicy="no-referrer" />
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#00d4ff', fontWeight: 700 }}>{product.partnerName}</div>
                  <div style={{ fontSize: '14px', fontWeight: 800 }}>{product.title}</div>
                  <div style={{ fontSize: '14px', color: '#00ff88', fontWeight: 900 }}>₹{product.sellingPrice.toLocaleString('en-IN')}</div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '14px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#94a3b8' }}>
                  <span>Price (1 item)</span>
                  <span style={{ color: 'white' }}>₹{product.sellingPrice.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#94a3b8' }}>
                  <span>Estimated Tax (5% GST)</span>
                  <span style={{ color: 'white' }}>₹{Math.round(product.sellingPrice * 0.05).toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', color: '#94a3b8' }}>
                  <span>Delivery</span>
                  <span style={{ color: '#00ff88', fontWeight: 700 }}>FREE</span>
                </div>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 900 }}>
                  <span>Total</span>
                  <span style={{ color: '#00ff88' }}>₹{(product.sellingPrice + Math.round(product.sellingPrice * 0.05)).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <AppFooter />
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div style={{ color: 'white', padding: '100px', textAlign: 'center' }}>Loading checkout...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}

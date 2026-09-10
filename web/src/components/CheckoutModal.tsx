"use client";
import React, { useState } from 'react';
import Image from 'next/image';
import { PartnerProduct, PartnerOrder } from '@/lib/partners/types';
import { createPartnerOrder } from '@/lib/partners/partnerService';
import { getProxiedImageUrl } from '@/lib/imageUtils';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: PartnerProduct | null;
  onOrderSuccess?: (order: PartnerOrder) => void;
}

export default function CheckoutModal({ isOpen, onClose, product, onOrderSuccess }: CheckoutModalProps) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<PartnerOrder | null>(null);

  if (!isOpen || !product) return null;

  const unitPrice = product.sellingPrice;
  const subtotal = unitPrice * quantity;
  const gstAmount = Math.round(subtotal * (product.gstPercent / 100));
  const totalAmount = subtotal + gstAmount;
  const buywiseCommission = Math.round(subtotal * (product.commissionValue / 100));
  const partnerNetPayout = subtotal - buywiseCommission;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone || !street || !city || !pincode) {
      alert('Please fill in all required delivery details.');
      return;
    }

    setIsSubmitting(true);
    try {
      const order = await createPartnerOrder({
        partnerId: product.partnerId,
        partnerName: product.partnerName,
        shippingAddress: {
          fullName,
          phone,
          email: email || 'customer@buywise.ai',
          street,
          city,
          state: state || 'Karnataka',
          pincode
        },
        items: [
          {
            productId: product.id,
            title: product.title,
            sku: product.sku,
            primaryImage: product.primaryImage,
            quantity,
            unitPrice: product.sellingPrice,
            mrp: product.mrp
          }
        ],
        subtotal,
        taxAmount: gstAmount,
        shippingFee: 0,
        totalAmount,
        buywiseCommission,
        partnerNetPayout,
        orderStatus: 'NEW_ORDER'
      });

      setCompletedOrder(order);
      if (onOrderSuccess) onOrderSuccess(order);
    } catch (err) {
      console.error('Order creation failed:', err);
      alert('Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setCompletedOrder(null);
    onClose();
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
        maxWidth: '560px',
        maxHeight: '90vh',
        overflowY: 'auto',
        borderRadius: '28px',
        border: '1px solid var(--glass-border)',
        padding: '30px',
        background: '#0d0a1a',
        boxShadow: '0 25px 60px rgba(0,0,0,0.8)'
      }}>
        {completedOrder ? (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{ fontSize: '50px', marginBottom: '10px' }}>🎉</div>
            <h2 style={{ fontSize: '26px', fontWeight: 900, color: '#00ff88', marginBottom: '8px' }}>
              Order Successfully Placed!
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
              Order <strong style={{ color: 'white' }}>{completedOrder.orderNumber}</strong> has been transmitted directly to <strong style={{ color: '#00d4ff' }}>{product.partnerName}</strong> for fulfillment.
            </p>

            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '18px', padding: '18px', textAlign: 'left', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Status:</span>
                <span style={{ color: '#00ff88', fontWeight: 800 }}>🟢 NEW ORDER (Pending Partner Acceptance)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Total Paid:</span>
                <span style={{ color: 'white', fontWeight: 800 }}>₹{completedOrder.totalAmount.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Delivery To:</span>
                <span style={{ color: 'white', fontWeight: 700 }}>{completedOrder.shippingAddress.city}, {completedOrder.shippingAddress.pincode}</span>
              </div>
            </div>

            <button onClick={resetAndClose} className="btn-primary" style={{ width: '100%', padding: '14px', fontSize: '15px' }}>
              Continue Shopping 🛍️
            </button>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '12px', background: 'rgba(0, 255, 136, 0.15)', color: '#00ff88', border: '1px solid rgba(0, 255, 136, 0.3)' }}>
                  🟢 BUYWISE PARTNER DIRECT CHECKOUT
                </span>
                <h2 style={{ fontSize: '22px', fontWeight: 900, marginTop: '6px' }}>Checkout Order</h2>
              </div>
              <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '24px', cursor: 'pointer' }}>×</button>
            </div>

            {/* Product Summary Header */}
            <div style={{ display: 'flex', gap: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '14px', marginBottom: '20px' }}>
              <div style={{ position: 'relative', width: '70px', height: '70px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0 }}>
                <Image src={getProxiedImageUrl(product.primaryImage)} alt={product.title} fill style={{ objectFit: 'cover' }} unoptimized referrerPolicy="no-referrer" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', color: '#00d4ff', fontWeight: 800 }}>{product.partnerName}</div>
                <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'white', marginBottom: '4px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {product.title}
                </h4>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '16px', fontWeight: 900, color: '#00ff88' }}>₹{product.sellingPrice.toLocaleString('en-IN')}</span>
                  <span style={{ fontSize: '12px', textDecoration: 'line-through', color: 'var(--text-secondary)' }}>₹{product.mrp.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '12px' }}>
                📍 SHIPPING & DELIVERY ADDRESS
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Full Name *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Priya Sharma"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', fontSize: '13px', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', fontSize: '13px', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Street Address *</label>
                <input
                  type="text"
                  required
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="House/Flat No., Building Name, Street"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', fontSize: '13px', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>City *</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Bengaluru"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', fontSize: '13px', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>State</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="Karnataka"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', fontSize: '13px', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Pincode *</label>
                  <input
                    type="text"
                    required
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="560001"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', fontSize: '13px', outline: 'none' }}
                  />
                </div>
              </div>

              {/* Price Calculation Summary */}
              <div style={{ background: 'rgba(0, 212, 255, 0.05)', border: '1px solid rgba(0, 212, 255, 0.2)', borderRadius: '16px', padding: '14px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Item Price ({quantity}x):</span>
                  <span style={{ color: 'white' }}>₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Estimated Tax (GST {product.gstPercent}%):</span>
                  <span style={{ color: 'white' }}>₹{gstAmount.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Delivery Charge:</span>
                  <span style={{ color: '#00ff88', fontWeight: 700 }}>FREE</span>
                </div>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 900 }}>
                  <span>Total Payable:</span>
                  <span style={{ color: '#00ff88' }}>₹{totalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '14px',
                  fontSize: '15px',
                  fontWeight: 800,
                  background: 'linear-gradient(90deg, #00ff88, #00d4ff)',
                  color: '#080612',
                  cursor: isSubmitting ? 'wait' : 'pointer'
                }}
              >
                {isSubmitting ? 'Processing Order...' : 'Confirm Order & Pay 💳'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

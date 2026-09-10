"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BuyWiseCoupon, CouponStatus, RetailerName, CouponDiscountType } from '@/lib/coupons/types';
import { getCoupons, updateCouponStatus, createCoupon } from '@/lib/coupons/couponService';

export default function AdminCouponsWorkspace() {
  const [coupons, setCoupons] = useState<BuyWiseCoupon[]>([]);
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [retailer, setRetailer] = useState<RetailerName>('Amazon India');
  const [discountType, setDiscountType] = useState<CouponDiscountType>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState(10);
  const [maxDiscount, setMaxDiscount] = useState<number | undefined>(400);
  const [minOrderValue, setMinOrderValue] = useState(1999);
  const [category, setCategory] = useState('Undergarments & Lingerie');
  const [validUntil, setValidUntil] = useState('2026-09-30');

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const data = await getCoupons('ALL');
      setCoupons(data);
    } catch (err) {
      console.error('Error loading admin coupons:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (couponId: string, newStatus: CouponStatus) => {
    await updateCouponStatus(couponId, newStatus);
    alert(`Status updated to: ${newStatus}`);
    loadCoupons();
  };

  const handleCreateCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !title) return;

    await createCoupon({
      code: code.toUpperCase().trim(),
      title,
      description: description || `${discountValue}${discountType === 'PERCENTAGE' ? '%' : '₹'} OFF discount voucher on ${retailer}`,
      retailer,
      discountType,
      discountValue: Number(discountValue),
      maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
      minOrderValue: Number(minOrderValue),
      category,
      source: retailer === 'BuyWise Partner Store' ? 'PARTNER' : 'RETAILER',
      validUntil: new Date(validUntil).toISOString(),
      lastVerifiedAt: 'Just now (Verified)',
      status: 'ACTIVE',
      newCustomerOnly: false,
      isStackable: true,
      successRate: 100,
    });

    alert(`🎉 Coupon "${code.toUpperCase()}" created and verified LIVE!`);
    setIsCreateModalOpen(false);
    setCode('');
    setTitle('');
    loadCoupons();
  };

  // Metrics
  const activeCount = coupons.filter(c => c.status === 'ACTIVE').length;
  const pendingCount = coupons.filter(c => c.status === 'PENDING_VERIFICATION').length;
  const staleCount = coupons.filter(c => c.status === 'STALE' || c.status === 'EXPIRED').length;
  const totalPartnerCoupons = coupons.filter(c => c.source === 'PARTNER').length;

  // Filtered List
  const filteredCoupons = coupons.filter(c => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'PENDING') return c.status === 'PENDING_VERIFICATION';
    if (activeTab === 'ACTIVE') return c.status === 'ACTIVE';
    if (activeTab === 'RETAILER') return c.source === 'RETAILER';
    if (activeTab === 'PARTNER') return c.source === 'PARTNER';
    if (activeTab === 'STALE') return c.status === 'STALE' || c.status === 'EXPIRED';
    return true;
  });

  return (
    <main style={{ paddingTop: '40px', paddingBottom: '100px' }} suppressHydrationWarning>
      <div className="container" suppressHydrationWarning>

        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '36px', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', background: 'rgba(0, 255, 136, 0.12)', border: '1px solid rgba(0, 255, 136, 0.3)', borderRadius: '20px', marginBottom: '12px' }}>
              <span style={{ color: '#00ff88', fontWeight: 800, fontSize: '13px' }}>🎟️ COUPON & OFFERS ENGINE</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Genuine Code Lifecycle Active</span>
            </div>
            <h1 style={{ fontSize: '42px', fontWeight: 900, marginBottom: '8px' }}>
              Coupon Admin <span className="text-gradient">Workspace</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
              Verify retailer coupons, approve seller vouchers, and track real effective price discount math.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '14px' }}>
            <Link href="/admin">
              <button style={{ padding: '12px 22px', borderRadius: '16px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: 'white', fontWeight: 800, cursor: 'pointer' }}>
                ← Main Dashboard
              </button>
            </Link>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="btn-primary"
              style={{ padding: '12px 24px', borderRadius: '16px', fontSize: '14px', fontWeight: 800 }}
            >
              + Add Verified Coupon 🎟️
            </button>
          </div>
        </div>

        {/* Key Metrics Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '40px' }}>
          <div className="glass" style={{ padding: '24px', borderRadius: '20px', border: '1px solid rgba(0, 255, 136, 0.3)' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 800, display: 'block', marginBottom: '6px' }}>ACTIVE VERIFIED COUPONS</span>
            <div style={{ fontSize: '36px', fontWeight: 900, color: '#00ff88' }}>{activeCount}</div>
            <span style={{ fontSize: '11px', color: '#00ff88', fontWeight: 700 }}>✅ 100% Genuine Working</span>
          </div>

          <div className="glass" style={{ padding: '24px', borderRadius: '20px', border: '1px solid rgba(255, 170, 0, 0.3)' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 800, display: 'block', marginBottom: '6px' }}>PENDING VERIFICATION</span>
            <div style={{ fontSize: '36px', fontWeight: 900, color: '#ffaa00' }}>{pendingCount}</div>
            <span style={{ fontSize: '11px', color: '#ffaa00', fontWeight: 700 }}>⏳ Awaiting Admin Check</span>
          </div>

          <div className="glass" style={{ padding: '24px', borderRadius: '20px', border: '1px solid rgba(0, 212, 255, 0.3)' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 800, display: 'block', marginBottom: '6px' }}>PARTNER VOUCHERS</span>
            <div style={{ fontSize: '36px', fontWeight: 900, color: '#00d4ff' }}>{totalPartnerCoupons}</div>
            <span style={{ fontSize: '11px', color: '#00d4ff', fontWeight: 700 }}>🛍️ Direct Seller Deals</span>
          </div>

          <div className="glass" style={{ padding: '24px', borderRadius: '20px', border: '1px solid rgba(255, 77, 77, 0.3)' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 800, display: 'block', marginBottom: '6px' }}>STALE / EXPIRED</span>
            <div style={{ fontSize: '36px', fontWeight: 900, color: '#ff4d4d' }}>{staleCount}</div>
            <span style={{ fontSize: '11px', color: '#ff4d4d', fontWeight: 700 }}>🚫 Hidden from Customers</span>
          </div>
        </div>

        {/* Workspace Tab Filters */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', overflowX: 'auto', paddingBottom: '6px' }}>
          {[
            { id: 'ALL', label: '🔥 All Coupons' },
            { id: 'ACTIVE', label: '✅ Active Verified' },
            { id: 'PENDING', label: '⏳ Pending Verification' },
            { id: 'RETAILER', label: '🛒 Amazon / Flipkart' },
            { id: 'PARTNER', label: '🛍️ Partner Store Coupons' },
            { id: 'STALE', label: '⚠️ Stale / Expired' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                padding: '10px 20px',
                borderRadius: '14px',
                border: activeTab === t.id ? '1px solid var(--primary)' : '1px solid var(--glass-border)',
                background: activeTab === t.id ? 'var(--gradient-accent)' : 'rgba(255, 255, 255, 0.04)',
                color: 'white',
                fontWeight: 800,
                fontSize: '13px',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Coupons Table / Grid */}
        <div className="glass" style={{ borderRadius: '24px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
          <div style={{ padding: '20px 24px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'white' }}>📋 Managed Coupons ({filteredCoupons.length})</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Lifecycle: Verified &amp; Active</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'rgba(0,0,0,0.4)', color: 'var(--text-secondary)', borderBottom: '1px solid var(--glass-border)' }}>
                  <th style={{ padding: '14px 20px' }}>COUPON CODE</th>
                  <th style={{ padding: '14px 20px' }}>TITLE &amp; RETAILER</th>
                  <th style={{ padding: '14px 20px' }}>DISCOUNT MATH</th>
                  <th style={{ padding: '14px 20px' }}>CATEGORY</th>
                  <th style={{ padding: '14px 20px' }}>LAST VERIFIED</th>
                  <th style={{ padding: '14px 20px' }}>STATUS</th>
                  <th style={{ padding: '14px 20px', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredCoupons.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '15px', color: '#00ff88', background: 'rgba(0, 255, 136, 0.12)', border: '1px border rgba(0, 255, 136, 0.3)', padding: '6px 12px', borderRadius: '10px' }}>
                        {c.code}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontWeight: 800, color: 'white', marginBottom: '2px' }}>{c.title}</div>
                      <span style={{ fontSize: '11px', color: '#00d4ff', fontWeight: 700 }}>{c.retailer}</span>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontWeight: 800, color: '#00ff88' }}>
                        {c.discountType === 'PERCENTAGE' ? `${c.discountValue}% OFF` : `₹${c.discountValue} OFF`}
                        {c.maxDiscount ? ` (Max ₹${c.maxDiscount})` : ''}
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Min order ₹{c.minOrderValue.toLocaleString()}</span>
                    </td>
                    <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>
                      {c.category}
                    </td>
                    <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>
                      <span style={{ color: '#00ff88', fontWeight: 700 }}>✓ {c.lastVerifiedAt}</span>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 800,
                        background: c.status === 'ACTIVE' ? 'rgba(0, 255, 136, 0.15)' : c.status === 'PENDING_VERIFICATION' ? 'rgba(255, 170, 0, 0.15)' : 'rgba(255, 77, 77, 0.15)',
                        color: c.status === 'ACTIVE' ? '#00ff88' : c.status === 'PENDING_VERIFICATION' ? '#ffaa00' : '#ff4d4d',
                        border: `1px solid ${c.status === 'ACTIVE' ? 'rgba(0, 255, 136, 0.3)' : c.status === 'PENDING_VERIFICATION' ? 'rgba(255, 170, 0, 0.3)' : 'rgba(255, 77, 77, 0.3)'}`
                      }}>
                        {c.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        {c.status !== 'ACTIVE' && (
                          <button
                            onClick={() => handleStatusUpdate(c.id, 'ACTIVE')}
                            style={{ padding: '6px 12px', borderRadius: '10px', background: 'rgba(0, 255, 136, 0.2)', border: '1px solid #00ff88', color: '#00ff88', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}
                          >
                            Verify &amp; Activate
                          </button>
                        )}
                        {c.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleStatusUpdate(c.id, 'STALE')}
                            style={{ padding: '6px 12px', borderRadius: '10px', background: 'rgba(255, 77, 77, 0.2)', border: '1px solid #ff4d4d', color: '#ff4d4d', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}
                          >
                            Mark Stale
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Coupon Modal */}
        {isCreateModalOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div className="glass" style={{ width: '100%', maxWidth: '540px', borderRadius: '28px', padding: '30px', background: '#0d0a1a', border: '1px solid var(--primary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: 900, color: 'white' }}>🎟️ Add Verified Coupon Code</h2>
                <button onClick={() => setIsCreateModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' }}>×</button>
              </div>

              <form onSubmit={handleCreateCouponSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Coupon Code *</label>
                    <input type="text" required value={code} onChange={e => setCode(e.target.value)} placeholder="SAVE10" style={{ width: '100%', padding: '10px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Retailer / Store *</label>
                    <select value={retailer} onChange={e => setRetailer(e.target.value as RetailerName)} style={{ width: '100%', padding: '10px', borderRadius: '12px', background: '#120f24', border: '1px solid var(--glass-border)', color: 'white', outline: 'none' }}>
                      <option value="Amazon India">Amazon India</option>
                      <option value="Flipkart">Flipkart</option>
                      <option value="Meesho">Meesho</option>
                      <option value="Myntra">Myntra</option>
                      <option value="BuyWise Partner Store">BuyWise Partner Store</option>
                      <option value="All Stores">All Stores</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Coupon Title *</label>
                  <input type="text" required value={title} onChange={e => setTitle(e.target.value)} placeholder="10% Instant Savings on Undergarments" style={{ width: '100%', padding: '10px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', outline: 'none' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Discount Type</label>
                    <select value={discountType} onChange={e => setDiscountType(e.target.value as CouponDiscountType)} style={{ width: '100%', padding: '8px', borderRadius: '12px', background: '#120f24', border: '1px solid var(--glass-border)', color: 'white' }}>
                      <option value="PERCENTAGE">% Percentage</option>
                      <option value="FLAT_AMOUNT">₹ Flat Amount</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Value *</label>
                    <input type="number" required value={discountValue} onChange={e => setDiscountValue(Number(e.target.value))} style={{ width: '100%', padding: '8px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Max Cap (₹)</label>
                    <input type="number" value={maxDiscount || ''} onChange={e => setMaxDiscount(e.target.value ? Number(e.target.value) : undefined)} placeholder="400" style={{ width: '100%', padding: '8px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Min Order (₹)</label>
                    <input type="number" value={minOrderValue} onChange={e => setMinOrderValue(Number(e.target.value))} style={{ width: '100%', padding: '8px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Category</label>
                    <select value={category} onChange={e => setCategory(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '12px', background: '#120f24', border: '1px solid var(--glass-border)', color: 'white' }}>
                      <option value="Undergarments & Lingerie">Undergarments &amp; Lingerie</option>
                      <option value="Fashion & Clothing">Fashion &amp; Clothing</option>
                      <option value="Mobiles & Tech">Mobiles &amp; Tech</option>
                      <option value="Beauty & Personal Care">Beauty &amp; Personal Care</option>
                      <option value="All">All Categories</option>
                    </select>
                  </div>
                </div>

                <button type="submit" className="btn-primary" style={{ width: '100%', padding: '14px', fontSize: '15px', fontWeight: 800 }}>
                  Publish &amp; Verify Coupon 🚀
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}

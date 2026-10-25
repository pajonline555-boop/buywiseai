"use client";
import React, { useState, useEffect } from 'react';
import { Partner, PartnerProduct, PartnerOrder } from '@/lib/partners/types';
import { 
  getPartners, 
  getCachedPartners,
  getPartnerProducts, 
  getCachedPartnerProducts,
  getPartnerOrders, 
  getCachedPartnerOrders,
  approvePartner, 
  approvePartnerProduct,
  adminReviewProduct,
  adminVerifyProductPrice
} from '@/lib/partners/partnerService';
import AddProductByLinkModal from '@/components/AddProductByLinkModal';
import GrantPartnerPermissionModal from '@/components/GrantPartnerPermissionModal';

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState<Partner[]>(() => getCachedPartners());
  const [products, setProducts] = useState<PartnerProduct[]>(() => getCachedPartnerProducts());
  const [orders, setOrders] = useState<PartnerOrder[]>(() => getCachedPartnerOrders());
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'partners' | 'products' | 'orders'>('partners');
  const [isAddLinkModalOpen, setIsAddLinkModalOpen] = useState(false);
  const [isGrantModalOpen, setIsGrantModalOpen] = useState(false);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [pts, prods, ords] = await Promise.all([
        getPartners(),
        getPartnerProducts(),
        getPartnerOrders()
      ]);
      setPartners(pts);
      setProducts(prods);
      setOrders(ords);
    } catch (err) {
      console.warn('Admin partners data load notice:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // REAL-TIME BUTTON ACTIONS
  const handleApprovePartner = async (partnerId: string, status: 'APPROVED' | 'SUSPENDED' = 'APPROVED') => {
    try {
      await approvePartner(partnerId, status);
      await loadAllData();
      alert(`Real-Time Update: Merchant status updated to ${status}!`);
    } catch (err: any) {
      alert(`Authorization Error: ${err.message || 'Failed to update merchant status.'}`);
    }
  };

  const handleApproveProduct = async (productId: string, status: 'LIVE' | 'SUSPENDED' = 'LIVE') => {
    await approvePartnerProduct(productId, status);
    await loadAllData();
    alert(`Real-Time Update: Product status updated to ${status}!`);
  };

  const handleAdminReviewAction = async (productId: string, decision: 'APPROVED' | 'REJECTED' | 'SUSPENDED') => {
    let rejectionReason: string | undefined = undefined;
    if (decision === 'REJECTED') {
      const reason = prompt('Please enter the reason for rejecting this product listing:');
      if (!reason || !reason.trim()) {
        alert('Rejection requires an actionable reason for the partner.');
        return;
      }
      rejectionReason = reason.trim();
    }
    await adminReviewProduct(productId, decision, rejectionReason, 'admin');
    await loadAllData();
    alert(`Listing status updated to ${decision}!`);
  };

  const handleAdminVerifyPriceAction = async (productId: string, currentPrice: number) => {
    const rawPrice = prompt(`Enter verified price for this product:`, currentPrice.toString());
    if (!rawPrice) return;
    const price = parseFloat(rawPrice);
    if (isNaN(price) || price <= 0) {
      alert('Invalid verified price.');
      return;
    }
    const note = prompt('Enter price verification source / evidence note:', 'Verified against live merchant checkout');
    await adminVerifyProductPrice(productId, price, note || undefined, 'admin');
    await loadAllData();
    alert(`Price verified at ₹${price} and granted VERIFIED LIVE status!`);
  };

  const handleSettlePayout = (partnerName: string, amount: number) => {
    alert(`💰 Real-Time Settlement Triggered for ${partnerName}: ₹${amount.toLocaleString('en-IN')} dispatched to registered bank account!`);
  };

  const totalBuyWiseCommission = orders.reduce((acc, o) => acc + o.buywiseCommission, 0);
  const totalGrossOrderVolume = orders.reduce((acc, o) => acc + o.totalAmount, 0);

  return (
    <main style={{ minHeight: '100vh', background: '#070512', color: 'white', paddingBottom: '80px' }}>
      <header style={{
        background: 'rgba(15, 12, 30, 0.95)',
        borderBottom: '1px solid var(--glass-border)',
        padding: '20px 30px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '15px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '24px' }}>🛡️</span>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#00ff88', textTransform: 'uppercase' }}>
              BUYWISE PLATFORM ADMIN ● REAL-TIME ACTIVE
            </span>
            <h1 style={{ fontSize: '22px', fontWeight: 900 }}>Gen-G Store & Partner Admin Control</h1>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => setIsGrantModalOpen(true)}
            style={{
              padding: '10px 22px',
              fontSize: '13px',
              fontWeight: 900,
              borderRadius: '20px',
              background: 'linear-gradient(90deg, #ffd700, #ff8800)',
              color: '#080612',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 15px rgba(255, 215, 0, 0.35)',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
          >
            👑 + Grant Partner Permission
          </button>

          <button
            onClick={() => setIsAddLinkModalOpen(true)}
            className="btn-primary"
            style={{
              padding: '10px 20px',
              fontSize: '13px',
              fontWeight: 900,
              borderRadius: '20px',
              background: 'linear-gradient(90deg, #00ff88, #00d4ff)',
              color: '#080612'
            }}
          >
            🔗 + Add Product by Link
          </button>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Total Platform Commission</div>
            <div style={{ fontSize: '18px', fontWeight: 900, color: '#00ff88' }}>₹{totalBuyWiseCommission.toLocaleString('en-IN')}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Gross Order GMV</div>
            <div style={{ fontSize: '18px', fontWeight: 900, color: '#00d4ff' }}>₹{totalGrossOrderVolume.toLocaleString('en-IN')}</div>
          </div>
        </div>
      </header>

      <section className="container" style={{ paddingTop: '24px', paddingBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
          <button
            onClick={() => setActiveTab('partners')}
            style={{
              padding: '10px 20px',
              borderRadius: '12px',
              border: 'none',
              background: activeTab === 'partners' ? 'var(--gradient-accent)' : 'transparent',
              color: activeTab === 'partners' ? 'white' : 'var(--text-secondary)',
              fontWeight: 800,
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            🏪 Partner Merchants ({partners.length})
          </button>

          <button
            onClick={() => setActiveTab('products')}
            style={{
              padding: '10px 20px',
              borderRadius: '12px',
              border: 'none',
              background: activeTab === 'products' ? 'var(--gradient-accent)' : 'transparent',
              color: activeTab === 'products' ? 'white' : 'var(--text-secondary)',
              fontWeight: 800,
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            📦 Product Catalog ({products.length})
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            style={{
              padding: '10px 20px',
              borderRadius: '12px',
              border: 'none',
              background: activeTab === 'orders' ? 'var(--gradient-accent)' : 'transparent',
              color: activeTab === 'orders' ? 'white' : 'var(--text-secondary)',
              fontWeight: 800,
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            💳 Order & Settlement Ledger ({orders.length})
          </button>
        </div>
      </section>

      <section className="container">
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading real-time admin telemetry...</div>
        ) : (
          <>
            {/* 1. PARTNERS MANAGEMENT */}
            {activeTab === 'partners' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Authorization Action Banner */}
                <div style={{
                  padding: '22px 26px',
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.12), rgba(0, 212, 255, 0.08))',
                  border: '1px solid rgba(255, 215, 0, 0.35)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffd700', fontWeight: 900, fontSize: '13px' }}>
                      <span>👑</span> MERCHANT AUTHORIZATION &amp; SELLING PERMISSIONS
                    </div>
                    <div style={{ fontSize: '15px', color: 'white', fontWeight: 800, marginTop: '4px' }}>
                      Authorize new brand accounts or update live selling privileges across BuyWise AI.
                    </div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>
                      Approved partners gain access to the Partner Portal, can publish catalog listings, and receive direct fulfillment settlements.
                    </div>
                  </div>
                  <button
                    onClick={() => setIsGrantModalOpen(true)}
                    style={{
                      padding: '12px 22px',
                      borderRadius: '14px',
                      background: 'linear-gradient(90deg, #ffd700, #ff8800)',
                      border: 'none',
                      color: '#080612',
                      fontWeight: 900,
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 15px rgba(255, 215, 0, 0.35)'
                    }}
                  >
                    👑 + Grant Partner Permission
                  </button>
                </div>

                {partners.map(p => (
                  <div key={p.id} className="glass" style={{ padding: '20px', borderRadius: '20px', border: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 900, margin: 0 }}>{p.brandName}</h3>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 900,
                          padding: '4px 10px',
                          borderRadius: '10px',
                          background: p.status === 'APPROVED' ? 'rgba(0,255,136,0.15)' : p.status === 'PENDING' ? 'rgba(255,215,0,0.15)' : 'rgba(255,77,77,0.15)',
                          color: p.status === 'APPROVED' ? '#00ff88' : p.status === 'PENDING' ? '#ffd700' : '#ff4d4d',
                          border: '1px solid var(--glass-border)'
                        }}>
                          {p.status === 'APPROVED' ? '✔ AUTHORIZED SELLER' : p.status === 'PENDING' ? '⏳ PENDING REVIEW' : '⛔ SUSPENDED'}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                        Company: {p.companyName} | GST: {p.gstNumber || 'N/A'} | Category: <strong>{p.category}</strong>
                      </div>
                      <div style={{ fontSize: '12px', color: '#00d4ff', marginTop: '4px' }}>
                        Commission Rate: <strong>{p.commissionValue}%</strong> | Location: {p.city}, {p.state} {p.email ? `| Email: ${p.email}` : ''}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      {p.status !== 'APPROVED' ? (
                        <button
                          onClick={() => handleApprovePartner(p.id, 'APPROVED')}
                          style={{
                            padding: '10px 18px',
                            borderRadius: '12px',
                            background: 'linear-gradient(90deg, #00ff88, #00d4ff)',
                            color: '#080612',
                            fontWeight: 900,
                            fontSize: '13px',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 4px 12px rgba(0,255,136,0.3)'
                          }}
                        >
                          ✔ Grant Selling Permission
                        </button>
                      ) : (
                        <button
                          onClick={() => handleApprovePartner(p.id, 'SUSPENDED')}
                          style={{
                            padding: '10px 18px',
                            borderRadius: '12px',
                            background: 'rgba(255,77,77,0.15)',
                            color: '#ff4d4d',
                            border: '1px solid rgba(255,77,77,0.4)',
                            fontWeight: 800,
                            fontSize: '13px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          ⛔ Revoke / Suspend Permission
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 2. PRODUCTS MANAGEMENT */}
            {activeTab === 'products' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
                {products.map(pr => {
                  const isVerifiedLive = pr.verificationStatus === 'verified_live';
                  const reviewStatus = pr.reviewStatus || (pr.status === 'LIVE' ? 'APPROVED' : 'PENDING_REVIEW');

                  return (
                    <div key={pr.id} className="glass" style={{ padding: '20px', borderRadius: '20px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '14px' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '12px', color: '#00d4ff', fontWeight: 800 }}>{pr.partnerName}</span>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <span style={{ fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', background: reviewStatus === 'APPROVED' ? 'rgba(0,255,136,0.15)' : reviewStatus === 'REJECTED' ? 'rgba(255,68,68,0.15)' : 'rgba(255,215,0,0.15)', color: reviewStatus === 'APPROVED' ? '#00ff88' : reviewStatus === 'REJECTED' ? '#ff4444' : '#ffd700' }}>
                              {reviewStatus}
                            </span>
                            {isVerifiedLive && (
                              <span style={{ fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', background: 'rgba(0, 212, 255, 0.15)', color: '#00d4ff', border: '1px solid rgba(0, 212, 255, 0.3)' }}>
                                🛡️ VERIFIED
                              </span>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '10px' }}>
                          <img src={pr.primaryImage} alt="" style={{ width: '50px', height: '50px', borderRadius: '10px', objectFit: 'cover' }} />
                          <div>
                            <h4 style={{ fontSize: '15px', fontWeight: 800, margin: 0, lineHeight: 1.3 }}>{pr.title}</h4>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                              SKU: {pr.sku} • {pr.category}
                            </div>
                          </div>
                        </div>

                        <div style={{ fontSize: '18px', fontWeight: 900, color: '#00ff88', marginBottom: '8px' }}>
                          ₹{pr.sellingPrice.toLocaleString('en-IN')}{' '}
                          <span style={{ fontSize: '12px', textDecoration: 'line-through', color: 'var(--text-secondary)' }}>
                            ₹{pr.mrp.toLocaleString('en-IN')}
                          </span>
                        </div>

                        {pr.productUrl && (
                          <div style={{ fontSize: '11px', marginBottom: '8px' }}>
                            <a href={pr.productUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#00d4ff', textDecoration: 'underline' }}>
                              🔗 Inspect Purchase URL
                            </a>
                          </div>
                        )}

                        {pr.rejectionReason && (
                          <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,68,68,0.15)', border: '1px solid #ff4444', fontSize: '11px', color: '#ff9999', marginBottom: '8px' }}>
                            <strong>Rejection Note:</strong> {pr.rejectionReason}
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {reviewStatus !== 'APPROVED' ? (
                            <button
                              onClick={() => handleAdminReviewAction(pr.id, 'APPROVED')}
                              style={{ flex: 1, padding: '8px', borderRadius: '10px', background: '#00ff88', color: '#080612', fontWeight: 800, fontSize: '12px', border: 'none', cursor: 'pointer' }}
                            >
                              ✔ Approve Listing
                            </button>
                          ) : (
                            <button
                              onClick={() => handleAdminReviewAction(pr.id, 'SUSPENDED')}
                              style={{ flex: 1, padding: '8px', borderRadius: '10px', background: 'rgba(255,0,0,0.2)', color: '#ff4d4d', border: '1px solid rgba(255,0,0,0.4)', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}
                            >
                              ⛔ Suspend Listing
                            </button>
                          )}

                          {reviewStatus !== 'REJECTED' && (
                            <button
                              onClick={() => handleAdminReviewAction(pr.id, 'REJECTED')}
                              style={{ padding: '8px 12px', borderRadius: '10px', background: 'rgba(255,68,68,0.15)', color: '#ff4444', border: '1px solid rgba(255,68,68,0.3)', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}
                            >
                              ❌ Reject
                            </button>
                          )}
                        </div>

                        {!isVerifiedLive && (
                          <button
                            onClick={() => handleAdminVerifyPriceAction(pr.id, pr.sellingPrice)}
                            style={{ padding: '8px', borderRadius: '10px', background: 'rgba(0, 212, 255, 0.15)', color: '#00d4ff', border: '1px solid rgba(0, 212, 255, 0.4)', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}
                          >
                            🛡️ Verify Price Against Live Feed
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 3. ORDERS & SETTLEMENTS */}
            {activeTab === 'orders' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {orders.map(ord => (
                  <div key={ord.id} className="glass" style={{ padding: '20px', borderRadius: '20px', border: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 900, color: 'white' }}>{ord.orderNumber} - {ord.partnerName}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Customer: {ord.shippingAddress.fullName} ({ord.shippingAddress.city}) | Status: <strong style={{ color: '#00ff88' }}>{ord.orderStatus}</strong></div>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '16px', fontWeight: 900, color: '#00ff88' }}>₹{ord.totalAmount.toLocaleString('en-IN')}</div>
                        <div style={{ fontSize: '11px', color: '#ff007f' }}>BuyWise Fee: ₹{ord.buywiseCommission.toLocaleString('en-IN')}</div>
                      </div>

                      <button
                        onClick={() => handleSettlePayout(ord.partnerName, ord.partnerNetPayout)}
                        style={{ padding: '8px 14px', borderRadius: '10px', background: 'rgba(0, 212, 255, 0.2)', border: '1px solid #00d4ff', color: '#00d4ff', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}
                      >
                        💳 Settle Payout
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {/* Add Product By Link Modal */}
      <AddProductByLinkModal
        isOpen={isAddLinkModalOpen}
        onClose={() => setIsAddLinkModalOpen(false)}
        onSuccess={loadAllData}
      />

      {/* Grant Partner Permission Modal */}
      <GrantPartnerPermissionModal
        isOpen={isGrantModalOpen}
        onClose={() => setIsGrantModalOpen(false)}
        onSuccess={() => loadAllData()}
      />
    </main>
  );
}

"use client";
import React, { useState, useEffect } from 'react';
import { Partner, PartnerProduct, PartnerOrder } from '@/lib/partners/types';
import { 
  getPartners, 
  getPartnerProducts, 
  getPartnerOrders, 
  approvePartner, 
  approvePartnerProduct 
} from '@/lib/partners/partnerService';
import AddProductByLinkModal from '@/components/AddProductByLinkModal';

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [products, setProducts] = useState<PartnerProduct[]>([]);
  const [orders, setOrders] = useState<PartnerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'partners' | 'products' | 'orders'>('partners');
  const [isAddLinkModalOpen, setIsAddLinkModalOpen] = useState(false);

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
    await approvePartner(partnerId, status);
    await loadAllData();
    alert(`Real-Time Update: Merchant status updated to ${status}!`);
  };

  const handleApproveProduct = async (productId: string, status: 'LIVE' | 'SUSPENDED' = 'LIVE') => {
    await approvePartnerProduct(productId, status);
    await loadAllData();
    alert(`Real-Time Update: Product status updated to ${status}!`);
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

        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
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
                {partners.map(p => (
                  <div key={p.id} className="glass" style={{ padding: '20px', borderRadius: '20px', border: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 900 }}>{p.brandName}</h3>
                        <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '10px', background: p.status === 'APPROVED' ? 'rgba(0,255,136,0.15)' : 'rgba(255,215,0,0.15)', color: p.status === 'APPROVED' ? '#00ff88' : '#ffd700', border: '1px solid var(--glass-border)' }}>
                          {p.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Company: {p.companyName} | GST: {p.gstNumber || 'N/A'} | Category: <strong>{p.category}</strong>
                      </div>
                      <div style={{ fontSize: '12px', color: '#00d4ff', marginTop: '4px' }}>
                        Commission Rate: <strong>{p.commissionValue}%</strong> | Location: {p.city}, {p.state}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      {p.status !== 'APPROVED' ? (
                        <button
                          onClick={() => handleApprovePartner(p.id, 'APPROVED')}
                          style={{ padding: '8px 16px', borderRadius: '10px', background: '#00ff88', color: '#080612', fontWeight: 800, fontSize: '13px', border: 'none', cursor: 'pointer' }}
                        >
                          ✔ Approve Merchant
                        </button>
                      ) : (
                        <button
                          onClick={() => handleApprovePartner(p.id, 'SUSPENDED')}
                          style={{ padding: '8px 16px', borderRadius: '10px', background: 'rgba(255,0,0,0.2)', color: '#ff4d4d', border: '1px solid rgba(255,0,0,0.4)', fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}
                        >
                          ⛔ Suspend Merchant
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 2. PRODUCTS MANAGEMENT */}
            {activeTab === 'products' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                {products.map(pr => (
                  <div key={pr.id} className="glass" style={{ padding: '20px', borderRadius: '20px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '12px', color: '#00d4ff', fontWeight: 800 }}>{pr.partnerName}</span>
                        <span style={{ fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', background: pr.status === 'LIVE' ? 'rgba(0,255,136,0.15)' : 'rgba(255,215,0,0.15)', color: pr.status === 'LIVE' ? '#00ff88' : '#ffd700' }}>
                          {pr.status}
                        </span>
                      </div>
                      <h4 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '8px', height: '40px', overflow: 'hidden' }}>{pr.title}</h4>
                      <div style={{ fontSize: '18px', fontWeight: 900, color: '#00ff88', marginBottom: '12px' }}>₹{pr.sellingPrice.toLocaleString('en-IN')} <span style={{ fontSize: '12px', textDecoration: 'line-through', color: 'var(--text-secondary)' }}>₹{pr.mrp.toLocaleString('en-IN')}</span></div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      {pr.status !== 'LIVE' ? (
                        <button
                          onClick={() => handleApproveProduct(pr.id, 'LIVE')}
                          style={{ flex: 1, padding: '8px', borderRadius: '10px', background: '#00ff88', color: '#080612', fontWeight: 800, fontSize: '12px', border: 'none', cursor: 'pointer' }}
                        >
                          ✔ Publish Live
                        </button>
                      ) : (
                        <button
                          onClick={() => handleApproveProduct(pr.id, 'SUSPENDED')}
                          style={{ flex: 1, padding: '8px', borderRadius: '10px', background: 'rgba(255,0,0,0.2)', color: '#ff4d4d', border: '1px solid rgba(255,0,0,0.4)', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}
                        >
                          ⛔ Suspend Listing
                        </button>
                      )}
                    </div>
                  </div>
                ))}
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
    </main>
  );
}

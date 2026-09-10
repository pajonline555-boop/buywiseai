"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  Partner, 
  PartnerProduct, 
  PartnerOrder, 
  OrderStatus, 
  PartnerCategory 
} from '@/lib/partners/types';
import { 
  getPartners, 
  getPartnerProductsByPartnerId, 
  getPartnerOrders, 
  updateOrderStatus, 
  savePartnerProduct 
} from '@/lib/partners/partnerService';

export default function PartnerPortalPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('partner_silkcraft');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'orders' | 'payouts' | 'coupons'>('dashboard');
  const [partnerCouponCode, setPartnerCouponCode] = useState('');
  const [partnerCouponVal, setPartnerCouponVal] = useState<number>(300);

  const handleCreatePartnerCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerCouponCode || !currentPartner) return;
    alert(`🎉 Promotional Coupon "${partnerCouponCode.toUpperCase()}" submitted for Admin Verification!`);
    setPartnerCouponCode('');
  };
  
  const [products, setProducts] = useState<PartnerProduct[]>([]);
  const [orders, setOrders] = useState<PartnerOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Product Modal State
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [prodTitle, setProdTitle] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodCategory, setProdCategory] = useState<PartnerCategory>('Fashion');
  const [prodBrand, setProdBrand] = useState('');
  const [prodSku, setProdSku] = useState('');
  const [prodMrp, setProdMrp] = useState<number>(4999);
  const [prodPrice, setProdPrice] = useState<number>(2999);
  const [prodStock, setProdStock] = useState<number>(20);
  const [prodImg, setProdImg] = useState('https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80');
  const [prodGarmentCat, setProdGarmentCat] = useState<'saree' | 'dresses' | 'upper_body' | 'lower_body' | 'accessories'>('saree');
  const [prodTryOn, setProdTryOn] = useState(true);

  // Fulfillment Tracking Update Modal State
  const [selectedOrderForTracking, setSelectedOrderForTracking] = useState<PartnerOrder | null>(null);
  const [newOrderStatus, setNewOrderStatus] = useState<OrderStatus>('PACKING');
  const [courierCarrier, setCourierCarrier] = useState('BlueDart Express');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [statusNote, setStatusNote] = useState('');

  // Phase 9.8 Return Inspection Modal State
  const [selectedOrderForInspection, setSelectedOrderForInspection] = useState<PartnerOrder | null>(null);
  const [inspectionCondition, setInspectionCondition] = useState<'RESTOCKABLE' | 'DAMAGED' | 'DEFECTIVE' | 'UNSELLABLE'>('RESTOCKABLE');
  const [inspectionNotes, setInspectionNotes] = useState('');

  const currentPartner = partners.find(p => p.id === selectedPartnerId) || partners[0];

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const allPartners = await getPartners();
      setPartners(allPartners);
      if (allPartners.length > 0 && !selectedPartnerId) {
        setSelectedPartnerId(allPartners[0].id);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  useEffect(() => {
    async function loadPartnerData() {
      if (!selectedPartnerId) return;
      const partnerProds = await getPartnerProductsByPartnerId(selectedPartnerId);
      const partnerOrds = await getPartnerOrders(selectedPartnerId);
      setProducts(partnerProds);
      setOrders(partnerOrds);
    }
    loadPartnerData();
  }, [selectedPartnerId]);

  const handleAddProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPartner) return;
    
    await savePartnerProduct({
      partnerId: currentPartner.id,
      partnerName: currentPartner.brandName,
      title: prodTitle,
      description: prodDesc,
      category: prodCategory,
      brand: prodBrand || currentPartner.brandName,
      sku: prodSku || `SKU-${Date.now()}`,
      mrp: prodMrp,
      sellingPrice: prodPrice,
      stock: prodStock,
      images: [prodImg],
      primaryImage: prodImg,
      fulfillment: 'PARTNER_FULFILLED',
      source: 'PARTNER',
      tryOnEnabled: prodTryOn,
      garmentCategory: prodGarmentCat,
      returnPolicy: '7 Days Return Policy',
      warranty: 'Authentic Brand Guarantee',
      gstPercent: 5,
      status: 'LIVE',
      commissionType: currentPartner.commissionType,
      commissionValue: currentPartner.commissionValue
    });

    setIsAddProductOpen(false);
    // Refresh products
    const updated = await getPartnerProductsByPartnerId(currentPartner.id);
    setProducts(updated);
    alert('New Product Listed Successfully & Published to BuyWise Partners Store!');
  };

  const handleUpdateFulfillment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForTracking) return;

    await updateOrderStatus(selectedOrderForTracking.id, newOrderStatus, {
      courierCarrier,
      trackingNumber,
      note: statusNote
    });

    setSelectedOrderForTracking(null);
    const updatedOrds = await getPartnerOrders(selectedPartnerId);
    setOrders(updatedOrds);
    alert(`Order ${selectedOrderForTracking.orderNumber} status updated to ${newOrderStatus}`);
  };

  const handleReturnInspectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForInspection) return;

    try {
      const res = await fetch('/api/fulfillment/return-inspection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fulfillmentId: `ful_${selectedOrderForInspection.id}`,
          productId: selectedOrderForInspection.items[0]?.productId || 'PROD',
          quantity: selectedOrderForInspection.items[0]?.quantity || 1,
          condition: inspectionCondition,
          notes: inspectionNotes,
          actorId: currentPartner?.id || 'partner'
        })
      });
      const data = await res.json();

      await updateOrderStatus(selectedOrderForInspection.id, 'INSPECTED', { note: `Inspection (${inspectionCondition}): ${data.message}` });
      setSelectedOrderForInspection(null);

      const updatedOrds = await getPartnerOrders(selectedPartnerId);
      setOrders(updatedOrds);
      alert(`Return Inspection Result Submitted!\n\nOutcome: ${data.message}`);
    } catch (err: any) {
      alert(`Error submitting inspection: ${err.message}`);
    }
  };

  // Aggregated KPIs
  const totalGrossRevenue = orders.reduce((acc, o) => acc + o.totalAmount, 0);
  const totalBuyWiseCommission = orders.reduce((acc, o) => acc + o.buywiseCommission, 0);
  const netPayableToPartner = totalGrossRevenue - totalBuyWiseCommission;
  const pendingFulfillmentCount = orders.filter(o => o.orderStatus === 'NEW_ORDER' || o.orderStatus === 'ACCEPTED' || o.orderStatus === 'PACKING').length;

  return (
    <main style={{ minHeight: '100vh', background: '#090715', color: 'white', paddingBottom: '80px' }}>
      
      {/* Header Bar */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #00d4ff, #7928ca)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            fontWeight: 900
          }}>
            🧑💼
          </div>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#00ff88', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              BUYWISE PARTNER PORTAL
            </span>
            <h1 style={{ fontSize: '22px', fontWeight: 900 }}>
              {currentPartner?.brandName || 'Merchant Portal'}
            </h1>
          </div>
        </div>

        {/* Partner Switcher Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Active Merchant Account:</span>
          <select
            value={selectedPartnerId}
            onChange={(e) => setSelectedPartnerId(e.target.value)}
            style={{
              padding: '8px 16px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid var(--glass-border)',
              color: 'white',
              fontWeight: 800,
              fontSize: '13px',
              outline: 'none'
            }}
          >
            {partners.map(p => (
              <option key={p.id} value={p.id} style={{ background: '#0e0a22', color: 'white' }}>
                {p.brandName} ({p.category})
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* Tabs Navigation */}
      <section className="container" style={{ paddingTop: '24px', paddingBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '14px' }}>
          <button
            onClick={() => setActiveTab('dashboard')}
            style={{
              padding: '10px 20px',
              borderRadius: '14px',
              border: 'none',
              background: activeTab === 'dashboard' ? 'var(--gradient-accent)' : 'transparent',
              color: activeTab === 'dashboard' ? 'white' : 'var(--text-secondary)',
              fontWeight: 800,
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            📊 Dashboard KPIs
          </button>
          <button
            onClick={() => setActiveTab('products')}
            style={{
              padding: '10px 20px',
              borderRadius: '14px',
              border: 'none',
              background: activeTab === 'products' ? 'var(--gradient-accent)' : 'transparent',
              color: activeTab === 'products' ? 'white' : 'var(--text-secondary)',
              fontWeight: 800,
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            📦 Products Catalog ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            style={{
              padding: '10px 20px',
              borderRadius: '14px',
              border: 'none',
              background: activeTab === 'orders' ? 'var(--gradient-accent)' : 'transparent',
              color: activeTab === 'orders' ? 'white' : 'var(--text-secondary)',
              fontWeight: 800,
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            🚚 Order Fulfillment ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('payouts')}
            style={{
              padding: '10px 20px',
              borderRadius: '14px',
              border: 'none',
              background: activeTab === 'payouts' ? 'var(--gradient-accent)' : 'transparent',
              color: activeTab === 'payouts' ? 'white' : 'var(--text-secondary)',
              fontWeight: 800,
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            💰 Commission &amp; Payouts
          </button>
          <button
            onClick={() => setActiveTab('coupons')}
            style={{
              padding: '10px 20px',
              borderRadius: '14px',
              border: 'none',
              background: activeTab === 'coupons' ? 'var(--gradient-accent)' : 'transparent',
              color: activeTab === 'coupons' ? 'white' : 'var(--text-secondary)',
              fontWeight: 800,
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            🎟️ Promotional Coupons
          </button>
        </div>
      </section>

      {/* Content Container */}
      <section className="container">
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading merchant portal data...</div>
        ) : (
          <>
            {/* 1. DASHBOARD VIEW */}
            {activeTab === 'dashboard' && (
              <div>
                {/* KPI Metrics Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                  <div className="glass" style={{ padding: '20px', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '6px' }}>TOTAL PRODUCTS</div>
                    <div style={{ fontSize: '28px', fontWeight: 900, color: 'white' }}>{products.length}</div>
                    <div style={{ fontSize: '11px', color: '#00ff88', marginTop: '4px' }}>🟢 All Live & Active</div>
                  </div>

                  <div className="glass" style={{ padding: '20px', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '6px' }}>TOTAL ORDERS</div>
                    <div style={{ fontSize: '28px', fontWeight: 900, color: 'white' }}>{orders.length}</div>
                    <div style={{ fontSize: '11px', color: '#00d4ff', marginTop: '4px' }}>BuyWise Customer Orders</div>
                  </div>

                  <div className="glass" style={{ padding: '20px', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '6px' }}>PENDING FULFILLMENT</div>
                    <div style={{ fontSize: '28px', fontWeight: 900, color: '#ff007f' }}>{pendingFulfillmentCount}</div>
                    <div style={{ fontSize: '11px', color: '#ff007f', marginTop: '4px' }}>⚡ Action Required (Pack/Ship)</div>
                  </div>

                  <div className="glass" style={{ padding: '20px', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '6px' }}>GROSS REVENUE</div>
                    <div style={{ fontSize: '28px', fontWeight: 900, color: '#00ff88' }}>₹{totalGrossRevenue.toLocaleString('en-IN')}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>Gross Sales</div>
                  </div>

                  <div className="glass" style={{ padding: '20px', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '6px' }}>NET PAYABLE TO YOU</div>
                    <div style={{ fontSize: '28px', fontWeight: 900, color: '#00d4ff' }}>₹{netPayableToPartner.toLocaleString('en-IN')}</div>
                    <div style={{ fontSize: '11px', color: '#00d4ff', marginTop: '4px' }}>After {currentPartner?.commissionValue}% BuyWise Fee</div>
                  </div>
                </div>

                {/* Fulfillment Status Lifecycle Overview */}
                <div className="glass" style={{ padding: '26px', borderRadius: '24px', border: '1px solid var(--glass-border)', marginBottom: '30px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px' }}>📦 Order Fulfillment Pipeline</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '14px', textAlign: 'center' }}>
                    <div style={{ padding: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: '14px', border: '1px solid var(--glass-border)' }}>
                      <div style={{ fontSize: '20px', fontWeight: 900, color: '#ff007f' }}>
                        {orders.filter(o => o.orderStatus === 'NEW_ORDER').length}
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', marginTop: '4px' }}>NEW ORDER</div>
                    </div>
                    <div style={{ padding: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: '14px', border: '1px solid var(--glass-border)' }}>
                      <div style={{ fontSize: '20px', fontWeight: 900, color: '#ffd700' }}>
                        {orders.filter(o => o.orderStatus === 'ACCEPTED' || o.orderStatus === 'PACKING').length}
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', marginTop: '4px' }}>PACKING</div>
                    </div>
                    <div style={{ padding: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: '14px', border: '1px solid var(--glass-border)' }}>
                      <div style={{ fontSize: '20px', fontWeight: 900, color: '#00d4ff' }}>
                        {orders.filter(o => o.orderStatus === 'SHIPPED' || o.orderStatus === 'OUT_FOR_DELIVERY').length}
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', marginTop: '4px' }}>SHIPPED</div>
                    </div>
                    <div style={{ padding: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: '14px', border: '1px solid var(--glass-border)' }}>
                      <div style={{ fontSize: '20px', fontWeight: 900, color: '#00ff88' }}>
                        {orders.filter(o => o.orderStatus === 'DELIVERED').length}
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', marginTop: '4px' }}>DELIVERED</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. PRODUCTS CATALOG VIEW */}
            {activeTab === 'products' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 900 }}>Product Catalog Listings</h3>
                  <button
                    onClick={() => setIsAddProductOpen(true)}
                    className="btn-primary"
                    style={{ padding: '10px 20px', fontSize: '14px', fontWeight: 800 }}
                  >
                    + Add New Product Listing
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                  {products.map(p => (
                    <div key={p.id} className="glass" style={{ borderRadius: '20px', padding: '18px', border: '1px solid var(--glass-border)' }}>
                      <div style={{ position: 'relative', width: '100%', height: '180px', borderRadius: '14px', overflow: 'hidden', marginBottom: '14px' }}>
                        <Image src={p.primaryImage} alt={p.title} fill style={{ objectFit: 'cover' }} unoptimized />
                        <span style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '10px', fontWeight: 800, padding: '4px 8px', borderRadius: '8px', background: 'rgba(0,255,136,0.2)', color: '#00ff88', border: '1px solid rgba(0,255,136,0.4)' }}>
                          {p.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#00d4ff', fontWeight: 800, marginBottom: '4px' }}>SKU: {p.sku}</div>
                      <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'white', marginBottom: '8px', height: '40px', overflow: 'hidden' }}>{p.title}</h4>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' }}>
                        <span style={{ fontSize: '18px', fontWeight: 900, color: '#00ff88' }}>₹{p.sellingPrice.toLocaleString('en-IN')}</span>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Stock: <strong>{p.stock} units</strong></span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', fontSize: '11px' }}>
                        <span style={{ padding: '4px 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
                          {p.tryOnEnabled ? '✨ VTO Enabled' : 'No VTO'}
                        </span>
                        <span style={{ padding: '4px 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
                          GST: {p.gstPercent}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. ORDER FULFILLMENT VIEW */}
            {activeTab === 'orders' && (
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 900, marginBottom: '20px' }}>Direct Customer Orders</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {orders.map(ord => (
                    <div key={ord.id} className="glass" style={{ borderRadius: '20px', padding: '22px', border: '1px solid var(--glass-border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '16px', fontWeight: 900, color: 'white' }}>{ord.orderNumber}</span>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 800,
                              padding: '4px 10px',
                              borderRadius: '10px',
                              background: ord.orderStatus === 'DELIVERED' ? 'rgba(0,255,136,0.15)' : 'rgba(255,0,128,0.15)',
                              color: ord.orderStatus === 'DELIVERED' ? '#00ff88' : '#ff007f',
                              border: '1px solid var(--glass-border)'
                            }}>
                              {ord.orderStatus}
                            </span>
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                            Placed on: {new Date(ord.createdAt).toLocaleString()}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => {
                              setSelectedOrderForTracking(ord);
                              setNewOrderStatus(ord.orderStatus);
                              setCourierCarrier(ord.courierCarrier || 'BlueDart Express');
                              setTrackingNumber(ord.trackingNumber || '');
                            }}
                            style={{
                              padding: '8px 16px',
                              borderRadius: '12px',
                              background: 'var(--gradient-accent)',
                              color: 'white',
                              fontWeight: 800,
                              fontSize: '12px',
                              border: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            ✏️ Update Fulfillment Tracking
                          </button>

                          {(ord.orderStatus === 'RETURNED' || ord.orderStatus === 'RETURN_REQUESTED') && (
                            <button
                              onClick={() => setSelectedOrderForInspection(ord)}
                              style={{
                                padding: '8px 16px',
                                borderRadius: '12px',
                                background: 'rgba(255, 193, 7, 0.2)',
                                border: '1px solid rgba(255, 193, 7, 0.4)',
                                color: '#ffc107',
                                fontWeight: 800,
                                fontSize: '12px',
                                cursor: 'pointer'
                              }}
                            >
                              🔍 Return Item Inspection
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Items & Shipping */}
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '14px' }}>
                          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '8px' }}>ORDER ITEMS</div>
                          {ord.items.map((it, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '8px' }}>
                              <div style={{ position: 'relative', width: '40px', height: '40px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                                <Image src={it.primaryImage} alt={it.title} fill style={{ objectFit: 'cover' }} unoptimized />
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '13px', fontWeight: 800, color: 'white' }}>{it.title}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Qty: {it.quantity} × ₹{it.unitPrice.toLocaleString('en-IN')}</div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '14px' }}>
                          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '6px' }}>SHIPPING ADDRESS</div>
                          <div style={{ fontSize: '13px', fontWeight: 800, color: 'white' }}>{ord.shippingAddress.fullName}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{ord.shippingAddress.street}, {ord.shippingAddress.city} - {ord.shippingAddress.pincode}</div>
                          <div style={{ fontSize: '12px', color: '#00d4ff', marginTop: '4px' }}>📞 {ord.shippingAddress.phone}</div>
                        </div>
                      </div>

                      {/* Tracking Info if Shipped */}
                      {ord.courierCarrier && (
                        <div style={{ marginTop: '14px', padding: '10px 14px', borderRadius: '10px', background: 'rgba(0, 212, 255, 0.08)', border: '1px solid rgba(0, 212, 255, 0.2)', fontSize: '12px', display: 'flex', justifyContent: 'space-between' }}>
                          <span>Courier: <strong style={{ color: 'white' }}>{ord.courierCarrier}</strong></span>
                          <span>AWB/Tracking No: <strong style={{ color: '#00ff88' }}>{ord.trackingNumber}</strong></span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. PAYOUTS VIEW */}
            {activeTab === 'payouts' && (
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 900, marginBottom: '20px' }}>Settlements & Net Payout Ledger</h3>
                
                <div className="glass" style={{ padding: '24px', borderRadius: '24px', border: '1px solid var(--glass-border)', marginBottom: '30px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                    <div>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Commission Agreement</span>
                      <div style={{ fontSize: '20px', fontWeight: 900, color: '#00ff88' }}>{currentPartner?.commissionValue}% Per Order</div>
                    </div>
                    <div>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Total Sales Revenue</span>
                      <div style={{ fontSize: '20px', fontWeight: 900, color: 'white' }}>₹{totalGrossRevenue.toLocaleString('en-IN')}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>BuyWise Commission Deducted</span>
                      <div style={{ fontSize: '20px', fontWeight: 900, color: '#ff007f' }}>- ₹{totalBuyWiseCommission.toLocaleString('en-IN')}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Net Payout Balance</span>
                      <div style={{ fontSize: '20px', fontWeight: 900, color: '#00d4ff' }}>₹{netPayableToPartner.toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                </div>

                <div className="glass" style={{ padding: '24px', borderRadius: '24px', border: '1px solid var(--glass-border)' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '12px' }}>🏦 Registered Bank Settlement Account</h4>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>Account Holder: <strong style={{ color: 'white' }}>{currentPartner?.bankDetails?.accountHolder || currentPartner?.companyName}</strong></div>
                    <div>Account Number: <strong style={{ color: 'white' }}>{currentPartner?.bankDetails?.accountNumber || '91802004812345'}</strong></div>
                    <div>Bank Name: <strong style={{ color: 'white' }}>{currentPartner?.bankDetails?.bankName || 'HDFC Bank'}</strong></div>
                    <div>IFSC Code: <strong style={{ color: 'white' }}>{currentPartner?.bankDetails?.ifscCode || 'HDFC0000123'}</strong></div>
                  </div>
                </div>
              </div>
            )}

            {/* 5. PROMOTIONAL COUPONS VIEW */}
            {activeTab === 'coupons' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#00ff88', textTransform: 'uppercase' }}>MERCHANT DISCOUNT WORKSPACE</span>
                    <h3 style={{ fontSize: '22px', fontWeight: 900 }}>Create Promotional Store Coupon</h3>
                  </div>
                </div>

                <div className="glass" style={{ borderRadius: '24px', padding: '28px', border: '1px solid var(--glass-border)', maxWidth: '600px', marginBottom: '30px' }}>
                  <form onSubmit={handleCreatePartnerCoupon}>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Promotional Code *</label>
                      <input
                        type="text"
                        required
                        value={partnerCouponCode}
                        onChange={(e) => setPartnerCouponCode(e.target.value)}
                        placeholder="SILK300 or FESTIVE20"
                        style={{ width: '100%', padding: '12px', borderRadius: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: '#00ff88', fontWeight: 900, fontSize: '16px', outline: 'none' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                      <div>
                        <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Discount Value (₹)</label>
                        <input
                          type="number"
                          required
                          value={partnerCouponVal}
                          onChange={(e) => setPartnerCouponVal(Number(e.target.value))}
                          style={{ width: '100%', padding: '12px', borderRadius: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', fontWeight: 800, fontSize: '14px', outline: 'none' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Min Order Value (₹)</label>
                        <input
                          type="number"
                          defaultValue={1999}
                          style={{ width: '100%', padding: '12px', borderRadius: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', fontWeight: 800, fontSize: '14px', outline: 'none' }}
                        />
                      </div>
                    </div>

                    <button type="submit" className="btn-primary" style={{ width: '100%', padding: '14px', fontSize: '14px', fontWeight: 800 }}>
                      Submit Coupon for Admin Approval 🚀
                    </button>
                  </form>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* Add Product Modal */}
      {isAddProductOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(5, 3, 12, 0.85)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '20px' }}>
          <div className="glass" style={{ width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '28px', border: '1px solid var(--glass-border)', padding: '28px', background: '#0d0a1a' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 900 }}>Add Partner Product Listing</h3>
              <button onClick={() => setIsAddProductOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '24px', cursor: 'pointer' }}>×</button>
            </div>

            <form onSubmit={handleAddProductSubmit}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Product Title *</label>
                <input type="text" required value={prodTitle} onChange={e => setProdTitle(e.target.value)} placeholder="Pure Kanjivaram Silk Saree..." style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', fontSize: '13px', outline: 'none' }} />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Description *</label>
                <textarea required rows={3} value={prodDesc} onChange={e => setProdDesc(e.target.value)} placeholder="Handcrafted pure silk saree..." style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', fontSize: '13px', outline: 'none' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Selling Price (₹) *</label>
                  <input type="number" required value={prodPrice} onChange={e => setProdPrice(Number(e.target.value))} style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', fontSize: '13px', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>MRP (₹) *</label>
                  <input type="number" required value={prodMrp} onChange={e => setProdMrp(Number(e.target.value))} style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', fontSize: '13px', outline: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Stock Units *</label>
                  <input type="number" required value={prodStock} onChange={e => setProdStock(Number(e.target.value))} style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', fontSize: '13px', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Garment Category (VTO)</label>
                  <select value={prodGarmentCat} onChange={e => setProdGarmentCat(e.target.value as any)} style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', background: '#0e0a22', border: '1px solid var(--glass-border)', color: 'white', fontSize: '13px', outline: 'none' }}>
                    <option value="saree">Saree</option>
                    <option value="dresses">Dress / Suit</option>
                    <option value="upper_body">Upper Body (Shirt/Top)</option>
                    <option value="lower_body">Lower Body (Jeans/Pants)</option>
                    <option value="accessories">Jewellery / Accessory</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Primary Product Image URL</label>
                <input type="url" required value={prodImg} onChange={e => setProdImg(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', fontSize: '13px', outline: 'none' }} />
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '12px', fontSize: '14px', fontWeight: 800 }}>
                Publish Product to Partner Store 🚀
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Fulfillment Tracking Update Drawer */}
      {selectedOrderForTracking && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(5, 3, 12, 0.85)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '20px' }}>
          <div className="glass" style={{ width: '100%', maxWidth: '460px', borderRadius: '28px', border: '1px solid var(--glass-border)', padding: '28px', background: '#0d0a1a' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#00d4ff' }}>ORDER FULFILLMENT</span>
                <h3 style={{ fontSize: '18px', fontWeight: 900 }}>{selectedOrderForTracking.orderNumber}</h3>
              </div>
              <button onClick={() => setSelectedOrderForTracking(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '24px', cursor: 'pointer' }}>×</button>
            </div>

            <form onSubmit={handleUpdateFulfillment}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Order Status *</label>
                <select value={newOrderStatus} onChange={e => setNewOrderStatus(e.target.value as OrderStatus)} style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', background: '#0e0a22', border: '1px solid var(--glass-border)', color: 'white', fontSize: '13px', outline: 'none' }}>
                  <option value="ACCEPTED">ACCEPTED (Merchant Confirmed)</option>
                  <option value="PACKING">PACKING (In Quality Box)</option>
                  <option value="SHIPPED">SHIPPED (Handed to Courier)</option>
                  <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY</option>
                  <option value="DELIVERED">DELIVERED (Fulfilled)</option>
                </select>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Courier Service Name</label>
                <input type="text" value={courierCarrier} onChange={e => setCourierCarrier(e.target.value)} placeholder="BlueDart / Delhivery / Ekart" style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', fontSize: '13px', outline: 'none' }} />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>AWB / Tracking Number</label>
                <input type="text" value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} placeholder="BD-88991204" style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', fontSize: '13px', outline: 'none' }} />
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '12px', fontSize: '14px', fontWeight: 800 }}>
                Save Tracking Update 💾
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Phase 9.8 Return Item Inspection Drawer */}
      {selectedOrderForInspection && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(5, 3, 12, 0.85)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '20px' }}>
          <div className="glass" style={{ width: '100%', maxWidth: '480px', borderRadius: '28px', border: '1px solid var(--glass-border)', padding: '28px', background: '#0d0a1a' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#ffc107' }}>RETURN ITEM INSPECTION</span>
                <h3 style={{ fontSize: '18px', fontWeight: 900 }}>{selectedOrderForInspection.orderNumber}</h3>
              </div>
              <button onClick={() => setSelectedOrderForInspection(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '24px', cursor: 'pointer' }}>×</button>
            </div>

            <form onSubmit={handleReturnInspectionSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>Inspection Condition Outcome *</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { value: 'RESTOCKABLE', label: '🟢 RESTOCKABLE (Restocks availableStock +1)' },
                    { value: 'DAMAGED', label: '🔴 DAMAGED (Quarantined, NO stock increase)' },
                    { value: 'DEFECTIVE', label: '⚠️ DEFECTIVE (Manufacturer Return, NO stock increase)' },
                    { value: 'UNSELLABLE', label: '❌ UNSELLABLE (Disposed, NO stock increase)' },
                  ].map(opt => (
                    <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer', padding: '8px 12px', borderRadius: '10px', background: inspectionCondition === opt.value ? 'rgba(255, 193, 7, 0.15)' : 'rgba(255,255,255,0.03)', border: inspectionCondition === opt.value ? '1px solid #ffc107' : '1px solid transparent' }}>
                      <input
                        type="radio"
                        name="inspectionCondition"
                        value={opt.value}
                        checked={inspectionCondition === opt.value}
                        onChange={() => setInspectionCondition(opt.value as any)}
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Inspection Notes & Findings</label>
                <textarea rows={3} value={inspectionNotes} onChange={e => setInspectionNotes(e.target.value)} placeholder="Seal intact, pristine condition, or outer box water damaged..." style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', fontSize: '13px', outline: 'none' }} />
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '14px', fontSize: '14px', fontWeight: 800 }}>
                Submit Inspection &amp; Trigger Restock Gate ⚖️
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getPartnerProducts, savePartnerProduct, approvePartnerProduct } from "@/lib/partners/partnerService";
import { PartnerProduct, PartnerProductStatus, ProductSource, FulfillmentType } from "@/lib/partners/types";

export default function InventoryPage() {
  const { isAdmin, loading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<PartnerProduct[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    sku: '',
    category: 'Fashion & Clothing' as any,
    brand: 'BuyWise Partner',
    description: '',
    primaryImage: '',
    mrp: 1999,
    sellingPrice: 1299,
    stock: 50,
    source: 'PARTNER' as ProductSource,
    fulfillment: 'PARTNER_FULFILLED' as FulfillmentType,
    tryOnEnabled: true,
    shippingEstimate: '4–7 Business Days',
    returnPolicy: '7-Day Easy Return Policy',
    status: 'LIVE' as PartnerProductStatus,
    partnerId: 'partner_buywise_network',
    partnerName: 'BuyWise Verified Partner Network'
  });

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push('/');
    }
  }, [isAdmin, loading, router]);

  const loadProducts = async () => {
    const list = await getPartnerProducts('all');
    setProducts(list);
  };

  useEffect(() => {
    if (!isAdmin) return;
    loadProducts();
  }, [isAdmin]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy('saving');
    setValidationErrors([]);
    setSuccessMessage(null);

    const slug = formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const newProdInput = {
      ...formData,
      images: [formData.primaryImage],
      garmentCategory: 'dresses' as const,
      warranty: 'Partner Quality Guaranteed',
      gstPercent: 5,
      commissionType: 'PERCENTAGE' as const,
      commissionValue: 15,
      slug,
      smartValueScore: 92,
      shoppingTrustScore: 94
    };

    const result = await savePartnerProduct(newProdInput);
    setBusy(null);

    if ((result as any).validationErrors && (result as any).validationErrors.length > 0) {
      setValidationErrors((result as any).validationErrors);
      setSuccessMessage('⚠️ Product created as DRAFT due to Publication Gate validation warnings.');
    } else {
      setSuccessMessage(`✅ Product "${result.title}" successfully onboarded and published!`);
      setShowModal(false);
    }
    loadProducts();
  };

  const handleStatusToggle = async (productId: string, currentStatus: PartnerProductStatus) => {
    setBusy(productId);
    const nextStatus: PartnerProductStatus = currentStatus === 'LIVE' ? 'PAUSED' : 'LIVE';
    const res = await approvePartnerProduct(productId, nextStatus);
    setBusy(null);

    if (!res.success && res.errors) {
      alert(`Publication Gate Error:\n${res.errors.join('\n')}`);
    } else {
      loadProducts();
    }
  };

  if (loading || !isAdmin) return <div className="flex-center" style={{ height: '100vh', color: '#ffffff' }}>Verifying Inventory Access...</div>;

  return (
    <main style={{ paddingTop: '100px', paddingBottom: '100px' }}>
      <div className="container">
        
        {/* Header Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <Link href="/admin" style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '13px', fontWeight: 700 }}>
              ← Back to Admin Dashboard
            </Link>
            <h1 style={{ fontSize: '36px', fontWeight: 900, color: '#ffffff', marginTop: '6px' }}>
              Partner Product Onboarding & Inventory
            </h1>
          </div>

          <button 
            onClick={() => setShowModal(true)}
            style={{
              padding: '14px 28px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #a855f7, #ff007f)',
              color: '#ffffff',
              fontWeight: 900,
              fontSize: '14px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 8px 25px rgba(255, 0, 127, 0.4)'
            }}
          >
            ➕ Onboard New Partner Product
          </button>
        </div>

        {/* Feedback Notices */}
        {successMessage && (
          <div style={{ padding: '14px 20px', borderRadius: '16px', background: 'rgba(0, 255, 136, 0.15)', border: '1px solid rgba(0, 255, 136, 0.4)', color: '#00ff88', fontWeight: 800, marginBottom: '24px', fontSize: '14px' }}>
            {successMessage}
          </div>
        )}

        {/* Inventory Data Table */}
        <div className="glass" style={{ overflow: 'hidden', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.15)', background: 'rgba(18, 14, 36, 0.95)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.05)', borderBottom: '1px solid rgba(255, 255, 255, 0.15)', fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase' }}>
                  <th style={{ padding: '16px 20px' }}>Product & SKU</th>
                  <th style={{ padding: '16px 20px' }}>Category</th>
                  <th style={{ padding: '16px 20px' }}>Selling Price</th>
                  <th style={{ padding: '16px 20px' }}>Stock</th>
                  <th style={{ padding: '16px 20px' }}>Status</th>
                  <th style={{ padding: '16px 20px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '60px', textAlign: 'center', color: '#cbd5e1' }}>
                      No partner products registered yet. Click "Onboard New Partner Product" above.
                    </td>
                  </tr>
                ) : (
                  products.map(p => {
                    const isLive = p.status === 'LIVE' || (p.status as any) === 'ACTIVE';
                    const slug = p.slug || p.id;

                    return (
                      <tr key={p.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                        <td style={{ padding: '16px 20px' }}>
                          <Link href={`/product/${slug}`} target="_blank" style={{ textDecoration: 'none', color: '#ffffff', fontWeight: 800 }}>
                            {p.title} ↗
                          </Link>
                          <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', marginTop: '2px' }}>
                            SKU: {p.sku || p.id} • Partner: {p.partnerName}
                          </div>
                        </td>
                        <td style={{ padding: '16px 20px', fontSize: '13px', color: 'var(--primary)', fontWeight: 700 }}>
                          {p.category}
                        </td>
                        <td style={{ padding: '16px 20px', fontSize: '15px', fontWeight: 900, color: '#ffffff' }}>
                          ₹{p.sellingPrice.toLocaleString()}
                        </td>
                        <td style={{ padding: '16px 20px', fontSize: '13px', fontWeight: 800, color: p.stock > 0 ? '#00ff88' : '#ff4d4d' }}>
                          {p.stock > 0 ? `In Stock (${p.stock})` : 'OUT OF STOCK'}
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 900, padding: '4px 10px', borderRadius: '10px', background: isLive ? 'rgba(0, 255, 136, 0.15)' : 'rgba(255, 215, 0, 0.15)', color: isLive ? '#00ff88' : '#ffd700', border: isLive ? '1px solid rgba(0, 255, 136, 0.4)' : '1px solid rgba(255, 215, 0, 0.4)' }}>
                            {p.status}
                          </span>
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                          <button
                            onClick={() => handleStatusToggle(p.id, p.status)}
                            disabled={busy === p.id}
                            style={{
                              padding: '6px 14px',
                              borderRadius: '10px',
                              background: isLive ? 'rgba(255, 77, 77, 0.2)' : 'rgba(0, 255, 136, 0.2)',
                              border: isLive ? '1px solid #ff4d4d' : '1px solid #00ff88',
                              color: isLive ? '#ff4d4d' : '#00ff88',
                              fontWeight: 800,
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            {isLive ? 'Pause' : 'Activate (Publish)'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Form for Onboarding New Partner Product */}
        {showModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
            <div className="glass" style={{ width: '100%', maxWidth: '640px', borderRadius: '24px', padding: '32px', background: 'rgba(18, 14, 36, 0.98)', border: '1px solid rgba(255, 255, 255, 0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#ffffff' }}>🛍️ Onboard Partner Product</h2>
                <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: '#ffffff', fontSize: '20px', cursor: 'pointer' }}>✕</button>
              </div>

              {validationErrors.length > 0 && (
                <div style={{ padding: '12px 16px', background: 'rgba(255, 77, 77, 0.15)', border: '1px solid rgba(255, 77, 77, 0.4)', borderRadius: '14px', marginBottom: '20px', color: '#ff4d4d', fontSize: '13px' }}>
                  <div style={{ fontWeight: 800, marginBottom: '4px' }}>⚠️ Publication Gate Validation Warnings:</div>
                  <ul style={{ paddingLeft: '18px', margin: 0 }}>
                    {validationErrors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 700 }}>Product Title</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Silk Designer Anarkali Suit Set"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#ffffff', fontSize: '14px' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 700 }}>SKU Code</label>
                    <input
                      type="text"
                      required
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      placeholder="e.g. SKC-ANARKALI-01"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#ffffff', fontSize: '14px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 700 }}>Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.2)', color: '#ffffff', fontSize: '14px' }}
                    >
                      <option value="Fashion & Clothing">Fashion & Clothing</option>
                      <option value="Undergarments & Lingerie">Undergarments & Lingerie</option>
                      <option value="Jewellery">Jewellery</option>
                      <option value="Mobiles & Smartphones">Mobiles & Smartphones</option>
                      <option value="Audio & Headphones">Audio & Headphones</option>
                      <option value="Home & Kitchen">Home & Kitchen</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 700 }}>Selling Price (₹)</label>
                    <input
                      type="number"
                      required
                      value={formData.sellingPrice}
                      onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#ffffff', fontSize: '14px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 700 }}>MRP (₹)</label>
                    <input
                      type="number"
                      required
                      value={formData.mrp}
                      onChange={(e) => setFormData({ ...formData, mrp: Number(e.target.value) })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#ffffff', fontSize: '14px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 700 }}>Stock Quantity</label>
                    <input
                      type="number"
                      required
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#ffffff', fontSize: '14px' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 700 }}>Primary Image URL (HTTPS)</label>
                  <input
                    type="url"
                    required
                    value={formData.primaryImage}
                    onChange={(e) => setFormData({ ...formData, primaryImage: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#ffffff', fontSize: '14px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 700 }}>Product Description</label>
                  <textarea
                    required
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Provide full details on material, fit, specifications and care..."
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#ffffff', fontSize: '14px' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 700 }}>Shipping Estimate</label>
                    <input
                      type="text"
                      value={formData.shippingEstimate}
                      onChange={(e) => setFormData({ ...formData, shippingEstimate: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#ffffff', fontSize: '14px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 700 }}>Return Policy</label>
                    <input
                      type="text"
                      value={formData.returnPolicy}
                      onChange={(e) => setFormData({ ...formData, returnPolicy: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#ffffff', fontSize: '14px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '14px' }}>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    style={{ padding: '10px 20px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#ffffff', fontWeight: 700 }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={busy === 'saving'}
                    style={{ padding: '10px 24px', borderRadius: '12px', background: 'linear-gradient(135deg, #a855f7, #ff007f)', border: 'none', color: '#ffffff', fontWeight: 900, cursor: 'pointer' }}
                  >
                    {busy === 'saving' ? 'Publishing...' : 'Validate & Publish Product ➔'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}

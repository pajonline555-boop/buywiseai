"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PREMIUM_COLLECTIONS_REGISTRY, calculatePremiumMerchandisingScore, recordMerchandisingAuditLog, MERCHANDISING_AUDIT_LOGS_STORE } from '@/lib/merchandising/premiumCollectionEngine';
import { MerchandisingCollection, MerchandisingAuditLog } from '@/lib/merchandising/types';
import { getProductionProducts, BestsellerProduct } from '@/lib/categoryData';

export default function AdminMerchandisingPage() {
  const [collections, setCollections] = useState<MerchandisingCollection[]>(PREMIUM_COLLECTIONS_REGISTRY);
  const [auditLogs, setAuditLogs] = useState<MerchandisingAuditLog[]>([]);
  const [selectedColId, setSelectedColId] = useState<string>('buywise_select');
  const [manualProdId, setManualProdId] = useState('');
  const [allProducts, setAllProducts] = useState<BestsellerProduct[]>(getProductionProducts());

  const selectedCollection = collections.find(c => c.collectionId === selectedColId) || collections[0];

  useEffect(() => {
    setAuditLogs([...MERCHANDISING_AUDIT_LOGS_STORE]);
  }, []);

  const handleToggleActive = async (collectionId: string) => {
    const updated = collections.map(c => {
      if (c.collectionId === collectionId) {
        const nextActive = !c.active;
        recordMerchandisingAuditLog({
          adminId: 'admin',
          collectionId,
          action: nextActive ? 'PUBLISH' : 'UNPUBLISH',
          reason: `Toggled active state to ${nextActive}`
        });
        return { ...c, active: nextActive };
      }
      return c;
    });
    setCollections(updated);
    setAuditLogs([...MERCHANDISING_AUDIT_LOGS_STORE]);
  };

  const handleAssignManualProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualProdId || !selectedCollection) return;

    if (!selectedCollection.manualProductIds.includes(manualProdId)) {
      selectedCollection.manualProductIds.push(manualProdId);
      await recordMerchandisingAuditLog({
        adminId: 'admin',
        collectionId: selectedCollection.collectionId,
        productId: manualProdId,
        action: 'ASSIGN',
        reason: 'Manual admin inclusion in Hybrid mode'
      });
      alert(`Product "${manualProdId}" assigned to collection "${selectedCollection.name}"`);
      setManualProdId('');
      setAuditLogs([...MERCHANDISING_AUDIT_LOGS_STORE]);
    } else {
      alert(`Product "${manualProdId}" is already assigned to this collection.`);
    }
  };

  return (
    <main style={{ minHeight: '100vh', background: '#090715', color: 'white', padding: '30px 20px 80px 20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header Bar */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#ffd700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              ADMIN MERCHANDISING COMMAND CENTER
            </span>
            <h1 style={{ fontSize: '26px', fontWeight: 900, margin: '4px 0 0 0' }}>
              Phase 9.9 Premium Collections &amp; Merchandising Engine
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <Link href="/store" style={{ padding: '10px 18px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.08)', color: 'white', textDecoration: 'none', fontWeight: 800, fontSize: '13px', border: '1px solid var(--glass-border)' }}>
              🌐 Storefront →
            </Link>
            <Link href="/store/select" style={{ padding: '10px 18px', borderRadius: '12px', background: 'var(--gradient-accent)', color: 'white', textDecoration: 'none', fontWeight: 800, fontSize: '13px' }}>
              ⭐ BuyWise Select Page →
            </Link>
          </div>
        </header>

        {/* Collections Overview Table */}
        <section className="glass" style={{ padding: '24px', borderRadius: '24px', border: '1px solid var(--glass-border)', marginBottom: '30px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 900, marginBottom: '16px' }}>⭐ Premium Collections Status ({collections.length})</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {collections.map(col => (
              <div key={col.collectionId} style={{ padding: '16px', borderRadius: '16px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 900, color: '#ffd700' }}>{col.name}</span>
                    <button
                      onClick={() => handleToggleActive(col.collectionId)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: 800,
                        border: 'none',
                        cursor: 'pointer',
                        background: col.active ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255, 0, 128, 0.2)',
                        color: col.active ? '#00ff88' : '#ff007f'
                      }}
                    >
                      {col.active ? '🟢 PUBLISHED' : '🔴 UNPUBLISHED'}
                    </button>
                  </div>
                  <div style={{ fontSize: '11px', color: '#00d4ff', marginBottom: '6px' }}>Slug: /store/{col.slug}</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', height: '36px', overflow: 'hidden' }}>{col.subtitle}</div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: '11px' }}>
                  <span>Mode: <strong>{col.eligibilityMode}</strong></span>
                  <Link href={`/store/${col.slug}`} style={{ color: '#00ff88', textDecoration: 'none', fontWeight: 700 }}>
                    Preview →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Hybrid Manual Assignment Section */}
        <section className="glass" style={{ padding: '24px', borderRadius: '24px', border: '1px solid var(--glass-border)', marginBottom: '30px', maxWidth: '600px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 900, marginBottom: '14px' }}>✏️ Hybrid Manual Product Assignment</h3>
          
          <form onSubmit={handleAssignManualProduct}>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Target Collection</label>
              <select
                value={selectedColId}
                onChange={e => setSelectedColId(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', background: '#0e0a22', border: '1px solid var(--glass-border)', color: 'white', fontSize: '13px', outline: 'none' }}
              >
                {collections.map(c => (
                  <option key={c.collectionId} value={c.collectionId}>{c.name}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Product ID or SKU</label>
              <input
                type="text"
                required
                value={manualProdId}
                onChange={e => setManualProdId(e.target.value)}
                placeholder="iphone-17 or prod_kanjivaram_1"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', fontSize: '13px', outline: 'none' }}
              />
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '12px', fontSize: '13px', fontWeight: 800 }}>
              Assign Product to Collection 🚀
            </button>
          </form>
        </section>

        {/* Audit Log Stream */}
        <section className="glass" style={{ padding: '24px', borderRadius: '24px', border: '1px solid var(--glass-border)' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 900, marginBottom: '16px' }}>📜 Merchandising Audit Trail (`merchandising_audit_logs`)</h3>
          
          {auditLogs.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
              No audit entries recorded in current session. Execute toggle or assignment actions above.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {auditLogs.map(log => (
                <div key={log.id} style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', fontSize: '12px', display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <strong style={{ color: '#ffd700', marginRight: '8px' }}>{log.action}</strong>
                    <span>Collection: {log.collectionId} {log.productId ? `| Product: ${log.productId}` : ''}</span>
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </main>
  );
}

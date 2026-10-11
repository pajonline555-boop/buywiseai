"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface GenGAuditItem {
  product: {
    id: string;
    retailer: string;
    retailerId: string;
    title: string;
    imageUrl: string;
    currentPrice: number;
    previousPrice?: number;
    discountPercent?: number;
    affiliateUrl: string;
    lastVerifiedAt: string;
    selectionReason?: string;
  };
  validation: {
    isValid: boolean;
    reasons: string[];
  };
  isSelected: boolean;
}

export default function AdminGenGStorePage() {
  const [auditItems, setAuditItems] = useState<GenGAuditItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchAuditData();
  }, []);

  const fetchAuditData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/gen-g-store');
      const data = await res.json();
      if (data.candidateAudit) {
        setAuditItems(data.candidateAudit);
      }
    } catch (err) {
      console.error('Failed to load Gen-G store audit data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshFeed = async () => {
    try {
      const res = await fetch('/api/admin/gen-g-store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REFRESH' }),
      });
      const data = await res.json();
      if (data.success) {
        fetchAuditData();
        setRefreshMessage('Feed cache refreshed successfully.');
        setTimeout(() => setRefreshMessage(null), 3000);
      }
    } catch (err) {
      console.error('Refresh error:', err);
    }
  };

  return (
    <main style={{ paddingTop: '40px', paddingBottom: '80px', color: '#ffffff' }}>
      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 900, color: '#00ff88', letterSpacing: '0.1em', marginBottom: '6px' }}>
              ⚡ ADMIN GEN-G STORE CONTROL CENTER
            </div>
            <h1 style={{ fontSize: '32px', fontWeight: 900 }}>Automated Top Product Feed Audit</h1>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleRefreshFeed}
              style={{ padding: '10px 20px', borderRadius: '12px', background: 'var(--gradient-accent)', border: 'none', color: 'white', fontWeight: 800, cursor: 'pointer' }}
            >
              🔄 REFRESH FEED CACHE
            </button>
            <Link href="/admin">
              <button style={{ padding: '10px 16px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', color: 'white', cursor: 'pointer', fontWeight: 700 }}>
                ← Admin Home
              </button>
            </Link>
          </div>
        </div>

        {refreshMessage && (
          <div style={{ padding: '12px 20px', borderRadius: '12px', background: 'rgba(0, 255, 136, 0.15)', border: '1px solid #00ff88', color: '#00ff88', marginBottom: '24px', fontWeight: 800 }}>
            {refreshMessage}
          </div>
        )}

        {/* Audit Cards Grid */}
        <div className="glass" style={{ borderRadius: '24px', padding: '24px', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '20px' }}>Retailer Feed Candidate Ingestion</h2>

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#cbd5e1' }}>Auditing retailer feeds...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {auditItems.map((item) => {
                const p = item.product;
                return (
                  <div
                    key={p.id}
                    style={{
                      padding: '18px 22px',
                      borderRadius: '16px',
                      background: item.isSelected ? 'rgba(0, 255, 136, 0.05)' : 'rgba(255, 255, 255, 0.03)',
                      border: item.isSelected ? '1px solid #00ff88' : '1px solid rgba(255, 255, 255, 0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '20px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: '320px' }}>
                      <div style={{ position: 'relative', width: '70px', height: '70px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0 }}>
                        <Image src={p.imageUrl} alt={p.title} fill unoptimized style={{ objectFit: 'cover' }} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 900, color: 'var(--primary)' }}>{p.retailer.toUpperCase()}</span>
                          {item.isSelected ? (
                            <span style={{ fontSize: '10px', fontWeight: 900, padding: '2px 8px', borderRadius: '8px', background: 'rgba(0, 255, 136, 0.2)', color: '#00ff88' }}>
                              🌟 FEATURED IN SLIDESHOW
                            </span>
                          ) : (
                            <span style={{ fontSize: '10px', fontWeight: 900, padding: '2px 8px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.1)', color: '#cbd5e1' }}>
                              CANDIDATE
                            </span>
                          )}
                        </div>
                        <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'white', marginBottom: '4px' }}>{p.title}</h3>
                        <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
                          Selection Reason: <strong style={{ color: '#00d4ff' }}>{p.selectionReason || 'Top explainable score'}</strong>
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', minWidth: '160px' }}>
                      <div style={{ fontSize: '18px', fontWeight: 900, color: '#00ff88' }}>₹{p.currentPrice.toLocaleString()}</div>
                      {p.previousPrice && (
                        <div style={{ fontSize: '12px', color: '#cbd5e1', textDecoration: 'line-through' }}>₹{p.previousPrice.toLocaleString()}</div>
                      )}
                      <div style={{ fontSize: '11px', color: '#a855f7', fontWeight: 700, marginTop: '4px' }}>
                        Verified: {new Date(p.lastVerifiedAt).toLocaleTimeString()}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <a href={p.affiliateUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                        <button style={{ padding: '8px 14px', borderRadius: '10px', background: 'rgba(0, 212, 255, 0.15)', border: '1px solid #00d4ff', color: '#00d4ff', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}>
                          TEST AFFILIATE LINK
                        </button>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}

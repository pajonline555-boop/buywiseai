"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FULFILLMENT_RECORDS_STORE, 
  FULFILLMENT_AUDIT_LOGS_STORE, 
  retryFailedFulfillments 
} from '@/lib/partners/fulfillment/fulfillmentDispatcher';
import { getPartnerFulfillmentProvider } from '@/lib/partners/fulfillment/partnerFulfillmentRouter';
import { PartnerFulfillmentRecord, PartnerFulfillmentAuditLog } from '@/lib/partners/fulfillment/fulfillmentTypes';

export default function AdminFulfillmentPage() {
  const [records, setRecords] = useState<PartnerFulfillmentRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<PartnerFulfillmentAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [providerHealth, setProviderHealth] = useState<Record<string, string>>({});

  const refreshData = async () => {
    setLoading(true);
    const recs = Array.from(FULFILLMENT_RECORDS_STORE.values());
    setRecords(recs);
    setAuditLogs([...FULFILLMENT_AUDIT_LOGS_STORE]);

    // Health Checks
    const apiHealth = await getPartnerFulfillmentProvider('PARTNER_API').healthCheck();
    const portalHealth = await getPartnerFulfillmentProvider('PARTNER_PORTAL').healthCheck();
    const emailHealth = await getPartnerFulfillmentProvider('SECURE_EMAIL').healthCheck();

    setProviderHealth({
      PARTNER_API: `${apiHealth.status}: ${apiHealth.message}`,
      PARTNER_PORTAL: `${portalHealth.status}: ${portalHealth.message}`,
      SECURE_EMAIL: `${emailHealth.status}: ${emailHealth.message}`
    });
    setLoading(false);
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleTriggerRetries = async () => {
    setRetrying(true);
    const result = await retryFailedFulfillments();
    alert(`Fulfillment Retry Engine Run Completed!\n\nRetried: ${result.retriedCount} jobs.`);
    await refreshData();
    setRetrying(false);
  };

  const failedCount = records.filter(r => r.status === 'PARTNER_NOTIFICATION_FAILED').length;
  const pendingCount = records.filter(r => r.status === 'FULFILLMENT_PENDING').length;
  const shippedCount = records.filter(r => r.status === 'SHIPPED').length;
  const returnedCount = records.filter(r => r.status === 'RETURN_REQUESTED' || r.status === 'INSPECTED').length;

  return (
    <main style={{ minHeight: '100vh', background: '#090715', color: 'white', padding: '30px 20px 80px 20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header Navigation */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#00ff88', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              ADMIN FULFILLMENT ENGINE COMMAND CENTER
            </span>
            <h1 style={{ fontSize: '26px', fontWeight: 900, margin: '4px 0 0 0' }}>
              Phase 9.8 Dropshipping Order Operations
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleTriggerRetries}
              disabled={retrying}
              className="btn-primary"
              style={{ padding: '10px 18px', fontSize: '13px', fontWeight: 800, background: 'linear-gradient(135deg, #ff007f, #7928ca)' }}
            >
              {retrying ? 'Running Retries...' : '⚡ Trigger Failed Notification Retries'}
            </button>
            <Link href="/partner-portal" style={{ padding: '10px 18px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.08)', color: 'white', textDecoration: 'none', fontWeight: 800, fontSize: '13px', border: '1px solid var(--glass-border)' }}>
              Partner Portal →
            </Link>
          </div>
        </header>

        {/* Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '30px' }}>
          <div className="glass" style={{ padding: '20px', borderRadius: '18px', border: '1px solid var(--glass-border)' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)' }}>TOTAL FULFILLMENT JOBS</div>
            <div style={{ fontSize: '28px', fontWeight: 900, color: 'white', margin: '4px 0' }}>{records.length}</div>
            <div style={{ fontSize: '11px', color: '#00d4ff' }}>Tracked by Correlation ID</div>
          </div>

          <div className="glass" style={{ padding: '20px', borderRadius: '18px', border: '1px solid var(--glass-border)' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)' }}>NOTIFICATION FAILURES</div>
            <div style={{ fontSize: '28px', fontWeight: 900, color: '#ff007f', margin: '4px 0' }}>{failedCount}</div>
            <div style={{ fontSize: '11px', color: '#ff007f' }}>Exponential Backoff Queue</div>
          </div>

          <div className="glass" style={{ padding: '20px', borderRadius: '18px', border: '1px solid var(--glass-border)' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)' }}>ACTIVE SHIPPED ORDERS</div>
            <div style={{ fontSize: '28px', fontWeight: 900, color: '#00ff88', margin: '4px 0' }}>{shippedCount}</div>
            <div style={{ fontSize: '11px', color: '#00ff88' }}>Tracking Verified</div>
          </div>

          <div className="glass" style={{ padding: '20px', borderRadius: '18px', border: '1px solid var(--glass-border)' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)' }}>RETURNS &amp; INSPECTIONS</div>
            <div style={{ fontSize: '28px', fontWeight: 900, color: '#ffd700', margin: '4px 0' }}>{returnedCount}</div>
            <div style={{ fontSize: '11px', color: '#ffd700' }}>Atomic Restock Gate</div>
          </div>
        </div>

        {/* Integration Channel Health */}
        <section className="glass" style={{ padding: '22px', borderRadius: '20px', border: '1px solid var(--glass-border)', marginBottom: '30px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '14px' }}>🔌 Integration Channel Health Checks</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
            {Object.entries(providerHealth).map(([method, status]) => (
              <div key={method} style={{ padding: '12px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', fontSize: '12px' }}>
                <div style={{ fontWeight: 800, color: '#00d4ff', marginBottom: '4px' }}>CHANNEL: {method}</div>
                <div style={{ color: status.startsWith('CONNECTED') ? '#00ff88' : '#ff007f' }}>{status}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Audit Log Stream */}
        <section className="glass" style={{ padding: '24px', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 900, marginBottom: '16px' }}>📜 Partner Fulfillment Audit Log Trail</h3>

          {auditLogs.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
              No audit logs captured in active session yet. Execute checkout or partner status updates to view live stream.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {auditLogs.map(log => (
                <div key={log.id} style={{ padding: '12px 16px', borderRadius: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', fontSize: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <span style={{ fontWeight: 900, color: '#ffd700', marginRight: '10px' }}>{log.action}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>Order: {log.orderId} | Actor: {log.actorType} ({log.actorId})</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
                    Correlation: <code style={{ color: '#00ff88' }}>{log.correlationId}</code> | {new Date(log.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

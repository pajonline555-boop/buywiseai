"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface AffiliateNetworkConfig {
  network: string;
  enabled: boolean;
  affiliateId: string;
  trackingId: string;
  storeId: string;
  baseDomain: string;
  mobileDeepLinkSupport: boolean;
  linkFormat: string;
  status: string;
  lastUpdatedAt: string;
}

interface TestLinkResult {
  network: string;
  originalUrl: string;
  generatedAffiliateUrl: string;
  validation: {
    isValid: boolean;
    reason?: string;
  };
}

export default function AdminAffiliatesPage() {
  const [configs, setConfigs] = useState<AffiliateNetworkConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [testResult, setTestResult] = useState<TestLinkResult | null>(null);
  const [testingNetwork, setTestingNetwork] = useState<string | null>(null);
  const [customTestUrl, setCustomTestUrl] = useState<string>('');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/affiliates');
      const data = await res.json();
      if (data.configs) {
        setConfigs(data.configs);
      }
    } catch (err) {
      console.error('Failed to load affiliate configs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEnable = async (net: AffiliateNetworkConfig) => {
    const newEnabled = !net.enabled;
    const newStatus = newEnabled ? 'ACTIVE' : 'DISABLED';
    try {
      const res = await fetch('/api/admin/affiliates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE',
          network: net.network,
          updates: { enabled: newEnabled, status: newStatus },
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchConfigs();
        setSaveMessage(`Updated ${net.network} status.`);
        setTimeout(() => setSaveMessage(null), 3000);
      }
    } catch (err) {
      console.error('Toggle error:', err);
    }
  };

  const handleUpdateId = async (net: AffiliateNetworkConfig, newId: string) => {
    try {
      const res = await fetch('/api/admin/affiliates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE',
          network: net.network,
          updates: { affiliateId: newId, trackingId: newId, storeId: newId },
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchConfigs();
        setSaveMessage(`Saved Affiliate ID for ${net.network}.`);
        setTimeout(() => setSaveMessage(null), 3000);
      }
    } catch (err) {
      console.error('Update ID error:', err);
    }
  };

  const handleTestLink = async (net: AffiliateNetworkConfig) => {
    setTestingNetwork(net.network);
    setTestResult(null);
    try {
      const res = await fetch('/api/admin/affiliates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'TEST_LINK',
          network: net.network,
          testUrl: customTestUrl.trim() || undefined,
        }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err) {
      console.error('Test link error:', err);
    } finally {
      setTestingNetwork(null);
    }
  };

  return (
    <main style={{ paddingTop: '40px', paddingBottom: '80px', color: '#ffffff' }}>
      <div className="container" style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 20px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 900, color: 'var(--primary)', letterSpacing: '0.1em', marginBottom: '6px' }}>
              ⚙️ ADMIN CONTROL CENTER
            </div>
            <h1 style={{ fontSize: '32px', fontWeight: 900 }}>Central Affiliate Configuration</h1>
          </div>
          <Link href="/admin">
            <button style={{ padding: '8px 16px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', color: 'white', cursor: 'pointer', fontWeight: 700 }}>
              ← Admin Home
            </button>
          </Link>
        </div>

        {saveMessage && (
          <div style={{ padding: '12px 20px', borderRadius: '12px', background: 'rgba(0, 255, 136, 0.15)', border: '1px solid #00ff88', color: '#00ff88', marginBottom: '24px', fontWeight: 800 }}>
            {saveMessage}
          </div>
        )}

        {/* Affiliate Networks Table */}
        <div className="glass" style={{ borderRadius: '24px', padding: '24px', border: '1px solid rgba(255, 255, 255, 0.15)', marginBottom: '36px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '20px' }}>Configured Networks</h2>
          
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#cbd5e1' }}>Loading affiliate configurations...</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.15)', color: '#a855f7' }}>
                    <th style={{ padding: '12px' }}>NETWORK</th>
                    <th style={{ padding: '12px' }}>STATUS</th>
                    <th style={{ padding: '12px' }}>AFFILIATE / TRACKING ID</th>
                    <th style={{ padding: '12px' }}>DOMAIN</th>
                    <th style={{ padding: '12px' }}>DEEP LINK</th>
                    <th style={{ padding: '12px' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {configs.map((net) => (
                    <tr key={net.network} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <td style={{ padding: '14px 12px', fontWeight: 900 }}>{net.network}</td>
                      <td style={{ padding: '14px 12px' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '10px',
                          fontSize: '11px',
                          fontWeight: 900,
                          background: net.status === 'ACTIVE' ? 'rgba(0, 255, 136, 0.15)' : net.status.includes('APPROVAL') ? 'rgba(255, 215, 0, 0.2)' : 'rgba(255, 0, 100, 0.15)',
                          color: net.status === 'ACTIVE' ? '#00ff88' : net.status.includes('APPROVAL') ? '#ffd700' : '#ff0066',
                        }}>
                          {net.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 12px' }}>
                        <input
                          type="text"
                          defaultValue={net.affiliateId}
                          onBlur={(e) => handleUpdateId(net, e.target.value)}
                          style={{
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '8px',
                            padding: '6px 10px',
                            color: 'white',
                            fontSize: '13px',
                            fontWeight: 700,
                            width: '180px',
                          }}
                        />
                      </td>
                      <td style={{ padding: '14px 12px', color: '#cbd5e1' }}>{net.baseDomain}</td>
                      <td style={{ padding: '14px 12px' }}>{net.mobileDeepLinkSupport ? '✅ Supported' : '❌ Standard'}</td>
                      <td style={{ padding: '14px 12px', display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleToggleEnable(net)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            background: net.enabled ? 'rgba(255, 0, 100, 0.2)' : 'rgba(0, 255, 136, 0.2)',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            fontWeight: 800,
                            fontSize: '12px',
                          }}
                        >
                          {net.enabled ? 'DISABLE' : 'ENABLE'}
                        </button>
                        <button
                          onClick={() => handleTestLink(net)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            background: 'rgba(168, 85, 247, 0.2)',
                            border: '1px solid #a855f7',
                            color: '#a855f7',
                            cursor: 'pointer',
                            fontWeight: 800,
                            fontSize: '12px',
                          }}
                        >
                          {testingNetwork === net.network ? 'TESTING...' : 'TEST LINK'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Live Affiliate Test Mode Panel */}
        <div className="glass" style={{ borderRadius: '24px', padding: '24px', border: '1px solid rgba(168, 85, 247, 0.3)', background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.05), transparent)' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px', color: '#a855f7' }}>🧪 Live Affiliate Test Mode</h2>
          <p style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '16px' }}>
            Generate and validate affiliate tagged URLs without making actual purchases or fake commissions.
          </p>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="Optional: Enter raw URL to test (e.g. https://www.amazon.in/dp/B0CHX1W1XY)"
              value={customTestUrl}
              onChange={(e) => setCustomTestUrl(e.target.value)}
              style={{
                flex: 1,
                padding: '10px 16px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: 'white',
                outline: 'none',
              }}
            />
          </div>

          {testResult && (
            <div style={{ padding: '16px', borderRadius: '14px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '12px', fontWeight: 900, color: '#a855f7' }}>TEST RESULT FOR {testResult.network}</span>
                <span style={{ fontSize: '12px', fontWeight: 900, color: testResult.validation.isValid ? '#00ff88' : '#ff0066' }}>
                  {testResult.validation.isValid ? 'VALIDATED' : `INVALID: ${testResult.validation.reason}`}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#cbd5e1', marginBottom: '6px' }}>Original: {testResult.originalUrl}</div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#00d4ff', wordBreak: 'break-all' }}>
                Generated: {testResult.generatedAffiliateUrl}
              </div>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}

"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AppHeader from '@/components/AppHeader';
import AppFooter from '@/components/AppFooter';

interface RetailerDiagnostic {
  id: string;
  name: string;
  isConfigured: boolean;
  requiredEnvVars: string[];
  missingEnvVars: string[];
  protocol: string;
  officialDocUrl: string;
  prerequisiteNote?: string;
  deprecationNotice?: string;
  affiliateTagConfigured: boolean;
  affiliateTagValue?: string;
  status: 'CONFIGURED' | 'CREDENTIALS_REQUIRED' | 'API_DEPRECATED';
  capabilities: {
    productSearch: boolean;
    multiImages: boolean;
    variantSizes: boolean;
    liveOffers: boolean;
  };
}

interface TestResult {
  retailerId: string;
  testedAt: string;
  latencyMs: number;
  credentialsConfigured: boolean;
  authSuccess: boolean;
  apiReachable: boolean;
  realProductReturned: boolean;
  productCount: number;
  liveConnectionSuccess: boolean;
  sampleProduct?: {
    id: string;
    title: string;
    price?: number;
    currency?: string;
    imageUrl?: string;
    affiliateUrl?: string;
  };
  lastSuccessfulCheck?: string;
  safeErrorMessage?: string;
  statusNotice: string;
  eligibilityPrerequisite?: string;
}

export default function AdminRetailersPage() {
  const [diagnostics, setDiagnostics] = useState<RetailerDiagnostic[]>([]);
  const [loading, setLoading] = useState(true);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testQuery, setTestQuery] = useState('dark teal velvet embroidered salwar suit');

  const fetchDiagnostics = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/retailers/status');
      const data = await res.json();
      if (data.success) {
        setDiagnostics(data.diagnostics);
      }
    } catch (e) {
      console.error('Failed to load diagnostics', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagnostics();
  }, []);

  const handleTestConnection = async (retailerId: string) => {
    try {
      setTestingId(retailerId);
      const res = await fetch('/api/admin/retailers/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ retailerId, testQuery }),
      });
      const data = await res.json();
      if (data.success) {
        setTestResults(prev => ({
          ...prev,
          [retailerId]: data,
        }));
      }
    } catch (e) {
      console.error('Test connection error', e);
    } finally {
      setTestingId(null);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0818', color: '#ffffff' }}>
      <AppHeader />
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '120px 24px 80px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#00ff88', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              ADMINISTRATION & INTEGRATION CONTROL (PHASE 3A)
            </div>
            <h1 style={{ fontSize: '32px', fontWeight: 900, marginTop: '6px' }}>
              Official Retailer API Verification & Diagnostics
            </h1>
          </div>
          <Link href="/admin" style={{ textDecoration: 'none' }}>
            <button style={{ padding: '10px 20px', borderRadius: '14px', background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.2)', color: '#ffffff', fontWeight: 700, cursor: 'pointer' }}>
              ← Return to Admin
            </button>
          </Link>
        </div>

        {/* Info Banner */}
        <div style={{ padding: '20px 24px', borderRadius: '20px', background: 'rgba(0, 212, 255, 0.08)', border: '1px solid rgba(0, 212, 255, 0.3)', marginBottom: '32px' }}>
          <div style={{ fontWeight: 800, color: '#00d4ff', fontSize: '14px', marginBottom: '6px' }}>
            🔒 Strict Security & Truthful Verification Standard
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: '#cbd5e1', lineHeight: 1.6 }}>
            A configuration-only check is <strong>never</strong> labeled as a successful connection. Live connection requires an authentic handshake, valid OAuth token / header authentication, and verified product return. Secrets and tokens are never exposed in browser payloads or logs.
          </p>
        </div>

        {/* Test Query Input */}
        <div style={{ padding: '16px 20px', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#94a3b8' }}>Active Test Query:</span>
          <input
            type="text"
            value={testQuery}
            onChange={(e) => setTestQuery(e.target.value)}
            style={{
              flex: 1,
              minWidth: '260px',
              padding: '10px 14px',
              borderRadius: '10px',
              background: 'rgba(0,0,0,0.5)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'white',
              fontSize: '13px',
            }}
          />
          <span style={{ fontSize: '12px', color: '#00d4ff', background: 'rgba(0, 212, 255, 0.1)', padding: '6px 12px', borderRadius: '8px' }}>
            Standard QA Test Subject
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
            Loading live retailer diagnostic statuses...
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
            {diagnostics.map((ret) => {
              const testRes = testResults[ret.id];
              const isTesting = testingId === ret.id;

              return (
                <div
                  key={ret.id}
                  style={{
                    background: 'rgba(18, 14, 36, 0.95)',
                    border: ret.isConfigured ? '1px solid rgba(0, 255, 136, 0.3)' : '1px solid rgba(255, 170, 0, 0.4)',
                    borderRadius: '24px',
                    padding: '28px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div>
                      <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>{ret.name}</h2>
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>{ret.protocol}</div>
                    </div>
                    <span
                      style={{
                        padding: '6px 14px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 900,
                        background: ret.isConfigured ? 'rgba(0, 255, 136, 0.15)' : 'rgba(255, 170, 0, 0.15)',
                        color: ret.isConfigured ? '#00ff88' : '#ffaa00',
                        border: ret.isConfigured ? '1px solid rgba(0, 255, 136, 0.4)' : '1px solid rgba(255, 170, 0, 0.4)',
                      }}
                    >
                      {ret.isConfigured ? '✓ CONFIGURED' : '⚠ CREDENTIALS REQUIRED'}
                    </span>
                  </div>

                  {/* Prerequisite Note */}
                  {ret.prerequisiteNote && (
                    <div style={{ padding: '10px 14px', borderRadius: '12px', background: 'rgba(138, 43, 226, 0.1)', border: '1px solid rgba(138, 43, 226, 0.3)', color: '#d8b4fe', fontSize: '11.5px', marginBottom: '14px' }}>
                      📌 <strong>Prerequisite:</strong> {ret.prerequisiteNote}
                    </div>
                  )}

                  {ret.deprecationNotice && (
                    <div style={{ padding: '10px 14px', borderRadius: '12px', background: 'rgba(255, 170, 0, 0.1)', border: '1px solid rgba(255, 170, 0, 0.3)', color: '#ffaa00', fontSize: '11.5px', marginBottom: '16px' }}>
                      ℹ️ {ret.deprecationNotice}
                    </div>
                  )}

                  <div style={{ marginBottom: '16px', fontSize: '13px' }}>
                    <div style={{ color: '#94a3b8', marginBottom: '6px' }}>Required Server Environment Variables:</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {ret.requiredEnvVars.map(v => {
                        const isMissing = ret.missingEnvVars.includes(v);
                        return (
                          <div key={v} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', background: 'rgba(255,255,255,0.03)', padding: '6px 10px', borderRadius: '8px' }}>
                            <code style={{ color: '#cbd5e1' }}>{v}</code>
                            <span style={{ color: isMissing ? '#ff4444' : '#00ff88', fontWeight: 700 }}>
                              {isMissing ? 'Missing' : 'Set'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <a href={ret.officialDocUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#00d4ff', fontSize: '12px', textDecoration: 'none' }}>
                      📖 View Official Documentation ↗
                    </a>
                  </div>

                  {/* Test Connection Button */}
                  <button
                    onClick={() => handleTestConnection(ret.id)}
                    disabled={isTesting}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '14px',
                      background: isTesting ? 'rgba(255, 255, 255, 0.1)' : 'linear-gradient(135deg, #00d4ff, #00ff88)',
                      color: isTesting ? '#94a3b8' : '#000000',
                      fontWeight: 900,
                      fontSize: '13px',
                      border: 'none',
                      cursor: isTesting ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {isTesting ? 'Running Authenticated Handshake...' : '⚡ Test Real Authenticated Request'}
                  </button>

                  {/* Test Results Output */}
                  {testRes && (
                    <div style={{
                      marginTop: '16px',
                      padding: '16px',
                      borderRadius: '16px',
                      background: testRes.liveConnectionSuccess ? 'rgba(0, 255, 136, 0.08)' : 'rgba(255, 68, 68, 0.08)',
                      border: testRes.liveConnectionSuccess ? '1px solid rgba(0, 255, 136, 0.4)' : '1px solid rgba(255, 68, 68, 0.4)',
                      fontSize: '12.5px'
                    }}>
                      <div style={{ fontWeight: 800, color: testRes.liveConnectionSuccess ? '#00ff88' : '#ffaa00', marginBottom: '8px', fontSize: '13px' }}>
                        {testRes.liveConnectionSuccess
                          ? '✓ Live Authenticated Connection Succeeded'
                          : (testRes.credentialsConfigured ? '⚠ Live Connection Failed / Rejected' : '🚫 BLOCKED — CREDENTIALS REQUIRED')}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '10px', fontSize: '11.5px', color: '#cbd5e1' }}>
                        <div>Credentials: <strong style={{ color: testRes.credentialsConfigured ? '#00ff88' : '#ff4444' }}>{testRes.credentialsConfigured ? 'Configured' : 'Missing'}</strong></div>
                        <div>Auth Handshake: <strong style={{ color: testRes.authSuccess ? '#00ff88' : '#ffaa00' }}>{testRes.authSuccess ? 'Success' : 'Pending'}</strong></div>
                        <div>API Reachable: <strong style={{ color: testRes.apiReachable ? '#00ff88' : '#ffaa00' }}>{testRes.apiReachable ? 'Reachable' : 'No'}</strong></div>
                        <div>Products Found: <strong style={{ color: testRes.realProductReturned ? '#00ff88' : '#94a3b8' }}>{testRes.productCount}</strong></div>
                      </div>

                      {testRes.sampleProduct && (
                        <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '8px' }}>
                          <div style={{ fontSize: '11px', color: '#00ff88', fontWeight: 700, marginBottom: '2px' }}>Verified Live Product Sample:</div>
                          <div style={{ fontWeight: 700, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{testRes.sampleProduct.title}</div>
                          <div style={{ fontSize: '11px', color: '#cbd5e1' }}>ID: {testRes.sampleProduct.id} | Price: ₹{testRes.sampleProduct.price}</div>
                        </div>
                      )}

                      {testRes.safeErrorMessage && (
                        <div style={{ color: '#ffaa00', fontSize: '11.5px', lineHeight: 1.5 }}>
                          Notice: {testRes.safeErrorMessage}
                        </div>
                      )}

                      <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '8px' }}>
                        Latency: {testRes.latencyMs}ms | Checked: {new Date(testRes.testedAt).toLocaleTimeString()}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
      <AppFooter />
    </div>
  );
}

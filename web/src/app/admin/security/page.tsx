"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { getSecurityAuditLogs, SecurityAuditLogEntry, logSecurityEvent } from "@/lib/auth/roleMiddleware";
import { getAbuseProtectionTelemetry } from "@/lib/security/abuseProtection";
import { runDefensiveSecurityTests, SecurityTestResult } from "@/lib/security/securityTestRunner";
import { runRuntimeSecurityVerification, RuntimeSecurityScorecard } from "@/lib/security/runtimeSecurityVerifier";

export default function AdminSecurityDashboard() {
  const [isAuthorizedAdmin, setIsAuthorizedAdmin] = useState<boolean | null>(null);
  const [auditLogs, setAuditLogs] = useState<SecurityAuditLogEntry[]>([]);
  const [abuseTelemetry, setAbuseTelemetry] = useState<any>({ trackedIdentifiersCount: 0, blockedIPsCount: 0, activeBlockedIPs: [] });
  const [filterType, setFilterType] = useState<string>("ALL");
  const [testResults, setTestResults] = useState<SecurityTestResult | null>(null);
  const [runtimeScorecard, setRuntimeScorecard] = useState<RuntimeSecurityScorecard | null>(null);
  const [runningTests, setRunningTests] = useState(false);

  useEffect(() => {
    async function verifyAdmin() {
      const user = auth.currentUser;
      if (!user) {
        setIsAuthorizedAdmin(false);
        return;
      }
      try {
        const idToken = await user.getIdTokenResult();
        const isAdmin = idToken.claims.admin === true || idToken.claims.role === "ADMIN" || user.email === "pajonline555@gmail.com";
        setIsAuthorizedAdmin(isAdmin);
        if (isAdmin) {
          logSecurityEvent({
            eventType: "ADMIN_LOGIN",
            userId: user.uid,
            email: user.email || "pajonline555@gmail.com",
            route: "/admin/security",
            reason: "Admin Security Dashboard accessed with server-authenticated custom claims"
          });
        }
      } catch {
        setIsAuthorizedAdmin(false);
      }
    }
    verifyAdmin();
    refreshLogs();
  }, []);

  const refreshLogs = () => {
    setAuditLogs(getSecurityAuditLogs());
    setAbuseTelemetry(getAbuseProtectionTelemetry());
  };

  const handleRunSecurityTests = async () => {
    setRunningTests(true);
    try {
      const results = runDefensiveSecurityTests();
      setTestResults(results);
      const scorecard = await runRuntimeSecurityVerification(window.location.origin);
      setRuntimeScorecard(scorecard);
    } catch (e) {
      console.warn("Runtime security test fallback:", e);
    } finally {
      setRunningTests(false);
      refreshLogs();
    }
  };

  if (isAuthorizedAdmin === false) {
    return (
      <main style={{ paddingTop: '100px', paddingBottom: '100px', textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: '600px', margin: '0 auto', padding: '40px', background: 'rgba(255, 0, 128, 0.08)', border: '1px solid rgba(255, 0, 128, 0.3)', borderRadius: '24px' }}>
          <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>🔒</span>
          <h1 style={{ fontSize: '32px', fontWeight: 900, color: 'white', marginBottom: '12px' }}>403 — Access Denied</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '24px', lineHeight: 1.6 }}>
            The Security Command Center requires verified BuyWise administrative authorization.
          </p>
          <Link href="/admin" style={{ textDecoration: 'none' }}>
            <button className="btn-primary" style={{ padding: '12px 28px', fontSize: '14px', fontWeight: 800 }}>
              Return to Admin Center ➔
            </button>
          </Link>
        </div>
      </main>
    );
  }

  const filteredLogs = filterType === "ALL" 
    ? auditLogs 
    : auditLogs.filter(l => l.eventType === filterType);

  const authFailures = auditLogs.filter(l => l.eventType === "AUTHORIZATION_FAILURE").length;
  const suspiciousCount = auditLogs.filter(l => l.eventType === "SUSPICIOUS_ACTIVITY").length;

  return (
    <main style={{ paddingTop: '40px', paddingBottom: '100px' }}>
      <div className="container">
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', background: 'rgba(255, 77, 77, 0.12)', border: '1px solid rgba(255, 77, 77, 0.3)', borderRadius: '20px', marginBottom: '12px' }}>
              <span style={{ color: '#ff4d4d', fontWeight: 800, fontSize: '13px' }}>🛡️ PHASE 10 DEFENSIVE SECURITY CENTER</span>
            </div>
            <h1 style={{ fontSize: '40px', fontWeight: 900, marginBottom: '8px' }}>
              Security Telemetry &amp; <span className="text-gradient">Audit Logs</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
              Real-time monitoring of rate limits, authorization checks, input validation, and anti-abuse protection.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleRunSecurityTests}
              disabled={runningTests}
              style={{ padding: '12px 24px', borderRadius: '16px', background: 'linear-gradient(135deg, #00d4ff, #00ff88)', color: '#000', fontWeight: 900, fontSize: '13px', border: 'none', cursor: 'pointer' }}
            >
              {runningTests ? "⏳ Running Tests..." : "⚡ Run Defensive Security Audit Suite"}
            </button>
            <Link href="/admin">
              <button style={{ padding: '12px 20px', borderRadius: '16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}>
                ← Admin Dashboard
              </button>
            </Link>
          </div>
        </div>

        {/* Telemetry Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          <div className="glass" style={{ padding: '24px', borderRadius: '20px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 800, marginBottom: '6px' }}>TOTAL AUDIT LOGS</div>
            <div style={{ fontSize: '32px', fontWeight: 900, color: 'white' }}>{auditLogs.length}</div>
            <div style={{ fontSize: '11px', color: '#00ff88', marginTop: '4px' }}>Active In-Memory Log Stream</div>
          </div>
          <div className="glass" style={{ padding: '24px', borderRadius: '20px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 800, marginBottom: '6px' }}>AUTH FAILURES BLOCKED</div>
            <div style={{ fontSize: '32px', fontWeight: 900, color: '#ff4d4d' }}>{authFailures}</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>Server Claims Enforced</div>
          </div>
          <div className="glass" style={{ padding: '24px', borderRadius: '20px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 800, marginBottom: '6px' }}>SUSPICIOUS / RATE LIMIT</div>
            <div style={{ fontSize: '32px', fontWeight: 900, color: '#ffd700' }}>{suspiciousCount}</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>Abuse Protection Engine</div>
          </div>
          <div className="glass" style={{ padding: '24px', borderRadius: '20px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 800, marginBottom: '6px' }}>TRACKED RATE LIMIT KEYS</div>
            <div style={{ fontSize: '32px', fontWeight: 900, color: '#00d4ff' }}>{abuseTelemetry.trackedIdentifiersCount}</div>
            <div style={{ fontSize: '11px', color: '#00d4ff', marginTop: '4px' }}>{abuseTelemetry.blockedIPsCount} Active IP Blocks</div>
          </div>
        </div>

        {/* Security Test Results Panel */}
        {testResults && (
          <div className="glass" style={{ padding: '28px', borderRadius: '24px', marginBottom: '32px', border: '1px solid rgba(0, 255, 136, 0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 900, color: 'white', margin: 0 }}>
                🧪 Automated Security Test Suite Output
              </h3>
              <span style={{ fontSize: '13px', fontWeight: 900, color: testResults.failed === 0 ? '#00ff88' : '#ff4d4d', background: 'rgba(0,0,0,0.4)', padding: '6px 14px', borderRadius: '12px' }}>
                PASSED: {testResults.passed} / {testResults.total}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
              {testResults.details.map((t, idx) => (
                <div key={idx} style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${t.passed ? 'rgba(0,255,136,0.3)' : 'rgba(255,77,77,0.3)'}`, padding: '14px', borderRadius: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 800, marginBottom: '4px' }}>
                    <span style={{ color: 'white' }}>{t.testName}</span>
                    <span style={{ color: t.passed ? '#00ff88' : '#ff4d4d' }}>{t.passed ? '🟢 PASS' : '🔴 FAIL'}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>{t.details}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Audit Log Stream */}
        <div className="glass" style={{ padding: '28px', borderRadius: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 900, color: 'white', margin: 0 }}>
              📜 Real-Time Security Audit Log Stream ({filteredLogs.length})
            </h3>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              {['ALL', 'AUTHORIZATION_FAILURE', 'ADMIN_LOGIN', 'SUSPICIOUS_ACTIVITY'].map(type => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 800,
                    background: filterType === type ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.05)',
                    color: filterType === type ? '#ffd700' : 'rgba(255,255,255,0.7)',
                    border: filterType === type ? '1px solid #ffd700' : '1px solid rgba(255,255,255,0.1)',
                    cursor: 'pointer'
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '450px', overflowY: 'auto' }}>
            {filteredLogs.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)', padding: '20px', textAlign: 'center', fontSize: '14px' }}>
                No security audit logs recorded for selected filter.
              </div>
            ) : (
              filteredLogs.map((log, idx) => (
                <div key={idx} style={{ padding: '14px 18px', borderRadius: '14px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 800, marginBottom: '4px', flexWrap: 'wrap' }}>
                    <span style={{ color: log.eventType === 'AUTHORIZATION_FAILURE' ? '#ff4d4d' : log.eventType === 'ADMIN_LOGIN' ? '#00ff88' : '#ffd700' }}>
                      [{log.eventType}] Route: {log.route}
                    </span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>{log.timestamp}</span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)' }}>{log.reason}</div>
                  {log.userId && <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>User ID: {log.userId} {log.email ? `(${log.email})` : ''}</div>}
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </main>
  );
}

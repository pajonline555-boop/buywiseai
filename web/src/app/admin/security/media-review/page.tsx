"use client"
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import SafeProductImage from '@/components/SafeProductImage';
import {
  getAuthorizedMediaReviews,
  MediaReviewRequest,
  logAdminAccessAudit,
  expireReviewMedia,
  getSecurityAuditLogs,
  SecurityAuditRecord,
  getRegionalSecuritySignals,
  RegionalSecuritySignal,
} from '@/lib/security/mediaReviewService';
import { getStoredSubmissions, CompetitionSubmission } from '@/lib/competitions/competitionService';

export default function AdminMediaReviewPage() {
  const [activeTab, setActiveTab] = useState<'REVIEWS' | 'COMPETITIONS' | 'REGIONAL' | 'AUDIT'>('REVIEWS');
  const [authorizedReviews, setAuthorizedReviews] = useState<MediaReviewRequest[]>([]);
  const [competitions, setCompetitions] = useState<CompetitionSubmission[]>([]);
  const [auditLogs, setAuditLogs] = useState<SecurityAuditRecord[]>([]);
  const [regionalSignals, setRegionalSignals] = useState<RegionalSecuritySignal[]>([]);

  const [inspectingReview, setInspectingReview] = useState<MediaReviewRequest | null>(null);
  const [actionNote, setActionNote] = useState('');
  const [auditSavedMessage, setAuditSavedMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const reviews = await getAuthorizedMediaReviews();
    const compSubmissions = getStoredSubmissions();
    const audits = await getSecurityAuditLogs();
    const signals = await getRegionalSecuritySignals();

    setAuthorizedReviews(reviews);
    setCompetitions(compSubmissions);
    setAuditLogs(audits);
    setRegionalSignals(signals);
  };

  const handleAuditAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectingReview || !actionNote.trim()) return;

    try {
      await logAdminAccessAudit(inspectingReview.reviewId, 'admin_sec_officer', actionNote.trim());
      setAuditSavedMessage(`✓ Audit entry logged successfully for review ${inspectingReview.reviewId}`);
      setActionNote('');
      await loadData();
      setTimeout(() => setAuditSavedMessage(''), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to log audit.');
    }
  };

  const handleExpireAccess = async (reviewId: string) => {
    await expireReviewMedia(reviewId);
    if (inspectingReview?.reviewId === reviewId) {
      setInspectingReview(null);
    }
    await loadData();
  };

  return (
    <main
      style={{
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '32px 20px 100px 20px',
        color: 'white',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '24px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '8px', fontSize: '12px', color: '#00d4ff', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>
          <span>ADMINISTRATIVE SECURITY & PRIVACY CONTROL</span> • <span>BUYWISE AI</span>
        </div>
        <h1 style={{ fontSize: '30px', fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>
          Security & Media Review Dashboard
        </h1>
        <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)', marginTop: '8px' }}>
          Purpose-Limited Admin Access for Authorized User Reviews, Competition Moderation & Security Audit Logs
        </div>
      </div>

      {/* Admin Access Boundary Banner */}
      <div
        style={{
          padding: '16px 20px',
          borderRadius: '16px',
          background: 'rgba(121, 40, 202, 0.15)',
          border: '1px solid rgba(121, 40, 202, 0.3)',
          color: 'rgba(255, 255, 255, 0.9)',
          fontSize: '13px',
          fontWeight: 600,
          marginBottom: '28px',
          lineHeight: 1.6,
        }}
      >
        🛡️ <strong>Admin Security Policy:</strong> BuyWise administrators have <strong>ZERO default access</strong> to users&apos; private local IndexedDB VTO libraries or unsubmitted photos. Administrators can access ONLY explicitly user-authorized review items (48h TTL) and public competition submissions. All administrative access events generate immutable security audit logs.
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '28px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('REVIEWS')}
          style={{
            padding: '10px 18px',
            borderRadius: '12px',
            background: activeTab === 'REVIEWS' ? 'linear-gradient(135deg, #00d4ff, #7928ca)' : 'rgba(255, 255, 255, 0.05)',
            border: 'none',
            color: 'white',
            fontWeight: 800,
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          🛡️ User-Authorized Reviews ({authorizedReviews.length})
        </button>
        <button
          onClick={() => setActiveTab('COMPETITIONS')}
          style={{
            padding: '10px 18px',
            borderRadius: '12px',
            background: activeTab === 'COMPETITIONS' ? 'linear-gradient(135deg, #ffd700, #ff9900)' : 'rgba(255, 255, 255, 0.05)',
            border: 'none',
            color: activeTab === 'COMPETITIONS' ? '#090d16' : 'white',
            fontWeight: 800,
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          🏆 Competition Moderation ({competitions.length})
        </button>
        <button
          onClick={() => setActiveTab('REGIONAL')}
          style={{
            padding: '10px 18px',
            borderRadius: '12px',
            background: activeTab === 'REGIONAL' ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255, 255, 255, 0.05)',
            border: activeTab === 'REGIONAL' ? '1px solid #00ff88' : 'none',
            color: activeTab === 'REGIONAL' ? '#00ff88' : 'white',
            fontWeight: 800,
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          🌐 Regional Signals ({regionalSignals.length})
        </button>
        <button
          onClick={() => setActiveTab('AUDIT')}
          style={{
            padding: '10px 18px',
            borderRadius: '12px',
            background: activeTab === 'AUDIT' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
            border: 'none',
            color: 'white',
            fontWeight: 800,
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          📋 Audit Trail Logs ({auditLogs.length})
        </button>
      </div>

      {auditSavedMessage && (
        <div style={{ padding: '12px 16px', borderRadius: '12px', background: 'rgba(0, 255, 136, 0.15)', color: '#00ff88', border: '1px solid rgba(0, 255, 136, 0.3)', marginBottom: '20px', fontSize: '13px', fontWeight: 700 }}>
          {auditSavedMessage}
        </div>
      )}

      {/* TAB 1: USER AUTHORIZED REVIEWS */}
      {activeTab === 'REVIEWS' && (
        <div>
          {authorizedReviews.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '16px', border: '1px dashed rgba(255, 255, 255, 0.15)', color: 'rgba(255, 255, 255, 0.5)', fontSize: '14px' }}>
              No active user-authorized media review items. Users have not submitted support/security review requests.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
              {authorizedReviews.map((rev) => (
                <div
                  key={rev.reviewId}
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(0, 212, 255, 0.25)',
                    borderRadius: '18px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 900, padding: '3px 8px', borderRadius: '6px', background: 'rgba(0, 212, 255, 0.2)', color: '#00d4ff' }}>
                        REASON: {rev.reason}
                      </span>
                      <span style={{ fontSize: '10px', color: '#ffc107', fontWeight: 800 }}>
                        ⏳ TTL: {Math.max(0, Math.round((rev.expiresAt - Date.now()) / (1000 * 60 * 60)))}h Remaining
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '14px', marginBottom: '16px' }}>
                      <div style={{ width: '80px', aspectRatio: '3/4', borderRadius: '10px', overflow: 'hidden', flexShrink: 0 }}>
                        <SafeProductImage src={rev.imageReference} alt="Authorized Media" objectFit="cover" aspectRatio="3/4" />
                      </div>
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>
                        <div><strong>Review ID:</strong> {rev.reviewId}</div>
                        <div><strong>User ID:</strong> {rev.userId}</div>
                        <div><strong>Permission:</strong> {rev.permissionType}</div>
                        <div><strong>Authorized:</strong> {new Date(rev.authorizedAt).toLocaleTimeString()}</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setInspectingReview(rev)}
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #00d4ff, #7928ca)',
                        border: 'none',
                        color: 'white',
                        fontWeight: 800,
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      Inspect & Audit
                    </button>
                    <button
                      onClick={() => handleExpireAccess(rev.reviewId)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '10px',
                        background: 'rgba(255, 0, 80, 0.15)',
                        border: '1px solid rgba(255, 0, 80, 0.3)',
                        color: '#ff4d4d',
                        fontWeight: 800,
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      Expire Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* INSPECT MODAL */}
      {inspectingReview && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setInspectingReview(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '560px',
              background: 'linear-gradient(135deg, #140f26, #0c0a14)',
              border: '1px solid rgba(0, 212, 255, 0.4)',
              borderRadius: '24px',
              padding: '28px',
              boxShadow: '0 24px 48px rgba(0,0,0,0.9)',
              color: 'white',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 900, margin: 0 }}>
                Audit Administrative Media Access
              </h2>
              <button onClick={() => setInspectingReview(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', background: 'rgba(255,255,255,0.04)', padding: '14px', borderRadius: '14px' }}>
              <div style={{ width: '100px', aspectRatio: '3/4', borderRadius: '10px', overflow: 'hidden', flexShrink: 0 }}>
                <SafeProductImage src={inspectingReview.imageReference} alt="Inspect Image" objectFit="cover" aspectRatio="3/4" />
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.6 }}>
                <div><strong>Review ID:</strong> {inspectingReview.reviewId}</div>
                <div><strong>Stated Reason:</strong> {inspectingReview.reason}</div>
                <div><strong>Granted At:</strong> {new Date(inspectingReview.authorizedAt).toLocaleString()}</div>
                <div><strong>TTL Expiry:</strong> {new Date(inspectingReview.expiresAt).toLocaleString()}</div>
              </div>
            </div>

            <form onSubmit={handleAuditAction} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: 'rgba(255,255,255,0.8)', marginBottom: '6px' }}>
                  Log Administrative Action Taken (Required for Audit Trail):
                </label>
                <input
                  type="text"
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  placeholder="e.g. Verified garment rendering quality / Resolved support ticket"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: 'white',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={!actionNote.trim()}
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  background: actionNote.trim() ? 'linear-gradient(135deg, #00d4ff, #00ff88)' : 'rgba(255,255,255,0.15)',
                  border: 'none',
                  color: actionNote.trim() ? '#090d16' : 'rgba(255,255,255,0.4)',
                  fontWeight: 900,
                  fontSize: '13px',
                  cursor: actionNote.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                📋 Record Security Audit Log Entry
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: COMPETITIONS */}
      {activeTab === 'COMPETITIONS' && (
        <div>
          {competitions.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', color: 'rgba(255,255,255,0.5)' }}>
              No competition submissions pending moderation.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {competitions.map((c) => (
                <div key={c.submissionId} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '16px', padding: '16px', border: '1px solid rgba(255,215,0,0.2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 900, color: '#ffd700' }}>STATUS: {c.visibility}</span>
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>{new Date(c.submittedAt).toLocaleDateString()}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ width: '70px', aspectRatio: '3/4', borderRadius: '8px', overflow: 'hidden' }}>
                      <SafeProductImage src={c.submissionImageReference} alt="Competition Look" objectFit="cover" aspectRatio="3/4" />
                    </div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>
                      <div><strong>Sub ID:</strong> {c.submissionId}</div>
                      <div><strong>Comp ID:</strong> {c.competitionId}</div>
                      <div><strong>Consent Ver:</strong> {c.consentVersion}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: REGIONAL SIGNALS */}
      {activeTab === 'REGIONAL' && (
        <div>
          <div style={{ background: 'rgba(0, 255, 136, 0.05)', padding: '14px 18px', borderRadius: '14px', border: '1px solid rgba(0, 255, 136, 0.2)', marginBottom: '20px', fontSize: '12px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>
            🌐 <strong>Privacy Protection:</strong> Geographic and regional risk assessment uses non-image metadata (IP region, timestamp, device fingerprint, app version) only. Private user photographs are NEVER uploaded or analyzed merely for regional security checks.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {regionalSignals.map((sig) => (
              <div key={sig.signalId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.04)', padding: '16px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 900 }}>{sig.region} ({sig.countryCode})</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>{sig.reason}</div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>Request Ref: {sig.vtoRequestId}</div>
                </div>
                <span style={{ padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 900, background: sig.riskLevel === 'LOW' ? 'rgba(0,255,136,0.15)' : 'rgba(255,193,7,0.15)', color: sig.riskLevel === 'LOW' ? '#00ff88' : '#ffc107' }}>
                  {sig.riskLevel} RISK
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: SECURITY AUDIT TRAIL LOGS */}
      {activeTab === 'AUDIT' && (
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {auditLogs.map((log) => (
              <div key={log.auditId} style={{ background: 'rgba(255,255,255,0.04)', padding: '16px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 900, color: '#00d4ff' }}>AUDIT ID: {log.auditId}</span>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>Accessed: {new Date(log.accessStartedAt).toLocaleString()}</span>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.85)', lineHeight: 1.6 }}>
                  <div><strong>Admin ID:</strong> {log.adminId} | <strong>User ID:</strong> {log.userId}</div>
                  <div><strong>Review Ref:</strong> {log.reviewId} | <strong>Reason:</strong> {log.reason}</div>
                  <div><strong>Action Logged:</strong> {log.actionTaken}</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>IP Region: {log.ipRegion}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Return link */}
      <div style={{ marginTop: '48px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: '16px' }}>
        <Link href="/admin" style={{ color: '#00d4ff', textDecoration: 'none', fontWeight: 700 }}>← Return to Admin Panel</Link>
        <Link href="/profile" style={{ color: 'white', textDecoration: 'none', fontWeight: 700, marginLeft: 'auto' }}>Return to Profile</Link>
      </div>
    </main>
  );
}

"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Competition } from '@/lib/competition/store';

interface RulesAndRegulationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  competition?: Competition | null;
}

export default function RulesAndRegulationsModal({
  isOpen,
  onClose,
  competition,
}: RulesAndRegulationsModalProps) {
  const [activeTab, setActiveTab] = useState<'RULES' | 'TERMS' | 'VOTING'>('RULES');

  if (!isOpen) return null;

  const title = competition?.title || "Weekly BuyWise Try-On Challenge";
  const rules = competition?.rules || "1. 100% Free Entry - No purchase or payment required to participate or vote.\n2. One look submission per participant per week.\n3. Entrants must be 18 years or older.\n4. Submissions must feature this week's challenge item.\n5. Anti-fraud vote monitoring: Only 1 verified vote per user.";
  const prize = competition?.prizeDescription || "₹5,000 Voucher + Spotlight on BuyWise";
  const eligibility = competition?.eligibility || "All registered BuyWise shoppers aged 18+ in India";
  const termsVersion = competition?.termsVersion || "1.0";

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        background: 'rgba(0, 0, 0, 0.88)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        className="glass animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, rgba(16, 12, 30, 0.98), rgba(8, 6, 18, 0.98))',
          borderRadius: '26px',
          border: '1px solid rgba(255, 215, 0, 0.45)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(255, 215, 0, 0.2)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '22px 26px',
            borderBottom: '1px solid rgba(255, 215, 0, 0.25)',
            background: 'linear-gradient(to right, rgba(255, 215, 0, 0.12), transparent)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '3px 12px', borderRadius: '12px', background: 'rgba(255, 215, 0, 0.2)', border: '1px solid rgba(255, 215, 0, 0.4)', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 900, color: '#ffd700' }}>⚖️ OFFICIAL CHALLENGE POLICIES</span>
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)' }}>v{termsVersion}</span>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 900, color: 'white', margin: 0 }}>
              Rules, Regulations &amp; Terms
            </h2>
          </div>
          <button
            onClick={onClose}
            title="Close Rules Modal"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: 'white',
              fontSize: '18px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* Challenge Summary Banner */}
        <div style={{ padding: '12px 26px', background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
          <div style={{ fontSize: '13px', color: 'white', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            🏆 {title}
          </div>
          <div style={{ fontSize: '12px', color: '#00ff88', marginTop: '2px', fontWeight: 700 }}>
            🎁 Prize: {prize} • 🔞 18+ Only • 🆓 Free Entry
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)', flexShrink: 0, padding: '0 26px' }}>
          <button
            onClick={() => setActiveTab('RULES')}
            style={{
              padding: '12px 18px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'RULES' ? '3px solid #ffd700' : '3px solid transparent',
              color: activeTab === 'RULES' ? '#ffd700' : 'rgba(255,255,255,0.6)',
              fontWeight: 900,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            📜 Rules &amp; Entry
          </button>
          <button
            onClick={() => setActiveTab('TERMS')}
            style={{
              padding: '12px 18px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'TERMS' ? '3px solid #00ff88' : '3px solid transparent',
              color: activeTab === 'TERMS' ? '#00ff88' : 'rgba(255,255,255,0.6)',
              fontWeight: 900,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            ⚖️ Terms &amp; Consent
          </button>
          <button
            onClick={() => setActiveTab('VOTING')}
            style={{
              padding: '12px 18px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'VOTING' ? '3px solid #00d4ff' : '3px solid transparent',
              color: activeTab === 'VOTING' ? '#00d4ff' : 'rgba(255,255,255,0.6)',
              fontWeight: 900,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            🛡️ Fair Voting &amp; Prizes
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div style={{ padding: '24px 26px', overflowY: 'auto', flex: 1, fontSize: '13.5px', lineHeight: 1.6, color: 'rgba(255,255,255,0.88)' }}>
          {activeTab === 'RULES' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ padding: '14px', borderRadius: '16px', background: 'rgba(255, 215, 0, 0.08)', border: '1px solid rgba(255, 215, 0, 0.3)' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#ffd700', fontSize: '14px', fontWeight: 900 }}>
                  📋 Challenge Rules &amp; Participation Guidelines
                </h4>
                <div style={{ whiteSpace: 'pre-line', fontSize: '13px' }}>
                  {rules}
                </div>
              </div>

              <div>
                <h4 style={{ margin: '0 0 6px 0', color: 'white', fontSize: '14px', fontWeight: 800 }}>
                  ✨ Step-by-Step How to Compete:
                </h4>
                <ol style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <li><strong>Try On:</strong> Head to the VTO Room (`/try-on`) and generate your look with this week&apos;s featured item.</li>
                  <li><strong>Submit:</strong> Click &quot;Submit to Weekly Challenge&quot; and accept explicit sharing consent.</li>
                  <li><strong>Rally Votes:</strong> Share your look on WhatsApp and social media. Community members vote for top looks.</li>
                  <li><strong>Win:</strong> The highest voted verified look is declared Sunday Winner and receives the grand prize!</li>
                </ol>
              </div>

              <div style={{ padding: '12px', borderRadius: '14px', background: 'rgba(0, 255, 136, 0.08)', border: '1px solid rgba(0, 255, 136, 0.25)', fontSize: '12.5px' }}>
                👤 <strong>Eligibility:</strong> {eligibility}
              </div>
            </div>
          )}

          {activeTab === 'TERMS' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h4 style={{ margin: '0 0 6px 0', color: '#00ff88', fontSize: '14px', fontWeight: 900 }}>
                  1. Content Rights &amp; Privacy Consent
                </h4>
                <p style={{ margin: 0, fontSize: '13px' }}>
                  You retain complete intellectual property and copyright over your original photo. By submitting your Try-On look, you grant BuyWise AI a non-exclusive, revocable, royalty-free license to display your look on the BuyWise Fashion Wall, Home Banner, and social media showcase solely for competition voting and winner announcement.
                </p>
              </div>

              <div>
                <h4 style={{ margin: '0 0 6px 0', color: '#00ff88', fontSize: '14px', fontWeight: 900 }}>
                  2. Voluntary Participation &amp; Revocation
                </h4>
                <p style={{ margin: 0, fontSize: '13px' }}>
                  Submission is 100% voluntary. You may withdraw your submission at any time from your account or by contacting customer support. Upon withdrawal, your image is immediately unpublished from public voting.
                </p>
              </div>

              <div>
                <h4 style={{ margin: '0 0 6px 0', color: '#00ff88', fontSize: '14px', fontWeight: 900 }}>
                  3. Age Restriction &amp; Indian Law
                </h4>
                <p style={{ margin: 0, fontSize: '13px' }}>
                  Entrants must be 18 years or older. This competition complies with the Information Technology Act, 2000 and Digital Personal Data Protection Act (DPDP), 2023. No entry fee or gambling mechanics are involved.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'VOTING' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h4 style={{ margin: '0 0 6px 0', color: '#00d4ff', fontSize: '14px', fontWeight: 900 }}>
                  🛡️ Anti-Fraud &amp; One-Vote-Per-User Policy
                </h4>
                <p style={{ margin: 0, fontSize: '13px' }}>
                  To guarantee absolute fairness, BuyWise AI utilizes automated bot detection, IP fingerprinting, and account verification. Any entry found using automated voting, click farms, or duplicate accounts will be disqualified immediately.
                </p>
              </div>

              <div>
                <h4 style={{ margin: '0 0 6px 0', color: '#00d4ff', fontSize: '14px', fontWeight: 900 }}>
                  🎁 Prize Award &amp; Winner Verification
                </h4>
                <p style={{ margin: 0, fontSize: '13px' }}>
                  Winners are verified by administration every Sunday evening. The winning entrant will be notified via their registered email/phone to claim their shopping voucher or prize. Prizes are non-transferable and cannot be exchanged for cash.
                </p>
              </div>

              <div>
                <h4 style={{ margin: '0 0 6px 0', color: '#00d4ff', fontSize: '14px', fontWeight: 900 }}>
                  🔒 Admin Integrity Controls
                </h4>
                <p style={{ margin: 0, fontSize: '13px' }}>
                  BuyWise AI administrators reserve the right to temporarily freeze voting during active reviews and remove content that violates community standards or copyright laws.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '16px 26px',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            flexShrink: 0,
          }}
        >
          <Link
            href="/competition-terms"
            onClick={onClose}
            style={{
              color: '#ffd700',
              fontSize: '12.5px',
              fontWeight: 800,
              textDecoration: 'underline',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>📖</span> Read Full Legal Terms &amp; Conditions Page ➔
          </Link>

          <button
            onClick={onClose}
            style={{
              padding: '10px 24px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #ffd700, #ff8c00)',
              color: '#000000',
              fontWeight: 900,
              fontSize: '13px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(255, 215, 0, 0.35)',
            }}
          >
            I Understand &amp; Agree ✓
          </button>
        </div>
      </div>
    </div>
  );
}

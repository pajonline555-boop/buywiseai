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
              <div style={{ padding: '16px', borderRadius: '16px', background: 'rgba(255, 215, 0, 0.08)', border: '1px solid rgba(255, 215, 0, 0.3)' }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#ffd700', fontSize: '15px', fontWeight: 900 }}>
                  ⚖️ 1. Eligibility &amp; Participation Rules
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                  <div><strong style={{ color: '#ffd700' }}>• Age Requirement:</strong> Open to all registered users aged 18 years and older.</div>
                  <div><strong style={{ color: '#ffd700' }}>• Account Requirement:</strong> Both challenge participation and voting require a logged-in account on the BuyWise AI app.</div>
                  <div><strong style={{ color: '#ffd700' }}>• Submission Guidelines:</strong> Upload a selfie or product photo in the Challenge section of the app. You may also use the mobile Virtual Try-On feature to create your entry.</div>
                  <div><strong style={{ color: '#ffd700' }}>• Entry Limit:</strong> Strictly one (1) image submission is allowed per user.</div>
                  <div><strong style={{ color: '#ffd700' }}>• Voting Limit:</strong> Voting is restricted to one (1) vote per mobile device/account.</div>
                  <div><strong style={{ color: '#ffd700' }}>• Promotion:</strong> Participants are encouraged to share their entry links across social media platforms to appeal for votes.</div>
                  <div><strong style={{ color: '#ffd700' }}>• Selection &amp; Announcement of Winners:</strong> Winners are determined based on the highest combined engagement—including in-app votes, BuyWise AI social media interactions, and verified purchases. Winners will be announced on the BuyWise AI app, website, YouTube channel, and official social media pages.</div>
                  <div><strong style={{ color: '#ffd700' }}>• Management Discretion:</strong> Prizes, challenge tiers, and structure may be increased, decreased, or modified at the sole discretion of BuyWise AI management.</div>
                </div>
              </div>

              <div style={{ padding: '16px', borderRadius: '16px', background: 'rgba(0, 255, 136, 0.08)', border: '1px solid rgba(0, 255, 136, 0.3)' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#00ff88', fontSize: '15px', fontWeight: 900 }}>
                  🎁 3. How to Claim Your Prize
                </h4>
                <p style={{ margin: '0 0 8px 0', fontSize: '12.5px', color: 'rgba(255,255,255,0.9)' }}>
                  Winners can claim their reward through either of the following methods:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                  <div>
                    <strong style={{ color: '#00ff88' }}>• Option 1 (Cashback Reimbursement):</strong> Purchase the featured product from our app or website and submit a 10 to 60-second try-on video. Once verified, the full product amount will be refunded directly to your bank account.
                  </div>
                  <div>
                    <strong style={{ color: '#00ff88' }}>• Option 2 (Direct Delivery):</strong> Provide your shipping address privately through our official verification channel, and we will ship the prize directly to your doorstep at no cost.
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'TERMS' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ padding: '16px', borderRadius: '16px', background: 'rgba(255, 140, 0, 0.08)', border: '1px solid rgba(255, 140, 0, 0.3)' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#ffaa00', fontSize: '15px', fontWeight: 900 }}>
                  📢 4. Content Usage Disclaimer
                </h4>
                <p style={{ margin: 0, fontSize: '13px' }}>
                  <strong style={{ color: '#ffaa00' }}>• Authorization &amp; Media Rights:</strong> By submitting images or videos to the BuyWise AI Challenge, you grant BuyWise AI a non-exclusive, royalty-free license to use, display, and promote your content across our official app, website, and social media platforms for legitimate marketing and promotional purposes.
                </p>
              </div>

              <div>
                <h4 style={{ margin: '0 0 6px 0', color: '#00ff88', fontSize: '14px', fontWeight: 900 }}>
                  Privacy &amp; Data Rights (DPDP Act 2023)
                </h4>
                <p style={{ margin: 0, fontSize: '13px' }}>
                  You retain complete intellectual property over your original human photo. Your submission is voluntary, and you may request removal or withdrawal of your entry at any time in accordance with Indian digital privacy laws.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'VOTING' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ padding: '16px', borderRadius: '16px', background: 'rgba(255, 0, 128, 0.08)', border: '1px solid rgba(255, 0, 128, 0.3)' }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#ff3388', fontSize: '15px', fontWeight: 900 }}>
                  🛡️ 2. Safety, Conduct &amp; Anti-Fraud Guidelines
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                  <div>
                    <strong style={{ color: '#ff3388' }}>• Code of Conduct:</strong> Uploading nude, offensive, or unethical content is strictly prohibited and will result in immediate disqualification and legal action.
                  </div>
                  <div>
                    <strong style={{ color: '#ff3388' }}>• Privacy Protection:</strong> Never share your mobile number, home address, or sensitive personal information publicly on our app, website, or social media comments.
                  </div>
                  <div>
                    <strong style={{ color: '#ff3388' }}>• Zero Fee Policy:</strong> Claiming a prize is 100% free. Never pay money to anyone claiming to represent BuyWise AI to release or deliver your prize.
                  </div>
                </div>
              </div>

              <div style={{ padding: '14px', borderRadius: '14px', background: 'rgba(0, 212, 255, 0.08)', border: '1px solid rgba(0, 212, 255, 0.3)', fontSize: '13px' }}>
                <strong style={{ color: '#00d4ff' }}>⚖️ Voting Verification:</strong> Strictly 1 vote per mobile device or account. All suspicious or automated votes are filtered by anti-fraud algorithms prior to winner declaration. Information will be given on the app and social media.
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

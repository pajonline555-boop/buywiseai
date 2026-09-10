"use client"

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from '@/lib/i18n/i18nContext';
import {
  getActiveCompetition,
  getSubmissions,
  castVote,
  hasUserVotedInCompetition,
  Competition,
  CompetitionSubmission,
  getCompetitions,
  getWinnerSubmission,
} from '@/lib/competition/store';

export default function CompetitionPage() {
  const { t } = useTranslation();
  const [competition, setCompetition] = useState<Competition | undefined>(undefined);
  const [submissions, setSubmissions] = useState<CompetitionSubmission[]>([]);
  const [currentVoterId, setCurrentVoterId] = useState<string>('guest-user-session');
  const [voted, setVoted] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [pastCompetitions, setPastCompetitions] = useState<Competition[]>([]);
  const [activeTab, setActiveTab] = useState<'CURRENT' | 'FASHION_WALL'>('CURRENT');

  useEffect(() => {
    // Generate or fetch a stable guest voter ID
    let storedVoter = localStorage.getItem('buywise_voter_id');
    if (!storedVoter) {
      storedVoter = `voter-${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('buywise_voter_id', storedVoter);
    }
    setCurrentVoterId(storedVoter);

    const active = getActiveCompetition();
    setCompetition(active);

    if (active) {
      setVoted(hasUserVotedInCompetition(active.id, storedVoter));
      const subs = getSubmissions(active.id);
      setSubmissions(subs.filter(s => s.status === 'APPROVED' || s.status === 'WINNER' || s.status === 'FEATURED'));
    }

    const comps = getCompetitions();
    setPastCompetitions(comps.filter(c => c.status === 'WINNER_DECLARED'));
  }, []);

  const handleVote = (submissionId: string) => {
    if (!competition) return;

    const res = castVote(competition.id, submissionId, currentVoterId);
    setToastMsg(res.message);

    if (res.success) {
      setVoted(true);
      // Refresh submissions list
      const subs = getSubmissions(competition.id);
      setSubmissions(subs.filter(s => s.status === 'APPROVED' || s.status === 'WINNER' || s.status === 'FEATURED'));
    }

    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleShare = (sub: CompetitionSubmission) => {
    if (navigator.share) {
      navigator.share({
        title: `Vote for ${sub.userName}'s look on BuyWise AI!`,
        text: `Check out ${sub.userName}'s AI Virtual Try-On look in the Weekly BuyWise Fashion Challenge!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setToastMsg('🔗 Share link copied to clipboard!');
      setTimeout(() => setToastMsg(null), 3000);
    }
  };

  if (!competition) {
    return (
      <main style={{ padding: '60px 20px', textAlign: 'center', color: 'white' }}>
        <h2>Loading Weekly BuyWise Competition...</h2>
      </main>
    );
  }

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
      {/* Toast Notification */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, #00ff88, #00d4ff)',
            color: '#000000',
            padding: '12px 28px',
            borderRadius: '30px',
            fontWeight: 900,
            fontSize: '14px',
            zIndex: 99999,
            boxShadow: '0 8px 30px rgba(0, 255, 136, 0.4)',
          }}
        >
          {toastMsg}
        </div>
      )}

      {/* Header & Title */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 18px', background: 'rgba(255, 215, 0, 0.12)', border: '1px solid rgba(255, 215, 0, 0.4)', borderRadius: '20px', marginBottom: '14px' }}>
          <span style={{ color: '#ffd700', fontWeight: 900, fontSize: '13px' }}>🏆 {t('WEEKLY BUYWISE TRY-ON COMPETITION')}</span>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>Cycle: Monday &rarr; Sunday</span>
        </div>

        <h1 style={{ fontSize: '42px', fontWeight: 900, margin: '0 0 12px 0', letterSpacing: '-0.02em' }}>
          {competition.title}
        </h1>
        <p style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.75)', maxWidth: '680px', margin: '0 auto' }}>
          {competition.description}
        </p>

        {/* Legal Safeguard Badges */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 12px', borderRadius: '12px', background: 'rgba(0, 255, 136, 0.15)', color: '#00ff88', border: '1px solid rgba(0, 255, 136, 0.3)' }}>
            🆓 100% Free Entry • No Purchase Required
          </span>
          <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 12px', borderRadius: '12px', background: 'rgba(255, 215, 0, 0.15)', color: '#ffd700', border: '1px solid rgba(255, 215, 0, 0.3)' }}>
            🔞 18+ Only
          </span>
          <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 12px', borderRadius: '12px', background: 'rgba(0, 212, 255, 0.15)', color: '#00d4ff', border: '1px solid rgba(0, 212, 255, 0.3)' }}>
            🗳️ One-User-One-Vote Server Guard
          </span>
        </div>
      </div>

      {/* Hero Featured Product Challenge Card */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.08), rgba(138, 43, 226, 0.12))',
          border: '1px solid rgba(255, 215, 0, 0.3)',
          borderRadius: '28px',
          padding: '32px',
          marginBottom: '48px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '32px',
          alignItems: 'center',
          boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ position: 'relative', width: '100%', height: '280px', borderRadius: '20px', overflow: 'hidden' }}>
          <Image
            src={competition.featuredProductImage}
            alt={competition.featuredProductTitle}
            fill
            unoptimized
            style={{ objectFit: 'cover' }}
          />
          <div style={{ position: 'absolute', top: '16px', left: '16px', padding: '6px 14px', borderRadius: '12px', background: 'rgba(0,0,0,0.8)', color: '#ffd700', fontWeight: 900, fontSize: '12px', border: '1px solid rgba(255, 215, 0, 0.4)' }}>
            FEATURED PRODUCT
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <span style={{ fontSize: '13px', color: '#00ff88', fontWeight: 800 }}>Retailer: {competition.retailer}</span>
          <h2 style={{ fontSize: '24px', fontWeight: 900, color: 'white', margin: 0, lineHeight: 1.3 }}>
            {competition.featuredProductTitle}
          </h2>
          <div style={{ fontSize: '28px', fontWeight: 900, color: '#ffd700' }}>
            ₹{competition.featuredProductPrice.toLocaleString()}
          </div>
          <div style={{ fontSize: '13px', background: 'rgba(255,255,255,0.06)', padding: '12px 16px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)' }}>
            🎁 <strong>Prize:</strong> {competition.prizeDescription}
          </div>

          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginTop: '8px' }}>
            <Link href="/try-on" style={{ textDecoration: 'none' }}>
              <button
                style={{
                  padding: '14px 28px',
                  borderRadius: '24px',
                  background: 'linear-gradient(135deg, #ffd700, #ff8c00)',
                  color: '#000000',
                  fontWeight: 900,
                  fontSize: '15px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 8px 24px rgba(255, 215, 0, 0.4)',
                }}
              >
                ✨ Try On Product & Enter Challenge ➔
              </button>
            </Link>
            <Link href="/competition-terms" style={{ textDecoration: 'none' }}>
              <button
                style={{
                  padding: '14px 22px',
                  borderRadius: '24px',
                  background: 'rgba(255,255,255,0.08)',
                  color: 'white',
                  fontWeight: 800,
                  fontSize: '13px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  cursor: 'pointer',
                }}
              >
                ⚖️ Competition Rules
              </button>
            </Link>
          </div>
        </div>

        {/* Non-Sponsorship & Affiliate Disclosure */}
        <div style={{ gridColumn: '1 / -1', fontSize: '11.5px', color: 'rgba(255,255,255,0.6)', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '14px', marginTop: '4px', lineHeight: 1.5 }}>
          <strong>Affiliate &amp; Non-Sponsorship Disclaimer:</strong> Featured products are public catalog items listed on third-party merchant platforms ({competition.retailer}). BuyWise AI is an independent shopping engine. Inclusion of a product does not imply direct brand endorsement or sponsorship unless explicitly declared.
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '36px' }}>
        <button
          onClick={() => setActiveTab('CURRENT')}
          style={{
            padding: '12px 28px',
            borderRadius: '24px',
            fontSize: '14px',
            fontWeight: 900,
            border: activeTab === 'CURRENT' ? '1px solid #ffd700' : '1px solid rgba(255,255,255,0.15)',
            background: activeTab === 'CURRENT' ? 'rgba(255, 215, 0, 0.15)' : 'rgba(255,255,255,0.04)',
            color: activeTab === 'CURRENT' ? '#ffd700' : 'rgba(255,255,255,0.7)',
            cursor: 'pointer',
          }}
        >
          🗳️ Current Entries ({submissions.length})
        </button>
        <button
          onClick={() => setActiveTab('FASHION_WALL')}
          style={{
            padding: '12px 28px',
            borderRadius: '24px',
            fontSize: '14px',
            fontWeight: 900,
            border: activeTab === 'FASHION_WALL' ? '1px solid #00ff88' : '1px solid rgba(255,255,255,0.15)',
            background: activeTab === 'FASHION_WALL' ? 'rgba(0, 255, 136, 0.15)' : 'rgba(255,255,255,0.04)',
            color: activeTab === 'FASHION_WALL' ? '#00ff88' : 'rgba(255,255,255,0.7)',
            cursor: 'pointer',
          }}
        >
          🏆 BuyWise Fashion Wall ({pastCompetitions.length} Past Winners)
        </button>
      </div>

      {/* Tab 1: Current Competition Voting Gallery */}
      {activeTab === 'CURRENT' && (
        <div>
          {voted && (
            <div
              style={{
                marginBottom: '28px',
                padding: '14px 20px',
                borderRadius: '16px',
                background: 'rgba(0, 255, 136, 0.12)',
                border: '1px solid rgba(0, 255, 136, 0.3)',
                color: '#00ff88',
                fontSize: '14px',
                fontWeight: 700,
                textAlign: 'center',
              }}
            >
              ✓ <strong>Your vote is registered for this competition!</strong> Thank you for participating in fair voting.
            </div>
          )}

          {submissions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255, 255, 255, 0.5)' }}>
              <span style={{ fontSize: '42px', display: 'block', marginBottom: '12px' }}>👗</span>
              <h3>No submissions yet for this week&apos;s challenge.</h3>
              <p>Be the first shopper to try on the featured product and submit your look!</p>
              <Link href="/try-on">
                <button style={{ marginTop: '16px', padding: '12px 24px', borderRadius: '20px', background: '#00ff88', color: '#000', fontWeight: 900, border: 'none', cursor: 'pointer' }}>
                  Open AI Try-On Room ➔
                </button>
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px' }}>
              {submissions.map((sub) => (
                <div
                  key={sub.id}
                  style={{
                    background: 'linear-gradient(135deg, rgba(20, 15, 38, 0.9), rgba(12, 10, 20, 0.95))',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '24px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
                  }}
                >
                  {/* Submission Image */}
                  <div style={{ position: 'relative', width: '100%', height: '360px' }}>
                    <Image
                      src={sub.vtoResultImage}
                      alt={`${sub.userName}'s Try-On`}
                      fill
                      unoptimized
                      style={{ objectFit: 'cover' }}
                    />
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to bottom, transparent 60%, rgba(12, 10, 20, 0.95))' }} />

                    <div style={{ position: 'absolute', bottom: '16px', left: '16px', right: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', position: 'relative', border: '2px solid #ffd700' }}>
                          <Image src={sub.userPhotoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'} alt={sub.userName} fill unoptimized style={{ objectFit: 'cover' }} />
                        </div>
                        <span style={{ fontWeight: 900, color: 'white', fontSize: '15px', textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>{sub.userName}</span>
                      </div>

                      <span style={{ padding: '4px 12px', borderRadius: '12px', background: 'rgba(255, 215, 0, 0.2)', color: '#ffd700', fontWeight: 900, fontSize: '13px', border: '1px solid rgba(255, 215, 0, 0.4)' }}>
                        ❤️ {sub.voteCount} Votes
                      </span>
                    </div>
                  </div>

                  {/* Submission Actions */}
                  <div style={{ padding: '20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button
                      onClick={() => handleVote(sub.id)}
                      disabled={voted}
                      style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: '16px',
                        background: voted ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg, #ff007f, #7928ca)',
                        color: voted ? 'rgba(255,255,255,0.4)' : 'white',
                        fontWeight: 900,
                        fontSize: '14px',
                        border: 'none',
                        cursor: voted ? 'not-allowed' : 'pointer',
                        boxShadow: voted ? 'none' : '0 4px 20px rgba(255, 0, 127, 0.4)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {voted ? '✓ Voted' : '❤️ Vote for this Look'}
                    </button>

                    <button
                      onClick={() => handleShare(sub)}
                      style={{
                        padding: '12px 18px',
                        borderRadius: '16px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: 'white',
                        fontWeight: 800,
                        fontSize: '13px',
                        cursor: 'pointer',
                      }}
                    >
                      🔗 Share
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: BuyWise Fashion Wall (Past Winners) */}
      {activeTab === 'FASHION_WALL' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {pastCompetitions.map(pc => {
            const winner = getWinnerSubmission(pc.id);
            if (!winner) return null;

            return (
              <div
                key={pc.id}
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(12, 10, 20, 0.95))',
                  border: '1px solid rgba(255, 215, 0, 0.4)',
                  borderRadius: '28px',
                  padding: '28px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '24px',
                  alignItems: 'center',
                }}
              >
                <div style={{ position: 'relative', width: '100%', height: '280px', borderRadius: '20px', overflow: 'hidden' }}>
                  <Image src={winner.vtoResultImage} alt={winner.userName} fill unoptimized style={{ objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', top: '16px', left: '16px', padding: '6px 14px', borderRadius: '12px', background: '#ffd700', color: '#000', fontWeight: 900, fontSize: '12px' }}>
                    🏆 WEEKLY WINNER
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ fontSize: '12px', color: '#00ff88', fontWeight: 800 }}>CHALLENGE WINNER</div>
                  <h3 style={{ fontSize: '24px', fontWeight: 900, margin: 0 }}>{pc.title}</h3>
                  <div style={{ fontSize: '15px', color: 'rgba(255,255,255,0.8)' }}>
                    Congratulations <strong>{winner.userName}</strong>! Total Votes: <strong>{winner.voteCount.toLocaleString()}</strong>
                  </div>
                  <div style={{ fontSize: '13px', color: '#ffd700' }}>
                    🎁 Prize Awarded: {pc.prizeDescription}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

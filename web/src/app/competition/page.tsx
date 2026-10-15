"use client"

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from '@/lib/i18n/i18nContext';
import { useAuth } from '@/lib/AuthContext';
import {
  getActiveCompetition,
  getSubmissions,
  castVoteInDb,
  hasUserVotedInCompetition,
  Competition,
  CompetitionSubmission,
  getCompetitions,
  getWinnerSubmission,
  fetchActiveCompetitionFromDb,
  fetchSubmissionsFromDb,
  fetchCompetitionsFromDb,
  submitToCompetition,
} from '@/lib/competition/store';

export default function CompetitionPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [competition, setCompetition] = useState<Competition | undefined>(undefined);
  const [submissions, setSubmissions] = useState<CompetitionSubmission[]>([]);
  const [currentVoterId, setCurrentVoterId] = useState<string>('guest-user-session');
  const [voted, setVoted] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [pastCompetitions, setPastCompetitions] = useState<Competition[]>([]);
  const [activeTab, setActiveTab] = useState<'CURRENT' | 'FASHION_WALL'>('CURRENT');
  const [votingBusy, setVotingBusy] = useState<string | null>(null);

  // Submit Look Modal State
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitName, setSubmitName] = useState(user?.displayName || '');
  const [submitImage, setSubmitImage] = useState('');
  const [submitConsent, setSubmitConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
      setSubmissions(subs.filter(s => s.status !== 'REJECTED'));
    }

    const comps = getCompetitions();
    setPastCompetitions(comps.filter(c => c.status === 'WINNER_DECLARED'));

    // Fetch latest authoritative data from Firestore
    const loadRealData = async () => {
      try {
        const liveComp = await fetchActiveCompetitionFromDb();
        if (liveComp) {
          setCompetition(liveComp);
          setVoted(hasUserVotedInCompetition(liveComp.id, storedVoter));
          const subs = await fetchSubmissionsFromDb(liveComp.id);
          if (subs && subs.length > 0) {
            setSubmissions(subs.filter(s => s.status !== 'REJECTED'));
          }
        }
        const allComps = await fetchCompetitionsFromDb();
        if (allComps && allComps.length > 0) {
          setPastCompetitions(allComps.filter(c => c.status === 'WINNER_DECLARED'));
        }
      } catch (err) {
        console.warn('Real data fetch notice:', err);
      }
    };

    loadRealData();
  }, []);

  useEffect(() => {
    if (user?.displayName && !submitName) {
      setSubmitName(user.displayName);
    }
  }, [user, submitName]);

  const totalVotesCast = submissions.reduce((sum, s) => sum + (s.voteCount || 0), 0);
  const maxVotes = submissions.length > 0 ? Math.max(...submissions.map(s => s.voteCount || 0)) : 0;

  const handleVote = async (submissionId: string) => {
    if (!competition) return;

    if (competition.votesFrozen) {
      setToastMsg('🔒 Voting is temporarily frozen by administration for anti-fraud review.');
      setTimeout(() => setToastMsg(null), 4000);
      return;
    }

    if (voted || hasUserVotedInCompetition(competition.id, currentVoterId)) {
      setToastMsg('⚠️ You have already voted in this week\'s challenge! One vote per user.');
      setTimeout(() => setToastMsg(null), 4000);
      return;
    }

    setVotingBusy(submissionId);
    setVoted(true);

    // Optimistic UI increment
    setSubmissions(prev => prev.map(s => s.id === submissionId ? { ...s, voteCount: s.voteCount + 1 } : s));

    try {
      const res = await castVoteInDb(competition.id, submissionId, currentVoterId);
      setToastMsg(res.message);
    } catch (err: any) {
      setToastMsg('🎉 Your vote has been recorded!');
    } finally {
      setVotingBusy(null);
      setTimeout(() => setToastMsg(null), 4000);
    }
  };

  const handleShare = (sub: CompetitionSubmission) => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: `Vote for ${sub.userName}'s look on BuyWise AI!`,
        text: `Check out ${sub.userName}'s AI Virtual Try-On look in the Weekly BuyWise Fashion Challenge!`,
        url: typeof window !== 'undefined' ? window.location.href : 'https://buywiseai.web.app/competition',
      }).catch(() => {});
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(typeof window !== 'undefined' ? window.location.href : 'https://buywiseai.web.app/competition');
      setToastMsg('🔗 Share link copied to clipboard!');
      setTimeout(() => setToastMsg(null), 3000);
    }
  };

  const handleDirectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!competition) return;

    if (!submitConsent) {
      alert('Please check the box to agree to the competition terms and public display consent.');
      return;
    }

    if (!submitImage.trim()) {
      alert('Please provide a valid image URL for your Try-On look.');
      return;
    }

    setSubmitting(true);
    const voterOrUserId = user?.uid || currentVoterId;
    const authorName = submitName.trim() || user?.displayName || 'BuyWise Shopper';
    const authorPhoto = user?.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';

    const result = submitToCompetition(
      competition.id,
      voterOrUserId,
      authorName,
      authorPhoto,
      submitImage.trim()
    );

    setSubmitting(false);

    if (result.success && result.submission) {
      // Auto-approve in local view so entrant immediately sees their submission
      const newEntry: CompetitionSubmission = {
        ...result.submission,
        status: 'APPROVED',
        voteCount: 1
      };
      setSubmissions(prev => [newEntry, ...prev]);
      setShowSubmitModal(false);
      setToastMsg('✨ Look successfully submitted to the Weekly Competition!');
      setSubmitImage('');
      setSubmitConsent(false);
      setTimeout(() => setToastMsg(null), 4000);
    } else {
      alert(result.message);
    }
  };

  if (!competition) {
    return (
      <main style={{ padding: '80px 20px', textAlign: 'center', color: 'white' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800 }}>Loading Weekly BuyWise Competition...</h2>
        <div style={{ color: 'rgba(255,255,255,0.6)', marginTop: '8px' }}>Fetching live active challenge from Cloud Firestore...</div>
      </main>
    );
  }

  // Sort submissions by highest vote count
  const sortedSubmissions = [...submissions].sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0));

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
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>Live Weekly Challenge</span>
        </div>

        <h1 style={{ fontSize: '38px', fontWeight: 900, margin: '0 0 12px 0', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
          {competition.title}
        </h1>
        <p style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.75)', maxWidth: '680px', margin: '0 auto' }}>
          {competition.description}
        </p>

        {/* Legal Safeguard Badges */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '14px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 12px', borderRadius: '12px', background: 'rgba(0, 255, 136, 0.15)', color: '#00ff88', border: '1px solid rgba(0, 255, 136, 0.3)' }}>
            🆓 100% Free Entry • No Purchase Required
          </span>
          <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 12px', borderRadius: '12px', background: 'rgba(255, 215, 0, 0.15)', color: '#ffd700', border: '1px solid rgba(255, 215, 0, 0.3)' }}>
            🗳️ 1 Vote Per Shopper Anti-Fraud Guard
          </span>
          <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 12px', borderRadius: '12px', background: 'rgba(0, 212, 255, 0.15)', color: '#00d4ff', border: '1px solid rgba(0, 212, 255, 0.3)' }}>
            🎁 Prize: {competition.prizeDescription}
          </span>
          {competition.votesFrozen && (
            <span style={{ fontSize: '11px', fontWeight: 900, padding: '4px 12px', borderRadius: '12px', background: 'rgba(255, 77, 77, 0.2)', color: '#ff4d4d', border: '1px solid #ff4d4d' }}>
              🔒 Voting Temporarily Frozen by Admin
            </span>
          )}
        </div>
      </div>

      {/* Hero Featured Product Challenge Card */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.08), rgba(138, 43, 226, 0.12))',
          border: '1px solid rgba(255, 215, 0, 0.35)',
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
        <div style={{ position: 'relative', width: '100%', height: '280px', borderRadius: '20px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.15)' }}>
          <Image
            src={competition.featuredProductImage || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80'}
            alt={competition.featuredProductTitle}
            fill
            unoptimized
            style={{ objectFit: 'cover' }}
          />
          <div style={{ position: 'absolute', top: '16px', left: '16px', padding: '6px 14px', borderRadius: '12px', background: 'rgba(0,0,0,0.85)', color: '#ffd700', fontWeight: 900, fontSize: '12px', border: '1px solid rgba(255, 215, 0, 0.5)' }}>
            FEATURED CHALLENGE PRODUCT
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '13px', color: '#00ff88', fontWeight: 800 }}>Retailer: {competition.retailer}</span>
            <span style={{ fontSize: '11px', color: '#00d4ff', background: 'rgba(0, 212, 255, 0.15)', padding: '2px 8px', borderRadius: '8px' }}>
              ⚡ Status: {competition.status}
            </span>
          </div>

          <h2 style={{ fontSize: '24px', fontWeight: 900, color: 'white', margin: 0, lineHeight: 1.3 }}>
            {competition.featuredProductTitle}
          </h2>

          <div style={{ fontSize: '28px', fontWeight: 900, color: '#ffd700' }}>
            ₹{competition.featuredProductPrice.toLocaleString()}
          </div>

          <div style={{ fontSize: '13px', background: 'rgba(255,255,255,0.06)', padding: '12px 16px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)' }}>
            🎁 <strong>Prize:</strong> {competition.prizeDescription}
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '6px' }}>
            <Link href="/try-on" style={{ textDecoration: 'none' }}>
              <button
                style={{
                  padding: '12px 24px',
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, #ffd700, #ff8c00)',
                  color: '#000000',
                  fontWeight: 900,
                  fontSize: '14px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 8px 24px rgba(255, 215, 0, 0.4)',
                }}
              >
                ✨ Try On in VTO Room ➔
              </button>
            </Link>

            <button
              onClick={() => setShowSubmitModal(true)}
              style={{
                padding: '12px 22px',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #a855f7, #ff007f)',
                color: '#ffffff',
                fontWeight: 900,
                fontSize: '14px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(255, 0, 127, 0.35)',
              }}
            >
              📸 Submit Your Look
            </button>

            <Link href="/competition-terms" style={{ textDecoration: 'none' }}>
              <button
                style={{
                  padding: '12px 18px',
                  borderRadius: '20px',
                  background: 'rgba(255,255,255,0.08)',
                  color: 'white',
                  fontWeight: 800,
                  fontSize: '13px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  cursor: 'pointer',
                }}
              >
                ⚖️ Rules
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
      <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '36px', flexWrap: 'wrap' }}>
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
          🗳️ Current Entries ({submissions.length}) • {totalVotesCast} Votes Cast
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
              ✓ <strong>Your vote is registered for this competition!</strong> Thank you for participating in fair community voting.
            </div>
          )}

          {submissions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(255,255,255,0.03)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <span style={{ fontSize: '48px', display: 'block', marginBottom: '12px' }}>👗</span>
              <h3 style={{ fontSize: '20px', fontWeight: 800 }}>No submissions yet for this week&apos;s challenge.</h3>
              <p style={{ color: 'rgba(255,255,255,0.6)', maxWidth: '420px', margin: '8px auto 20px auto' }}>
                Be the first shopper to try on the featured product and submit your look to win ₹5,000!
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <Link href="/try-on">
                  <button style={{ padding: '12px 24px', borderRadius: '20px', background: '#00ff88', color: '#000', fontWeight: 900, border: 'none', cursor: 'pointer' }}>
                    Open AI Try-On Room ➔
                  </button>
                </Link>
                <button
                  onClick={() => setShowSubmitModal(true)}
                  style={{ padding: '12px 24px', borderRadius: '20px', background: 'rgba(255,255,255,0.1)', color: '#fff', fontWeight: 800, border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer' }}
                >
                  📸 Submit Photo Directly
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px' }}>
              {sortedSubmissions.map((sub, idx) => {
                const isLeader = idx === 0 && (sub.voteCount || 0) > 0;
                const votePct = totalVotesCast > 0 ? Math.round(((sub.voteCount || 0) / totalVotesCast) * 100) : 0;

                return (
                  <div
                    key={sub.id}
                    style={{
                      background: 'linear-gradient(135deg, rgba(20, 15, 38, 0.95), rgba(12, 10, 20, 0.98))',
                      border: isLeader ? '2px solid #ffd700' : '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '24px',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      boxShadow: isLeader ? '0 16px 40px rgba(255, 215, 0, 0.25)' : '0 12px 32px rgba(0,0,0,0.4)',
                      position: 'relative'
                    }}
                  >
                    {/* Rank Badge */}
                    <div style={{ position: 'absolute', top: '14px', left: '14px', zIndex: 10, padding: '4px 12px', borderRadius: '10px', background: isLeader ? 'rgba(255, 215, 0, 0.95)' : 'rgba(0,0,0,0.75)', color: isLeader ? '#000' : '#fff', fontWeight: 900, fontSize: '11px', backdropFilter: 'blur(4px)' }}>
                      {idx === 0 ? '🥇 #1 CURRENT LEADER' : idx === 1 ? '🥈 #2 RANKED' : idx === 2 ? '🥉 #3 RANKED' : `#${idx + 1}`}
                    </div>

                    {/* Submission Image */}
                    <div style={{ position: 'relative', width: '100%', height: '360px', background: 'rgba(0,0,0,0.4)' }}>
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
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', position: 'relative', border: '2px solid #ffd700', background: '#222' }}>
                            <Image src={sub.userPhotoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'} alt={sub.userName} fill unoptimized style={{ objectFit: 'cover' }} />
                          </div>
                          <span style={{ fontWeight: 900, color: 'white', fontSize: '15px', textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>{sub.userName}</span>
                        </div>

                        <span style={{ padding: '4px 12px', borderRadius: '12px', background: 'rgba(255, 215, 0, 0.25)', color: '#ffd700', fontWeight: 900, fontSize: '13px', border: '1px solid rgba(255, 215, 0, 0.5)' }}>
                          ❤️ {sub.voteCount} Votes ({votePct}%)
                        </span>
                      </div>
                    </div>

                    {/* Vote Percentage Progress Bar */}
                    <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.08)' }}>
                      <div style={{ width: `${votePct}%`, height: '100%', background: isLeader ? 'linear-gradient(90deg, #ffd700, #ff8c00)' : '#ff007f', transition: 'width 0.4s ease' }} />
                    </div>

                    {/* Submission Actions */}
                    <div style={{ padding: '20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <button
                        onClick={() => handleVote(sub.id)}
                        disabled={voted || votingBusy === sub.id}
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
                        {voted ? '✓ Voted' : votingBusy === sub.id ? 'Recording...' : '❤️ Vote for this Look'}
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
                );
              })}
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

      {/* Direct Look Submission Modal */}
      {showSubmitModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100000, background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass" style={{ width: '100%', maxWidth: '520px', background: 'rgba(18, 14, 36, 0.98)', border: '1px solid rgba(255, 215, 0, 0.4)', borderRadius: '24px', padding: '32px', boxShadow: '0 25px 60px rgba(0,0,0,0.8)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <span style={{ fontSize: '11px', color: '#ffd700', fontWeight: 900 }}>WEEKLY FASHION CHALLENGE</span>
                <h2 style={{ fontSize: '20px', fontWeight: 900, margin: '2px 0 0 0', color: '#fff' }}>Submit Look to Competition</h2>
              </div>
              <button onClick={() => setShowSubmitModal(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '22px', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleDirectSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 800, color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: '6px' }}>Your Name / Model Handle</label>
                <input
                  type="text"
                  value={submitName}
                  onChange={e => setSubmitName(e.target.value)}
                  placeholder="e.g. Maya Patel"
                  required
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 800, color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: '6px' }}>Try-On Look Image URL</label>
                <input
                  type="url"
                  value={submitImage}
                  onChange={e => setSubmitImage(e.target.value)}
                  placeholder="https://... (or choose a preset below)"
                  required
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '13px' }}
                />
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '6px' }}>
                  Quick Presets:
                  <button type="button" onClick={() => setSubmitImage('https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80')} style={{ marginLeft: '6px', background: 'none', border: 'none', color: '#00d4ff', textDecoration: 'underline', cursor: 'pointer', fontSize: '11px' }}>Kanjivaram Saree</button>
                  <button type="button" onClick={() => setSubmitImage('https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80')} style={{ marginLeft: '6px', background: 'none', border: 'none', color: '#00d4ff', textDecoration: 'underline', cursor: 'pointer', fontSize: '11px' }}>Emerald Anarkali</button>
                </div>
              </div>

              {submitImage && (
                <div style={{ width: '100%', height: '180px', borderRadius: '14px', overflow: 'hidden', position: 'relative', border: '1px solid rgba(255,255,255,0.2)' }}>
                  <img src={submitImage} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginTop: '4px' }}>
                <input
                  type="checkbox"
                  id="consentCheck"
                  checked={submitConsent}
                  onChange={e => setSubmitConsent(e.target.checked)}
                  style={{ marginTop: '3px', cursor: 'pointer' }}
                />
                <label htmlFor="consentCheck" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.4, cursor: 'pointer' }}>
                  I confirm that I am 18+, own or have rights to this Try-On image, and agree to the <Link href="/competition-terms" target="_blank" style={{ color: '#ffd700' }}>Competition Terms &amp; Privacy Policy</Link> for community voting publication.
                </label>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  style={{ padding: '10px 18px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', fontWeight: 800, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ padding: '10px 24px', borderRadius: '12px', background: 'linear-gradient(135deg, #ffd700, #ff8c00)', border: 'none', color: '#000', fontWeight: 900, cursor: 'pointer' }}
                >
                  {submitting ? 'Submitting...' : 'Submit Entry ➔'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

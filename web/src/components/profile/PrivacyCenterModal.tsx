"use client"
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getPrivateMediaCounts, clearAllPrivateImages } from '@/lib/privacy/localImageStore';
import { useTranslation } from '@/lib/i18n/i18nContext';

interface PrivacyCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PrivacyCenterModal({ isOpen, onClose }: PrivacyCenterModalProps) {
  const { t } = useTranslation();
  const [personalization, setPersonalization] = useState(true);
  const [analytics, setAnalytics] = useState(false);
  const [clearedHistory, setClearedHistory] = useState(false);
  const [clearedPrivateData, setClearedPrivateData] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  const [counts, setCounts] = useState({
    privatePhotos: 0,
    privateLooks: 0,
    competitionSubmissions: 0,
  });

  useEffect(() => {
    if (isOpen) {
      loadCounts();
    }
  }, [isOpen]);

  const loadCounts = async () => {
    const data = await getPrivateMediaCounts();
    setCounts(data);
  };

  if (!isOpen) return null;

  const handleClearHistory = () => {
    localStorage.removeItem('buywise_recent_searches');
    setClearedHistory(true);
    setTimeout(() => setClearedHistory(false), 2000);
  };

  const handleConfirmClearPrivateData = async () => {
    await clearAllPrivateImages();
    setShowConfirmClear(false);
    setClearedPrivateData(true);
    await loadCounts();
    setTimeout(() => setClearedPrivateData(false), 3000);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'linear-gradient(135deg, #140f26, #0c0a14)',
          border: '1px solid rgba(0, 212, 255, 0.3)',
          borderRadius: '24px',
          padding: '28px',
          boxShadow: '0 24px 48px rgba(0,0,0,0.8)',
          color: 'white',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 900, margin: 0 }}>{t('privacy_rights_title')}</h2>
            <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', margin: 0 }}>
              Aligned with DPDP Act 2023 &amp; DPDP Rules 2025 (India)
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '20px',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {clearedHistory && (
          <div style={{ padding: '10px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 700, marginBottom: '16px', background: 'rgba(0, 255, 136, 0.15)', color: '#00ff88', border: '1px solid rgba(0, 255, 136, 0.3)' }}>
            ✓ Local search &amp; browsing history cleared successfully!
          </div>
        )}

        {clearedPrivateData && (
          <div style={{ padding: '10px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 700, marginBottom: '16px', background: 'rgba(0, 255, 136, 0.15)', color: '#00ff88', border: '1px solid rgba(0, 255, 136, 0.3)' }}>
            ✓ All local private Try-On photos and saved looks cleared from this device!
          </div>
        )}

        {/* MY PRIVATE DATA Breakdown */}
        <div style={{ background: 'rgba(255, 255, 255, 0.04)', borderRadius: '16px', padding: '18px', border: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: 900, color: 'var(--primary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            MY PRIVATE DATA (LOCAL STORAGE)
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 900, color: 'white' }}>{counts.privatePhotos}</div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>Private Photos</div>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#00ff88' }}>{counts.privateLooks}</div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>Saved VTO Looks</div>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#ffd700' }}>{counts.competitionSubmissions}</div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>Competition Entries</div>
            </div>
          </div>

          <button
            onClick={() => setShowConfirmClear(true)}
            style={{
              width: '100%',
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
            🗑️ {t('clear_history')}
          </button>
        </div>

        {/* Confirmation Modal Safeguard for Clear Private Data */}
        {showConfirmClear && (
          <div
            style={{
              background: 'rgba(255, 0, 80, 0.12)',
              border: '1px solid rgba(255, 0, 80, 0.4)',
              borderRadius: '14px',
              padding: '16px',
              marginBottom: '20px',
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: 900, color: '#ff4d4d', marginBottom: '6px' }}>
              ⚠️ Confirm Clearing Local Try-On Data?
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.8)', lineHeight: 1.5, marginBottom: '12px' }}>
              This will remove your locally stored Try-On photos and saved VTO results from this device. (Order &amp; transaction records remain preserved separately).
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setShowConfirmClear(false)}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  color: 'white',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleConfirmClearPrivateData}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '8px',
                  background: '#ff0055',
                  border: 'none',
                  color: 'white',
                  fontWeight: 900,
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                Yes, Clear All Local Data
              </button>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Toggles */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.04)', padding: '14px 16px', borderRadius: '12px' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 800 }}>Personalized Recommendations</div>
              <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>Use categories &amp; price range preferences to tailor SmartCompare</div>
            </div>
            <input
              type="checkbox"
              checked={personalization}
              onChange={(e) => setPersonalization(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.04)', padding: '14px 16px', borderRadius: '12px' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 800 }}>Performance Analytics</div>
              <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>Help improve system health logs (No personal identifiers stored)</div>
            </div>
            <input
              type="checkbox"
              checked={analytics}
              onChange={(e) => setAnalytics(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
            <button
              onClick={handleClearHistory}
              style={{
                padding: '12px 16px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: 'white',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              🧹 {t('clear_history')}
            </button>

            <div style={{ display: 'flex', gap: '10px' }}>
              <Link
                href="/privacy-policy"
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: 'rgba(0, 212, 255, 0.1)',
                  border: '1px solid rgba(0, 212, 255, 0.25)',
                  color: 'var(--primary)',
                  fontWeight: 700,
                  fontSize: '12px',
                  textDecoration: 'none',
                  display: 'block',
                  textAlign: 'center',
                }}
              >
                📄 {t('privacy_policy')} →
              </Link>
              <Link
                href="/competition-terms"
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: 'rgba(255, 215, 0, 0.1)',
                  border: '1px solid rgba(255, 215, 0, 0.25)',
                  color: '#ffd700',
                  fontWeight: 700,
                  fontSize: '12px',
                  textDecoration: 'none',
                  display: 'block',
                  textAlign: 'center',
                }}
              >
                🏆 Competition Terms →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

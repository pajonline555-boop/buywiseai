"use client"
import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n/i18nContext';

interface RateBuyWiseDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RateBuyWiseDialog({ isOpen, onClose }: RateBuyWiseDialogProps) {
  const { t } = useTranslation();
  const [rating, setRating] = useState<number>(5);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFeedback('');
      onClose();
    }, 1500);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(0, 0, 0, 0.75)',
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
          maxWidth: '480px',
          background: 'linear-gradient(135deg, #140f26, #0c0a14)',
          border: '1px solid rgba(255, 0, 128, 0.3)',
          borderRadius: '24px',
          padding: '28px',
          boxShadow: '0 24px 48px rgba(0,0,0,0.8)',
          color: 'white',
          textAlign: 'center',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
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

        {submitted ? (
          <div style={{ padding: '20px 0' }}>
            <span style={{ fontSize: '40px', display: 'block', marginBottom: '10px' }}>🌟</span>
            <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#00ff88', margin: 0 }}>
              Thank You!
            </h3>
            <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)', marginTop: '6px' }}>
              Your rating helps us improve BuyWise AI for shoppers everywhere.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: 900, margin: 0 }}>{t('rate_buywise_title')}</h2>
              <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)', marginTop: '4px' }}>
                How is your AI shopping &amp; SmartCompare experience?
              </p>
            </div>

            {/* Star selector */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '36px',
                    cursor: 'pointer',
                    filter: star <= rating ? 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.6))' : 'grayscale(100%) opacity(0.3)',
                    transition: 'transform 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  ⭐
                </button>
              ))}
            </div>

            {rating === 5 ? (
              <div
                style={{
                  padding: '14px',
                  borderRadius: '12px',
                  background: 'rgba(0, 255, 136, 0.12)',
                  border: '1px solid rgba(0, 255, 136, 0.3)',
                  color: '#00ff88',
                  fontSize: '13px',
                  fontWeight: 700,
                }}
              >
                🎉 5 Stars! We are thrilled you love BuyWise AI.
              </div>
            ) : (
              <div>
                <label style={{ fontSize: '12px', fontWeight: 800, color: 'rgba(255, 255, 255, 0.7)', display: 'block', marginBottom: '6px', textAlign: 'left' }}>
                  What can we improve?
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={3}
                  placeholder="Tell us what features or price comparison tools you'd like..."
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: 'white',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  color: 'white',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  background: 'var(--gradient-accent)',
                  border: 'none',
                  color: 'white',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                {t('submit_review')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

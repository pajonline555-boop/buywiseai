"use client"
import React, { useState } from 'react';
import Link from 'next/link';
import SafeProductImage from '@/components/SafeProductImage';
import { submitToCompetition } from '@/lib/competitions/competitionService';

interface SubmitToCompetitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  vtoResultId: string;
  imageSrc: string;
  productName?: string;
  onSuccess?: () => void;
}

export default function SubmitToCompetitionModal({
  isOpen,
  onClose,
  vtoResultId,
  imageSrc,
  productName = 'Festive Look 2026',
  onSuccess,
}: SubmitToCompetitionModalProps) {
  const [consentChecked, setConsentChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentChecked) {
      setError('Please accept the competition sharing terms to proceed.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await submitToCompetition(vtoResultId, imageSrc, consentChecked);
      setSubmitted(true);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to submit entry.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(0, 0, 0, 0.85)',
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
          maxWidth: '500px',
          background: 'linear-gradient(135deg, #140f26, #0c0a14)',
          border: '1px solid rgba(255, 215, 0, 0.4)',
          borderRadius: '24px',
          padding: '28px',
          boxShadow: '0 24px 48px rgba(0,0,0,0.9)',
          color: 'white',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 900, color: '#ffd700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              BUYWISE FASHION COMPETITION
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 900, margin: '2px 0 0 0' }}>
              Submit Look to Competition
            </h2>
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

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏆</div>
            <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#ffd700', marginBottom: '8px' }}>
              Look Submitted Successfully!
            </h3>
            <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.8)', lineHeight: 1.6, marginBottom: '20px' }}>
              Your selected VTO image has been submitted for moderation. Once reviewed by judges, it will be published in the public competition gallery.
            </p>
            <button
              onClick={onClose}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #ffd700, #ffaa00)',
                border: 'none',
                color: '#090d16',
                fontWeight: 900,
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Selected Image Preview */}
            <div style={{ display: 'flex', gap: '16px', background: 'rgba(255, 255, 255, 0.04)', padding: '14px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <div style={{ width: '80px', aspectRatio: '3/4', borderRadius: '10px', overflow: 'hidden', flexShrink: 0 }}>
                <SafeProductImage src={imageSrc} alt="Selected Competition VTO Look" objectFit="cover" aspectRatio="3/4" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontSize: '14px', fontWeight: 900 }}>{productName}</div>
                <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', marginTop: '4px' }}>
                  Target: BuyWise Style Challenge 2026
                </div>
                <div style={{ fontSize: '10px', fontWeight: 800, color: '#ffd700', marginTop: '6px' }}>
                  🏆 Single Image Selection
                </div>
              </div>
            </div>

            {/* Granular Scope Notice */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '12px',
                background: 'rgba(0, 212, 255, 0.1)',
                border: '1px solid rgba(0, 212, 255, 0.25)',
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.85)',
                lineHeight: 1.5,
              }}
            >
              🛡️ <strong>Granular Privacy Scope:</strong> Submitting this look shares <em>only this specific image</em>. All your other private Try-On photos and saved looks remain 100% private on your device.
            </div>

            {error && (
              <div style={{ color: '#ff4d4d', fontSize: '12px', fontWeight: 700, padding: '8px 12px', background: 'rgba(255, 77, 77, 0.15)', borderRadius: '8px' }}>
                ⚠️ {error}
              </div>
            )}

            {/* Consent Checkbox */}
            <label
              style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
                cursor: 'pointer',
                background: 'rgba(255, 215, 0, 0.05)',
                padding: '14px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 215, 0, 0.2)',
              }}
            >
              <input
                type="checkbox"
                checked={consentChecked}
                onChange={(e) => setConsentChecked(e.target.checked)}
                style={{ width: '20px', height: '20px', marginTop: '2px', cursor: 'pointer' }}
              />
              <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.9)', lineHeight: 1.5 }}>
                I understand and explicitly agree to the{' '}
                <Link href="/competition-terms" style={{ color: '#ffd700', textDecoration: 'underline' }} target="_blank">
                  Competition Sharing Terms
                </Link>. This image may be visible to judges and public users if published.
              </div>
            </label>

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !consentChecked}
                style={{
                  flex: 2,
                  padding: '12px',
                  borderRadius: '12px',
                  background: consentChecked
                    ? 'linear-gradient(135deg, #ffd700, #ff9900)'
                    : 'rgba(255, 255, 255, 0.15)',
                  border: 'none',
                  color: consentChecked ? '#090d16' : 'rgba(255, 255, 255, 0.4)',
                  fontWeight: 900,
                  fontSize: '13px',
                  cursor: submitting || !consentChecked ? 'not-allowed' : 'pointer',
                }}
              >
                {submitting ? 'Submitting...' : '🏆 Submit Selected Look'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

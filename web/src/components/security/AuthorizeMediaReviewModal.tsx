"use client"
import React, { useState } from 'react';
import SafeProductImage from '@/components/SafeProductImage';
import { authorizeMediaReview, ReviewReason } from '@/lib/security/mediaReviewService';

interface AuthorizeMediaReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  vtoResultId: string;
  imageSrc: string;
  onSuccess?: () => void;
}

export default function AuthorizeMediaReviewModal({
  isOpen,
  onClose,
  vtoResultId,
  imageSrc,
  onSuccess,
}: AuthorizeMediaReviewModalProps) {
  const [reason, setReason] = useState<ReviewReason>('VTO_QUALITY');
  const [consentChecked, setConsentChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentChecked) {
      setError('Explicit user authorization is required to proceed.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await authorizeMediaReview(vtoResultId, imageSrc, reason, consentChecked);
      setSubmitted(true);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to authorize media review.');
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
          maxWidth: '520px',
          background: 'linear-gradient(135deg, #140f26, #0c0a14)',
          border: '1px solid rgba(0, 212, 255, 0.3)',
          borderRadius: '24px',
          padding: '28px',
          boxShadow: '0 24px 48px rgba(0,0,0,0.9)',
          color: 'white',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 900, color: '#00d4ff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              SECURITY & SUPPORT REVIEW
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 900, margin: '2px 0 0 0' }}>
              Authorize Single-Image Review
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
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🛡️</div>
            <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#00ff88', marginBottom: '8px' }}>
              Temporary Review Authorized
            </h3>
            <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.8)', lineHeight: 1.6, marginBottom: '20px' }}>
              Your selected VTO image has been authorized for temporary support/security review (48-hour TTL). An immutable audit log entry has been recorded.
            </p>
            <button
              onClick={onClose}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #00d4ff, #00ff88)',
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
                <SafeProductImage src={imageSrc} alt="Target Review Image" objectFit="cover" aspectRatio="3/4" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontSize: '13px', fontWeight: 900 }}>Selected Try-On Image</div>
                <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', marginTop: '4px' }}>
                  ID: {vtoResultId}
                </div>
                <div style={{ fontSize: '10px', fontWeight: 800, color: '#00d4ff', marginTop: '6px' }}>
                  🔒 Temporary TTL Access (48 Hours)
                </div>
              </div>
            </div>

            {/* Select Reason */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: 'rgba(255,255,255,0.8)', marginBottom: '6px' }}>
                Reason for Security / Support Review:
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as ReviewReason)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: 'white',
                  fontSize: '13px',
                  outline: 'none',
                }}
              >
                <option value="VTO_QUALITY" style={{ background: '#140f26' }}>VTO Quality / Garment Rendering Issue</option>
                <option value="ABUSE_REPORT" style={{ background: '#140f26' }}>Safety or Content Abuse Report</option>
                <option value="SECURITY_INVESTIGATION" style={{ background: '#140f26' }}>Security & Fraud Investigation</option>
                <option value="TECHNICAL_SUPPORT" style={{ background: '#140f26' }}>Technical Support Ticket</option>
                <option value="OTHER" style={{ background: '#140f26' }}>Other Stated Reason</option>
              </select>
            </div>

            {/* Granular Scope Notice */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '12px',
                background: 'rgba(121, 40, 202, 0.15)',
                border: '1px solid rgba(121, 40, 202, 0.3)',
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.85)',
                lineHeight: 1.5,
              }}
            >
              🛡️ <strong>Limited Authorization Scope:</strong> Authorizing review grants access ONLY to this single selected image for 48 hours. BuyWise administrators CANNOT access your full private VTO library or other unsubmitted images.
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
                background: 'rgba(0, 212, 255, 0.05)',
                padding: '14px',
                borderRadius: '12px',
                border: '1px solid rgba(0, 212, 255, 0.2)',
              }}
            >
              <input
                type="checkbox"
                checked={consentChecked}
                onChange={(e) => setConsentChecked(e.target.checked)}
                style={{ width: '20px', height: '20px', marginTop: '2px', cursor: 'pointer' }}
              />
              <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.9)', lineHeight: 1.5 }}>
                I authorize BuyWise to temporarily access this specific image for the selected support/security purpose.
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
                    ? 'linear-gradient(135deg, #00d4ff, #7928ca)'
                    : 'rgba(255, 255, 255, 0.15)',
                  border: 'none',
                  color: consentChecked ? 'white' : 'rgba(255, 255, 255, 0.4)',
                  fontWeight: 900,
                  fontSize: '13px',
                  cursor: submitting || !consentChecked ? 'not-allowed' : 'pointer',
                }}
              >
                {submitting ? 'Authorizing...' : '🛡️ Authorize Once'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

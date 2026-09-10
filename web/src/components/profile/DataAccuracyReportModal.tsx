"use client"
import React, { useState } from 'react';

interface DataAccuracyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const REPORT_CATEGORIES = [
  'Wrong Price Displayed',
  'Wrong Product Image',
  'Invalid / Expired Coupon',
  'Wrong Retailer / Store',
  'AI Virtual Try-On Generation Issue',
  'Product Link Broken / Removed',
  'Other Data Quality Issue',
];

export default function DataAccuracyReportModal({ isOpen, onClose }: DataAccuracyReportModalProps) {
  const [category, setCategory] = useState(REPORT_CATEGORIES[0]);
  const [productIdOrUrl, setProductIdOrUrl] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setDetails('');
        setProductIdOrUrl('');
        onClose();
      }, 1500);
    }, 600);
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
          maxWidth: '520px',
          background: 'linear-gradient(135deg, #140f26, #0c0a14)',
          border: '1px solid rgba(255, 193, 7, 0.3)',
          borderRadius: '24px',
          padding: '28px',
          boxShadow: '0 24px 48px rgba(0,0,0,0.8)',
          color: 'white',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 900, margin: 0 }}>Report Data Issue</h2>
            <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', margin: 0 }}>
              Help BuyWise keep shopping data 100% accurate
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

        {submitted ? (
          <div
            style={{
              padding: '24px',
              textAlign: 'center',
              background: 'rgba(0, 255, 136, 0.12)',
              borderRadius: '16px',
              border: '1px solid rgba(0, 255, 136, 0.3)',
              color: '#00ff88',
            }}
          >
            <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>✓</span>
            <div style={{ fontSize: '16px', fontWeight: 800 }}>Thank you for your report!</div>
            <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', marginTop: '4px' }}>
              Our data verification team has received your submission.
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 800, color: 'rgba(255, 255, 255, 0.7)', display: 'block', marginBottom: '6px' }}>
                Issue Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: '#1a162b',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: 'white',
                  fontSize: '13px',
                  outline: 'none',
                }}
              >
                {REPORT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 800, color: 'rgba(255, 255, 255, 0.7)', display: 'block', marginBottom: '6px' }}>
                Product ID, Title, or Retailer URL (Optional)
              </label>
              <input
                type="text"
                value={productIdOrUrl}
                onChange={(e) => setProductIdOrUrl(e.target.value)}
                placeholder="e.g. iPhone 17 or Amazon product link"
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

            <div>
              <label style={{ fontSize: '12px', fontWeight: 800, color: 'rgba(255, 255, 255, 0.7)', display: 'block', marginBottom: '6px' }}>
                Details / What did you notice? *
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={4}
                required
                placeholder="Describe what price or information was incorrect..."
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: 'white',
                  fontSize: '13px',
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
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
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !details.trim()}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #ffc107, #ff9800)',
                  border: 'none',
                  color: '#090d16',
                  fontWeight: 900,
                  cursor: submitting || !details.trim() ? 'not-allowed' : 'pointer',
                }}
              >
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

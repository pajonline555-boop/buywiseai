"use client"
import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useTranslation } from '@/lib/i18n/i18nContext';

interface DeleteAccountDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DeleteAccountDialog({ isOpen, onClose }: DeleteAccountDialogProps) {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDelete = async () => {
    if (confirmText.toUpperCase() !== 'DELETE') {
      setError('Please type DELETE to confirm account deletion.');
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      if (user) {
        await user.delete();
      }
      await logout();
    } catch (err: any) {
      console.error("Account deletion error:", err);
      if (err.code === 'auth/requires-recent-login') {
        setError('Security rule: Please sign out and sign back in before deleting your account.');
      } else {
        setError('Account deletion failed. Please contact support.');
      }
      setDeleting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(16px)',
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
          background: 'linear-gradient(135deg, #260f14, #140a0c)',
          border: '1px solid rgba(255, 0, 80, 0.4)',
          borderRadius: '24px',
          padding: '28px',
          boxShadow: '0 24px 48px rgba(255, 0, 80, 0.3)',
          color: 'white',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '24px' }}>⚠️</span>
            <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#ff0050', margin: 0 }}>
              {t('delete_account')}
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

        <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.8)', lineHeight: 1.6, marginBottom: '16px' }}>
          {t('delete_account_title')} {t('delete_warning')}
        </div>

        {error && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 700,
              marginBottom: '16px',
              background: 'rgba(255, 0, 80, 0.2)',
              color: '#ff0050',
              border: '1px solid rgba(255, 0, 80, 0.4)',
            }}
          >
            {error}
          </div>
        )}

        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '12px', fontWeight: 800, color: 'rgba(255, 255, 255, 0.8)', display: 'block', marginBottom: '6px' }}>
            Type <strong>DELETE</strong> to confirm:
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: '12px',
              background: 'rgba(255, 0, 80, 0.1)',
              border: '1px solid rgba(255, 0, 80, 0.3)',
              color: '#ff0050',
              fontSize: '14px',
              fontWeight: 800,
              outline: 'none',
              letterSpacing: '0.05em',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: 'white',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting || confirmText.toUpperCase() !== 'DELETE'}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '12px',
              background: confirmText.toUpperCase() === 'DELETE' ? '#ff0050' : 'rgba(255, 0, 80, 0.3)',
              border: 'none',
              color: 'white',
              fontWeight: 900,
              cursor: deleting || confirmText.toUpperCase() !== 'DELETE' ? 'not-allowed' : 'pointer',
              boxShadow: confirmText.toUpperCase() === 'DELETE' ? '0 4px 16px rgba(255, 0, 80, 0.5)' : 'none',
            }}
          >
            {deleting ? 'Deleting...' : t('confirm_delete')}
          </button>
        </div>
      </div>
    </div>
  );
}

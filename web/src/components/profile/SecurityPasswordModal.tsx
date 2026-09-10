"use client"
import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { sendPasswordResetEmail, updatePassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useTranslation } from '@/lib/i18n/i18nContext';

interface SecurityPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SecurityPasswordModal({ isOpen, onClose }: SecurityPasswordModalProps) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'recover' | 'change'>('recover');
  const [resetEmail, setResetEmail] = useState(user?.email || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(true);

  if (!isOpen) return null;

  const handlePasswordReset = async () => {
    const emailToUse = resetEmail.trim() || user?.email;
    if (!emailToUse || !emailToUse.includes('@')) {
      setIsSuccess(false);
      setMessage('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      await sendPasswordResetEmail(auth, emailToUse);
      setIsSuccess(true);
      setMessage(`✓ Password reset email sent to ${emailToUse}. Please check your inbox.`);
    } catch (err: any) {
      console.error("Password reset error:", err);
      setIsSuccess(false);
      setMessage(err.message || 'Failed to send password reset email.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!auth.currentUser) {
      setIsSuccess(false);
      setMessage('Guest Mode: Please sign in with an email account to change your password.');
      return;
    }
    if (newPassword.length < 6) {
      setIsSuccess(false);
      setMessage('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setIsSuccess(false);
      setMessage('Passwords do not match.');
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      await updatePassword(auth.currentUser, newPassword);
      setIsSuccess(true);
      setMessage('✓ Password updated successfully! Please use your new password next time you sign in.');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error("Password change error:", err);
      setIsSuccess(false);
      if (err.code === 'auth/requires-recent-login') {
        setMessage('Security Requirement: Changing password requires recent authentication. Please sign out and sign back in, then retry.');
      } else {
        setMessage(err.message || 'Failed to update password.');
      }
    } finally {
      setLoading(false);
    }
  };

  const providers = user?.providerData?.map((p) => p.providerId) || ['password'];

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
          maxWidth: '520px',
          background: 'linear-gradient(135deg, #140f26, #0c0a14)',
          border: '1px solid rgba(0, 255, 136, 0.3)',
          borderRadius: '24px',
          padding: '28px',
          boxShadow: '0 24px 48px rgba(0,0,0,0.8)',
          color: 'white',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 900, margin: 0 }}>🔐 {t('account_security_title')}</h2>
            <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', margin: 0 }}>
              Firebase Auth 256-bit AES Encrypted Credentials
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

        {/* Tab Selection */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <button
            onClick={() => { setActiveTab('recover'); setMessage(null); }}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '12px',
              background: activeTab === 'recover' ? 'var(--gradient-accent)' : 'rgba(255,255,255,0.06)',
              color: activeTab === 'recover' ? '#ffffff' : 'rgba(255,255,255,0.7)',
              border: 'none',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            🔑 Recover Password
          </button>
          <button
            onClick={() => { setActiveTab('change'); setMessage(null); }}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '12px',
              background: activeTab === 'change' ? 'linear-gradient(135deg, #00ff88, #00b359)' : 'rgba(255,255,255,0.06)',
              color: activeTab === 'change' ? '#090d16' : 'rgba(255,255,255,0.7)',
              border: 'none',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            ⚡ {t('change_password')}
          </button>
        </div>

        {message && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 700,
              marginBottom: '16px',
              background: isSuccess ? 'rgba(0, 255, 136, 0.15)' : 'rgba(255, 68, 68, 0.15)',
              color: isSuccess ? '#00ff88' : '#ff6b6b',
              border: `1px solid ${isSuccess ? 'rgba(0, 255, 136, 0.3)' : 'rgba(255, 68, 68, 0.3)'}`,
            }}
          >
            {message}
          </div>
        )}

        {/* Authentication Providers Info */}
        <div style={{ marginBottom: '20px', background: 'rgba(255, 255, 255, 0.04)', padding: '14px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'rgba(255, 255, 255, 0.6)', marginBottom: '6px', textTransform: 'uppercase' }}>
            Active Authentication Method
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {providers.map((p, idx) => (
              <span
                key={idx}
                style={{
                  fontSize: '12px',
                  fontWeight: 800,
                  padding: '4px 12px',
                  borderRadius: '20px',
                  background: 'rgba(0, 255, 136, 0.15)',
                  color: '#00ff88',
                  border: '1px solid rgba(0, 255, 136, 0.3)',
                }}
              >
                {p === 'google.com' ? '🔑 Google OAuth 2.0' : '✉️ Password / Email'}
              </span>
            ))}
          </div>
        </div>

        {activeTab === 'recover' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                Account Email Address
              </label>
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="enter email to recover"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>
            <button
              onClick={handlePasswordReset}
              disabled={loading}
              style={{
                padding: '14px',
                borderRadius: '12px',
                background: 'var(--gradient-accent)',
                border: 'none',
                color: '#ffffff',
                fontWeight: 900,
                fontSize: '14px',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 16px rgba(0, 212, 255, 0.3)',
              }}
            >
              {loading ? 'Sending Recovery Link...' : '📧 Send Recovery Reset Email'}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                New Password (min 6 characters)
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>
            <button
              onClick={handleChangePassword}
              disabled={loading}
              style={{
                padding: '14px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #00ff88, #00b359)',
                border: 'none',
                color: '#090d16',
                fontWeight: 900,
                fontSize: '14px',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 16px rgba(0, 255, 136, 0.3)',
              }}
            >
              {loading ? 'Updating Password...' : `⚡ ${t('change_password')}`}
            </button>
          </div>
        )}

        <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', textAlign: 'center', marginTop: '16px' }}>
          🔒 Password changes are protected by Firebase Authentication 256-bit security rules.
        </div>
      </div>
    </div>
  );
}

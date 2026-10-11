"use client"
import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage(`Password reset email sent to ${email}. Please check your inbox or spam folder.`);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email address.');
      } else {
        setMessage(`Password reset request processed for ${email}. Check your inbox for link.`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-center" style={{ minHeight: '100vh', paddingTop: '100px' }}>
      <div className="glass animate-fade-in" style={{ padding: '40px', width: '100%', maxWidth: '450px' }}>
        <h2 className="text-gradient" style={{ fontSize: '28px', textAlign: 'center', marginBottom: '10px' }}>Reset Password</h2>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: '14px', marginBottom: '25px' }}>
          Enter your registered email address to receive a secure password reset link.
        </p>
        
        {message && (
          <div style={{ padding: '12px', background: 'rgba(0, 240, 255, 0.1)', color: '#00F0FF', borderRadius: '10px', marginBottom: '20px', textAlign: 'center', border: '1px solid rgba(0, 240, 255, 0.2)', fontSize: '13px' }}>
            {message}
          </div>
        )}

        {error && (
          <div style={{ padding: '12px', background: 'rgba(255, 77, 77, 0.1)', color: '#ff4d4d', borderRadius: '10px', marginBottom: '20px', textAlign: 'center', border: '1px solid rgba(255, 77, 77, 0.2)', fontSize: '13px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="glass" 
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', padding: '12px 20px', color: 'white', borderRadius: '12px', outline: 'none' }}
              placeholder="name@example.com"
              required
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: '10px' }}>
            {loading ? 'Sending Link...' : 'Send Password Reset Link'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '30px', fontSize: '14px', color: 'var(--text-secondary)' }}>
          Remembered your password? <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Back to Sign In</Link>
        </p>
      </div>
    </main>
  );
}

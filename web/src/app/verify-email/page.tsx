"use client"
import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const { user } = useAuth();

  const displayEmail = email || user?.email || "your email";

  return (
    <main className="flex-center" style={{ minHeight: '100vh', paddingTop: '100px' }}>
      <div className="glass animate-fade-in" style={{ padding: '60px', width: '100%', maxWidth: '600px', textAlign: 'center' }}>
        <div style={{ fontSize: '64px', marginBottom: '30px' }}>✉️</div>
        <h2 className="text-gradient" style={{ fontSize: '36px', marginBottom: '20px' }}>Verify Your Email</h2>
        
        {/* Requirement Message */}
        <p style={{ fontSize: '18px', lineHeight: 1.6, color: 'var(--text-secondary)', marginBottom: '40px' }}>
          We have sent you a verification email to <span style={{ color: 'white', fontWeight: 600 }}>{displayEmail}</span>. 
          Please verify it and log in.
        </p>

        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
          <Link href="/login" className="btn-primary" style={{ textDecoration: 'none' }}>
            Go to Login
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="flex-center" style={{ height: '100vh' }}>Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}

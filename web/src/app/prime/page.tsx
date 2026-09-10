"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useTranslation } from '@/lib/i18n/i18nContext';
import { useTheme } from '@/lib/theme/themeProvider';
import { AUTHORITATIVE_PRIME_PLANS, PrimePlanId, UserEntitlement } from '@/lib/prime/types';
import Link from 'next/link';

export default function PrimeMembershipPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { accentColor } = useTheme();

  const [selectedPlan, setSelectedPlan] = useState<PrimePlanId>('PRIME_MONTHLY');
  const [entitlement, setEntitlement] = useState<UserEntitlement | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchStatus = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/prime/status?userId=${user.uid}&userEmail=${encodeURIComponent(user.email || '')}`);
      const data = await res.json();
      if (data.success) {
        setEntitlement(data.entitlement);
      }
    } catch (e) {
      console.warn("Failed to fetch Prime status:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [user]);

  const handleSandboxSubscribe = async () => {
    if (!user) {
      setMessage({ type: 'error', text: 'Please sign in to subscribe to BuyWise Prime.' });
      return;
    }

    setProcessing(true);
    setMessage(null);

    try {
      // 1. Create Sandbox Order
      const createRes = await fetch('/api/prime/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlan,
          userId: user.uid,
          provider: 'SANDBOX',
        }),
      });
      const createData = await createRes.json();

      if (!createData.success) {
        throw new Error(createData.error || 'Failed to initialize order');
      }

      // 2. Verify Sandbox Order
      const verifyRes = await fetch('/api/prime/razorpay/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: createData.order.orderId,
          paymentId: `pay_sandbox_${Date.now()}`,
          signature: `sandbox_sig_${Date.now()}`,
          planId: selectedPlan,
          userId: user.uid,
          userEmail: user.email,
          provider: 'SANDBOX',
        }),
      });
      const verifyData = await verifyRes.json();

      if (verifyData.success) {
        setEntitlement(verifyData.entitlement);
        setMessage({ type: 'success', text: `🎉 ${verifyData.message}` });
      } else {
        throw new Error(verifyData.error || 'Verification failed');
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Sandbox activation failed' });
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!user) return;
    setProcessing(true);
    try {
      const res = await fetch('/api/webhooks/razorpay-prime', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-razorpay-signature': 'sandbox_sig_cancel',
        },
        body: JSON.stringify({
          event: 'subscription.cancelled',
          event_id: `evt_cancel_${Date.now()}`,
          payload: {
            subscription: {
              entity: {
                notes: { userId: user.uid }
              }
            }
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        await fetchStatus();
        setMessage({ type: 'success', text: 'Subscription cancelled. Access remains valid until expiry.' });
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || 'Failed to cancel subscription' });
    } finally {
      setProcessing(false);
    }
  };

  const isPrimeActive = entitlement?.status === 'ACTIVE' && entitlement.plan !== 'FREE';

  return (
    <main
      style={{
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '100px 20px 80px 20px',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        gap: '32px',
      }}
    >
      {/* 1. HERO HEADER */}
      <div
        className="glass animate-fade-in"
        style={{
          padding: '48px 36px',
          borderRadius: '32px',
          background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.25), rgba(255, 0, 127, 0.15))',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(124, 58, 237, 0.2)',
        }}
      >
        <span
          style={{
            fontSize: '12px',
            fontWeight: 900,
            letterSpacing: '0.12em',
            padding: '6px 16px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #ffd700, #ff8c00)',
            color: '#090d16',
            textTransform: 'uppercase',
          }}
        >
          👑 BuyWise Prime Membership
        </span>

        <h1 style={{ fontSize: '42px', fontWeight: 900, margin: 0, letterSpacing: '-0.03em' }}>
          Elevate Your AI Shopping Experience
        </h1>

        <p style={{ maxWidth: '680px', fontSize: '16px', color: 'rgba(255, 255, 255, 0.8)', margin: 0, lineHeight: 1.6 }}>
          Unlock unlimited AI Virtual Try-On previews, priority GPU rendering, instant price drop notifications, and exclusive partner brand discounts.
        </p>

        {/* STATUS CARD */}
        {entitlement && (
          <div
            style={{
              marginTop: '12px',
              padding: '12px 24px',
              borderRadius: '16px',
              background: isPrimeActive ? 'rgba(0, 255, 136, 0.15)' : 'rgba(255, 255, 255, 0.08)',
              border: `1px solid ${isPrimeActive ? 'rgba(0, 255, 136, 0.4)' : 'rgba(255, 255, 255, 0.15)'}`,
              color: isPrimeActive ? '#00ff88' : '#ffffff',
              fontSize: '14px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <span>{isPrimeActive ? '🟢 STATUS: PRIME ACTIVE' : '⚪ STATUS: FREE PLAN'}</span>
            {isPrimeActive && (
              <span style={{ fontSize: '12px', opacity: 0.8 }}>
                (Valid until {new Date(entitlement.expiresAt).toLocaleDateString()})
              </span>
            )}
          </div>
        )}
      </div>

      {message && (
        <div
          style={{
            padding: '16px 20px',
            borderRadius: '16px',
            background: message.type === 'success' ? 'rgba(0, 255, 136, 0.12)' : 'rgba(255, 77, 77, 0.12)',
            border: `1px solid ${message.type === 'success' ? 'rgba(0, 255, 136, 0.3)' : 'rgba(255, 77, 77, 0.3)'}`,
            color: message.type === 'success' ? '#00ff88' : '#ff4d4d',
            textAlign: 'center',
            fontWeight: 700,
            fontSize: '14px',
          }}
        >
          {message.text}
        </div>
      )}

      {/* 2. PLAN SELECTOR & PRICING */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* MONTHLY PLAN */}
        <div
          onClick={() => setSelectedPlan('PRIME_MONTHLY')}
          className="glass"
          style={{
            padding: '32px 24px',
            borderRadius: '24px',
            background: selectedPlan === 'PRIME_MONTHLY' ? 'rgba(124, 58, 237, 0.18)' : 'rgba(255, 255, 255, 0.03)',
            border: selectedPlan === 'PRIME_MONTHLY' ? `2px solid ${accentColor}` : '1px solid rgba(255, 255, 255, 0.1)',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            position: 'relative',
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{ fontSize: '18px', fontWeight: 900, color: 'white' }}>Monthly Pass</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '38px', fontWeight: 900, color: accentColor }}>₹199</span>
            <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)' }}>/ month</span>
          </div>
          <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)', margin: 0 }}>
            Flexible month-to-month membership. Cancel anytime with 1 click.
          </p>
        </div>

        {/* ANNUAL PLAN */}
        <div
          onClick={() => setSelectedPlan('PRIME_YEARLY')}
          className="glass"
          style={{
            padding: '32px 24px',
            borderRadius: '24px',
            background: selectedPlan === 'PRIME_YEARLY' ? 'rgba(255, 215, 0, 0.12)' : 'rgba(255, 255, 255, 0.03)',
            border: selectedPlan === 'PRIME_YEARLY' ? '2px solid #ffd700' : '1px solid rgba(255, 255, 255, 0.1)',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            position: 'relative',
            transition: 'all 0.2s ease',
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: '16px',
              right: '20px',
              fontSize: '10px',
              fontWeight: 900,
              padding: '4px 10px',
              borderRadius: '12px',
              background: '#ffd700',
              color: '#000000',
            }}
          >
            SAVE 37%
          </span>
          <div style={{ fontSize: '18px', fontWeight: 900, color: 'white' }}>Annual Pass</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '38px', fontWeight: 900, color: '#ffd700' }}>₹1,499</span>
            <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)' }}>/ year</span>
          </div>
          <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)', margin: 0 }}>
            Equivalent to ₹124/month. Recommended for frequent fashion & tech shoppers.
          </p>
        </div>
      </div>

      {/* 3. PRIME BENEFITS LIST */}
      <div
        className="glass"
        style={{
          padding: '32px',
          borderRadius: '24px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        <h2 style={{ fontSize: '20px', fontWeight: 900, margin: 0, color: accentColor }}>
          ✨ Included Prime Benefits
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          {[
            { icon: '👗', title: 'Unlimited AI Virtual Try-On', desc: 'No daily image generation limits on sarees, gowns, and suits.' },
            { icon: '⚡', title: 'Priority GPU Rendering', desc: 'Instant VTO result processing ahead of public queues.' },
            { icon: '🔥', title: 'Instant Price Drop Alerts', desc: 'Real-time push & email notifications when tracked items drop.' },
            { icon: '🏬', title: 'Exclusive Partner Discounts', desc: 'Extra 5% to 15% net savings on Gen-G partner brand products.' },
            { icon: '👑', title: 'Cross-Platform Sync', desc: 'One Prime membership active across both Web and Android app.' },
          ].map((item, idx) => (
            <div
              key={idx}
              style={{
                padding: '16px',
                borderRadius: '16px',
                background: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
              }}
            >
              <span style={{ fontSize: '24px' }}>{item.icon}</span>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: 'white' }}>{item.title}</div>
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', marginTop: '2px' }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. ACTIONS & DISCLOSURE */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          textAlign: 'center',
        }}
      >
        {!isPrimeActive ? (
          <button
            onClick={handleSandboxSubscribe}
            disabled={processing}
            style={{
              padding: '16px 36px',
              fontSize: '16px',
              fontWeight: 900,
              background: `linear-gradient(135deg, ${accentColor}, #ff007f)`,
              border: 'none',
              color: 'white',
              borderRadius: '16px',
              cursor: 'pointer',
              boxShadow: `0 8px 30px ${accentColor}66`,
              transition: 'all 0.2s ease',
              width: '100%',
              maxWidth: '400px',
            }}
          >
            {processing ? 'Processing Sandbox Activation...' : `Activate ${AUTHORITATIVE_PRIME_PLANS[selectedPlan].name} (Sandbox Test)`}
          </button>
        ) : (
          <button
            onClick={handleCancelSubscription}
            disabled={processing}
            style={{
              padding: '14px 28px',
              fontSize: '14px',
              fontWeight: 800,
              background: 'rgba(255, 77, 77, 0.15)',
              border: '1px solid rgba(255, 77, 77, 0.3)',
              color: '#ff4d4d',
              borderRadius: '14px',
              cursor: 'pointer',
            }}
          >
            Cancel Subscription Auto-Renew
          </button>
        )}

        <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', maxWidth: '600px', lineHeight: 1.5 }}>
          ⚠️ <strong>COMMERCIAL PAYMENT GATEWAY NOT LIVE.</strong> Operating in Sandbox/Readiness Mode. No real money will be charged during this architecture test.
        </div>
      </div>
    </main>
  );
}

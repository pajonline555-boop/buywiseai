"use client"
import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import SafeProductImage from '@/components/SafeProductImage';
import { useTranslation } from '@/lib/i18n/i18nContext';

interface ProfileHeaderProps {
  onEditClick: () => void;
}

export default function ProfileHeader({ onEditClick }: ProfileHeaderProps) {
  const { user, userProfile, isAdmin } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();

  const isGuest = !user;
  const isUserAdmin = isAdmin || userProfile?.role === 'admin' || (!!user?.email && ['pajonline555@gmail.com', 'akshayman224@gmail.com'].includes(user.email.toLowerCase().trim()));

  const role = isUserAdmin
    ? 'ADMIN'
    : userProfile?.role === 'partner' || userProfile?.role === 'partner_admin'
    ? 'BUYWISE PARTNER'
    : userProfile?.role === 'premium'
    ? 'PREMIUM SHOPPER'
    : isGuest
    ? 'GUEST SHOPPER'
    : 'BUYWISE SHOPPER';

  const roleBadgeStyle = isUserAdmin
    ? { background: 'linear-gradient(135deg, #00ff88, #00d4ff)', color: '#090d16' }
    : role === 'BUYWISE PARTNER'
    ? { background: 'linear-gradient(135deg, #ffd700, #ff8c00)', color: '#090d16' }
    : role === 'PREMIUM SHOPPER'
    ? { background: 'linear-gradient(135deg, #7928ca, #ff007f)', color: '#ffffff' }
    : isGuest
    ? { background: 'rgba(0, 212, 255, 0.15)', color: '#00d4ff', border: '1px solid rgba(0, 212, 255, 0.3)' }
    : { background: 'rgba(255, 255, 255, 0.1)', color: 'rgba(255, 255, 255, 0.85)' };

  const displayName = isGuest ? t('guest_shopper') : userProfile?.displayName || user?.displayName || t('buywise_shopper');
  const email = isGuest ? t('guest_access_no_signup') : user?.email || userProfile?.email || 'shopper@buywise.ai';
  const isVerified = user?.emailVerified ?? false;
  const photoURL = userProfile?.photoURL || user?.photoURL || '';

  const handleActionClick = () => {
    if (isGuest) {
      router.push('/login');
    } else {
      onEditClick();
    }
  };

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(20, 15, 38, 0.9), rgba(12, 10, 20, 0.95))',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '24px',
        padding: '24px 28px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: '14px',
        position: 'relative',
        boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.5)',
      }}
    >
      {/* Avatar Container */}
      <div style={{ position: 'relative', width: '90px', height: '90px' }}>
        <div
          style={{
            width: '90px',
            height: '90px',
            borderRadius: '50%',
            overflow: 'hidden',
            border: '3px solid rgba(255, 255, 255, 0.2)',
            background: 'linear-gradient(135deg, #7928ca, #ff007f)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(255, 0, 128, 0.3)',
          }}
        >
          {photoURL ? (
            <SafeProductImage
              src={photoURL}
              alt={displayName}
              width={90}
              height={90}
              objectFit="cover"
            />
          ) : (
            <span style={{ fontSize: '36px', fontWeight: 900, color: 'white' }}>
              {isGuest ? '👤' : displayName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {/* Identity Info */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 900, color: 'white', margin: 0, letterSpacing: '-0.02em' }}>
          {displayName}
        </h1>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 500 }}>
            {email}
          </span>
          {!isGuest && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '6px',
                background: isVerified ? 'rgba(0, 255, 136, 0.15)' : 'rgba(255, 193, 7, 0.15)',
                color: isVerified ? '#00ff88' : '#ffc107',
                border: `1px solid ${isVerified ? 'rgba(0, 255, 136, 0.3)' : 'rgba(255, 193, 7, 0.3)'}`,
              }}
            >
              {isVerified ? `✓ ${t('verified')}` : `⚠ ${t('unverified')}`}
            </span>
          )}
        </div>

        {/* Role Badge */}
        <div style={{ marginTop: '6px' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 900,
              letterSpacing: '0.08em',
              padding: '4px 12px',
              borderRadius: '20px',
              textTransform: 'uppercase',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
              ...roleBadgeStyle,
            }}
          >
            {t(role)}
          </span>
        </div>
      </div>

      {/* Action CTA */}
      <button
        onClick={handleActionClick}
        style={{
          marginTop: '4px',
          padding: '10px 24px',
          borderRadius: '12px',
          background: isGuest ? 'linear-gradient(90deg, #ff007f, #7928ca)' : 'rgba(255, 255, 255, 0.08)',
          border: isGuest ? 'none' : '1px solid rgba(255, 255, 255, 0.18)',
          color: 'white',
          fontWeight: 800,
          fontSize: '14px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: isGuest ? '0 4px 14px rgba(255, 0, 128, 0.4)' : 'none',
        }}
      >
        {isGuest ? `🔑 ${t('sign_in_sync')}` : `✏️ ${t('edit_profile')}`}
      </button>
    </div>
  );
}

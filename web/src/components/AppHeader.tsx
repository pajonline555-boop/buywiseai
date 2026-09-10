"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/i18nContext';
import { useTheme } from '@/lib/theme/themeProvider';
import { useAuth } from '@/lib/AuthContext';

export default function AppHeader() {
  const { t } = useTranslation();
  const { accentColor } = useTheme();
  const { user, userProfile, isAdmin } = useAuth();
  const pathname = usePathname();

  const isUserAdmin = isAdmin || userProfile?.role === 'admin' || (!!user?.email && ['pajonline555@gmail.com', 'akshayman224@gmail.com'].includes(user.email.toLowerCase().trim()));
  const isPartnerUser = userProfile?.role === 'partner' || userProfile?.role === 'partner_admin' || isUserAdmin;

  const navItems = [
    { href: '/', label: t('nav_home'), icon: '🏠' },
    { href: '/partners', label: t('nav_geng_store'), icon: '⚡' },
    { href: '/prime', label: 'Prime', icon: '👑' },
    { href: '/knowledge', label: t('nav_knowledge'), icon: '📚' },
    { href: '/faq', label: t('nav_faq'), icon: '❓' },
    { href: '/profile', label: t('nav_profile'), icon: '👤' },
  ];

  if (isUserAdmin) {
    navItems.push({ href: '/admin', label: 'Admin', icon: '👑' });
  } else if (isPartnerUser) {
    navItems.push({ href: '/partner-portal', label: 'Partner', icon: '🏬' });
  }

  return (
    <header style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '16px 20px 0 20px', position: 'relative', zIndex: 100 }}>
      <nav 
        className="glass" 
        style={{ 
          width: '100%', 
          maxWidth: '1240px', 
          padding: '10px 24px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          background: 'rgba(10, 7, 20, 0.94)', 
          backdropFilter: 'blur(24px)', 
          WebkitBackdropFilter: 'blur(24px)', 
          border: '1px solid rgba(255, 255, 255, 0.12)', 
          borderRadius: '24px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(124, 58, 237, 0.15)'
        }}
      >
        {/* Logo Brand */}
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', flexShrink: 0, filter: `drop-shadow(0 4px 14px ${accentColor}88)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/logo-icon.png" alt="BuyWise AI Official Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} fetchPriority="high" decoding="async" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em' }}>BuyWise</span>
            <span style={{ fontSize: '10px', fontWeight: 900, padding: '3px 8px', borderRadius: '8px', background: `linear-gradient(135deg, ${accentColor}, #ff007f)`, color: '#ffffff', letterSpacing: '0.05em', boxShadow: `0 2px 10px ${accentColor}66` }}>AI</span>
          </div>
        </Link>

        {/* Navigation Items (Professional Uniform Pills) */}
        <div className="desktop-only" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const isSpecialAdmin = item.href === '/admin';
            const isSpecialPartner = item.href === '/partner-portal';
            
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                style={{ 
                  textDecoration: 'none', 
                  fontSize: '13px', 
                  fontWeight: 700, 
                  color: isActive ? '#ffffff' : isSpecialAdmin ? '#00ff88' : isSpecialPartner ? '#ffd700' : '#cbd5e1', 
                  padding: '8px 16px', 
                  borderRadius: '14px', 
                  background: isActive 
                    ? 'rgba(255, 255, 255, 0.1)' 
                    : isSpecialAdmin 
                    ? 'rgba(0, 255, 136, 0.12)' 
                    : isSpecialPartner 
                    ? 'rgba(255, 215, 0, 0.12)' 
                    : 'rgba(255, 255, 255, 0.03)', 
                  border: isActive 
                    ? `1px solid ${accentColor}aa` 
                    : isSpecialAdmin 
                    ? '1px solid rgba(0, 255, 136, 0.4)' 
                    : isSpecialPartner 
                    ? '1px solid rgba(255, 215, 0, 0.4)' 
                    : '1px solid rgba(255, 255, 255, 0.07)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px',
                  boxShadow: isActive ? `0 0 16px ${accentColor}33` : 'none',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                <span style={{ fontSize: '14px' }}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Action Buttons (Single Unified Auth Button, User Badge & Try-On Room) */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {!user ? (
            <Link href="/login" style={{ textDecoration: 'none' }}>
              <button 
                style={{ 
                  padding: '8px 18px', 
                  fontSize: '13px', 
                  fontWeight: 800, 
                  background: `linear-gradient(135deg, ${accentColor}33, rgba(255, 255, 255, 0.08))`, 
                  border: `1px solid ${accentColor}66`, 
                  color: '#ffffff', 
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  boxShadow: `0 4px 15px ${accentColor}22`,
                  transition: 'all 0.2s ease'
                }}
              >
                🔑 {t('sign_in_sync')}
              </button>
            </Link>
          ) : (
            <Link href="/profile" style={{ textDecoration: 'none' }}>
              <div 
                style={{ 
                  padding: '6px 14px', 
                  borderRadius: '14px', 
                  background: isUserAdmin 
                    ? 'rgba(0, 255, 136, 0.15)' 
                    : 'rgba(255, 255, 255, 0.08)', 
                  border: isUserAdmin 
                    ? '1px solid rgba(0, 255, 136, 0.4)' 
                    : '1px solid rgba(255, 255, 255, 0.18)', 
                  color: isUserAdmin ? '#00ff88' : '#ffffff', 
                  fontSize: '12px', 
                  fontWeight: 800, 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px' 
                }}
              >
                <span>{isUserAdmin ? '👑' : '✓'}</span>
                <span>{user.displayName || (user.email ? user.email.split('@')[0] : 'Logged In')}</span>
              </div>
            </Link>
          )}

          <Link href="/search" style={{ textDecoration: 'none' }}>
            <button
              title="Voice Search (English, Hindi, Hinglish)"
              style={{
                padding: '8px 12px',
                fontSize: '14px',
                fontWeight: 800,
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              🎙️
            </button>
          </Link>

          <Link href="/try-on" style={{ textDecoration: 'none' }}>
            <button 
              style={{ 
                padding: '8px 16px', 
                fontSize: '13px', 
                fontWeight: 800, 
                background: `linear-gradient(135deg, ${accentColor}, #ff007f)`, 
                color: '#ffffff', 
                border: 'none',
                borderRadius: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: `0 4px 20px ${accentColor}55`,
                transition: 'all 0.2s ease'
              }}
            >
              ✨ {t('nav_try_on_room')}
            </button>
          </Link>
        </div>
      </nav>
    </header>
  );
}

"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/i18nContext';
import { useTheme } from '@/lib/theme/themeProvider';
import { useAuth } from '@/lib/AuthContext';
import VoiceSearchModal from '@/components/VoiceSearchModal';

export default function AppHeader() {
  const { t } = useTranslation();
  const { accentColor } = useTheme();
  const { user, userProfile, isAdmin, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

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
    <header className="app-header-root">
      <style jsx>{`
        .app-header-root {
          width: 100%;
          display: flex;
          justify-content: center;
          padding: 16px 20px 0 20px;
          position: relative;
          z-index: 100;
        }
        .app-header-nav {
          width: 100%;
          max-width: 1240px;
          padding: 10px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(10, 7, 20, 0.94);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 24px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(124, 58, 237, 0.15);
        }
        @media (max-width: 768px) {
          .app-header-root {
            padding: calc(6px + env(safe-area-inset-top, 0px)) 10px 0 10px;
          }
          .app-header-nav {
            padding: 8px 12px;
            border-radius: 18px;
          }
          .app-header-logo-text {
            font-size: 18px !important;
          }
          .app-header-logo-badge {
            font-size: 9px !important;
            padding: 2px 6px !important;
          }
        }
      `}</style>
      <nav className="glass app-header-nav">
        {/* Logo Brand */}
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '34px', height: '34px', flexShrink: 0, filter: `drop-shadow(0 4px 14px ${accentColor}88)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/logo-icon.png" alt="BuyWise AI Official Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} fetchPriority="high" decoding="async" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span className="app-header-logo-text" style={{ fontSize: '22px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em' }}>BuyWise</span>
            <span className="app-header-logo-badge" style={{ fontSize: '10px', fontWeight: 900, padding: '3px 7px', borderRadius: '8px', background: `linear-gradient(135deg, ${accentColor}, #ff007f)`, color: '#ffffff', letterSpacing: '0.05em', boxShadow: `0 2px 10px ${accentColor}66` }}>AI</span>
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
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {!user ? (
            <Link href="/login" style={{ textDecoration: 'none' }}>
              <button 
                style={{ 
                  padding: '6px 14px', 
                  fontSize: '12px', 
                  fontWeight: 800, 
                  background: `linear-gradient(135deg, ${accentColor}33, rgba(255, 255, 255, 0.08))`, 
                  border: `1px solid ${accentColor}66`, 
                  color: '#ffffff', 
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  cursor: 'pointer',
                  boxShadow: `0 4px 15px ${accentColor}22`,
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                🔑 {t('sign_in_sync')}
              </button>
            </Link>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Link href="/profile" style={{ textDecoration: 'none' }}>
                <div 
                  style={{ 
                    padding: '5px 12px', 
                    borderRadius: '12px', 
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
                    gap: '4px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <span>{isUserAdmin ? '👑' : '✓'}</span>
                  <span>{user.displayName ? user.displayName.split(' ')[0] : (user.email ? user.email.split('@')[0] : 'User')}</span>
                </div>
              </Link>

              <button
                onClick={async () => {
                  await logout();
                  router.push('/login');
                }}
                title="Sign Out of BuyWise AI"
                style={{
                  padding: '5px 10px',
                  fontSize: '12px',
                  fontWeight: 800,
                  background: 'rgba(255, 68, 68, 0.15)',
                  border: '1px solid rgba(255, 68, 68, 0.4)',
                  color: '#ff6b6b',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                🚪 Sign Out
              </button>
            </div>
          )}

          <button
            onClick={() => setIsVoiceModalOpen(true)}
            title="Voice Search (English, Hindi, Hinglish)"
            style={{
              padding: '6px 10px',
              fontSize: '13px',
              fontWeight: 800,
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            🎙️
          </button>

          <div className="desktop-only">
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
        </div>
      </nav>

      <VoiceSearchModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onTranscript={(text) => {
          if (text && text.trim()) {
            router.push(`/search?q=${encodeURIComponent(text.trim())}`);
          }
        }}
      />
    </header>
  );
}

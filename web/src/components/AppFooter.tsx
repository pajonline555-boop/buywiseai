"use client";

import React from 'react';
import Link from 'next/link';
import VisitorCounter from '@/components/VisitorCounter';
import SocialMediaIcons from '@/components/SocialMediaIcons';
import { useTranslation } from '@/lib/i18n/i18nContext';
import { useTheme } from '@/lib/theme/themeProvider';

export default function AppFooter() {
  const { t } = useTranslation();
  const { accentColor } = useTheme();

  return (
    <footer style={{ width: '100%', background: 'rgba(8, 6, 15, 0.98)', borderTop: `1px solid ${accentColor}33`, padding: '50px 20px 90px 20px', marginTop: '60px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '36px', color: '#ffffff' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{ width: '36px', height: '36px' }}>
              <img src="/logo-icon.png" alt="BuyWise AI Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <span style={{ fontSize: '22px', fontWeight: 900, color: '#ffffff' }}>BuyWise AI</span>
          </div>
          <div style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.6, marginBottom: '16px' }}>
            {t('app_tagline')}
          </div>
          <div style={{ background: `linear-gradient(135deg, ${accentColor}15, rgba(0, 255, 136, 0.1))`, border: `1px solid ${accentColor}44`, borderRadius: '16px', padding: '14px 18px' }}>
            <div style={{ fontSize: '12px', fontWeight: 900, color: accentColor, marginBottom: '4px', letterSpacing: '0.05em' }}>📱 {t('download_native_app_btn')}</div>
            <div style={{ fontSize: '12px', color: '#cbd5e1', marginBottom: '10px', lineHeight: 1.4 }}>{t('download_native_app_sub')}</div>
            <Link href="/download-app" style={{ textDecoration: 'none' }}>
              <button style={{ width: '100%', padding: '8px 14px', borderRadius: '10px', background: `linear-gradient(135deg, ${accentColor}, #00b8ff)`, color: '#ffffff', fontWeight: 900, fontSize: '12px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                ⚡ {t('nav_app_download')}
              </button>
            </Link>
          </div>
        </div>

        <div>
          <div style={{ fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', color: accentColor, marginBottom: '14px', letterSpacing: '0.05em' }}>
            {t('footer_shopping_hub')}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', color: '#cbd5e1' }}>
            <Link href="/try-on" style={{ color: '#ffffff', textDecoration: 'none' }}>✨ {t('nav_try_on')}</Link>
            <Link href="/alerts" style={{ color: '#ffffff', textDecoration: 'none' }}>🔔 {t('price_alerts')}</Link>
            <Link href="/coupons" style={{ color: '#ffffff', textDecoration: 'none' }}>🎟️ {t('coupons_offers')}</Link>
            <Link href="/partners" style={{ color: '#00ff88', textDecoration: 'none', fontWeight: 700 }}>⚡ {t('nav_geng_store')}</Link>
          </div>
        </div>

        <div>
          <div style={{ fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', color: '#00ff88', marginBottom: '14px', letterSpacing: '0.05em' }}>
            {t('footer_support_knowledge')}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', color: '#cbd5e1' }}>
            <Link href="/knowledge" style={{ color: '#ffffff', textDecoration: 'none' }}>📚 {t('nav_knowledge')}</Link>
            <Link href="/faq" style={{ color: '#ffffff', textDecoration: 'none' }}>❓ {t('nav_faq')}</Link>
            <Link href="/profile" style={{ color: '#ffffff', textDecoration: 'none' }}>👤 {t('nav_profile')}</Link>
          </div>
        </div>

        <div>
          <div style={{ fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', color: '#ff007f', marginBottom: '14px', letterSpacing: '0.05em' }}>
            {t('footer_legal_compliance')}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', color: '#cbd5e1' }}>
            <Link href="/privacy-policy" style={{ color: '#ffffff', textDecoration: 'none' }}>{t('privacy_policy')}</Link>
            <Link href="/terms-of-service" style={{ color: '#ffffff', textDecoration: 'none' }}>{t('terms_of_service')}</Link>
            <Link href="/refund-policy" style={{ color: '#ffffff', textDecoration: 'none' }}>{t('refund_policy')}</Link>
            <Link href="/affiliate-disclosure" style={{ color: '#ffffff', textDecoration: 'none' }}>{t('affiliate_disclosure')}</Link>
            <Link href="/partner-terms" style={{ color: '#ffffff', textDecoration: 'none' }}>{t('partner_terms')}</Link>
          </div>
        </div>

        {/* SOCIAL MEDIA ICONS PLACED DIRECTLY BELOW SHOPPING HUB & SUPPORT */}
        <div style={{ gridColumn: '2 / 4', marginTop: '8px' }}>
          <SocialMediaIcons 
            variant="footer"
            title={t('footer_official_channels')}
            subtitle=""
          />
        </div>
      </div>

      {/* BOTTOM COPYRIGHT BAR */}
      <div 
        style={{ 
          maxWidth: '1200px', 
          margin: '36px auto 0 auto', 
          paddingTop: '20px', 
          borderTop: '1px solid rgba(255, 255, 255, 0.1)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          gap: '20px'
        }}
      >
        <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>
          © 2026 BuyWise AI. All Rights Reserved.
        </div>
      </div>

      {/* LIVE VISITOR TRAFFIC COUNTER */}
      <VisitorCounter />
    </footer>
  );
}

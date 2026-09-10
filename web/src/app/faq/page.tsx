"use client"
import React, { useState } from 'react';
import Link from 'next/link';
import { getFaqItems, FAQ_CATEGORIES, FaqItem } from '@/lib/faq/store';
import { useTranslation } from '@/lib/i18n/i18nContext';

export default function FaqPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { t } = useTranslation();

  const faqList: FaqItem[] = getFaqItems(selectedCategory, searchQuery);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <main
      style={{
        width: '100%',
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '32px 20px 100px 20px',
        color: 'white',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <div style={{ fontSize: '12px', fontWeight: 900, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
          {t('help_faq')}
        </div>
        <h1 style={{ fontSize: '36px', fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>
          {t('help_center_faqs')}
        </h1>
        <p style={{ fontSize: '15px', color: 'rgba(255, 255, 255, 0.7)', maxWidth: '600px', margin: '10px auto 0 auto' }}>
          {t('Find fast answers about SmartCompare, verified coupons, price alerts, AI Virtual Try-On, and partner orders.')}
        </p>
      </div>

      {/* Search Bar */}
      <div style={{ maxWidth: '600px', margin: '0 auto 28px auto' }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('search_placeholder')}
          style={{
            width: '100%',
            padding: '14px 20px',
            borderRadius: '16px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: 'white',
            fontSize: '15px',
            outline: 'none',
            backdropFilter: 'blur(12px)',
          }}
        />
      </div>

      {/* Category Bar */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '32px' }}>
        <button
          onClick={() => setSelectedCategory('ALL')}
          style={{
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 800,
            border: selectedCategory === 'ALL' ? '1px solid var(--primary)' : '1px solid rgba(255, 255, 255, 0.12)',
            background: selectedCategory === 'ALL' ? 'rgba(0, 212, 255, 0.15)' : 'rgba(255, 255, 255, 0.04)',
            color: selectedCategory === 'ALL' ? 'var(--primary)' : 'rgba(255, 255, 255, 0.7)',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {t('All Topics')} ({getFaqItems('ALL').length})
        </button>

        {FAQ_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 700,
                border: isSelected ? '1px solid #00ff88' : '1px solid rgba(255, 255, 255, 0.12)',
                background: isSelected ? 'rgba(0, 255, 136, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                color: isSelected ? '#00ff88' : 'rgba(255, 255, 255, 0.7)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {t(cat)}
            </button>
          );
        })}
      </div>

      {/* FAQ Accordion Items */}
      {faqList.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255, 255, 255, 0.5)' }}>
          <span style={{ fontSize: '36px', display: 'block', marginBottom: '10px' }}>❓</span>
          <div style={{ fontSize: '16px', fontWeight: 700 }}>{t('No FAQ items found matching')} &quot;{searchQuery}&quot;</div>
          <div style={{ fontSize: '13px', marginTop: '4px' }}>
            {t('Need help? Return to your')} <Link href="/profile" style={{ color: 'var(--primary)' }}>{t('nav_profile')}</Link> {t('to report a data issue or contact support.')}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {faqList.map((item) => {
            const isExpanded = expandedId === item.id;
            return (
              <div
                key={item.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: isExpanded ? '1px solid rgba(0, 212, 255, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  transition: 'all 0.2s ease',
                }}
              >
                <button
                  onClick={() => toggleExpand(item.id)}
                  style={{
                    width: '100%',
                    padding: '18px 22px',
                    background: 'none',
                    border: 'none',
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: 800,
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '16px',
                  }}
                >
                  <span>{t(item.question)}</span>
                  <span style={{ fontSize: '18px', color: isExpanded ? 'var(--primary)' : 'rgba(255, 255, 255, 0.5)', transition: 'transform 0.2s ease', transform: isExpanded ? 'rotate(180deg)' : 'none' }}>
                    ▼
                  </span>
                </button>

                {isExpanded && (
                  <div
                    style={{
                      padding: '0 22px 20px 22px',
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontSize: '14px',
                      lineHeight: 1.6,
                      borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                      paddingTop: '14px',
                    }}
                  >
                    {t(item.answer)}
                    <div style={{ marginTop: '12px', fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)' }}>
                      {t('Category:')} {t(item.category)}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

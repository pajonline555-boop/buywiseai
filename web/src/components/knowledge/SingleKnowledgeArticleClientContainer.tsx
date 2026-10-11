"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getArticleBySlug } from '@/lib/knowledge/store';
import { useTranslation } from '@/lib/i18n/i18nContext';
import { ArticleMarkdownRenderer } from '@/components/knowledge/ArticleMarkdownRenderer';

interface SingleKnowledgeArticleClientContainerProps {
  slug: string;
}

export default function SingleKnowledgeArticleClientContainer({ slug }: SingleKnowledgeArticleClientContainerProps) {
  const article = getArticleBySlug(slug);
  const { t } = useTranslation();

  if (!article) {
    return (
      <main
        style={{
          width: '100%',
          maxWidth: '800px',
          margin: '0 auto',
          padding: '80px 20px',
          textAlign: 'center',
          color: 'white',
        }}
      >
        <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>📚</span>
        <h1 style={{ fontSize: '28px', fontWeight: 900, marginBottom: '12px' }}>
          {t('Shopping Guide Not Found')}
        </h1>
        <p style={{ fontSize: '15px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '28px' }}>
          {t('The shopping guide article you are looking for may have been updated or moved.')}
        </p>
        <Link href="/knowledge" style={{ textDecoration: 'none' }}>
          <button
            style={{
              padding: '12px 28px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, var(--primary, #00d4ff), #00ff88)',
              color: '#000000',
              fontWeight: 900,
              fontSize: '14px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(0, 255, 136, 0.3)',
            }}
          >
            ← {t('Return to Knowledge Hub')}
          </button>
        </Link>
      </main>
    );
  }

  return (
    <main
      style={{
        width: '100%',
        maxWidth: '900px',
        margin: '0 auto',
        padding: '32px 20px 100px 20px',
        color: 'white',
      }}
    >
      {/* Top Back Navigation Bar */}
      <div style={{ marginBottom: '24px' }}>
        <Link href="/knowledge" style={{ textDecoration: 'none' }}>
          <button
            style={{
              padding: '8px 18px',
              borderRadius: '20px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: 'white',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            ← {t('Back to Knowledge Hub')}
          </button>
        </Link>
      </div>

      {/* Article Container Card */}
      <article
        style={{
          borderRadius: '28px',
          border: '1px solid rgba(0, 212, 255, 0.3)',
          background: 'linear-gradient(135deg, rgba(20, 15, 38, 0.95), rgba(12, 10, 20, 0.98))',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
          overflow: 'hidden',
        }}
      >
        {/* Cover Header Image */}
        <div style={{ position: 'relative', width: '100%', height: '280px' }}>
          <Image
            src={article.coverImage || 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=800&q=80'}
            alt={article.title}
            fill
            unoptimized
            style={{ objectFit: 'cover' }}
          />
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(to bottom, transparent 30%, rgba(12, 10, 20, 0.98) 100%)',
            }}
          />
        </div>

        {/* Article Body Content */}
        <div style={{ padding: '0 36px 40px 36px', marginTop: '-30px', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
            <span
              style={{
                padding: '4px 14px',
                borderRadius: '12px',
                background: 'rgba(0, 212, 255, 0.2)',
                color: '#00d4ff',
                fontSize: '12px',
                fontWeight: 800,
                border: '1px solid rgba(0, 212, 255, 0.4)',
              }}
            >
              {t(article.category)}
            </span>
            <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)' }}>
              {t(article.readTime)} • {t('Author:')} {t(article.author)}
            </span>
          </div>

          <h1 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '16px', lineHeight: 1.3 }}>
            {t(article.title)}
          </h1>

          <p style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.8)', lineHeight: 1.6, marginBottom: '24px' }}>
            {t(article.excerpt)}
          </p>

          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '20px' }}>
            <ArticleMarkdownRenderer content={article.content} />
          </div>

          {article.disclaimer && (
            <div
              style={{
                marginTop: '28px',
                padding: '14px 18px',
                borderRadius: '14px',
                background: 'rgba(255, 193, 7, 0.08)',
                border: '1px solid rgba(255, 193, 7, 0.25)',
                color: 'rgba(255, 193, 7, 0.95)',
                fontSize: '13px',
                lineHeight: 1.5,
              }}
            >
              ℹ️ {t(article.disclaimer)}
            </div>
          )}

          <div
            style={{
              marginTop: '40px',
              paddingTop: '24px',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <Link href="/search" style={{ textDecoration: 'none' }}>
              <button
                style={{
                  padding: '14px 32px',
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, var(--primary, #00d4ff), #00ff88)',
                  color: '#000000',
                  fontWeight: 900,
                  fontSize: '15px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 20px rgba(0, 255, 136, 0.35)',
                }}
              >
                {t('Compare Live Deal Prices Now ↗')}
              </button>
            </Link>

            <Link href="/knowledge" style={{ textDecoration: 'none' }}>
              <button
                style={{
                  padding: '12px 28px',
                  borderRadius: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  fontWeight: 800,
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                ← {t('Back to Knowledge Hub')}
              </button>
            </Link>
          </div>
        </div>
      </article>
    </main>
  );
}

"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  getKnowledgeArticles,
  getArticleBySlug,
  KNOWLEDGE_CATEGORIES,
  KnowledgeArticle,
  KnowledgeCategory,
  generateDailyAIKnowledgeArticle,
} from '@/lib/knowledge/store';
import { useTranslation } from '@/lib/i18n/i18nContext';
import { ArticleMarkdownRenderer } from '@/components/knowledge/ArticleMarkdownRenderer';

function KnowledgeHubContent() {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [extraArticles, setExtraArticles] = useState<KnowledgeArticle[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle | null>(null);
  const [generating, setGenerating] = useState(false);
  
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();

  const baseArticles = getKnowledgeArticles(selectedCategory, searchQuery);
  
  // Combine base articles with dynamically generated daily articles
  const allArticles = [...extraArticles, ...baseArticles].filter((art, idx, self) => 
    self.findIndex(a => a.id === art.id) === idx
  );

  const articles = selectedCategory === 'ALL' 
    ? allArticles 
    : allArticles.filter(a => a.category.toLowerCase() === selectedCategory.toLowerCase());

  // Deep-link check on initial page load / URL search params change
  useEffect(() => {
    const slugParam = searchParams.get('slug') || searchParams.get('article');
    if (slugParam) {
      const found = getArticleBySlug(slugParam) || allArticles.find(a => a.id === slugParam || a.slug === slugParam);
      if (found) {
        setSelectedArticle(found);
      }
    }
  }, [searchParams]);

  const openArticle = (art: KnowledgeArticle) => {
    setSelectedArticle(art);
    if (typeof window !== 'undefined') {
      const newUrl = `${window.location.pathname}?slug=${encodeURIComponent(art.slug)}`;
      window.history.pushState({ path: newUrl }, '', newUrl);
    }
  };

  const closeArticle = () => {
    setSelectedArticle(null);
    if (typeof window !== 'undefined') {
      window.history.pushState({ path: window.location.pathname }, '', window.location.pathname);
    }
  };

  const handleGenerateDailyArticle = () => {
    setGenerating(true);
    setTimeout(() => {
      const catToUse: KnowledgeCategory = selectedCategory !== 'ALL' ? (selectedCategory as KnowledgeCategory) : 'Smart Shopping';
      const newDailyArticle = generateDailyAIKnowledgeArticle(catToUse);
      setExtraArticles(prev => [newDailyArticle, ...prev]);
      openArticle(newDailyArticle);
      setGenerating(false);
    }, 600);
  };

  return (
    <main
      style={{
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '32px 20px 100px 20px',
        color: 'white',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <div style={{ fontSize: '12px', fontWeight: 900, color: '#00ff88', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
          {t('BUYWISE AI SHOPPING EDUCATION')}
        </div>
        <h1 style={{ fontSize: '36px', fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>
          {t('Knowledge Hub')}
        </h1>
        <p style={{ fontSize: '15px', color: 'rgba(255, 255, 255, 0.7)', maxWidth: '600px', margin: '10px auto 18px auto' }}>
          {t('Learn how to compare prices, discover verified coupons, shop safely online, and master AI Virtual Try-On.')}
        </p>

        {/* Daily AI Article Generator Button */}
        <button
          onClick={handleGenerateDailyArticle}
          disabled={generating}
          style={{
            padding: '10px 22px',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: 800,
            background: 'linear-gradient(135deg, #00d4ff, #8a2be2)',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(0, 212, 255, 0.4)',
            transition: 'all 0.2s ease',
          }}
        >
          {generating ? t('Loading AI Guide...') : t('⚡ Generate Today\'s Daily AI Shopping Guide')}
        </button>
      </div>

      {/* Search Input */}
      <div style={{ maxWidth: '600px', margin: '0 auto 28px auto' }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('🔍 Search shopping guides, VTO privacy, consumer rights...')}
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

      {/* Category Pills */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '32px' }}>
        <button
          onClick={() => setSelectedCategory('ALL')}
          style={{
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 800,
            border: selectedCategory === 'ALL' ? '1px solid #00ff88' : '1px solid rgba(255, 255, 255, 0.12)',
            background: selectedCategory === 'ALL' ? 'rgba(0, 255, 136, 0.15)' : 'rgba(255, 255, 255, 0.04)',
            color: selectedCategory === 'ALL' ? '#00ff88' : 'rgba(255, 255, 255, 0.7)',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {t('All Categories')} ({allArticles.length})
        </button>

        {KNOWLEDGE_CATEGORIES.map((cat) => {
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
                border: isSelected ? '1px solid #00d4ff' : '1px solid rgba(255, 255, 255, 0.12)',
                background: isSelected ? 'rgba(0, 212, 255, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                color: isSelected ? '#00d4ff' : 'rgba(255, 255, 255, 0.7)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {t(cat)}
            </button>
          );
        })}
      </div>

      {/* Articles Grid */}
      {articles.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255, 255, 255, 0.5)' }}>
          <span style={{ fontSize: '36px', display: 'block', marginBottom: '10px' }}>📚</span>
          <div style={{ fontSize: '16px', fontWeight: 700 }}>{t('No articles found for')} &quot;{searchQuery}&quot;</div>
          <div style={{ fontSize: '13px', marginTop: '4px' }}>{t('Try searching for "SmartCompare", "VTO", or "Consumer Rights".')}</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {articles.map((art) => (
            <article
              key={art.id}
              onClick={() => openArticle(art)}
              style={{
                background: 'linear-gradient(135deg, rgba(20, 15, 38, 0.85), rgba(12, 10, 20, 0.95))',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '24px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4)',
                cursor: 'pointer',
                transition: 'transform 0.25s ease, border-color 0.25s ease',
              }}
            >
              {/* Featured Cover Image */}
              <div style={{ position: 'relative', width: '100%', height: '160px', overflow: 'hidden' }}>
                <Image
                  src={art.coverImage || 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=800&q=80'}
                  alt={art.title}
                  fill
                  unoptimized
                  style={{ objectFit: 'cover' }}
                />
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to bottom, transparent 30%, rgba(12, 10, 20, 0.95))' }} />
                
                <span
                  style={{
                    position: 'absolute',
                    top: '14px',
                    left: '14px',
                    fontSize: '11px',
                    fontWeight: 900,
                    padding: '4px 12px',
                    borderRadius: '12px',
                    background: 'rgba(0, 0, 0, 0.75)',
                    backdropFilter: 'blur(8px)',
                    color: '#00d4ff',
                    border: '1px solid rgba(0, 212, 255, 0.3)',
                    textTransform: 'uppercase',
                  }}
                >
                  {t(art.category)}
                </span>

                <span style={{ position: 'absolute', top: '14px', right: '14px', fontSize: '11px', color: 'white', padding: '4px 10px', borderRadius: '10px', background: 'rgba(0, 0, 0, 0.65)' }}>
                  {t(art.readTime)}
                </span>
              </div>

              {/* Card Body */}
              <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h2 style={{ fontSize: '17px', fontWeight: 900, color: 'white', margin: 0, lineHeight: 1.4 }}>
                  {t(art.title)}
                </h2>

                <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)', margin: 0, lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {t(art.excerpt)}
                </p>

                {art.disclaimer && (
                  <div
                    style={{
                      fontSize: '11px',
                      color: 'rgba(255, 193, 7, 0.9)',
                      background: 'rgba(255, 193, 7, 0.08)',
                      padding: '6px 10px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 193, 7, 0.2)',
                    }}
                  >
                    ℹ️ {t(art.disclaimer)}
                  </div>
                )}

                <div style={{ marginTop: 'auto', paddingTop: '14px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>
                  <span>{t('Author:')} {t(art.author)}</span>
                  
                  {/* Interactive Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openArticle(art);
                    }}
                    style={{
                      background: 'rgba(0, 255, 136, 0.12)',
                      border: '1px solid rgba(0, 255, 136, 0.4)',
                      color: '#00ff88',
                      fontWeight: 800,
                      fontSize: '12px',
                      padding: '6px 12px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    {t('Read Full Guide')} ➔
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Full Article Reader Modal with Cover Image Banner & Interactive App CTAs */}
      {selectedArticle && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.88)',
            backdropFilter: 'blur(14px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={closeArticle}
        >
          <div
            style={{
              maxWidth: '840px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: '28px',
              border: '1px solid rgba(0, 212, 255, 0.4)',
              background: '#0c0a14',
              color: 'white',
              position: 'relative',
              boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Banner Image */}
            <div style={{ position: 'relative', width: '100%', height: '240px' }}>
              <Image
                src={selectedArticle.coverImage || 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=800&q=80'}
                alt={selectedArticle.title}
                fill
                unoptimized
                style={{ objectFit: 'cover' }}
              />
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to bottom, transparent 30%, #0c0a14 100%)' }} />
              
              <button
                onClick={closeArticle}
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  background: 'rgba(0, 0, 0, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '20px',
                  zIndex: 10,
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Article Content */}
            <div style={{ padding: '0 36px 36px 36px', marginTop: '-30px', position: 'relative', zIndex: 2 }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
                <span style={{ padding: '4px 14px', borderRadius: '12px', background: 'rgba(0, 212, 255, 0.2)', color: '#00d4ff', fontSize: '12px', fontWeight: 800, border: '1px solid rgba(0, 212, 255, 0.4)' }}>
                  {t(selectedArticle.category)}
                </span>
                <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)' }}>
                  {t(selectedArticle.readTime)} • {t('Author:')} {t(selectedArticle.author)}
                </span>
                <Link href={`/knowledge/${selectedArticle.slug}`} style={{ textDecoration: 'none', marginLeft: 'auto' }}>
                  <span style={{ fontSize: '12px', color: '#00ff88', textDecoration: 'underline' }}>
                    🔗 Direct Link
                  </span>
                </Link>
              </div>

              <h1 style={{ fontSize: '30px', fontWeight: 900, marginBottom: '16px', lineHeight: 1.3 }}>
                {t(selectedArticle.title)}
              </h1>

              <p style={{ fontSize: '15px', color: 'rgba(255, 255, 255, 0.75)', lineHeight: 1.6, marginBottom: '24px' }}>
                {t(selectedArticle.excerpt)}
              </p>

              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '20px' }}>
                <ArticleMarkdownRenderer content={selectedArticle.content} />
              </div>

              {selectedArticle.disclaimer && (
                <div
                  style={{
                    marginTop: '24px',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: 'rgba(255, 193, 7, 0.08)',
                    border: '1px solid rgba(255, 193, 7, 0.2)',
                    color: 'rgba(255, 193, 7, 0.9)',
                    fontSize: '12px',
                  }}
                >
                  ℹ️ {t(selectedArticle.disclaimer)}
                </div>
              )}

              <div style={{ marginTop: '36px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <Link href="/search" style={{ textDecoration: 'none' }}>
                  <button style={{ padding: '12px 28px', borderRadius: '20px', background: 'linear-gradient(135deg, var(--primary, #00d4ff), #00ff88)', color: '#000000', fontWeight: 900, fontSize: '14px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 20px rgba(0, 255, 136, 0.3)' }}>
                    {t('Compare Live Deal Prices Now ↗')}
                  </button>
                </Link>

                <button
                  onClick={closeArticle}
                  style={{
                    padding: '12px 26px',
                    borderRadius: '20px',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    fontWeight: 800,
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  {t('Close Article')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function KnowledgeHubPage() {
  return (
    <Suspense fallback={
      <div style={{ textAlign: 'center', padding: '100px 20px', color: 'white' }}>
        Loading Knowledge Hub...
      </div>
    }>
      <KnowledgeHubContent />
    </Suspense>
  );
}

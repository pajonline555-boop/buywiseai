"use client";

import React, { useState } from 'react';
import { SOCIAL_CONFIG, SocialPlatform } from '@/config/socialLinks';
import { useTranslation } from '@/lib/i18n/i18nContext';

interface SocialMediaIconsProps {
  variant?: 'footer' | 'card' | 'compact' | 'inline';
  title?: string;
  subtitle?: string;
  platforms?: SocialPlatform[];
  showLabels?: boolean;
}

export default function SocialMediaIcons({
  variant = 'footer',
  title = SOCIAL_CONFIG.title,
  subtitle = SOCIAL_CONFIG.subtitle,
  platforms = SOCIAL_CONFIG.platforms,
  showLabels = false,
}: SocialMediaIconsProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const { t } = useTranslation();

  const displayTitle = t(title);
  const displaySubtitle = t(subtitle);

  if (variant === 'card') {
    return (
      <div
        style={{
          background: 'rgba(16, 12, 32, 0.85)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '24px',
          padding: '24px',
          color: '#ffffff',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.4)',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <span style={{ fontSize: '22px' }}>🌐</span>
              <h3 style={{ fontSize: '18px', fontWeight: 900, margin: 0, letterSpacing: '-0.01em' }}>
                {displayTitle}
              </h3>
            </div>
            {displaySubtitle && (
              <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.65)', margin: 0 }}>
                {displaySubtitle}
              </p>
            )}
          </div>

          {/* SINGLE HORIZONTAL LINE OF BRAND ICONS */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {platforms.map((platform) => {
              const isHovered = hoveredId === platform.id;
              const isDelinked = platform.isDelinked || platform.url === '#';
              return (
                <div key={platform.id} style={{ position: 'relative' }}>
                  <a
                    href={isDelinked ? '#' : platform.url}
                    target={isDelinked ? '_self' : '_blank'}
                    rel={isDelinked ? undefined : 'noopener noreferrer'}
                    onClick={(e) => {
                      if (isDelinked) {
                        e.preventDefault();
                      }
                    }}
                    onMouseEnter={() => setHoveredId(platform.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    aria-label={`${platform.name} - ${platform.actionText}`}
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: platform.gradient || platform.color,
                      border: `1px solid ${isHovered ? '#ffffff' : 'rgba(255, 255, 255, 0.2)'}`,
                      boxShadow: isHovered ? `0 8px 24px ${platform.glowColor}` : '0 4px 12px rgba(0,0,0,0.3)',
                      transform: isHovered ? 'translateY(-4px) scale(1.1)' : 'translateY(0) scale(1)',
                      transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      textDecoration: 'none',
                      cursor: isDelinked ? 'default' : 'pointer',
                      opacity: isDelinked ? 0.85 : 1,
                    }}
                  >
                    <svg viewBox="0 0 24 24" style={{ width: '22px', height: '22px', fill: '#ffffff', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>
                      <path d={platform.iconPath} />
                    </svg>
                  </a>

                  {/* TOOLTIP */}
                  {isHovered && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        marginBottom: '8px',
                        padding: '6px 12px',
                        background: 'rgba(8, 6, 18, 0.95)',
                        border: `1px solid ${platform.borderColor}`,
                        borderRadius: '10px',
                        fontSize: '11px',
                        fontWeight: 800,
                        color: '#ffffff',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 8px 20px rgba(0,0,0,0.6)',
                        pointerEvents: 'none',
                        zIndex: 50,
                      }}
                    >
                      {isDelinked ? `${platform.name} (Coming Soon)` : platform.name}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // DEFAULT & FOOTER VARIANT: SINGLE HORIZONTAL LINE
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {displayTitle && (
        <div style={{ fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.05em' }}>
          {displayTitle}
        </div>
      )}

      {displaySubtitle && (
        <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: 1.5, marginTop: '-4px' }}>
          {displaySubtitle}
        </div>
      )}

      {/* PRO SINGLE HORIZONTAL ROW OF OFFICIAL BRAND LOGOS */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexWrap: 'wrap',
          paddingTop: '4px',
        }}
      >
        {platforms.map((platform) => {
          const isHovered = hoveredId === platform.id;
          const isDelinked = platform.isDelinked || platform.url === '#';
          return (
            <div key={platform.id} style={{ position: 'relative' }}>
              <a
                href={isDelinked ? '#' : platform.url}
                target={isDelinked ? '_self' : '_blank'}
                rel={isDelinked ? undefined : 'noopener noreferrer'}
                onClick={(e) => {
                  if (isDelinked) {
                    e.preventDefault();
                  }
                }}
                title={isDelinked ? `${platform.name} (Coming Soon)` : `${platform.name} (${platform.handle})`}
                aria-label={platform.name}
                onMouseEnter={() => setHoveredId(platform.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: platform.gradient || platform.color,
                  border: `1px solid ${isHovered ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.25)'}`,
                  boxShadow: isHovered ? `0 6px 20px ${platform.glowColor}` : '0 4px 10px rgba(0, 0, 0, 0.35)',
                  transform: isHovered ? 'translateY(-3px) scale(1.08)' : 'translateY(0) scale(1)',
                  transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  textDecoration: 'none',
                  cursor: isDelinked ? 'default' : 'pointer',
                  opacity: isDelinked ? 0.85 : 1,
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  style={{
                    width: '20px',
                    height: '20px',
                    fill: '#ffffff',
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                  }}
                >
                  <path d={platform.iconPath} />
                </svg>
              </a>

              {/* TOOLTIP ON HOVER */}
              {isHovered && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    marginBottom: '8px',
                    padding: '5px 10px',
                    background: 'rgba(8, 6, 18, 0.95)',
                    border: `1px solid ${platform.borderColor}`,
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: 800,
                    color: '#ffffff',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 6px 16px rgba(0,0,0,0.6)',
                    pointerEvents: 'none',
                    zIndex: 50,
                  }}
                >
                  {isDelinked ? `${platform.name} (Coming Soon)` : platform.name}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

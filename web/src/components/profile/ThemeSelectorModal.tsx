"use client"
import React from 'react';
import { useTheme, ThemeMode } from '@/lib/theme/themeProvider';
import { useTranslation } from '@/lib/i18n/i18nContext';

interface ThemeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ThemeSelectorModal({ isOpen, onClose }: ThemeSelectorModalProps) {
  const { theme, setTheme, accentColor, setAccentColor, presetBalls } = useTheme();
  const { t } = useTranslation();

  if (!isOpen) return null;

  const handleSelectTheme = (mode: ThemeMode) => {
    setTheme(mode);
  };

  const options: { mode: ThemeMode; title: string; desc: string; icon: string }[] = [
    { mode: 'system', title: 'System Default', desc: 'Sync automatically with OS theme preference', icon: '💻' },
    { mode: 'dark', title: 'Dark Mode', desc: 'Deep violet glass surfaces with glowing accents', icon: '🌙' },
    { mode: 'light', title: 'Light Mode', desc: 'Clean slate light surfaces for daytime shopping', icon: '☀️' },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          background: 'linear-gradient(135deg, #140f26, #0c0a14)',
          border: '1px solid rgba(168, 85, 247, 0.4)',
          borderRadius: '24px',
          padding: '28px',
          boxShadow: '0 24px 48px rgba(0,0,0,0.85)',
          color: 'white',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 900, margin: 0 }}>🎨 {t('app_theme_color_selection')}</h2>
            <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.65)', margin: 0, marginTop: '2px' }}>
              Choose application theme and select your custom accent Color Ball
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* ACCENT COLOR BALLS SELECTOR */}
        <div style={{ marginBottom: '24px', background: 'rgba(255, 255, 255, 0.04)', padding: '16px', borderRadius: '18px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div style={{ fontSize: '13px', fontWeight: 800, marginBottom: '12px', color: 'var(--primary)' }}>
            🔮 {t('select_accent_color')} (Color Balls)
          </div>
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
            {presetBalls.map((ball) => {
              const isSelected = accentColor.toLowerCase() === ball.color.toLowerCase();
              return (
                <button
                  key={ball.id}
                  onClick={() => setAccentColor(ball.color)}
                  title={ball.name}
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: ball.color,
                    border: isSelected ? '3px solid #ffffff' : '2px solid rgba(255, 255, 255, 0.3)',
                    boxShadow: isSelected ? `0 0 16px ${ball.color}` : 'none',
                    cursor: 'pointer',
                    transform: isSelected ? 'scale(1.18)' : 'scale(1)',
                    transition: 'all 0.2s ease',
                  }}
                />
              );
            })}

            {/* Custom Color Wheel Selector */}
            <label
              title="Custom Color Picker Wheel"
              style={{
                position: 'relative',
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)',
                border: '2px solid rgba(255, 255, 255, 0.4)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <input
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                style={{ opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
              />
            </label>
          </div>
        </div>

        {/* THEME MODE OPTIONS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          {options.map((opt) => {
            const isSelected = theme === opt.mode;
            return (
              <div
                key={opt.mode}
                onClick={() => handleSelectTheme(opt.mode)}
                style={{
                  padding: '16px',
                  borderRadius: '16px',
                  border: isSelected ? '1px solid var(--primary)' : '1px solid rgba(255, 255, 255, 0.08)',
                  background: isSelected ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  transition: 'all 0.2s ease',
                }}
              >
                <span style={{ fontSize: '24px' }}>{opt.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: isSelected ? 'var(--primary)' : 'white' }}>
                    {t(opt.title)}
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.65)' }}>{t(opt.desc)}</div>
                </div>
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    border: isSelected ? '6px solid var(--primary)' : '2px solid rgba(255, 255, 255, 0.3)',
                    background: isSelected ? '#ffffff' : 'transparent',
                  }}
                />
              </div>
            );
          })}
        </div>

        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '16px',
            background: 'var(--gradient-accent)',
            color: '#ffffff',
            fontWeight: 900,
            fontSize: '14px',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          {t('confirm_delete') === 'Permanently Delete My Account' ? 'Apply Theme Settings' : 'Apply Settings'}
        </button>
      </div>
    </div>
  );
}

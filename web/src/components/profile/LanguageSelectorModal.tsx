"use client"
import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n/i18nContext';
import { SUPPORTED_LANGUAGES, LanguageCode } from '@/lib/i18n/translations';

interface LanguageSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LanguageSelectorModal({ isOpen, onClose }: LanguageSelectorModalProps) {
  const { language, setLanguage } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const handleSelect = (code: LanguageCode) => {
    setLanguage(code);
    onClose();
  };

  const filteredLanguages = SUPPORTED_LANGUAGES.filter((lang) => 
    lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lang.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #140f26, #0c0a14)',
          border: '1px solid rgba(0, 212, 255, 0.35)',
          borderRadius: '24px',
          padding: '24px',
          boxShadow: '0 24px 48px rgba(0,0,0,0.85)',
          color: 'white',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 900, margin: 0 }}>Select Language (13 Regional Languages)</h2>
            <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.65)', margin: 0, marginTop: '2px' }}>
              Choose your preferred native Indian shopping language
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

        {/* SEARCH INPUT */}
        <div style={{ marginBottom: '16px' }}>
          <input
            type="text"
            placeholder="🔍 Search Hindi, Bengali, Tamil, Telugu, Marathi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '14px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: 'white',
              fontSize: '13px',
              outline: 'none',
            }}
          />
        </div>

        {/* LANGUAGE LIST */}
        <div 
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '10px', 
            overflowY: 'auto', 
            paddingRight: '4px',
            maxHeight: '420px',
          }}
        >
          {filteredLanguages.map((lang) => {
            const isSelected = language === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                style={{
                  padding: '14px 18px',
                  borderRadius: '14px',
                  border: isSelected ? '1px solid #00d4ff' : '1px solid rgba(255, 255, 255, 0.08)',
                  background: isSelected ? 'rgba(0, 212, 255, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                  color: 'white',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '20px' }}>{lang.flagEmoji}</span>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 800 }}>{lang.name}</div>
                    <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>{lang.nativeName}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', background: 'rgba(255, 255, 255, 0.08)', padding: '2px 7px', borderRadius: '6px' }}>
                    {lang.packSize}
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: isSelected ? '#00d4ff' : 'rgba(255, 255, 255, 0.4)' }}>
                    {isSelected ? '✓ Active' : 'Select'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

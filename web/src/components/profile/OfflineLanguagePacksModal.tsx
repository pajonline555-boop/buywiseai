"use client"
import React, { useState } from 'react';
import { SUPPORTED_LANGUAGES, LanguageOption } from '@/lib/i18n/translations';
import { useTranslation } from '@/lib/i18n/i18nContext';

interface OfflineLanguagePacksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OfflineLanguagePacksModal({ isOpen, onClose }: OfflineLanguagePacksModalProps) {
  const { t } = useTranslation();
  const [downloadedPacks, setDownloadedPacks] = useState<Record<string, boolean>>({
    en: true,
    hi: true,
  });
  const [downloadingPack, setDownloadingPack] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownload = (code: string) => {
    setDownloadingPack(code);
    setTimeout(() => {
      setDownloadedPacks((prev) => ({ ...prev, [code]: true }));
      setDownloadingPack(null);
    }, 1200);
  };

  const handleDownloadAll = () => {
    setDownloadingPack('ALL');
    setTimeout(() => {
      const allDownloaded: Record<string, boolean> = {};
      SUPPORTED_LANGUAGES.forEach((l) => (allDownloaded[l.code] = true));
      setDownloadedPacks(allDownloaded);
      setDownloadingPack(null);
    }, 2000);
  };

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
          maxWidth: '560px',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #140f26, #0c0a14)',
          border: '1px solid rgba(0, 255, 136, 0.35)',
          borderRadius: '24px',
          padding: '24px',
          boxShadow: '0 24px 48px rgba(0,0,0,0.85)',
          color: 'white',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 900, margin: 0, color: '#00ff88' }}>
              📦 {t('offline_language_pack_download')}
            </h2>
            <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.65)', margin: 0, marginTop: '2px' }}>
              Download 13 regional language packs for 100% offline access &amp; fast AI comparison
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

        {/* BULK ACTION HEADER */}
        <div 
          style={{ 
            background: 'rgba(0, 255, 136, 0.1)', 
            border: '1px solid rgba(0, 255, 136, 0.3)', 
            borderRadius: '16px', 
            padding: '14px 18px', 
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ fontSize: '13px', fontWeight: 900, color: '#00ff88' }}>
              ⚡ Download All 13 Language Packs
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)' }}>
              Total Bundle Size: ~62.5 MB (Auto-updates via WiFi)
            </div>
          </div>
          <button
            onClick={handleDownloadAll}
            disabled={downloadingPack === 'ALL'}
            style={{
              padding: '8px 14px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #00ff88, #00b8ff)',
              color: '#000000',
              fontWeight: 900,
              fontSize: '12px',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {downloadingPack === 'ALL' ? '⏳ Downloading All...' : `📥 ${t('download_all')}`}
          </button>
        </div>

        {/* LANGUAGE PACKS LIST */}
        <div 
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '10px', 
            overflowY: 'auto', 
            paddingRight: '4px',
            maxHeight: '400px',
          }}
        >
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isInstalled = downloadedPacks[lang.code];
            const isDownloading = downloadingPack === lang.code || downloadingPack === 'ALL';
            return (
              <div
                key={lang.code}
                style={{
                  padding: '14px 18px',
                  borderRadius: '14px',
                  border: isInstalled ? '1px solid rgba(0, 255, 136, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
                  background: isInstalled ? 'rgba(0, 255, 136, 0.08)' : 'rgba(255, 255, 255, 0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '20px' }}>{lang.flagEmoji}</span>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 800 }}>{lang.name} ({lang.nativeName})</div>
                    <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>
                      Pack Size: {lang.packSize} • Version 2026.1
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => !isInstalled && handleDownload(lang.code)}
                  disabled={isInstalled || isDownloading}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '10px',
                    fontSize: '12px',
                    fontWeight: 800,
                    border: isInstalled ? '1px solid rgba(0, 255, 136, 0.5)' : '1px solid rgba(255, 255, 255, 0.2)',
                    background: isInstalled ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                    color: isInstalled ? '#00ff88' : 'white',
                    cursor: isInstalled ? 'default' : 'pointer',
                  }}
                >
                  {isDownloading ? '⏳ Installing...' : isInstalled ? `✓ ${t('installed')}` : `📥 ${t('download')}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

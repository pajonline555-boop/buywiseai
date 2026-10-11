"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from '@/lib/i18n/i18nContext';
import { startWebSpeechRecognition } from '@/lib/ai/webSpeechService';

interface VoiceSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTranscript: (text: string) => void;
}

export default function VoiceSearchModal({ isOpen, onClose, onTranscript }: VoiceSearchModalProps) {
  const { t, language } = useTranslation();
  const [status, setStatus] = useState<'listening' | 'transcribed' | 'error'>('listening');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>('');
  const recognitionRef = useRef<any>(null);

  const startListening = () => {
    setStatus('listening');
    setErrorMessage(null);
    setTranscript('');

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
    }

    const instance = startWebSpeechRecognition(
      (text: string) => {
        setTranscript(text);
        setStatus('transcribed');
        setTimeout(() => {
          onTranscript(text);
          onClose();
        }, 800);
      },
      (errMsg: string) => {
        setErrorMessage(errMsg);
        setStatus('error');
      },
      language
    );

    recognitionRef.current = instance;
  };

  useEffect(() => {
    if (isOpen) {
      startListening();
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
        recognitionRef.current = null;
      }
    }
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100001,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        className="glass animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '420px',
          padding: '36px 28px',
          borderRadius: '28px',
          background: 'linear-gradient(145deg, rgba(16, 12, 30, 0.98), rgba(8, 6, 18, 0.98))',
          border: '1px solid rgba(0, 255, 136, 0.3)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 30px rgba(124, 58, 237, 0.2)',
          textAlign: 'center',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            color: 'white',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 800,
          }}
        >
          ✕
        </button>

        {/* Animated Mic Indicator */}
        <div
          style={{
            width: '88px',
            height: '88px',
            margin: '0 auto 24px auto',
            borderRadius: '50%',
            background: status === 'error'
              ? 'rgba(255, 59, 48, 0.15)'
              : status === 'transcribed'
              ? 'rgba(0, 255, 136, 0.2)'
              : 'rgba(124, 58, 237, 0.2)',
            border: status === 'error'
              ? '2px solid #ff3b30'
              : status === 'transcribed'
              ? '2px solid #00ff88'
              : '2px solid var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '36px',
            boxShadow: status === 'listening'
              ? '0 0 30px rgba(124, 58, 237, 0.6)'
              : status === 'transcribed'
              ? '0 0 30px rgba(0, 255, 136, 0.6)'
              : 'none',
            animation: status === 'listening' ? 'pulse-glow 1.5s infinite ease-in-out' : 'none',
          }}
        >
          {status === 'error' ? '⚠️' : status === 'transcribed' ? '✅' : '🎙️'}
        </div>

        <h3 style={{ fontSize: '20px', fontWeight: 900, marginBottom: '8px', color: '#ffffff' }}>
          {status === 'listening' && (t('Voice Search') || 'Voice Search')}
          {status === 'transcribed' && (t('Speech Recognized') || 'Speech Recognized!')}
          {status === 'error' && (t('Voice Search Error') || 'Voice Search Notice')}
        </h3>

        <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '24px', lineHeight: 1.5 }}>
          {status === 'listening' && (
            <>
              {t('Listening in')} <strong style={{ color: '#00ff88' }}>{language.toUpperCase()}</strong>... {t('Speak your search query clearly.') || 'Speak your search query clearly.'}
            </>
          )}
          {status === 'transcribed' && (
            <span style={{ fontSize: '16px', fontWeight: 800, color: '#00ff88' }}>
              &quot;{transcript}&quot;
            </span>
          )}
          {status === 'error' && errorMessage}
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          {status === 'error' && (
            <button
              onClick={startListening}
              className="btn-primary"
              style={{ padding: '10px 24px', fontSize: '13px' }}
            >
              🔄 {t('Try Again') || 'Try Again'}
            </button>
          )}
          <button
            onClick={onClose}
            className="btn-secondary"
            style={{
              padding: '10px 24px',
              fontSize: '13px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: 'white',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: 800,
            }}
          >
            {t('cancel') || 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
}

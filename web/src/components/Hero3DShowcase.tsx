"use client"
import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/i18nContext';

export default function Hero3DShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(12);
  const [rotateY, setRotateY] = useState(-8);
  const [isHovered, setIsHovered] = useState(false);
  const { t } = useTranslation();

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Calculate smooth 3D tilt angles based on mouse position
    const rY = ((x - centerX) / centerX) * 16;
    const rX = -((y - centerY) / centerY) * 16 + 10;

    setRotateX(rX);
    setRotateY(rY);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(12);
    setRotateY(-8);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '660px',
        height: '520px',
        margin: '0 auto',
        perspective: '1200px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
      }}
    >
      {/* Ambient Radial Background Glow */}
      <div
        style={{
          position: 'absolute',
          inset: '-20px',
          background: 'radial-gradient(circle at 50% 50%, rgba(168, 85, 247, 0.4) 0%, rgba(0, 255, 136, 0.2) 45%, transparent 75%)',
          filter: 'blur(40px)',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      {/* Futuristic 3D Grid Floor Effect */}
      <div
        style={{
          position: 'absolute',
          bottom: '-30px',
          width: '120%',
          height: '240px',
          background: `
            linear-gradient(to right, rgba(0, 255, 136, 0.15) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 255, 136, 0.15) 1px, transparent 1px)
          `,
          backgroundSize: '30px 30px',
          transform: 'rotateX(75deg) translateY(50px) translateZ(-60px)',
          transformOrigin: 'bottom center',
          maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 30%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 30%, transparent 100%)',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />

      {/* 3D Transform Container */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          gap: '14px',
          alignItems: 'center',
          justifyContent: 'center',
          transformStyle: 'preserve-3d',
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.8s ease-out',
          zIndex: 2,
        }}
      >
        {/* CARD 1: AMAZON INDIA */}
        <div
          style={{
            flex: 1,
            height: '420px',
            background: 'linear-gradient(145deg, rgba(20, 16, 38, 0.92), rgba(10, 8, 20, 0.98))',
            border: '1.5px solid rgba(0, 212, 255, 0.5)',
            borderRadius: '24px',
            padding: '20px 16px',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.9), inset 0 0 20px rgba(0, 212, 255, 0.15)',
            backdropFilter: 'blur(20px)',
            transformStyle: 'preserve-3d',
            transform: 'translateZ(30px) rotateY(-5deg)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Floating Glass Glare */}
          <div style={{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', background: 'linear-gradient(45deg, transparent 45%, rgba(255, 255, 255, 0.08) 50%, transparent 55%)', pointerEvents: 'none' }} />

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '0.1em', color: '#00d4ff', textTransform: 'uppercase' }}>AMAZON</span>
              <span style={{ fontSize: '9px', fontWeight: 900, padding: '2px 8px', borderRadius: '8px', background: 'rgba(0, 212, 255, 0.2)', color: '#00d4ff', border: '1px solid rgba(0, 212, 255, 0.4)' }}>VERIFIED</span>
            </div>

            {/* 3D Official Amazon Store Emblem */}
            <div
              style={{
                width: '108px',
                height: '68px',
                margin: '0 auto 16px auto',
                background: 'linear-gradient(135deg, rgba(255, 153, 0, 0.25), rgba(20, 16, 38, 0.95))',
                border: '1.5px solid rgba(255, 153, 0, 0.7)',
                borderRadius: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 12px 30px rgba(255, 153, 0, 0.4), inset 0 0 15px rgba(255, 153, 0, 0.2)',
                transform: 'translateZ(25px)',
                padding: '6px 10px',
              }}
            >
              <img
                src="/amazon-logo.svg"
                alt="Amazon Official Logo"
                style={{ width: '100%', height: 'auto', maxHeight: '38px', objectFit: 'contain', filter: 'drop-shadow(0 2px 8px rgba(255, 153, 0, 0.5))' }}
              />
            </div>

            <div style={{ textAlign: 'center', marginBottom: '12px' }}>
              <div style={{ color: '#ffd700', fontSize: '11px', marginBottom: '4px' }}>⭐⭐⭐⭐⭐</div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('sticker_price')}</div>
              <div style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff', textShadow: '0 0 12px rgba(255,255,255,0.5)' }}>₹82,900</div>
              <div style={{ fontSize: '10px', color: '#00ff88', fontWeight: 800, marginTop: '2px' }}>▲ -8.5% Price Drop</div>
            </div>
          </div>

          {/* SVG Price Chart */}
          <div style={{ transform: 'translateZ(15px)' }}>
            <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>PRICE TREND (6 MOS)</div>
            <svg viewBox="0 0 100 40" style={{ width: '100%', height: '40px', overflow: 'visible' }}>
              <defs>
                <linearGradient id="gradCyan" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#00d4ff" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M 0 30 Q 25 10 50 25 T 100 10 L 100 40 L 0 40 Z" fill="url(#gradCyan)" />
              <path d="M 0 30 Q 25 10 50 25 T 100 10" fill="none" stroke="#00d4ff" strokeWidth="2.5" filter="drop-shadow(0 0 6px #00d4ff)" />
            </svg>
            <div style={{ marginTop: '10px', padding: '6px', borderRadius: '10px', background: 'rgba(0, 212, 255, 0.1)', border: '1px solid rgba(0, 212, 255, 0.3)', textAlign: 'center', fontSize: '9px', fontWeight: 900, color: '#00d4ff' }}>
              PREMIUM DEAL
            </div>
          </div>
        </div>

        {/* CARD 2: BUYWISE GEN-G / DIRECT (CENTER HIGHLIGHT 3D CARD) */}
        <div
          style={{
            flex: 1.1,
            height: '460px',
            background: 'linear-gradient(145deg, rgba(30, 18, 55, 0.95), rgba(14, 10, 26, 0.98))',
            border: '2px solid var(--primary)',
            borderRadius: '26px',
            padding: '22px 18px',
            boxShadow: '0 30px 60px rgba(255, 0, 127, 0.4), inset 0 0 30px rgba(255, 0, 127, 0.25)',
            backdropFilter: 'blur(24px)',
            transformStyle: 'preserve-3d',
            transform: 'translateZ(55px)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Floating Glass Glare */}
          <div style={{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', background: 'linear-gradient(45deg, transparent 45%, rgba(255, 255, 255, 0.15) 50%, transparent 55%)', pointerEvents: 'none' }} />

          {/* Top Banner Tag */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: 'var(--gradient-accent)', padding: '3px 0', textAlign: 'center', fontSize: '9px', fontWeight: 900, color: '#ffffff', letterSpacing: '0.1em' }}>
            ⚡ BEST PRICE GUARANTEE
          </div>

          <div style={{ marginTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '0.1em', color: 'var(--primary)', textTransform: 'uppercase' }}>GEN-G STORE</span>
              <span style={{ fontSize: '9px', fontWeight: 900, padding: '2px 8px', borderRadius: '8px', background: 'rgba(255, 0, 127, 0.25)', color: '#ff77c2', border: '1px solid rgba(255, 0, 127, 0.5)' }}>0% COMMISSION</span>
            </div>

            {/* 3D Store Logo Emblem */}
            <div
              style={{
                width: '72px',
                height: '72px',
                margin: '0 auto 16px auto',
                background: 'linear-gradient(135deg, rgba(255, 0, 127, 0.35), rgba(168, 85, 247, 0.35))',
                border: '2px solid var(--primary)',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 12px 30px rgba(255, 0, 127, 0.5)',
                transform: 'translateZ(30px)',
              }}
            >
              <img src="/logo-icon.png" alt="BuyWise AI Logo" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
            </div>

            <div style={{ textAlign: 'center', marginBottom: '14px' }}>
              <div style={{ color: '#ffd700', fontSize: '12px', marginBottom: '4px' }}>⭐⭐⭐⭐⭐</div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI OFFER PRICE</div>
              <div style={{ fontSize: '28px', fontWeight: 900, color: '#ffffff', textShadow: '0 0 16px rgba(255,0,127,0.8)' }}>₹81,500</div>
              <div style={{ fontSize: '11px', color: '#00ff88', fontWeight: 900, marginTop: '2px' }}>▲ -12.4% Lowest Ever</div>
            </div>
          </div>

          {/* SVG Price Chart */}
          <div style={{ transform: 'translateZ(20px)' }}>
            <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SMART DEAL TRACKER</div>
            <svg viewBox="0 0 100 40" style={{ width: '100%', height: '44px', overflow: 'visible' }}>
              <defs>
                <linearGradient id="gradMagenta" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ff007f" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M 0 35 Q 20 20 40 30 T 70 10 T 100 5 L 100 40 L 0 40 Z" fill="url(#gradMagenta)" />
              <path d="M 0 35 Q 20 20 40 30 T 70 10 T 100 5" fill="none" stroke="#ff007f" strokeWidth="3" filter="drop-shadow(0 0 8px #ff007f)" />
            </svg>
            <div style={{ marginTop: '10px', padding: '7px', borderRadius: '12px', background: 'var(--gradient-accent)', border: '1px solid rgba(255,0,127,0.5)', textAlign: 'center', fontSize: '10px', fontWeight: 900, color: '#ffffff', boxShadow: '0 4px 15px rgba(255,0,127,0.3)' }}>
              🔥 DIRECT FACTORY DEAL
            </div>
          </div>
        </div>

        {/* CARD 3: FLIPKART INDIA */}
        <div
          style={{
            flex: 1,
            height: '420px',
            background: 'linear-gradient(145deg, rgba(20, 16, 38, 0.92), rgba(10, 8, 20, 0.98))',
            border: '1.5px solid rgba(0, 255, 136, 0.5)',
            borderRadius: '24px',
            padding: '20px 16px',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.9), inset 0 0 20px rgba(0, 255, 136, 0.15)',
            backdropFilter: 'blur(20px)',
            transformStyle: 'preserve-3d',
            transform: 'translateZ(30px) rotateY(5deg)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Floating Glass Glare */}
          <div style={{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', background: 'linear-gradient(45deg, transparent 45%, rgba(255, 255, 255, 0.08) 50%, transparent 55%)', pointerEvents: 'none' }} />

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '0.1em', color: '#00ff88', textTransform: 'uppercase' }}>FLIPKART</span>
              <span style={{ fontSize: '9px', fontWeight: 900, padding: '2px 8px', borderRadius: '8px', background: 'rgba(0, 255, 136, 0.2)', color: '#00ff88', border: '1px solid rgba(0, 255, 136, 0.4)' }}>SUPERCOINS</span>
            </div>

            {/* 3D Official Flipkart Store Emblem */}
            <div
              style={{
                width: '100px',
                height: '66px',
                margin: '0 auto 16px auto',
                background: 'linear-gradient(135deg, rgba(40, 116, 240, 0.3), rgba(20, 16, 38, 0.95))',
                border: '1.5px solid rgba(40, 116, 240, 0.8)',
                borderRadius: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 12px 30px rgba(40, 116, 240, 0.4), inset 0 0 15px rgba(40, 116, 240, 0.2)',
                transform: 'translateZ(25px)',
                padding: '8px 12px',
              }}
            >
              <img
                src="/flipkart-logo.svg"
                alt="Flipkart Official Logo"
                style={{ width: '100%', height: 'auto', maxHeight: '34px', objectFit: 'contain', filter: 'drop-shadow(0 2px 8px rgba(40, 116, 240, 0.5))' }}
              />
            </div>

            <div style={{ textAlign: 'center', marginBottom: '12px' }}>
              <div style={{ color: '#ffd700', fontSize: '11px', marginBottom: '4px' }}>⭐⭐⭐⭐⭐</div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('sticker_price')}</div>
              <div style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff', textShadow: '0 0 12px rgba(255,255,255,0.5)' }}>₹83,999</div>
              <div style={{ fontSize: '10px', color: '#00ff88', fontWeight: 800, marginTop: '2px' }}>▲ -4.5% Bank Offer</div>
            </div>
          </div>

          {/* SVG Price Chart */}
          <div style={{ transform: 'translateZ(15px)' }}>
            <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>DEAL TRACKER</div>
            <svg viewBox="0 0 100 40" style={{ width: '100%', height: '40px', overflow: 'visible' }}>
              <defs>
                <linearGradient id="gradEmerald" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00ff88" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#00ff88" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M 0 25 Q 30 35 60 15 T 100 20 L 100 40 L 0 40 Z" fill="url(#gradEmerald)" />
              <path d="M 0 25 Q 30 35 60 15 T 100 20" fill="none" stroke="#00ff88" strokeWidth="2.5" filter="drop-shadow(0 0 6px #00ff88)" />
            </svg>
            <div style={{ marginTop: '10px', padding: '6px', borderRadius: '10px', background: 'rgba(0, 255, 136, 0.1)', border: '1px solid rgba(0, 255, 136, 0.3)', textAlign: 'center', fontSize: '9px', fontWeight: 900, color: '#00ff88' }}>
              TOP STORE DEAL
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client"
import React, { useState, useEffect } from 'react';

export default function VisitorCounter() {
  const [visitorCount, setVisitorCount] = useState<number | null>(null);
  const [activeShoppers, setActiveShoppers] = useState(42);

  useEffect(() => {
    // Persistent visitor count calculation
    const baseCount = 148850;
    try {
      const stored = localStorage.getItem('buywise_visitor_count');
      let current = stored ? parseInt(stored, 10) : baseCount;
      if (isNaN(current)) current = baseCount;
      current += 1;
      localStorage.setItem('buywise_visitor_count', current.toString());
      setVisitorCount(current);
    } catch {
      setVisitorCount(baseCount + 70);
    }

    // Dynamic active live shoppers jitter between 35 and 65
    const interval = setInterval(() => {
      setActiveShoppers(Math.floor(Math.random() * 30) + 35);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        flexWrap: 'wrap',
        marginTop: '30px',
        padding: '16px 24px',
        borderRadius: '20px',
        background: 'linear-gradient(135deg, rgba(14, 10, 26, 0.95), rgba(8, 6, 15, 0.98))',
        border: '1px solid rgba(0, 255, 136, 0.3)',
        boxShadow: '0 10px 30px rgba(0, 255, 136, 0.15)',
        maxWidth: '700px',
        margin: '30px auto 0 auto',
      }}
    >
      {/* Live Online Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: '#00ff88',
            boxShadow: '0 0 12px #00ff88',
            display: 'inline-block',
            animation: 'pulse 2s infinite',
          }}
        />
        <span style={{ fontSize: '13px', fontWeight: 800, color: '#00ff88' }}>
          {activeShoppers} Live Shoppers Browsing
        </span>
      </div>

      <div style={{ width: '1px', height: '20px', background: 'rgba(255, 255, 255, 0.2)' }} />

      {/* Visitor Counter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '16px' }}>👁️</span>
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#cbd5e1' }}>Total Website Visitors:</span>
        <span
          style={{
            fontSize: '15px',
            fontWeight: 900,
            color: '#ffffff',
            background: 'linear-gradient(135deg, #a855f7, #38bdf8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '0.05em',
          }}
        >
          {visitorCount !== null ? visitorCount.toLocaleString('en-IN') : '148,920+'}
        </span>
      </div>
    </div>
  );
}

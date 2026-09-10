"use client"
import React from 'react';

interface ProfileStatCardProps {
  label: string;
  count: number;
  icon: string;
  color?: string;
  onClick?: () => void;
  subtitle?: string;
}

export default function ProfileStatCard({
  label,
  count,
  icon,
  color = '#00ff88',
  onClick,
  subtitle,
}: ProfileStatCardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '20px',
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.borderColor = `${color}66`;
          e.currentTarget.style.boxShadow = `0 10px 24px -10px ${color}40`;
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '22px' }}>{icon}</span>
        <span
          style={{
            fontSize: '24px',
            fontWeight: 900,
            color: count > 0 ? color : 'rgba(255, 255, 255, 0.4)',
            letterSpacing: '-0.02em',
          }}
        >
          {count}
        </span>
      </div>
      <div>
        <div style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>{label}</div>
        {subtitle && (
          <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', marginTop: '2px' }}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}

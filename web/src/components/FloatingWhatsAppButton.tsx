"use client";

import React from 'react';
import { generateGeneralSupportWhatsAppLink } from '@/lib/commerce/whatsappCommerce';

export default function FloatingWhatsAppButton() {
  const whatsappUrl = generateGeneralSupportWhatsAppLink();

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with BuyWise on WhatsApp"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '12px 18px',
        borderRadius: '30px',
        background: 'linear-gradient(135deg, #25d366, #128c7e)',
        color: '#ffffff',
        textDecoration: 'none',
        fontWeight: 800,
        fontSize: '13px',
        boxShadow: '0 8px 25px rgba(37, 211, 102, 0.45)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        cursor: 'pointer',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)';
        e.currentTarget.style.boxShadow = '0 12px 30px rgba(37, 211, 102, 0.6)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 8px 25px rgba(37, 211, 102, 0.45)';
      }}
    >
      <span style={{ fontSize: '20px', lineHeight: 1 }}>💬</span>
      <span>WhatsApp Order &amp; Help</span>
    </a>
  );
}

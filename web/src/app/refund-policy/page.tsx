"use client"
import React from 'react';
import Link from 'next/link';

export default function RefundPolicyPage() {
  return (
    <main
      style={{
        width: '100%',
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '32px 20px 100px 20px',
        color: 'white',
      }}
    >
      <div style={{ marginBottom: '28px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '8px', fontSize: '12px', color: '#ff007f', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>
          <span>CANCELLATION & REFUND POLICY</span> • <span>INDIA</span>
        </div>
        <h1 style={{ fontSize: '32px', fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>
          Refund & Cancellation Policy
        </h1>
        <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)', marginTop: '8px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <span><strong>Version:</strong> 1.1</span>
          <span><strong>Effective Date:</strong> January 1, 2026</span>
        </div>
      </div>

      <div
        style={{
          padding: '16px 20px',
          borderRadius: '16px',
          background: 'rgba(255, 193, 7, 0.12)',
          border: '1px solid rgba(255, 193, 7, 0.3)',
          color: '#ffc107',
          fontSize: '13px',
          fontWeight: 700,
          marginBottom: '32px',
          lineHeight: 1.5,
        }}
      >
        ⚠️ <strong>Notice:</strong> Implementation policy draft. Final legal review by qualified counsel recommended prior to commercial launch.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', lineHeight: 1.7, fontSize: '15px', color: 'rgba(255, 255, 255, 0.85)' }}>
        
        <section>
          <h2 style={{ fontSize: '20px', fontWeight: 900, color: 'white' }}>1. External Affiliate Retailer Purchases</h2>
          <p>
            When you purchase products via affiliate links leading to third-party retailers (e.g. Amazon India, Flipkart, Myntra, Nykaa), the transaction occurs on the external retailer&apos;s platform.
          </p>
          <p>
            Returns, cancellations, replacements, and refunds for external affiliate purchases are governed entirely by the external retailer&apos;s customer return policy. BuyWise AI does not process payments or issue refunds for external affiliate transactions.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '20px', fontWeight: 900, color: 'white' }}>2. BuyWise Partner Marketplace Orders</h2>
          <p>
            For items purchased directly from verified partner sellers on the BuyWise Partners Marketplace:
          </p>
          <ul style={{ paddingLeft: '24px' }}>
            <li><strong>7-Day Return Guarantee:</strong> Eligible fashion, saree, and jewellery products can be returned or exchanged within 7 days of delivery.</li>
            <li><strong>Cancellation Window:</strong> Orders can be cancelled free of charge prior to the status changing to <code>SHIPPED</code>.</li>
            <li><strong>Refund Timeline:</strong> Approved refunds are credited to the customer&apos;s original payment source within 5 to 7 business days following partner merchant inspection.</li>
          </ul>
        </section>

      </div>

      <div style={{ marginTop: '48px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <Link href="/terms-of-service" style={{ color: '#00d4ff', textDecoration: 'none', fontWeight: 700 }}>Terms of Service →</Link>
        <Link href="/affiliate-disclosure" style={{ color: '#ff007f', textDecoration: 'none', fontWeight: 700 }}>Affiliate Disclosure →</Link>
        <Link href="/profile" style={{ color: 'white', textDecoration: 'none', fontWeight: 700, marginLeft: 'auto' }}>Return to Profile</Link>
      </div>
    </main>
  );
}

"use client"
import React from 'react';
import Link from 'next/link';

export default function TermsOfServicePage() {
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
        <div style={{ display: 'flex', gap: '8px', fontSize: '12px', color: '#00ff88', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>
          <span>TERMS OF SERVICE</span> • <span>REPUBLIC OF INDIA</span>
        </div>
        <h1 style={{ fontSize: '32px', fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>
          BuyWise AI — Terms of Service
        </h1>
        <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)', marginTop: '8px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <span><strong>Version:</strong> 1.1</span>
          <span><strong>Effective Date:</strong> January 1, 2026</span>
          <span><strong>Jurisdiction:</strong> Republic of India</span>
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
        ⚠️ <strong>Notice:</strong> These Terms of Service constitute a legal agreement implementation draft for BuyWise AI in India. Final legal review by qualified technology & e-commerce legal counsel is recommended prior to commercial launch.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', lineHeight: 1.7, fontSize: '15px', color: 'rgba(255, 255, 255, 0.85)' }}>
        
        <section>
          <h2 style={{ fontSize: '20px', fontWeight: 900, color: 'white' }}>1. Acceptance of Terms</h2>
          <p>
            By accessing or using BuyWise AI (including web, mobile applications, or API services), you agree to be bound by these Terms of Service. If you do not agree, you must discontinue using the Platform.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '20px', fontWeight: 900, color: 'white' }}>2. Guest Access & Account Registration</h2>
          <p>
            BuyWise AI permits guest exploration of public shopping comparison feeds, coupons, and buying guides without mandatory sign-up. Personal features (price drop alerts, saved looks, merchant orders) require account registration.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '20px', fontWeight: 900, color: 'white' }}>3. SmartCompare & Retailer Prices Disclaimer</h2>
          <p>
            SmartCompare displays product pricing from participating Indian merchants (including Amazon India, Flipkart, Myntra, Nykaa, and AJIO). Retailer prices, stock availability, and coupon validity change dynamically on merchant platforms. Always verify final checkout pricing on the merchant website.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '20px', fontWeight: 900, color: 'white' }}>4. AI Virtual Try-On Usage Terms</h2>
          <p>
            Users must upload only photographs they own or have explicit legal consent to use. AI Virtual Try-On previews are stylistic computer-generated simulations and do not guarantee exact physical fit or sizing.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '20px', fontWeight: 900, color: 'white' }}>5. BuyWise Partners Marketplace</h2>
          <p>
            Orders placed through BuyWise Partners Marketplace are fulfilled directly by verified partner merchants. Merchants are responsible for product authenticity, packaging, shipping, and statutory return/replacement compliance.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '20px', fontWeight: 900, color: 'white' }}>6. Governing Law & Jurisdiction</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of the Republic of India. Any disputes arising hereunder shall be subject to the exclusive jurisdiction of the courts in India.
          </p>
        </section>

      </div>

      <div style={{ marginTop: '48px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <Link href="/privacy-policy" style={{ color: '#00d4ff', textDecoration: 'none', fontWeight: 700 }}>Privacy Policy →</Link>
        <Link href="/refund-policy" style={{ color: '#00ff88', textDecoration: 'none', fontWeight: 700 }}>Refund Policy →</Link>
        <Link href="/partner-terms" style={{ color: '#ffd700', textDecoration: 'none', fontWeight: 700 }}>Partner Terms →</Link>
        <Link href="/profile" style={{ color: 'white', textDecoration: 'none', fontWeight: 700, marginLeft: 'auto' }}>Return to Profile</Link>
      </div>
    </main>
  );
}

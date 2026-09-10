"use client"
import React from 'react';
import Link from 'next/link';

export default function AffiliateDisclosurePage() {
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
          <span>AFFILIATE TRANSPARENCY DISCLOSURE</span>
        </div>
        <h1 style={{ fontSize: '32px', fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>
          Affiliate Disclosure
        </h1>
        <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)', marginTop: '8px' }}>
          <span><strong>Effective Date:</strong> January 1, 2026</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', lineHeight: 1.7, fontSize: '15px', color: 'rgba(255, 255, 255, 0.85)' }}>
        <p>
          BuyWise AI believes in 100% transparency with our users. In compliance with advertising guidelines and FTC/Indian consumer disclosure recommendations, please note the following:
        </p>

        <section
          style={{
            padding: '20px',
            borderRadius: '16px',
            background: 'rgba(255, 0, 128, 0.08)',
            border: '1px solid rgba(255, 0, 128, 0.25)',
          }}
        >
          <h2 style={{ fontSize: '18px', fontWeight: 900, color: 'white', marginTop: 0 }}>
            📢 Amazon Associates & Retailer Commission Notice
          </h2>
          <p style={{ margin: 0 }}>
            BuyWise AI is a participant in the <strong>Amazon Associates Program</strong> (Store Associate Tag: <code>pajonline-21</code>) and other retailer affiliate networks. Some product links on BuyWise AI are affiliate links. If you click on an affiliate link and complete a purchase on a retailer site, BuyWise AI may earn a small referral commission at <strong>no extra cost to you</strong>.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '20px', fontWeight: 900, color: 'white' }}>How Affiliate Links Affect Your Price</h2>
          <p>
            Affiliate partnerships do <strong>NOT</strong> increase the price you pay for products. Retailers pay affiliate commissions out of their standard marketing budgets. In fact, SmartCompare helps you find verified bank offers, instant credit card discounts, and active coupons to get the lowest possible price.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '20px', fontWeight: 900, color: 'white' }}>Independence & SmartCompare Rankings</h2>
          <p>
            Affiliate relationships do not alter SmartCompare price sorting or deal ratings. SmartCompare ranks deals strictly based on calculated effective price, bank discount savings, and merchant trust scores.
          </p>
        </section>

      </div>

      <div style={{ marginTop: '48px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <Link href="/privacy-policy" style={{ color: '#00d4ff', textDecoration: 'none', fontWeight: 700 }}>Privacy Policy →</Link>
        <Link href="/terms-of-service" style={{ color: '#00ff88', textDecoration: 'none', fontWeight: 700 }}>Terms of Service →</Link>
        <Link href="/profile" style={{ color: 'white', textDecoration: 'none', fontWeight: 700, marginLeft: 'auto' }}>Return to Profile</Link>
      </div>
    </main>
  );
}

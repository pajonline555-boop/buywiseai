"use client"
import React from 'react';
import Link from 'next/link';

export default function PartnerTermsPage() {
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
        <div style={{ display: 'flex', gap: '8px', fontSize: '12px', color: '#ffd700', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>
          <span>MERCHANT MARKETPLACE AGREEMENT</span> • <span>BUYWISE PARTNERS</span>
        </div>
        <h1 style={{ fontSize: '32px', fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>
          BuyWise Partner Merchant Terms
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
        ⚠️ <strong>Notice:</strong> Merchant Seller Agreement Draft for BuyWise Partners Marketplace. Final legal review by qualified counsel recommended prior to commercial merchant onboarding.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', lineHeight: 1.7, fontSize: '15px', color: 'rgba(255, 255, 255, 0.85)' }}>
        
        <section>
          <h2 style={{ fontSize: '20px', fontWeight: 900, color: 'white' }}>1. Partner Seller Eligibility & Verification</h2>
          <p>
            Merchant sellers applying to list products on BuyWise Partners Marketplace must provide valid business documentation, GSTIN registration (where applicable), bank account verification, and physical store/warehouse address details in India.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '20px', fontWeight: 900, color: 'white' }}>2. Product Authenticity & Listing Guidelines</h2>
          <p>
            Partner merchants guarantee that all listed goods (including silk sarees, jewellery, apparel, and accessories) are 100% authentic, brand-new, and accurately described. Counterfeit or prohibited items result in immediate merchant suspension and payout forfeiture.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '20px', fontWeight: 900, color: 'white' }}>3. Order Fulfillment & Shipping Obligations</h2>
          <p>
            For Partner-Fulfilled orders, merchants agree to accept, pack, and hand over shipments to designated courier partners (e.g. BlueDart) within 24 to 48 hours of receiving a <code>NEW_ORDER</code> notification.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '20px', fontWeight: 900, color: 'white' }}>4. Commission, Settlement & Payouts</h2>
          <p>
            BuyWise AI deducts the agreed platform commission fee (typically 10% to 15%) from completed sales. Net merchant payouts are disbursed weekly via direct NEFT/RTGS bank transfer following the expiry of the customer 7-day return window.
          </p>
        </section>

      </div>

      <div style={{ marginTop: '48px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <Link href="/terms-of-service" style={{ color: '#00d4ff', textDecoration: 'none', fontWeight: 700 }}>Terms of Service →</Link>
        <Link href="/refund-policy" style={{ color: '#00ff88', textDecoration: 'none', fontWeight: 700 }}>Refund Policy →</Link>
        <Link href="/profile" style={{ color: 'white', textDecoration: 'none', fontWeight: 700, marginLeft: 'auto' }}>Return to Profile</Link>
      </div>
    </main>
  );
}

"use client"
import React from 'react';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
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
      {/* Header */}
      <div style={{ marginBottom: '28px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '8px', fontSize: '12px', color: '#00d4ff', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>
          <span>LEGAL COMPLIANCE DRAFT</span> • <span>DPDP ACT 2023 & DPDP RULES 2025 ALIGNED</span>
        </div>
        <h1 style={{ fontSize: '32px', fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>
          BuyWise AI — Privacy Policy
        </h1>
        <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)', marginTop: '8px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <span><strong>Version:</strong> 2.1</span>
          <span><strong>Effective Date:</strong> January 1, 2026</span>
          <span><strong>Last Updated:</strong> September 6, 2026</span>
          <span><strong>Jurisdiction:</strong> Republic of India</span>
        </div>
      </div>

      {/* Mandatory Legal Review Safety Banner */}
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
        ⚠️ <strong>Notice:</strong> This Privacy Policy is structured as an implementation draft aligned with the <em>Digital Personal Data Protection Act, 2023</em>, <em>DPDP Rules, 2025</em>, and the <em>IT (Intermediary Guidelines and Digital Media Ethics Code) Rules</em>. Final legal review by qualified Indian technology & e-commerce legal counsel is recommended prior to commercial launch.
      </div>

      {/* Policy Content */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', lineHeight: 1.7, fontSize: '15px', color: 'rgba(255, 255, 255, 0.85)' }}>
        
        <section>
          <h2 style={{ fontSize: '20px', fontWeight: 900, color: 'white' }}>1. Entity & Platform Overview</h2>
          <p>
            This Privacy Policy governs the processing of personal data by <strong>BuyWise AI</strong> (&quot;BuyWise&quot;, &quot;Platform&quot;, &quot;We&quot;, &quot;Us&quot;, or &quot;Our&quot;). BuyWise AI is an AI-powered shopping intelligence platform operating in the Republic of India.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '20px', fontWeight: 900, color: 'white' }}>2. Regulatory & Legal Framework</h2>
          <p>
            BuyWise AI processes digital personal data in accordance with applicable Indian laws, including the <em>Digital Personal Data Protection Act, 2023 (DPDP Act)</em>, the <em>Digital Personal Data Protection Rules, 2025 (DPDP Rules)</em>, the <em>Information Technology Act, 2000</em>, and the <em>Consumer Protection (E-Commerce) Rules, 2020</em>.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '20px', fontWeight: 900, color: 'white' }}>3. Information We Collect</h2>
          <p>We collect personal data necessary to provide shopping comparison, price alerts, AI Virtual Try-On, and partner marketplace services:</p>
          <ul style={{ paddingLeft: '24px' }}>
            <li><strong>Account & Contact Data:</strong> Name, email address, mobile phone number, profile photo URL.</li>
            <li><strong>Shopping Preferences:</strong> Preferred categories, currency preferences, preferred retailers, price range filters.</li>
            <li><strong>Price Alert Subscriptions:</strong> Target prices, product SKUs, notification settings.</li>
            <li><strong>AI Virtual Try-On Photographs:</strong> Photographs voluntarily uploaded by users to generate garment and jewellery try-on previews.</li>
            <li><strong>Technical & Usage Data:</strong> IP address, device type, browser user-agent, operating system, proxy request logs.</li>
          </ul>
        </section>

        <section>
          <h2 style={{ fontSize: '20px', fontWeight: 900, color: 'white' }}>4. AI Virtual Try-On (VTO) & Admin Media Access Boundaries</h2>
          <p>
            BuyWise AI enforces three distinct media privacy access tiers:
          </p>
          <ul style={{ paddingLeft: '24px' }}>
            <li><strong>1. Private Local Media (Default):</strong> User photographs and generated VTO results are stored strictly in browser IndexedDB on the user&apos;s device. BuyWise administrators have <strong>zero default access</strong> to private local VTO photos.</li>
            <li><strong>2. User-Authorized Support/Security Review Media:</strong> Where a user voluntarily authorizes a specific image for support, rendering quality inspection, or safety/abuse reporting, BuyWise temporarily processes that <em>single selected image</em>. Access is purpose-limited, restricted to authorized support roles, expires after 48 hours, and generates an immutable security audit log.</li>
            <li><strong>3. Competition Submission Media:</strong> Submitting a VTO look to a BuyWise competition requires active, explicit consent via a dedicated consent dialog. Consent applies ONLY to the single selected look for public gallery display upon moderation.</li>
          </ul>
        </section>

        <section>
          <h2 style={{ fontSize: '20px', fontWeight: 900, color: 'white' }}>5. Affiliate Links & External Retailer Data</h2>
          <p>
            When you click on affiliate retailer links (such as Amazon India, Flipkart, or Myntra), you are redirected to the respective merchant platform. BuyWise AI does not receive your payment credentials, credit card details, or delivery address entered on external retailer sites.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '20px', fontWeight: 900, color: 'white' }}>6. Data Erasure & Local Clearing Rights</h2>
          <p>
            Under the DPDP Act 2023, data principals have the right to request erasure of their personal data. Users can clear locally stored Try-On photos and saved looks instantly via <em>Profile &rarr; Privacy Center &rarr; Clear Local Try-On Data</em> or request account deletion via <em>Profile &rarr; Security &rarr; Delete Account</em>.
          </p>
        </section>

        <section id="account-deletion">
          <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#00ff88' }}>8. Google Play Store Data Safety &amp; Account Deletion</h2>
          <p>
            In compliance with the Google Play Console User Data Policy and Data Deletion Requirement, BuyWise AI provides two methods for users to request permanent deletion of their account and all associated personal data:
          </p>
          <ul style={{ paddingLeft: '24px' }}>
            <li><strong>In-App Account Deletion:</strong> Open the BuyWise AI Android App, navigate to <em>Profile &rarr; Delete Account (DPDP Data Erasure)</em>, and confirm deletion. This immediately wipes your Firebase authentication credentials, price alerts, and private AI Try-On assets.</li>
            <li><strong>Web/Online Account Deletion Request:</strong> If you no longer have the app installed, you can submit a deletion request by emailing <strong>support@pajonline.co.in</strong> with the subject line <em>&quot;Account Deletion Request&quot;</em> along with your registered email address. Account data will be permanently purged within 7 business days.</li>
          </ul>
        </section>

        <section>
          <h2 style={{ fontSize: '20px', fontWeight: 900, color: 'white' }}>9. Grievance Redressal Officer</h2>
          <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <div><strong>Grievance Officer:</strong> Privacy &amp; Compliance Officer</div>
            <div><strong>Entity:</strong> BuyWise AI India</div>
            <div><strong>Email:</strong> privacy@buywise.ai / support@pajonline.co.in</div>
            <div><strong>Response Window:</strong> Acknowledgement within 24 hours; resolution within 15 business days as mandated under Indian IT Intermediary Rules &amp; Google Play Guidelines.</div>
          </div>
        </section>

      </div>

      {/* Navigation Footer */}
      <div style={{ marginTop: '48px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <Link href="/terms-of-service" style={{ color: '#00d4ff', textDecoration: 'none', fontWeight: 700 }}>Terms of Service →</Link>
        <Link href="/competition-terms" style={{ color: '#ffd700', textDecoration: 'none', fontWeight: 700 }}>Competition Terms →</Link>
        <Link href="/refund-policy" style={{ color: '#00ff88', textDecoration: 'none', fontWeight: 700 }}>Refund Policy →</Link>
        <Link href="/affiliate-disclosure" style={{ color: '#ff007f', textDecoration: 'none', fontWeight: 700 }}>Affiliate Disclosure →</Link>
        <Link href="/profile" style={{ color: 'white', textDecoration: 'none', fontWeight: 700, marginLeft: 'auto' }}>Return to Profile</Link>
      </div>
    </main>
  );
}

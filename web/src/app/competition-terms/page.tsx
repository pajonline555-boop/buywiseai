import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "⚖️ Official Competition Terms & Conditions | BuyWise AI",
  description: "Official rules, legal eligibility requirements, 18+ age restrictions, voting fraud policies, and privacy consent for the Weekly BuyWise Try-On Competition.",
};

export default function CompetitionTermsPage() {
  return (
    <main
      style={{
        width: '100%',
        maxWidth: '960px',
        margin: '0 auto',
        padding: '40px 20px 100px 20px',
        color: 'white',
        lineHeight: 1.7,
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 18px',
            background: 'rgba(255, 215, 0, 0.12)',
            border: '1px solid rgba(255, 215, 0, 0.4)',
            borderRadius: '20px',
            marginBottom: '14px',
          }}
        >
          <span style={{ color: '#ffd700', fontWeight: 900, fontSize: '13px' }}>
            ⚖️ OFFICIAL LEGAL RULES
          </span>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>
            Version 1.0 • Effective September 2026
          </span>
        </div>

        <h1 style={{ fontSize: '38px', fontWeight: 900, marginBottom: '12px' }}>
          Weekly BuyWise Try-On Challenge Terms &amp; Conditions
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '15px', maxWidth: '680px', margin: '0 auto' }}>
          These Terms &amp; Conditions govern participation, submission, voting, verification, prize awards, and content usage for the Weekly BuyWise Try-On Competition conducted on the BuyWise AI platform.
        </p>
      </div>

      {/* Highlights Box */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.08), rgba(0, 212, 255, 0.08))',
          border: '1px solid rgba(0, 255, 136, 0.3)',
          borderRadius: '20px',
          padding: '24px',
          marginBottom: '40px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ color: '#00ff88', fontWeight: 900, fontSize: '14px' }}>🆓 100% Free Entry</div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>No purchase or payment is required to enter or vote.</div>
        </div>
        <div>
          <div style={{ color: '#00ff88', fontWeight: 900, fontSize: '14px' }}>🔞 18+ Age Restriction</div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Participation is strictly restricted to individuals aged 18 years or older.</div>
        </div>
        <div>
          <div style={{ color: '#00ff88', fontWeight: 900, fontSize: '14px' }}>🗳️ One-User-One-Vote</div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Single authenticated vote per registered user per weekly cycle.</div>
        </div>
        <div>
          <div style={{ color: '#00ff88', fontWeight: 900, fontSize: '14px' }}>🔒 Private by Default</div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>VTO photos remain private unless you explicitly submit for voting.</div>
        </div>
      </div>

      {/* Sections Container */}
      <div
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '24px',
          padding: '36px',
          display: 'flex',
          flexDirection: 'column',
          gap: '28px',
        }}
      >
        <section>
          <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#ffd700', marginBottom: '8px' }}>1. Organizer Identity</h2>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.85)' }}>
            The <strong>Weekly BuyWise Try-On Challenge</strong> (&quot;Competition&quot;) is organized and administered by BuyWise AI Technologies Private Limited (&quot;BuyWise AI&quot;, &quot;We&quot;, &quot;Us&quot;).
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#ffd700', marginBottom: '8px' }}>2. Eligibility (Strictly 18+)</h2>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.85)' }}>
            The Competition is open only to natural persons who are legal residents of India and are <strong>18 years of age or older</strong> at the time of entry. Employees, contractors, or direct affiliates of BuyWise AI are ineligible to win official prizes.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#ffd700', marginBottom: '8px' }}>3. Free Participation &amp; No Purchase Necessary</h2>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.85)' }}>
            <strong>No purchase, fee, or financial payment is required to enter, participate, or vote in the Competition.</strong> Purchasing the featured merchant item from Amazon India, Myntra, Flipkart, or any retailer link does NOT increase your chances of winning.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#ffd700', marginBottom: '8px' }}>4. Competition Period &amp; Frozen Rules</h2>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.85)' }}>
            Each weekly competition cycle commences on <strong>Monday at 00:00 IST</strong> and closes voting on <strong>Saturday at 18:00 IST</strong>. Winners are verified and announced on <strong>Sunday</strong>. All rules, criteria, and prize structures are frozen upon weekly competition launch and will not be altered during an active cycle.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#ffd700', marginBottom: '8px' }}>5. Submission Consent &amp; 3-Tier Granular Permissions</h2>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.85)' }}>
            Submitting a Try-On image to the Competition requires explicit consent via three separate permission toggles:
          </p>
          <ul style={{ paddingLeft: '20px', fontSize: '14px', color: 'rgba(255,255,255,0.85)', display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
            <li><strong>Tier 1 (Mandatory for Entry):</strong> Consent to display your specific submitted Try-On image inside the BuyWise Competition Gallery for public voting.</li>
            <li><strong>Tier 2 (Mandatory for Winner Award):</strong> Consent to feature your submitted image in the in-app Winner Spotlight and Fashion Wall if declared a winner.</li>
            <li><strong>Tier 3 (Optional):</strong> Consent to allow BuyWise AI to feature your winning look on external social channels (YouTube, Instagram, X) or promotional banners. You may opt out of Tier 3 without affecting competition eligibility.</li>
          </ul>
        </section>

        <section>
          <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#ffd700', marginBottom: '8px' }}>6. One-User-One-Vote Rule &amp; Anti-Fraud Audit</h2>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.85)' }}>
            Voting is strictly limited to <strong>one vote per registered user account per weekly competition</strong>. BuyWise AI enforces automated rate-limiting, device fingerprinting, and audit logging to detect automated scripts, paid vote manipulation, or duplicate accounts. Votes identified as fraudulent will be invalidated prior to winner calculation.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#ffd700', marginBottom: '8px' }}>7. Winner Determination &amp; Tie-Breaker</h2>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.85)' }}>
            The winner is determined by the participant receiving the <strong>highest number of verified valid votes</strong> at competition close. In the event of a tie in valid vote counts, the entry submitted earlier in the competition cycle will be declared the winner.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#ffd700', marginBottom: '8px' }}>8. Prize Fulfillment &amp; Tax Obligations</h2>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.85)' }}>
            Weekly prizes (e.g. ₹5,000 Shopping Vouchers) will be delivered electronically via registered email or SMS within 7 days of winner verification. Any applicable statutory taxes or duties are the sole responsibility of the winner.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#ffd700', marginBottom: '8px' }}>9. Non-Sponsorship &amp; Affiliate Disclosure</h2>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.85)' }}>
            Featured items in the Competition are selected from public e-commerce catalogs (Amazon India, Flipkart, Myntra, Meesho). <strong>The inclusion of a product does NOT imply sponsorship, endorsement, or direct partnership with third-party brand owners unless explicitly declared.</strong> BuyWise AI operates as an independent price comparison platform and may earn affiliate commissions from qualifying purchases.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#ffd700', marginBottom: '8px' }}>10. Governing Law &amp; Jurisdiction</h2>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.85)' }}>
            These Terms &amp; Conditions are governed by and construed in accordance with the laws of the Republic of India, including the Consumer Protection Act, 2019. Any disputes arising out of or in connection with the Competition shall be subject to the exclusive jurisdiction of the competent courts in New Delhi, India.
          </p>
        </section>
      </div>

      {/* Footer Return CTA */}
      <div style={{ textAlign: 'center', marginTop: '40px' }}>
        <Link href="/competition" style={{ textDecoration: 'none' }}>
          <button
            style={{
              padding: '14px 28px',
              borderRadius: '24px',
              background: 'linear-gradient(135deg, #ffd700, #ff8c00)',
              color: '#000000',
              fontWeight: 900,
              fontSize: '14px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(255, 215, 0, 0.4)',
            }}
          >
            🏆 Return to Weekly Competition Gallery ➔
          </button>
        </Link>
      </div>
    </main>
  );
}

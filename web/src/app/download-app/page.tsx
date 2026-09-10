"use client";
import Link from "next/link";

export default function DownloadAppPage() {
  return (
    <main style={{ minHeight: "85vh", padding: "60px 20px" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        
        {/* Header Badge */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 20px", background: "rgba(0, 255, 136, 0.15)", border: "1px solid rgba(0, 255, 136, 0.4)", borderRadius: "30px", marginBottom: "16px" }}>
            <span style={{ color: "#00ff88", fontWeight: 900, fontSize: "14px", letterSpacing: "0.05em" }}>📱 OFFICIAL NATIVE KOTLIN APP</span>
          </div>
          <h1 style={{ fontSize: "44px", fontWeight: 900, color: "#ffffff", marginBottom: "16px", lineHeight: 1.2 }}>
            Get <span style={{ background: "linear-gradient(135deg, #00ff88, #38bdf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>BuyWise AI</span> for Android
          </h1>
          <p style={{ fontSize: "16px", color: "#cbd5e1", maxWidth: "600px", margin: "0 auto", lineHeight: 1.6 }}>
            Experience 10x faster AI price comparison, live deal tracking, verified coupons, and local AI Virtual Try-On built directly into Native Android Jetpack Compose.
          </p>
        </div>

        {/* Main Card */}
        <div style={{ background: "rgba(14, 10, 26, 0.96)", border: "1px solid rgba(255, 255, 255, 0.2)", borderRadius: "30px", padding: "40px", boxShadow: "0 20px 50px rgba(0, 0, 0, 0.85)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "30px", alignItems: "center" }}>
            
            <div>
              <h2 style={{ fontSize: "24px", fontWeight: 900, color: "#ffffff", marginBottom: "20px" }}>
                Why Download the Native App?
              </h2>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "16px" }}>
                <li style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                  <span style={{ fontSize: "20px", background: "rgba(0, 255, 136, 0.2)", padding: "6px 10px", borderRadius: "12px", color: "#00ff88" }}>⚡</span>
                  <div>
                    <strong style={{ color: "#ffffff", fontSize: "15px" }}>10x Faster Live Price Scraping</strong>
                    <p style={{ color: "#cbd5e1", fontSize: "13px", margin: "4px 0 0 0" }}>Native Android networking queries Amazon, Flipkart, Croma &amp; Meesho instantly.</p>
                  </div>
                </li>

                <li style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                  <span style={{ fontSize: "20px", background: "rgba(255, 0, 127, 0.2)", padding: "6px 10px", borderRadius: "12px", color: "#ff007f" }}>✨</span>
                  <div>
                    <strong style={{ color: "#ffffff", fontSize: "15px" }}>On-Device AR Virtual Try-On</strong>
                    <p style={{ color: "#cbd5e1", fontSize: "13px", margin: "4px 0 0 0" }}>Try clothes and footwear on your selfie with local encryption under DPDP 2025.</p>
                  </div>
                </li>

                <li style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                  <span style={{ fontSize: "20px", background: "rgba(56, 189, 248, 0.2)", padding: "6px 10px", borderRadius: "12px", color: "#38bdf8" }}>🔔</span>
                  <div>
                    <strong style={{ color: "#ffffff", fontSize: "15px" }}>Instant Price Drop Push Alerts</strong>
                    <p style={{ color: "#cbd5e1", fontSize: "13px", margin: "4px 0 0 0" }}>Get real-time push notifications when prices drop below your desired threshold.</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Action Box */}
            <div style={{ background: "linear-gradient(135deg, rgba(0, 255, 136, 0.08), rgba(168, 85, 247, 0.08))", border: "1px solid rgba(0, 255, 136, 0.3)", borderRadius: "24px", padding: "30px", textAlign: "center" }}>
              <div style={{ fontSize: "48px", marginBottom: "12px" }}>📱</div>
              <h3 style={{ fontSize: "20px", fontWeight: 900, color: "#ffffff", marginBottom: "8px" }}>BuyWise AI Android App</h3>
              <p style={{ fontSize: "13px", color: "#cbd5e1", marginBottom: "24px" }}>Version 1.0.0 (Native Kotlin Build) • Free Download</p>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <a 
                  href="https://buywiseai.pajonline.co.in"
                  style={{ textDecoration: "none" }}
                >
                  <button style={{ width: "100%", padding: "14px 24px", borderRadius: "14px", background: "linear-gradient(135deg, #00ff88, #00b8ff)", color: "#000000", fontWeight: 900, fontSize: "14px", border: "none", cursor: "pointer", boxShadow: "0 4px 20px rgba(0, 255, 136, 0.4)", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                    <span>⚡</span> Install directly via Connected Android Device
                  </button>
                </a>

                <Link href="/profile" style={{ textDecoration: "none" }}>
                  <button style={{ width: "100%", padding: "12px 24px", borderRadius: "14px", background: "rgba(255, 255, 255, 0.08)", color: "#ffffff", fontWeight: 800, fontSize: "13px", border: "1px solid rgba(255, 255, 255, 0.2)", cursor: "pointer" }}>
                    🌐 Open Web Shopping Center
                  </button>
                </Link>
              </div>

              <div style={{ marginTop: "20px", fontSize: "11px", color: "#94a3b8" }}>
                Complying with Digital Personal Data Protection (DPDP) Act 2023. Zero bloatware or background battery drain.
              </div>
            </div>

          </div>
        </div>

      </div>
    </main>
  );
}

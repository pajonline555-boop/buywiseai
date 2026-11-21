import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "AI Virtual Trial Room | BuyWise AI",
  description: "BuyWise AI Shopping & Price Intelligence.",
};

export default function TryOnPage() {
  return (
    <main style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
      <div
        style={{
          maxWidth: "540px",
          width: "100%",
          padding: "36px 28px",
          background: "linear-gradient(135deg, rgba(26, 20, 50, 0.95), rgba(12, 10, 25, 0.98))",
          borderRadius: "24px",
          border: "1.5px solid rgba(255, 215, 0, 0.35)",
          textAlign: "center",
          boxShadow: "0 20px 60px rgba(0,0,0,0.7)"
        }}
      >
        <div style={{ fontSize: "56px", marginBottom: "16px" }}>⚙️👗</div>
        <h1 style={{ fontSize: "24px", fontWeight: 900, color: "#ffd700", marginBottom: "12px" }}>
          AI Trial Room Temporarily Paused
        </h1>
        <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.75)", lineHeight: 1.6, marginBottom: "28px" }}>
          The Virtual Try-On feature is currently stopped while we upgrade our multi-retailer product discovery and price intelligence engines. Explore our live price comparisons across 14+ stores!
        </p>

        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <button
              style={{
                padding: "12px 24px",
                borderRadius: "14px",
                background: "linear-gradient(135deg, #00d4ff, #00ff88)",
                color: "#070510",
                fontWeight: 900,
                fontSize: "14px",
                border: "none",
                cursor: "pointer"
              }}
            >
              🏠 Go to Home
            </button>
          </Link>
          <Link href="/partners" style={{ textDecoration: "none" }}>
            <button
              style={{
                padding: "12px 24px",
                borderRadius: "14px",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "#ffffff",
                fontWeight: 800,
                fontSize: "14px",
                cursor: "pointer"
              }}
            >
              🛍️ BuyWise Store
            </button>
          </Link>
        </div>
      </div>
    </main>
  );
}

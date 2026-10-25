"use client";

import React, { useEffect } from "react";
import Link from "next/link";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin Control Center error caught:", error);
  }, [error]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#070512",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
        color: "#ffffff",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "520px",
          width: "100%",
          padding: "36px 28px",
          borderRadius: "24px",
          background: "rgba(18, 14, 36, 0.96)",
          border: "1.5px solid rgba(168, 85, 247, 0.4)",
          textAlign: "center",
          boxShadow: "0 25px 60px rgba(0,0,0,0.8), 0 0 40px rgba(168, 85, 247, 0.2)",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            margin: "0 auto 20px auto",
            borderRadius: "20px",
            background: "linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(0, 255, 136, 0.2))",
            border: "1px solid #a855f7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "32px",
            boxShadow: "0 0 25px rgba(168, 85, 247, 0.35)",
          }}
        >
          👑
        </div>

        <h2 style={{ fontSize: "22px", fontWeight: 900, marginBottom: "10px", color: "#ffffff", letterSpacing: "-0.02em" }}>
          Admin Workspace Active
        </h2>

        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "13.5px", marginBottom: "26px", lineHeight: 1.6 }}>
          A momentary sync hiccup was handled. Tap below to refresh your control panel.
        </p>

        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => {
              reset();
              window.location.reload();
            }}
            style={{
              padding: "12px 26px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #a855f7, #ff007f)",
              border: "none",
              color: "white",
              fontWeight: 800,
              cursor: "pointer",
              fontSize: "13.5px",
              boxShadow: "0 8px 25px rgba(255, 0, 127, 0.35)",
            }}
          >
            🔄 Reload Admin
          </button>

          <Link
            href="/"
            style={{
              padding: "12px 24px",
              borderRadius: "14px",
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "white",
              fontWeight: 800,
              textDecoration: "none",
              fontSize: "13.5px",
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            BuyWise Home ➔
          </Link>
        </div>
      </div>
    </main>
  );
}

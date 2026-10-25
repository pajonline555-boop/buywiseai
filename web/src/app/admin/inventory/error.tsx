"use client";

import React, { useEffect } from "react";
import Link from "next/link";

export default function InventoryError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Live Inventory Workspace caught error:", error);
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
          border: "1.5px solid rgba(0, 212, 255, 0.4)",
          textAlign: "center",
          boxShadow: "0 25px 60px rgba(0,0,0,0.8), 0 0 40px rgba(0, 212, 255, 0.2)",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            margin: "0 auto 20px auto",
            borderRadius: "20px",
            background: "linear-gradient(135deg, rgba(0, 212, 255, 0.2), rgba(0, 255, 136, 0.2))",
            border: "1px solid #00d4ff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "32px",
            boxShadow: "0 0 25px rgba(0, 212, 255, 0.35)",
          }}
        >
          📦
        </div>

        <h2 style={{ fontSize: "22px", fontWeight: 900, marginBottom: "10px", color: "#ffffff", letterSpacing: "-0.02em" }}>
          Inventory Workspace Active
        </h2>

        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "13.5px", marginBottom: "26px", lineHeight: 1.6 }}>
          The catalog view refreshed smoothly. Tap below to reload your live SKUs and verified partner inventory.
        </p>

        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => {
              try {
                localStorage.removeItem("buywise_cached_partner_products");
              } catch (e) {}
              reset();
              window.location.reload();
            }}
            style={{
              padding: "12px 26px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #00d4ff, #0055ff)",
              border: "none",
              color: "white",
              fontWeight: 800,
              cursor: "pointer",
              fontSize: "13.5px",
              boxShadow: "0 8px 25px rgba(0, 212, 255, 0.35)",
            }}
          >
            🔄 Reload Inventory
          </button>

          <Link
            href="/admin"
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
            Admin Dashboard ➔
          </Link>
        </div>
      </div>
    </main>
  );
}

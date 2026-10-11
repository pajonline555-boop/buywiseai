"use client";
import { useState, useEffect } from "react";
import Image from "next/image";

export default function WebSplashScreen() {
  const [showSplash, setShowSplash] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Show Web Splash Screen for 1.6 seconds, then fade out smoothly
    const timer1 = setTimeout(() => {
      setFadeOut(true);
    }, 1600);

    const timer2 = setTimeout(() => {
      setShowSplash(false);
    }, 2000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  if (!showSplash) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999999,
        background: "radial-gradient(circle at 50% 50%, rgba(20, 16, 38, 0.98), #080612)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity: fadeOut ? 0 : 1,
        transition: "opacity 0.4s ease-out",
        pointerEvents: fadeOut ? "none" : "auto",
      }}
    >
      <div style={{ textAlign: "center", padding: "20px" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 16px",
            background: "rgba(0, 255, 136, 0.16)",
            border: "1px solid rgba(0, 255, 136, 0.4)",
            borderRadius: "20px",
            marginBottom: "24px",
          }}
        >
          <span style={{ color: "#00ff88", fontWeight: 900, fontSize: "12px", letterSpacing: "0.08em" }}>
            ⚡ 14 STORES • AI PRICE COMPARISON & VIRTUAL TRY-ON
          </span>
        </div>

        {/* Glowing Logo Badge */}
        <div
          style={{
            position: "relative",
            width: "80px",
            height: "80px",
            margin: "0 auto 20px auto",
            borderRadius: "24px",
            background: "linear-gradient(135deg, rgba(255, 0, 127, 0.3), rgba(168, 85, 247, 0.3))",
            border: "2px solid #00ff88",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 40px rgba(0, 255, 136, 0.5), inset 0 0 20px rgba(168, 85, 247, 0.3)",
          }}
        >
          <Image src="/logo-icon.png" alt="BuyWise AI Logo" width={52} height={52} unoptimized />
        </div>

        <h1 style={{ fontSize: "36px", fontWeight: 900, color: "#ffffff", marginBottom: "8px" }}>
          BuyWise <span style={{ color: "#00ff88" }}>AI</span>
        </h1>

        <p style={{ fontSize: "16px", color: "#cbd5e1", fontWeight: 700, marginBottom: "30px" }}>
          Shop Smarter. Buy Better.
        </p>

        {/* Pulse Loading Indicator */}
        <div
          style={{
            width: "160px",
            height: "4px",
            background: "rgba(255, 255, 255, 0.15)",
            borderRadius: "4px",
            margin: "0 auto",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              bottom: 0,
              width: "60%",
              background: "linear-gradient(90deg, #00ff88, #00d4ff)",
              borderRadius: "4px",
              animation: "splashPulse 1.2s infinite ease-in-out alternate",
            }}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes splashPulse {
          0% {
            left: 0%;
            width: 30%;
          }
          100% {
            left: 70%;
            width: 30%;
          }
        }
      `}</style>
    </div>
  );
}

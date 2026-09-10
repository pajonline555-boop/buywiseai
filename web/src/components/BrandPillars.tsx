"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/i18nContext";

export default function BrandPillars() {
  const { t } = useTranslation();

  return (
    <section className="container" style={{ marginTop: "40px", marginBottom: "50px" }}>
      {/* Brand Identity Banner Container */}
      <div
        className="glass"
        style={{
          borderRadius: "32px",
          padding: "36px",
          background: "linear-gradient(135deg, rgba(16, 12, 34, 0.95), rgba(8, 6, 20, 0.95))",
          border: "1px solid rgba(138, 43, 226, 0.35)",
          boxShadow: "0 20px 60px rgba(121, 40, 202, 0.15)",
          position: "relative",
          overflow: "hidden"
        }}
      >
        {/* Ambient Glows */}
        <div
          style={{
            position: "absolute",
            top: "-20%",
            left: "-10%",
            width: "300px",
            height: "300px",
            background: "radial-gradient(circle, rgba(255, 0, 128, 0.2), transparent 70%)",
            pointerEvents: "none"
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-20%",
            right: "-10%",
            width: "300px",
            height: "300px",
            background: "radial-gradient(circle, rgba(0, 255, 136, 0.15), transparent 70%)",
            pointerEvents: "none"
          }}
        />

        {/* Section Header with Logo & 5-Step Slogan Showcase */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "24px",
            marginBottom: "36px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            paddingBottom: "24px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            <div
              style={{
                width: "72px",
                height: "72px",
                flexShrink: 0,
                filter: "drop-shadow(0 8px 24px rgba(255, 0, 128, 0.4))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <img
                src="/logo-icon.png"
                alt="BuyWise AI Official Logo"
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
                <h2 style={{ fontSize: "36px", fontWeight: 900, letterSpacing: "-0.02em", color: "white", margin: 0 }}>
                  BuyWise
                </h2>
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: 900,
                    padding: "3px 10px",
                    borderRadius: "10px",
                    background: "var(--gradient-accent)",
                    color: "white",
                    letterSpacing: "0.05em"
                  }}
                >
                  AI
                </span>
              </div>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "4px", margin: 0, fontWeight: 700 }}>
                {t('see_compare_try_save_buy')}
              </p>
            </div>
          </div>

          {/* Quick Action Badges */}
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "12px", fontWeight: 800, padding: "8px 14px", borderRadius: "16px", background: "rgba(0, 212, 255, 0.12)", color: "#00d4ff", border: "1px solid rgba(0, 212, 255, 0.3)" }}>
              {t('pillar_see')}
            </span>
            <span style={{ fontSize: "12px", fontWeight: 800, padding: "8px 14px", borderRadius: "16px", background: "rgba(121, 40, 202, 0.15)", color: "#a855f7", border: "1px solid rgba(121, 40, 202, 0.3)" }}>
              {t('pillar_compare')}
            </span>
            <span style={{ fontSize: "12px", fontWeight: 800, padding: "8px 14px", borderRadius: "16px", background: "rgba(255, 0, 128, 0.12)", color: "#ff007f", border: "1px solid rgba(255, 0, 128, 0.3)" }}>
              {t('pillar_try_on')}
            </span>
            <span style={{ fontSize: "12px", fontWeight: 800, padding: "8px 14px", borderRadius: "16px", background: "rgba(0, 255, 136, 0.12)", color: "#00ff88", border: "1px solid rgba(0, 255, 136, 0.3)" }}>
              {t('pillar_save')}
            </span>
            <span style={{ fontSize: "12px", fontWeight: 800, padding: "8px 14px", borderRadius: "16px", background: "linear-gradient(90deg, #00ff88, #00d4ff)", color: "#080612" }}>
              {t('pillar_buy')}
            </span>
          </div>
        </div>

        {/* 3 Core Pillars Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
          
          {/* Pillar 1: COMPARE IT */}
          <div
            className="glass-card"
            style={{
              padding: "28px",
              borderRadius: "24px",
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(0, 212, 255, 0.25)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between"
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <div style={{ width: "50px", height: "50px", borderRadius: "16px", background: "rgba(0, 212, 255, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", border: "1px solid rgba(0, 212, 255, 0.4)" }}>
                  ⚖️
                </div>
                <span style={{ fontSize: "11px", fontWeight: 900, padding: "4px 10px", borderRadius: "10px", background: "rgba(0, 212, 255, 0.2)", color: "#00d4ff", letterSpacing: "0.05em" }}>
                  {t('compare_it')}
                </span>
              </div>

              <h3 style={{ fontSize: "22px", fontWeight: 900, color: "white", marginBottom: "8px" }}>
                {t('multi_store_engine')}
              </h3>

              <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "20px" }}>
                {t('multi_store_desc')}
              </p>
            </div>

            <Link href="/categories" style={{ textDecoration: "none" }}>
              <button
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "14px",
                  border: "1px solid rgba(0, 212, 255, 0.4)",
                  background: "rgba(0, 212, 255, 0.1)",
                  color: "#00d4ff",
                  fontWeight: 800,
                  fontSize: "13px",
                  cursor: "pointer"
                }}
              >
                {t('compare_stores_now')}
              </button>
            </Link>
          </div>

          {/* Pillar 2: TRY IT */}
          <div
            className="glass-card"
            style={{
              padding: "28px",
              borderRadius: "24px",
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 0, 128, 0.25)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between"
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <div style={{ width: "50px", height: "50px", borderRadius: "16px", background: "rgba(255, 0, 128, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", border: "1px solid rgba(255, 0, 128, 0.4)" }}>
                  👗✨
                </div>
                <span style={{ fontSize: "11px", fontWeight: 900, padding: "4px 10px", borderRadius: "10px", background: "rgba(255, 0, 128, 0.2)", color: "#ff007f", letterSpacing: "0.05em" }}>
                  {t('try_it_on')}
                </span>
              </div>

              <h3 style={{ fontSize: "22px", fontWeight: 900, color: "white", marginBottom: "8px" }}>
                {t('ai_virtual_trial_room')}
              </h3>

              <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "20px" }}>
                {t('virtual_trial_desc')}
              </p>
            </div>

            <Link href="/try-on" style={{ textDecoration: "none" }}>
              <button
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "14px",
                  border: "1px solid rgba(255, 0, 128, 0.4)",
                  background: "linear-gradient(135deg, rgba(255, 0, 128, 0.2), rgba(121, 40, 202, 0.2))",
                  color: "#ff0080",
                  fontWeight: 800,
                  fontSize: "13px",
                  cursor: "pointer"
                }}
              >
                {t('open_ai_trial_room')}
              </button>
            </Link>
          </div>

          {/* Pillar 3: BUY IT WISELY */}
          <div
            className="glass-card"
            style={{
              padding: "28px",
              borderRadius: "24px",
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(0, 255, 136, 0.25)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between"
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <div style={{ width: "50px", height: "50px", borderRadius: "16px", background: "rgba(0, 255, 136, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", border: "1px solid rgba(0, 255, 136, 0.4)" }}>
                  🎟️💰
                </div>
                <span style={{ fontSize: "11px", fontWeight: 900, padding: "4px 10px", borderRadius: "10px", background: "rgba(0, 255, 136, 0.2)", color: "#00ff88", letterSpacing: "0.05em" }}>
                  {t('save_and_buy')}
                </span>
              </div>

              <h3 style={{ fontSize: "22px", fontWeight: 900, color: "white", marginBottom: "8px" }}>
                {t('real_effective_price')}
              </h3>

              <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "20px" }}>
                {t('real_effective_desc')}
              </p>
            </div>

            <Link href="/coupons" style={{ textDecoration: "none" }}>
              <button
                className="btn-primary"
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "14px",
                  fontWeight: 900,
                  fontSize: "13px",
                  background: "linear-gradient(90deg, #00ff88, #00d4ff)",
                  color: "#070510"
                }}
              >
                {t('find_verified_coupons')}
              </button>
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
}

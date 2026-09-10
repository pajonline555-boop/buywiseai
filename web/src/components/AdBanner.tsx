"use client";
import React from "react";
import Image from "next/image";
import { AdPlacementId, getActiveAdForPlacement } from "@/lib/ads/adService";
import { SubscriptionPlanId } from "@/lib/subscriptions/subscriptionTypes";

interface AdBannerProps {
  placement: AdPlacementId;
  userPlan?: SubscriptionPlanId;
}

export default function AdBanner({ placement, userPlan = "FREE" }: AdBannerProps) {
  const ad = getActiveAdForPlacement(placement, userPlan);

  if (!ad) return null;

  return (
    <div
      className="glass"
      style={{
        width: "100%",
        padding: "16px 24px",
        borderRadius: "20px",
        background: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(0, 212, 255, 0.25)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        margin: "16px 0",
        gap: "16px",
        flexWrap: "wrap"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1 }}>
        <span
          style={{
            fontSize: "10px",
            fontWeight: 800,
            padding: "2px 8px",
            borderRadius: "6px",
            background: "rgba(255, 255, 255, 0.1)",
            color: "var(--text-secondary)",
            letterSpacing: "0.5px"
          }}
        >
          SPONSORED
        </span>

        <div>
          <h4 style={{ fontSize: "15px", fontWeight: 800, color: "white", margin: 0 }}>
            {ad.headline}
          </h4>
          <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "4px 0 0 0" }}>
            {ad.description}
          </p>
        </div>
      </div>

      <a
        href={ad.destinationUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{ textDecoration: "none" }}
      >
        <button
          style={{
            padding: "8px 16px",
            borderRadius: "12px",
            background: "linear-gradient(90deg, #00ff88, #00d4ff)",
            border: "none",
            color: "#080612",
            fontWeight: 800,
            fontSize: "12px",
            cursor: "pointer",
            whiteSpace: "nowrap"
          }}
        >
          {ad.ctaText}
        </button>
      </a>
    </div>
  );
}

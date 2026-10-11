"use client";

import React, { useState, useEffect } from "react";
import { getProxiedImageUrl } from "@/lib/imageUtils";

interface SafeProductImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  width?: number;
  height?: number;
  objectFit?: "cover" | "contain" | "fill" | "none";
  aspectRatio?: string;
  fallbackSrc?: string;
}

function getSmartImageByAlt(altText: string): string {
  const lower = (altText || "").toLowerCase();
  if (lower.includes("kamarbandh") || lower.includes("gujarati") || lower.includes("etietnic") || lower.includes("waistband") || lower.includes("tagdi")) {
    return "/kamarbandh.png";
  }
  if (lower.includes("panty") || lower.includes("panties") || lower.includes("louis")) {
    return "https://m.media-amazon.com/images/I/41DSHIr6S6L._AC_SL800_.jpg";
  }
  if (lower.includes("bra") || lower.includes("zivame")) {
    return "https://m.media-amazon.com/images/I/714AcwEJC0L._AC_SL800_.jpg";
  }
  if (lower.includes("trunk") || lower.includes("boxer") || lower.includes("jockey")) {
    return "https://m.media-amazon.com/images/I/61W8YLsLmSL._AC_SL800_.jpg";
  }
  if (lower.includes("jewel") || lower.includes("necklace") || lower.includes("earring") || lower.includes("ring")) {
    return "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80";
  }
  if (lower.includes("phone") || lower.includes("iphone") || lower.includes("samsung")) {
    return "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80";
  }
  if (lower.includes("headphone") || lower.includes("earphone") || lower.includes("sony")) {
    return "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80";
  }
  return "";
}

export default function SafeProductImage({
  src,
  alt,
  className = "",
  style = {},
  width,
  height,
  objectFit = "cover",
  aspectRatio = "4/3",
  fallbackSrc,
}: SafeProductImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [attemptedFallback, setAttemptedFallback] = useState(false);

  let rawCleanSrc = src && typeof src === "string" ? src.trim() : "";
  const isBrokenAmazonPImage = rawCleanSrc.includes("/images/P/") || rawCleanSrc.includes("ssl-images-amazon.com/images/P");
  
  // Guard against stale earrings image on Kamarbandh / Gujarati belt
  const lowerAlt = (alt || "").toLowerCase();
  if (rawCleanSrc.includes("41-pc98WkyL") && (lowerAlt.includes("kamarbandh") || lowerAlt.includes("gujarati") || lowerAlt.includes("etietnic") || lowerAlt.includes("waistband"))) {
    rawCleanSrc = "/kamarbandh.png";
  }

  // If raw source is broken Amazon P link or empty, immediately use smart fallback
  const smartFallback = fallbackSrc || getSmartImageByAlt(alt);
  const effectiveSrc = (isBrokenAmazonPImage || !rawCleanSrc) ? (smartFallback || rawCleanSrc) : rawCleanSrc;
  const proxiedUrl = effectiveSrc ? getProxiedImageUrl(effectiveSrc) : "";

  useEffect(() => {
    setHasError(false);
    setIsLoading(true);
    setAttemptedFallback(false);
  }, [src]);

  const isUnavailable = (!effectiveSrc || hasError || !proxiedUrl) && !smartFallback;

  if (isUnavailable) {
    return (
      <div
        className={`safe-product-image-fallback ${className}`}
        style={{
          width: width ? `${width}px` : "100%",
          height: height ? `${height}px` : "100%",
          aspectRatio: height ? undefined : aspectRatio,
          background: "linear-gradient(135deg, rgba(20, 16, 35, 0.9), rgba(10, 8, 20, 0.95))",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "16px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
          textAlign: "center",
          color: "rgba(255, 255, 255, 0.45)",
          userSelect: "none",
          ...style,
        }}
      >
        <div style={{ fontSize: "24px", marginBottom: "6px", opacity: 0.6 }}>🛍️</div>
        <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.5px" }}>
          Verified Partner Offer
        </div>
      </div>
    );
  }

  const activeDisplayUrl = hasError && smartFallback && !attemptedFallback ? smartFallback : proxiedUrl;

  return (
    <div
      style={{
        position: "relative",
        width: width ? `${width}px` : "100%",
        height: height ? `${height}px` : "100%",
        aspectRatio: height ? undefined : aspectRatio,
        overflow: "hidden",
        borderRadius: "16px",
        background: "#080612",
        ...style,
      }}
      className={className}
    >
      {/* Loading Skeleton */}
      {isLoading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(90deg, rgba(255,255,255,0.03), rgba(255,255,255,0.08), rgba(255,255,255,0.03))",
            animation: "pulse 1.5s infinite",
            zIndex: 1,
          }}
        />
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={activeDisplayUrl}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={(e) => {
          const img = e.currentTarget;
          // Guard against 1x1 transparent GIFs returned by defective Amazon CDN links
          if (img.naturalWidth <= 10 && img.naturalHeight <= 10) {
            if (smartFallback && !attemptedFallback) {
              setAttemptedFallback(true);
              setHasError(true);
            } else {
              setHasError(true);
              setIsLoading(false);
            }
          } else {
            setIsLoading(false);
          }
        }}
        onError={() => {
          if (smartFallback && !attemptedFallback) {
            setAttemptedFallback(true);
            setHasError(true);
          } else {
            setIsLoading(false);
            setHasError(true);
          }
        }}
        style={{
          width: "100%",
          height: "100%",
          objectFit,
          display: "block",
          transition: "opacity 0.3s ease",
        }}
      />
    </div>
  );
}

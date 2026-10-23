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

  const rawCleanSrc = src && typeof src === "string" ? src.trim() : "";
  const isBrokenAmazonPImage = rawCleanSrc.includes("/images/P/") || rawCleanSrc.includes("ssl-images-amazon.com/images/P");
  
  // Guard against stale earrings image on Kamarbandh / Gujarati belt
  const lowerAlt = (alt || "").toLowerCase();
  let effectiveSrc = rawCleanSrc;

  if (rawCleanSrc.includes("41-pc98WkyL") && (lowerAlt.includes("kamarbandh") || lowerAlt.includes("gujarati") || lowerAlt.includes("etietnic") || lowerAlt.includes("waistband"))) {
    effectiveSrc = "/kamarbandh.png";
  }

  // Reject generic Nike stock photo if alt text is not a Nike shoe
  if (effectiveSrc.includes("photo-1542291026-7eec264c27ff") && !lowerAlt.includes("nike")) {
    effectiveSrc = "";
  }

  // Reject saree stock photo if alt is footwear
  if (effectiveSrc.includes("photo-1610030469983-98e550d6193c") && (lowerAlt.includes("shoe") || lowerAlt.includes("sneaker") || lowerAlt.includes("running"))) {
    effectiveSrc = "";
  }

  if (isBrokenAmazonPImage) {
    effectiveSrc = fallbackSrc || "";
  }

  const proxiedUrl = effectiveSrc ? getProxiedImageUrl(effectiveSrc) : "";

  useEffect(() => {
    setHasError(false);
    setIsLoading(Boolean(effectiveSrc));
  }, [src, effectiveSrc]);

  const isFootwear = lowerAlt.includes("shoe") || lowerAlt.includes("sneaker") || lowerAlt.includes("runner") || lowerAlt.includes("footwear") || lowerAlt.includes("lancer") || lowerAlt.includes("asian");
  const isTech = lowerAlt.includes("phone") || lowerAlt.includes("tv") || lowerAlt.includes("laptop") || lowerAlt.includes("macbook") || lowerAlt.includes("headphone");

  const isUnavailable = !effectiveSrc || hasError || !proxiedUrl;

  if (isUnavailable) {
    return (
      <div
        className={`safe-product-image-fallback ${className}`}
        style={{
          width: width ? `${width}px` : "100%",
          height: height ? `${height}px` : "100%",
          aspectRatio: height ? undefined : aspectRatio,
          background: "linear-gradient(135deg, rgba(20, 16, 35, 0.95), rgba(10, 8, 20, 0.98))",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "16px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
          textAlign: "center",
          color: "rgba(255, 255, 255, 0.5)",
          userSelect: "none",
          ...style,
        }}
      >
        <div style={{ fontSize: "28px", marginBottom: "6px", opacity: 0.8 }}>
          {isFootwear ? "👟" : isTech ? "📱" : "🛍️"}
        </div>
        <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.5px", color: "rgba(255, 255, 255, 0.7)" }}>
          {isFootwear ? "Sneaker Image Unavailable" : "Product Image Unavailable"}
        </div>
        <div style={{ fontSize: "9.5px", color: "rgba(255, 255, 255, 0.4)", marginTop: "2px" }}>
          Verified Direct Retailer Offer
        </div>
      </div>
    );
  }

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
        key={proxiedUrl}
        src={proxiedUrl}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={(e) => {
          const img = e.currentTarget;
          // Guard against 1x1 transparent GIFs returned by defective Amazon CDN links
          if (img.naturalWidth <= 10 && img.naturalHeight <= 10) {
            setHasError(true);
            setIsLoading(false);
          } else {
            setIsLoading(false);
          }
        }}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
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

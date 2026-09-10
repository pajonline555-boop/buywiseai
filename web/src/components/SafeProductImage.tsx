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
}: SafeProductImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const cleanSrc = src && typeof src === "string" ? src.trim() : "";
  const proxiedUrl = cleanSrc ? getProxiedImageUrl(cleanSrc) : "";

  useEffect(() => {
    setHasError(false);
    setIsLoading(true);
  }, [src]);

  const isUnavailable = !cleanSrc || hasError || !proxiedUrl;

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
        <div style={{ fontSize: "24px", marginBottom: "6px", opacity: 0.6 }}>🖼️</div>
        <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.5px" }}>
          Image Unavailable
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
        src={proxiedUrl}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setIsLoading(false)}
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

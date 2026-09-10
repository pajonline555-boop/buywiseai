"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { GarmentProduct } from "./GarmentCanvas";
import { useTranslation } from "@/lib/i18n/i18nContext";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  comparedProducts: GarmentProduct[];
  userPhotoUrl: string | null;
  onRemoveProduct: (id: string) => void;
}

function ComparedProductCard({ product, userPhotoUrl, onRemoveProduct }: { product: GarmentProduct; userPhotoUrl: string | null; onRemoveProduct: (id: string) => void }) {
  const [fittedUrl, setFittedUrl] = useState<string>(product.imageUrl);
  const { t } = useTranslation();

  useEffect(() => {
    if (!userPhotoUrl) return;

    fetch("/api/vto/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userPhoto: { url: userPhotoUrl },
        product
      })
    })
      .then(async (res) => {
        const data = await res.json();
        if (data?.success && data?.job?.resultImageUrl) {
          setFittedUrl(data.job.resultImageUrl);
        }
      })
      .catch(() => {});
  }, [userPhotoUrl, product]);

  return (
    <div className="glass" style={{ borderRadius: "20px", padding: "16px", border: "1px solid var(--glass-border)", background: "rgba(255,255,255,0.02)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <span style={{ fontSize: "11px", fontWeight: 800, color: "#00ff88" }}>{t(product.store)}</span>
          <button onClick={() => onRemoveProduct(product.id)} style={{ background: "none", border: "none", color: "#ff4d4d", cursor: "pointer", fontSize: "14px" }}>✕</button>
        </div>

        <div style={{ position: "relative", width: "100%", height: "240px", borderRadius: "16px", overflow: "hidden", background: "#05040a", marginBottom: "14px" }}>
          <Image src={fittedUrl} alt={product.title} fill unoptimized style={{ objectFit: "cover", objectPosition: "center top" }} />
          <span style={{ position: "absolute", bottom: "8px", left: "8px", background: "rgba(0,0,0,0.75)", color: "#00ff88", padding: "3px 8px", borderRadius: "8px", fontSize: "10px", fontWeight: 800 }}>
            {userPhotoUrl ? t("Identity Preserved Look") : t("Product Item")}
          </span>
        </div>

        <h4 style={{ fontSize: "14px", fontWeight: 800, color: "white", marginBottom: "8px", height: "38px", overflow: "hidden" }}>{t(product.title)}</h4>
        <div style={{ fontSize: "18px", fontWeight: 900, color: "#00ff88", marginBottom: "12px" }}>₹{product.price.toLocaleString('en-IN')}</div>
      </div>

      <Link href={product.productUrl || "#"} target="_blank" style={{ textDecoration: "none" }}>
        <button className="btn-primary" style={{ width: "100%", padding: "10px", fontSize: "12px", fontWeight: 800 }}>
          {t("BUY ON")} {product.store.toUpperCase()} ↗
        </button>
      </Link>
    </div>
  );
}

export default function LookComparisonGrid({ isOpen, onClose, comparedProducts, userPhotoUrl, onRemoveProduct }: Props) {
  const { t } = useTranslation();
  if (!isOpen) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)", display: "flex", justifyContent: "center", alignItems: "center", padding: "24px" }}>
      <div className="glass" style={{ width: "100%", maxWidth: "1100px", maxHeight: "90vh", borderRadius: "28px", border: "1px solid var(--glass-border)", padding: "28px", overflowY: "auto", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h2 style={{ fontSize: "22px", fontWeight: 900, color: "white", marginBottom: "4px" }}>📊 {t("Fit Comparison Grid")}</h2>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{t("Compare your virtual try-on looks side-by-side across multiple retailers.")}</p>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "white", borderRadius: "50%", width: "36px", height: "36px", cursor: "pointer", fontSize: "16px", fontWeight: 800 }}>✕</button>
        </div>

        {comparedProducts.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center", color: "var(--text-secondary)" }}>
            <p style={{ fontSize: "15px" }}>{t("No looks added to comparison grid yet.")}</p>
            <p style={{ fontSize: "12px", marginTop: "6px" }}>{t('Click "+ COMPARE LOOK" on any product canvas to add it here.')}</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "20px" }}>
            {comparedProducts.map((product) => (
              <ComparedProductCard key={product.id} product={product} userPhotoUrl={userPhotoUrl} onRemoveProduct={onRemoveProduct} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

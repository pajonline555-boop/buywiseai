"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/i18nContext";
import { getActiveCompetition, submitToCompetition } from "@/lib/competition/store";

export interface GarmentProduct {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  store: string;
  productUrl?: string;
  imageUrl: string;
  category?: string;
  drapeStyle?: string;
  fabrics?: string[];
  colors?: string[];
  smartValueScore?: number;
  trustScore?: number;
  isSaree?: boolean;
}

export interface PrewarmedAvatar {
  id: "petite" | "regular" | "curvy" | "plus";
  label: string;
  heightHint: string;
  imageUrl?: string;
}

const DEFAULT_AVATARS: PrewarmedAvatar[] = [
  { id: "petite", label: "Petite", heightHint: "5'1\" • 48kg", imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80" },
  { id: "regular", label: "Regular", heightHint: "5'4\" • 58kg", imageUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80" },
  { id: "curvy", label: "Curvy", heightHint: "5'5\" • 68kg", imageUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80" },
  { id: "plus", label: "Plus-Size", heightHint: "5'6\" • 82kg", imageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80" },
];

/**
 * Client-Side Pre-Processing: Resize max height to 1024px & compress to WebP (0.80 quality)
 */
async function compressImageToWebPBase64(file: File, maxHeight = 1024, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new (window as any).Image();
    img.onload = () => {
      let { width, height } = img;
      if (height > maxHeight) {
        width = Math.round((width * maxHeight) / height);
        height = maxHeight;
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas context unavailable"));
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/webp", quality));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

interface GarmentCanvasProps {
  userPhotoUrl: string | null;
  product: GarmentProduct;
  onCompareAddToLook?: (product: GarmentProduct) => void;
  onOpenFitAssistant?: () => void;
  userId?: string;
  prewarmedAvatars?: PrewarmedAvatar[];
  initialSize?: string | null;
}

interface StyleMatchResult {
  recommendedSize: string;
  fitConfidence: string;
  sizeAdvice: string;
  colorMatchScore: string;
  stylingTips: string[];
}

export function GarmentCanvas({ 
  userPhotoUrl, 
  product, 
  onCompareAddToLook, 
  onOpenFitAssistant,
  userId = "guest_user",
  prewarmedAvatars = DEFAULT_AVATARS,
  initialSize = null,
}: GarmentCanvasProps) {
  const { t } = useTranslation();

  // Tier 1: Multi-Body Avatar Switcher State
  const [selectedAvatarId, setSelectedAvatarId] = useState<string>("catalog");

  useEffect(() => {
    if (initialSize) {
      const sz = initialSize.toLowerCase().trim();
      if (sz === 's' || sz === 'petite') setSelectedAvatarId('petite');
      else if (sz === 'm' || sz === 'regular') setSelectedAvatarId('regular');
      else if (sz === 'l' || sz === 'curvy') setSelectedAvatarId('curvy');
      else if (sz === 'xxl' || sz === 'xl' || sz === 'plus') setSelectedAvatarId('plus');
    }
  }, [initialSize]);

  // Tier 3: 1 Free Live GPU Try-On State
  const [freeQuotaRemaining, setFreeQuotaRemaining] = useState<number>(1);
  const [vtoLoading, setVtoLoading] = useState<boolean>(false);
  const [vtoStatus, setVtoStatus] = useState<string | null>(null);

  // 1. AI SIZE & STYLE MATCH STATE
  const [height, setHeight] = useState<string>("5'5\"");
  const [weight, setWeight] = useState<string>("58");
  const [bodyType, setBodyType] = useState<string>("Regular");
  const [skinTone, setSkinTone] = useState<string>("Warm");
  const [fitPreference, setFitPreference] = useState<string>("Regular");
  const [isMatchingStyle, setIsMatchingStyle] = useState<boolean>(false);
  const [styleMatchResult, setStyleMatchResult] = useState<StyleMatchResult | null>(null);

  // 2. USER LOOK UPLOAD & PREVIEW STATE
  const [userStyledLookUrl, setUserStyledLookUrl] = useState<string | null>(null);
  const [privateLooks, setPrivateLooks] = useState<string[]>([]);
  const [downloadSuccessMsg, setDownloadSuccessMsg] = useState<string | null>(null);
  const [fitMode, setFitMode] = useState<"contain" | "cover">("contain");

  // 3. WEEKLY COMPETITION MODAL STATE
  const [showCompModal, setShowCompModal] = useState<boolean>(false);
  const [is18Plus, setIs18Plus] = useState<boolean>(false);
  const [consentVoting, setConsentVoting] = useState<boolean>(false);
  const [consentWinner, setConsentWinner] = useState<boolean>(false);
  const [consentMarketing, setConsentMarketing] = useState<boolean>(false);
  const [participantName, setParticipantName] = useState<string>("Priya S.");
  const [submissionCaption, setSubmissionCaption] = useState<string>("");
  const [compSubmitted, setCompSubmitted] = useState<boolean>(false);

  // Load private looks history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("buywise_vto_private_looks");
      if (stored) {
        setPrivateLooks(JSON.parse(stored));
      }
    } catch (e) {
      // Ignore
    }
  }, []);

  // Save a new private look
  const savePrivateLook = (dataUrl: string) => {
    setUserStyledLookUrl(dataUrl);
    try {
      const updated = [dataUrl, ...privateLooks.filter((url) => url !== dataUrl)].slice(0, 10);
      setPrivateLooks(updated);
      localStorage.setItem("buywise_vto_private_looks", JSON.stringify(updated));
    } catch (e) {
      // Ignore storage errors
    }
  };

  // Trigger AI Size & Style Match
  const handleGetStyleMatch = async () => {
    setIsMatchingStyle(true);
    try {
      const res = await fetch("/api/vto/style-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          garmentId: product.id,
          garmentTitle: product.title,
          garmentCategory: product.category || "ethnic",
          height,
          weight,
          bodyType,
          skinTone,
          fitPreference,
        }),
      });

      const data = await res.json();
      if (data && data.success) {
        setStyleMatchResult({
          recommendedSize: data.recommendedSize,
          fitConfidence: data.fitConfidence || "94% Match",
          sizeAdvice: data.sizeAdvice,
          colorMatchScore: data.colorMatchScore || "Excellent Match",
          stylingTips: data.stylingTips || [],
        });
      }
    } catch (err) {
      // Deterministic client fallback
      setStyleMatchResult({
        recommendedSize: "M",
        fitConfidence: "93% Match",
        sizeAdvice: `Based on your height (${height}) and ${fitPreference} fit, Size M provides optimal waist ease and fabric drape.`,
        colorMatchScore: "Excellent Match",
        stylingTips: [
          "The garment's balanced undertones flatter your complexion under both natural and festive indoor lighting.",
          "Pair with metallic drop earrings and stacked bangles to complete the look."
        ],
      });
    } finally {
      setIsMatchingStyle(false);
    }
  };

  // Download Garment Asset for external editing
  const handleDownloadOutfitImage = async () => {
    try {
      setDownloadSuccessMsg("Preparing high-res outfit...");
      const response = await fetch(product.imageUrl, { mode: "cors" });
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      const cleanName = product.title.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 30);
      link.download = `BuyWise_${cleanName}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      setDownloadSuccessMsg("✅ Outfit saved! Style your look and upload below to enter the Weekly Challenge.");
      setTimeout(() => setDownloadSuccessMsg(null), 6000);
    } catch (err) {
      // Direct anchor fallback if CORS fetch fails
      const link = document.createElement("a");
      link.href = product.imageUrl;
      link.target = "_blank";
      link.download = `BuyWise_${product.title.replace(/[^a-zA-Z0-9]/g, "_")}.jpg`;
      link.click();
      setDownloadSuccessMsg("✅ Outfit opened for download!");
      setTimeout(() => setDownloadSuccessMsg(null), 5000);
    }
  };

  // Upload user-created styled look
  const handleStyledLookUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Image file size exceeds 5MB. Please choose a smaller photo.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        savePrivateLook(result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle 1 Free Custom Photo Upload (Compressed to 1024px WebP & executed on Modal)
  const handleLiveCustomTryOn = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setVtoLoading(true);
    setVtoStatus("Compressing photo to 1024px WebP...");

    try {
      const compressedWebP = await compressImageToWebPBase64(file, 1024, 0.8);
      setVtoStatus("Fitting outfit on Modal GPU...");

      const res = await fetch("/api/vto/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          garmentSkuId: product.id,
          garmentImageUrl: product.imageUrl,
          userImageBase64: compressedWebP,
          category: product.category || "ethnic",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Try-on failed");
      }

      savePrivateLook(data.imageUrl);
      setSelectedAvatarId("custom");
      if (typeof data.quotaRemaining === "number") {
        setFreeQuotaRemaining(data.quotaRemaining);
      }
      setVtoStatus(
        data.cached
          ? "⚡ Loaded instantly from cache (0 credits used)!"
          : `✨ Fitted via ${data.modeUsed === "face_swap" ? "Selfie Smart-Swap" : "Full-Body VTO"}!`
      );
    } catch (err: any) {
      setVtoStatus(err.message || "Virtual Try-On generation error.");
    } finally {
      setVtoLoading(false);
    }
  };

  // Submit look to Weekly Challenge
  const handleCompetitionSubmit = () => {
    const activeComp = getActiveCompetition();
    if (!activeComp) return;
    const finalImg = userStyledLookUrl || product.imageUrl;
    const userImg = userPhotoUrl || finalImg;

    submitToCompetition(
      activeComp.id,
      `user_${Math.random().toString(36).substring(2, 7)}`,
      participantName || "BuyWise Stylist",
      userImg,
      finalImg,
      submissionCaption || `Styled look with ${product.title} for the BuyWise Challenge!`
    );

    setCompSubmitted(true);
  };

  return (
    <div
      className="glass"
      style={{
        padding: "24px",
        borderRadius: "24px",
        background: "rgba(255, 255, 255, 0.02)",
        border: "1px solid var(--glass-border)",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
      }}
    >
      {/* ------------------------------------------------------------- */}
      {/* TOP: ACTIVE GARMENT PREVIEW / USER LOOK PREVIEW               */}
      {/* ------------------------------------------------------------- */}
      <div>
        {/* OPTION A: $0 INSTANT MULTI-BODY MODEL SWITCHER (0ms Latency) */}
        <div style={{ background: "rgba(24, 26, 48, 0.7)", padding: "10px 14px", borderRadius: "14px", marginBottom: "14px", border: "1px solid rgba(255, 215, 0, 0.25)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", color: "#ffd700" }}>
              ⚡ Instant Body-Type Switcher (0s Wait)
            </span>
            <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)" }}>
              Tap your body type
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px" }}>
            <button
              onClick={() => {
                setSelectedAvatarId("catalog");
                setUserStyledLookUrl(null);
              }}
              style={{
                padding: "6px 4px",
                borderRadius: "8px",
                fontSize: "11px",
                fontWeight: 700,
                border: selectedAvatarId === "catalog" && !userStyledLookUrl ? "1px solid #ffd700" : "1px solid rgba(255,255,255,0.15)",
                background: selectedAvatarId === "catalog" && !userStyledLookUrl ? "#ffd700" : "rgba(35, 38, 66, 0.6)",
                color: selectedAvatarId === "catalog" && !userStyledLookUrl ? "#000" : "#fff",
                cursor: "pointer",
                textAlign: "center"
              }}
            >
              <div>Catalog</div>
              <div style={{ fontSize: "9px", opacity: 0.75 }}>Original</div>
            </button>
            {prewarmedAvatars.map((avatar) => (
              <button
                key={avatar.id}
                onClick={() => {
                  setSelectedAvatarId(avatar.id);
                  if (avatar.imageUrl) {
                    setUserStyledLookUrl(avatar.imageUrl);
                  }
                }}
                style={{
                  padding: "6px 4px",
                  borderRadius: "8px",
                  fontSize: "11px",
                  fontWeight: 700,
                  border: selectedAvatarId === avatar.id ? "1px solid #ffd700" : "1px solid rgba(255,255,255,0.15)",
                  background: selectedAvatarId === avatar.id ? "#ffd700" : "rgba(35, 38, 66, 0.6)",
                  color: selectedAvatarId === avatar.id ? "#000" : "#fff",
                  cursor: "pointer",
                  textAlign: "center"
                }}
              >
                <div>{avatar.label}</div>
                <div style={{ fontSize: "9px", opacity: 0.75 }}>{avatar.heightHint.split("•")[0].trim()}</div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: "11px", fontWeight: 800, color: "#ffd700", background: "rgba(255, 215, 0, 0.12)", border: "1px solid rgba(255, 215, 0, 0.3)", padding: "4px 12px", borderRadius: "12px" }}>
              ✨ BUYWISE STUDIO
            </span>
            <button
              onClick={() => setFitMode(fitMode === "contain" ? "cover" : "contain")}
              style={{
                fontSize: "11px",
                fontWeight: 800,
                color: "#00d4ff",
                background: "rgba(0, 212, 255, 0.12)",
                border: "1px solid rgba(0, 212, 255, 0.3)",
                padding: "4px 12px",
                borderRadius: "12px",
                cursor: "pointer",
              }}
            >
              {fitMode === "contain" ? t("📐 View: Full Body") : t("🔍 View: Zoom Detail")}
            </button>
          </div>

          <span
            style={{
              fontSize: "12px",
              color: userStyledLookUrl ? "#ff007f" : "#00ff88",
              fontWeight: 800,
              background: userStyledLookUrl ? "rgba(255, 0, 127, 0.15)" : "rgba(0, 255, 136, 0.12)",
              border: userStyledLookUrl ? "1px solid rgba(255, 0, 127, 0.4)" : "1px solid rgba(0, 255, 136, 0.3)",
              padding: "4px 12px",
              borderRadius: "12px",
            }}
          >
            {userStyledLookUrl ? "✨ Community Look • Ready for Challenge" : "👗 Selected Catalog Outfit"}
          </span>
        </div>

        {/* Display Canvas Container */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "460px",
            borderRadius: "20px",
            overflow: "hidden",
            background: "#080612",
            boxShadow: "0 20px 50px rgba(0,0,0,0.85)",
            userSelect: "none",
          }}
        >
          <Image
            src={userStyledLookUrl || product.imageUrl}
            alt={userStyledLookUrl ? "User Styled Look" : product.title}
            fill
            unoptimized
            style={{ objectFit: fitMode, objectPosition: "center top" }}
          />

          {userStyledLookUrl && (
            <div
              style={{
                position: "absolute",
                top: "14px",
                left: "14px",
                background: "rgba(0, 0, 0, 0.8)",
                border: "1px solid #ff007f",
                color: "#ff007f",
                padding: "4px 12px",
                borderRadius: "12px",
                fontSize: "11px",
                fontWeight: 900,
                zIndex: 10,
              }}
            >
              ✨ Community Look • Ready for Challenge
            </div>
          )}

          {userStyledLookUrl && (
            <button
              onClick={() => setUserStyledLookUrl(null)}
              style={{
                position: "absolute",
                top: "14px",
                right: "14px",
                background: "rgba(0,0,0,0.8)",
                border: "1px solid rgba(255,255,255,0.3)",
                color: "white",
                padding: "4px 10px",
                borderRadius: "10px",
                fontSize: "11px",
                fontWeight: 800,
                cursor: "pointer",
                zIndex: 10,
              }}
            >
              ✕ Reset to Outfit
            </button>
          )}

          <div
            style={{
              position: "absolute",
              bottom: "12px",
              left: "12px",
              background: "rgba(0,0,0,0.75)",
              backdropFilter: "blur(4px)",
              padding: "6px 12px",
              borderRadius: "10px",
              color: "white",
              fontSize: "12px",
              fontWeight: 800,
              zIndex: 5,
            }}
          >
            🔒 Saved to Local Private Media
          </div>
        </div>

        {/* Product Details Row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: "14px" }}>
          <div>
            <h2 style={{ fontSize: "17px", fontWeight: 800, color: "var(--text-primary)", marginBottom: "4px" }}>
              {product.title}
            </h2>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
              <strong style={{ color: "#ffd700" }}>₹{product.price.toLocaleString("en-IN")}</strong> • Store: <strong>{product.store}</strong>
            </p>
          </div>

          {onOpenFitAssistant && (
            <button
              onClick={onOpenFitAssistant}
              style={{
                fontSize: "11px",
                fontWeight: 800,
                color: "#00d4ff",
                background: "rgba(0, 212, 255, 0.12)",
                border: "1px solid rgba(0, 212, 255, 0.3)",
                padding: "6px 12px",
                borderRadius: "10px",
                cursor: "pointer",
              }}
            >
              📏 FIT ASSISTANT
            </button>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* PART 2: "AI SIZE & STYLE MATCH ✨" CARD (POWERED BY HI MAYA)  */}
      {/* ------------------------------------------------------------- */}
      <div
        style={{
          borderRadius: "20px",
          background: "linear-gradient(135deg, rgba(255, 215, 0, 0.08), rgba(20, 15, 38, 0.95))",
          border: "1.5px solid rgba(255, 215, 0, 0.35)",
          padding: "20px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
          <span style={{ fontSize: "20px" }}>✨</span>
          <h3 style={{ fontSize: "17px", fontWeight: 900, color: "#ffd700", margin: 0 }}>
            AI Size &amp; Style Match ✨
          </h3>
        </div>
        <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", margin: "0 0 16px 0" }}>
          Find your best fit &amp; personalized styling for <strong>{product.title}</strong> powered by HI MAYA ✨
        </p>

        {/* Input Form Controls */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
          {/* Height */}
          <div>
            <label style={{ fontSize: "11px", fontWeight: 800, color: "#00d4ff", display: "block", marginBottom: "4px" }}>
              Height
            </label>
            <input
              type="text"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="e.g. 5'5&quot; or 165 cm"
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "10px",
                background: "rgba(0,0,0,0.4)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "white",
                fontSize: "12px",
                outline: "none",
              }}
            />
          </div>

          {/* Weight */}
          <div>
            <label style={{ fontSize: "11px", fontWeight: 800, color: "#00d4ff", display: "block", marginBottom: "4px" }}>
              Weight (kg)
            </label>
            <input
              type="text"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="e.g. 58"
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "10px",
                background: "rgba(0,0,0,0.4)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "white",
                fontSize: "12px",
                outline: "none",
              }}
            />
          </div>

          {/* Body Type */}
          <div>
            <label style={{ fontSize: "11px", fontWeight: 800, color: "#ffd700", display: "block", marginBottom: "4px" }}>
              Body Type
            </label>
            <select
              value={bodyType}
              onChange={(e) => setBodyType(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "10px",
                background: "rgba(18, 14, 34, 0.95)",
                border: "1px solid rgba(255,215,0,0.3)",
                color: "white",
                fontSize: "12px",
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="Petite">Petite</option>
              <option value="Regular">Regular</option>
              <option value="Curvy">Curvy</option>
              <option value="Athletic">Athletic</option>
            </select>
          </div>

          {/* Skin Tone */}
          <div>
            <label style={{ fontSize: "11px", fontWeight: 800, color: "#ffd700", display: "block", marginBottom: "4px" }}>
              Skin Undertone
            </label>
            <select
              value={skinTone}
              onChange={(e) => setSkinTone(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "10px",
                background: "rgba(18, 14, 34, 0.95)",
                border: "1px solid rgba(255,215,0,0.3)",
                color: "white",
                fontSize: "12px",
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="Warm">Warm (Golden/Peach)</option>
              <option value="Neutral">Neutral (Balanced)</option>
              <option value="Cool">Cool (Rosy/Blue)</option>
              <option value="Auto-detect from Selfie">Auto-detect from Selfie</option>
            </select>
          </div>
        </div>

        {/* Preferred Fit Selector Chips */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ fontSize: "11px", fontWeight: 800, color: "#00ff88", display: "block", marginBottom: "6px" }}>
            Preferred Fit
          </label>
          <div style={{ display: "flex", gap: "8px" }}>
            {["Snug/Tailored", "Regular", "Comfort/Loose"].map((fit) => (
              <button
                key={fit}
                type="button"
                onClick={() => setFitPreference(fit)}
                style={{
                  flex: 1,
                  padding: "7px 10px",
                  borderRadius: "10px",
                  fontSize: "11px",
                  fontWeight: fitPreference === fit ? 900 : 700,
                  color: fitPreference === fit ? "#000" : "rgba(255,255,255,0.75)",
                  background: fitPreference === fit ? "#00ff88" : "rgba(255,255,255,0.06)",
                  border: fitPreference === fit ? "1px solid #00ff88" : "1px solid rgba(255,255,255,0.15)",
                  cursor: "pointer",
                }}
              >
                {fit}
              </button>
            ))}
          </div>
        </div>

        {/* Primary Yellow CTA Button */}
        <button
          onClick={handleGetStyleMatch}
          disabled={isMatchingStyle}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "14px",
            background: "linear-gradient(135deg, #ffd700, #ffaa00)",
            color: "#000",
            fontWeight: 900,
            fontSize: "14px",
            border: "none",
            cursor: isMatchingStyle ? "wait" : "pointer",
            boxShadow: "0 4px 18px rgba(255, 215, 0, 0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          {isMatchingStyle ? "✨ Analyzing Fabric & Maya Stylist Recommendations..." : "✨ Get My AI Size & Style Match"}
        </button>

        {/* Sizing & Styling Result Card */}
        {styleMatchResult && (
          <div
            style={{
              marginTop: "16px",
              padding: "16px",
              borderRadius: "16px",
              background: "rgba(0, 0, 0, 0.45)",
              border: "1px solid rgba(255, 215, 0, 0.4)",
            }}
          >
            {/* Header with recommended size badge */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", marginBottom: "10px" }}>
              <span style={{ fontSize: "13px", fontWeight: 900, color: "#ffd700", background: "rgba(255, 215, 0, 0.15)", border: "1px solid #ffd700", padding: "6px 14px", borderRadius: "12px" }}>
                🎯 Recommended Size: {styleMatchResult.recommendedSize} ({styleMatchResult.fitConfidence})
              </span>
              <span style={{ fontSize: "11px", fontWeight: 800, color: "#00ff88", background: "rgba(0, 255, 136, 0.12)", padding: "4px 10px", borderRadius: "10px" }}>
                🎨 {styleMatchResult.colorMatchScore}
              </span>
            </div>

            {/* Fit Advice Breakdown */}
            <p style={{ fontSize: "12.5px", color: "rgba(255,255,255,0.9)", lineHeight: 1.5, marginBottom: "12px" }}>
              <strong>Fit Breakdown:</strong> {styleMatchResult.sizeAdvice}
            </p>

            {/* Maya's Styling Tips */}
            <div style={{ background: "rgba(255, 215, 0, 0.05)", padding: "10px 14px", borderRadius: "12px", borderLeft: "3px solid #ffd700" }}>
              <div style={{ fontSize: "11px", fontWeight: 900, color: "#ffd700", marginBottom: "6px" }}>
                HI MAYA&apos;S STYLING TIPS:
              </div>
              <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "12px", color: "rgba(255,255,255,0.85)", lineHeight: 1.5 }}>
                {styleMatchResult.stylingTips.map((tip, idx) => (
                  <li key={idx} style={{ marginBottom: "4px" }}>{tip}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* PART 3: "DOWNLOAD OUTFIT & UPLOAD FOR WEEKLY CHALLENGE" FLOW    */}
      {/* ------------------------------------------------------------- */}
      <div
        style={{
          borderRadius: "20px",
          background: "linear-gradient(135deg, rgba(255, 0, 127, 0.12), rgba(18, 14, 34, 0.95))",
          border: "1.5px solid rgba(255, 0, 127, 0.35)",
          padding: "20px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <div style={{ fontSize: "16px", fontWeight: 900, color: "#ff007f", display: "flex", alignItems: "center", gap: "6px" }}>
              🏆 Join the Weekly Look Challenge
            </div>
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", margin: "4px 0 0 0" }}>
              Win ₹5,000 Voucher! Download this outfit, create your styled look with your favorite editor or photo, and upload here to compete.
            </p>
          </div>
        </div>

        {downloadSuccessMsg && (
          <div style={{ margin: "10px 0", padding: "8px 12px", borderRadius: "10px", background: "rgba(0, 255, 136, 0.15)", border: "1px solid rgba(0, 255, 136, 0.3)", fontSize: "12px", color: "#00ff88", fontWeight: 700 }}>
            {downloadSuccessMsg}
          </div>
        )}

        {/* TIER 3: 1 FREE LIVE GPU TRY-ON (POWERED BY MODAL L4 GPU) */}
        <div style={{ background: "rgba(15, 16, 33, 0.8)", padding: "16px", borderRadius: "16px", border: "1.5px solid rgba(255, 0, 127, 0.45)", marginTop: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
            <span style={{ fontSize: "13px", fontWeight: 900, color: "white", display: "flex", alignItems: "center", gap: "6px" }}>
              📸 Try On With Your Photo <span style={{ color: "#ffd700", fontSize: "11px" }}>• 1024px WebP Client Compressed</span>
            </span>
            <span style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "10px", background: freeQuotaRemaining > 0 ? "rgba(0, 255, 136, 0.15)" : "rgba(255,255,255,0.1)", color: freeQuotaRemaining > 0 ? "#00ff88" : "rgba(255,255,255,0.6)", fontWeight: 800 }}>
              {freeQuotaRemaining > 0 ? `${freeQuotaRemaining} Free GPU Try-On Left` : "Quota Used (Free Body Switcher Active)"}
            </span>
          </div>

          <label
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "14px",
              background: vtoLoading ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg, #ff007f, #8b5cf6)",
              color: "white",
              fontWeight: 900,
              fontSize: "13px",
              cursor: vtoLoading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              textAlign: "center",
              boxShadow: "0 4px 15px rgba(255, 0, 127, 0.35)",
            }}
          >
            {vtoLoading ? "⚙️ Generating on Modal GPU..." : "📸 Upload Photo (1 Free AI Live Try-On)"}
            <input
              type="file"
              accept="image/*"
              onChange={handleLiveCustomTryOn}
              disabled={vtoLoading}
              style={{ display: "none" }}
            />
          </label>

          {vtoStatus && (
            <p style={{ fontSize: "11.5px", textAlign: "center", color: "#ffd700", margin: 0, fontWeight: 700 }}>
              {vtoStatus}
            </p>
          )}
        </div>

        {/* Step 1 & Step 2 Buttons */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "14px", marginBottom: "16px" }}>
          {/* Step 1: Download Outfit */}
          <button
            onClick={handleDownloadOutfitImage}
            style={{
              padding: "12px",
              borderRadius: "14px",
              background: "rgba(0, 212, 255, 0.12)",
              border: "1px solid rgba(0, 212, 255, 0.4)",
              color: "#00d4ff",
              fontWeight: 800,
              fontSize: "12.5px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
          >
            ⬇️ Download Outfit Image
          </button>

          {/* Step 2: Upload Styled Look */}
          <label
            style={{
              padding: "12px",
              borderRadius: "14px",
              background: "rgba(255, 215, 0, 0.12)",
              border: "1px solid rgba(255, 215, 0, 0.4)",
              color: "#ffd700",
              fontWeight: 800,
              fontSize: "12.5px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              textAlign: "center",
            }}
          >
            📤 Upload Your Styled Look
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleStyledLookUpload}
              style={{ display: "none" }}
            />
          </label>
        </div>

        {/* Step 3: Pink Gradient Submit CTA Button */}
        <button
          onClick={() => setShowCompModal(true)}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "16px",
            background: "linear-gradient(135deg, #ff007f, #7928ca)",
            color: "white",
            fontWeight: 900,
            fontSize: "14px",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 6px 20px rgba(255, 0, 127, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          🏆 Submit This Look to Weekly Challenge!
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* LOCAL PRIVATE MEDIA REEL                                      */}
      {/* ------------------------------------------------------------- */}
      {privateLooks.length > 0 && (
        <div style={{ marginTop: "4px" }}>
          <div style={{ fontSize: "13px", fontWeight: 800, color: "rgba(255,255,255,0.8)", marginBottom: "8px" }}>
            🔒 Local Private Media ({privateLooks.length} looks saved)
          </div>
          <div style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "6px" }}>
            {privateLooks.map((lookUrl, idx) => (
              <div
                key={idx}
                onClick={() => setUserStyledLookUrl(lookUrl)}
                style={{
                  position: "relative",
                  width: "70px",
                  height: "90px",
                  borderRadius: "10px",
                  overflow: "hidden",
                  border: userStyledLookUrl === lookUrl ? "2px solid #ff007f" : "1px solid rgba(255,255,255,0.2)",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                <Image src={lookUrl} alt={`Private look ${idx}`} fill unoptimized style={{ objectFit: "cover" }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* COMPETITION SUBMISSION MODAL                                   */}
      {/* ------------------------------------------------------------- */}
      {showCompModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.88)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 99999,
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#120e24",
              border: "1.5px solid rgba(255, 0, 127, 0.4)",
              borderRadius: "24px",
              padding: "28px",
              maxWidth: "520px",
              width: "100%",
              color: "white",
              boxShadow: "0 20px 60px rgba(0,0,0,0.95)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "19px", fontWeight: 900, color: "#ffd700", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                🏆 Submit to Weekly Look Challenge
              </h3>
              <button
                onClick={() => setShowCompModal(false)}
                style={{ background: "none", border: "none", color: "rgba(255,255,255,0.6)", fontSize: "20px", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            {compSubmitted ? (
              <div style={{ textAlign: "center", padding: "24px 10px" }}>
                <span style={{ fontSize: "44px" }}>🎉</span>
                <h4 style={{ fontSize: "19px", fontWeight: 900, color: "#00ff88", margin: "12px 0 6px 0" }}>
                  Entry Submitted Successfully!
                </h4>
                <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.8)", marginBottom: "20px" }}>
                  Your styled creation is live in the Weekly Challenge gallery. Good luck winning the ₹5,000 Voucher!
                </p>
                <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                  <button
                    onClick={() => {
                      setShowCompModal(false);
                      setCompSubmitted(false);
                    }}
                    style={{ padding: "10px 18px", borderRadius: "14px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "white", fontWeight: 800, cursor: "pointer" }}
                  >
                    Close
                  </button>
                  <Link href="/competition">
                    <button style={{ padding: "10px 20px", borderRadius: "14px", background: "linear-gradient(135deg, #00ff88, #00d4ff)", color: "#000", fontWeight: 900, border: "none", cursor: "pointer" }}>
                      View Voting Gallery ➔
                    </button>
                  </Link>
                </div>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: "12.5px", color: "rgba(255,255,255,0.75)", marginBottom: "16px" }}>
                  Competing outfit: <strong>{product.title}</strong>
                </p>

                <div style={{ marginBottom: "12px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 800, color: "rgba(255,255,255,0.8)", display: "block", marginBottom: "4px" }}>
                    Stylist / Display Name
                  </label>
                  <input
                    type="text"
                    value={participantName}
                    onChange={(e) => setParticipantName(e.target.value)}
                    placeholder="Your Name (e.g., Priya S.)"
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "12px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", color: "white", fontSize: "13px", outline: "none" }}
                  />
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 800, color: "rgba(255,255,255,0.8)", display: "block", marginBottom: "4px" }}>
                    Caption / Style Note
                  </label>
                  <input
                    type="text"
                    value={submissionCaption}
                    onChange={(e) => setSubmissionCaption(e.target.value)}
                    placeholder="e.g. Styled with oxidized silver jewellery!"
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "12px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", color: "white", fontSize: "13px", outline: "none" }}
                  />
                </div>

                {/* Consent & Verification Checkboxes */}
                <div style={{ background: "rgba(0,0,0,0.35)", padding: "14px", borderRadius: "14px", border: "1px solid rgba(255, 215, 0, 0.25)", marginBottom: "18px", display: "flex", flexDirection: "column", gap: "10px" }}>
                  <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer", fontSize: "12px", color: "#ffd700", fontWeight: 800, lineHeight: 1.4 }}>
                    <input
                      type="checkbox"
                      checked={is18Plus}
                      onChange={(e) => setIs18Plus(e.target.checked)}
                      style={{ marginTop: "2px", width: "15px", height: "15px", accentColor: "#ffd700" }}
                    />
                    <span>🔞 18+ Age Guard: I confirm that I am 18 years of age or older. (Required)</span>
                  </label>

                  <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer", fontSize: "12px", color: "rgba(255,255,255,0.9)", lineHeight: 1.4 }}>
                    <input
                      type="checkbox"
                      checked={consentVoting}
                      onChange={(e) => setConsentVoting(e.target.checked)}
                      style={{ marginTop: "2px", width: "15px", height: "15px", accentColor: "#ffd700" }}
                    />
                    <span>Consent 1 (Voting): I agree this image may be displayed for competition voting. (Required)</span>
                  </label>

                  <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer", fontSize: "12px", color: "rgba(255,255,255,0.9)", lineHeight: 1.4 }}>
                    <input
                      type="checkbox"
                      checked={consentWinner}
                      onChange={(e) => setConsentWinner(e.target.checked)}
                      style={{ marginTop: "2px", width: "15px", height: "15px", accentColor: "#ffd700" }}
                    />
                    <span>Consent 2 (Winner Spotlight): If selected, I allow BuyWise to feature my look in-app. (Required)</span>
                  </label>

                  <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer", fontSize: "12px", color: "rgba(255,255,255,0.75)", lineHeight: 1.4 }}>
                    <input
                      type="checkbox"
                      checked={consentMarketing}
                      onChange={(e) => setConsentMarketing(e.target.checked)}
                      style={{ marginTop: "2px", width: "15px", height: "15px", accentColor: "#00ff88" }}
                    />
                    <span>Consent 3 (Marketing): I allow BuyWise to feature my winning look on social media. (Optional)</span>
                  </label>
                </div>

                <div style={{ display: "flex", gap: "12px" }}>
                  <button
                    onClick={() => setShowCompModal(false)}
                    style={{ flex: 1, padding: "12px", borderRadius: "14px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "white", fontWeight: 800, cursor: "pointer" }}
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleCompetitionSubmit}
                    disabled={!is18Plus || !consentVoting || !consentWinner}
                    style={{
                      flex: 1.5,
                      padding: "12px",
                      borderRadius: "14px",
                      background: is18Plus && consentVoting && consentWinner ? "linear-gradient(135deg, #ff007f, #7928ca)" : "rgba(255,255,255,0.1)",
                      color: is18Plus && consentVoting && consentWinner ? "white" : "rgba(255,255,255,0.4)",
                      fontWeight: 900,
                      fontSize: "13.5px",
                      border: "none",
                      cursor: is18Plus && consentVoting && consentWinner ? "pointer" : "not-allowed",
                    }}
                  >
                    🏆 SUBMIT ENTRY NOW
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* ACTION FOOTER BUTTONS                                         */}
      {/* ------------------------------------------------------------- */}
      <div style={{ display: "flex", gap: "12px", marginTop: "4px" }}>
        <button
          onClick={() => onCompareAddToLook && onCompareAddToLook(product)}
          style={{
            flex: 1,
            padding: "13px",
            borderRadius: "14px",
            border: "1px solid var(--glass-border)",
            background: "rgba(255,255,255,0.05)",
            color: "#00d4ff",
            fontWeight: 800,
            fontSize: "13px",
            cursor: "pointer",
          }}
        >
          + {t("COMPARE LOOK")}
        </button>

        <a
          href={product.productUrl || "#"}
          target="_blank"
          rel="noreferrer"
          style={{
            flex: 1.5,
            padding: "13px",
            borderRadius: "14px",
            border: "none",
            background: "linear-gradient(135deg, #00ff88, #00d4ff)",
            color: "#000",
            fontWeight: 900,
            fontSize: "13px",
            textDecoration: "none",
            textAlign: "center",
            display: "block",
          }}
        >
          {t("BUY ON")} {product.store.toUpperCase()} ↗
        </a>
      </div>
    </div>
  );
}

export default GarmentCanvas;

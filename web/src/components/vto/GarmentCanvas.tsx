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

interface GarmentCanvasProps {
  userPhotoUrl: string | null;
  product: GarmentProduct;
  onCompareAddToLook?: (product: GarmentProduct) => void;
  onOpenFitAssistant?: () => void;
}

export function GarmentCanvas({ userPhotoUrl, product, onCompareAddToLook, onOpenFitAssistant }: GarmentCanvasProps) {
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [fittedLookUrl, setFittedLookUrl] = useState<string | null>(null);
  const [isFitting, setIsFitting] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>("1. Analyzing body pose & garment...");
  const [providerError, setProviderError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const [activeDrapeStyle, setActiveDrapeStyle] = useState<string>(product.drapeStyle || "nivi");
  const [selectedColor, setSelectedColor] = useState<string>(product.colors?.[0] || "#ffffff");
  const [activeFabric, setActiveFabric] = useState<string>(product.fabrics?.[0] || "Silk");

  const [fitMode, setFitMode] = useState<"contain" | "cover">("contain");
  const { t } = useTranslation();

  // Weekly Competition Submission State
  const [showCompModal, setShowCompModal] = useState<boolean>(false);
  const [is18Plus, setIs18Plus] = useState<boolean>(false);
  const [consentVoting, setConsentVoting] = useState<boolean>(false);
  const [consentWinner, setConsentWinner] = useState<boolean>(false);
  const [consentMarketing, setConsentMarketing] = useState<boolean>(false);
  const [participantName, setParticipantName] = useState<string>("Priya S.");
  const [submissionCaption, setSubmissionCaption] = useState<string>("");
  const [compSubmitted, setCompSubmitted] = useState<boolean>(false);

  const handleCompetitionSubmit = () => {
    const activeComp = getActiveCompetition();
    if (!activeComp) return;
    const finalImg = fittedLookUrl || product.imageUrl;
    const userImg = userPhotoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80";

    submitToCompetition(
      activeComp.id,
      `user_${Math.random().toString(36).substring(2, 7)}`,
      participantName || "BuyWise Shopper",
      userImg,
      finalImg,
      submissionCaption || `Styling ${product.title} for the BuyWise Challenge!`
    );

    setCompSubmitted(true);
  };

  const isSaree = (product.category || "").toLowerCase().includes("saree") || product.title.toLowerCase().includes("saree") || Boolean(product.isSaree);

  const triggerTryOnGeneration = () => {
    if (!userPhotoUrl) {
      setFittedLookUrl(null);
      return;
    }

    setIsFitting(true);
    setFittedLookUrl(null);
    setProviderError(null);
    setErrorCode(null);

    setLoadingStep(t("1. Analyzing photo & garment texture..."));
    const t1 = setTimeout(() => setLoadingStep(t("2. Fitting garment to body geometry...")), 800);
    const t2 = setTimeout(() => setLoadingStep(t("3. Rendering photorealistic fabric folds...")), 1600);

    fetch("/api/vto/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userPhoto: { url: userPhotoUrl },
        product,
        drapeStyle: activeDrapeStyle
      })
    })
      .then(async (res) => {
        clearTimeout(t1); clearTimeout(t2);
        const data = await res.json();
        if (data?.success && data?.job?.resultImageUrl) {
          setFittedLookUrl(data.job.resultImageUrl);
          setProviderError(null);
          setErrorCode(null);
        } else {
          setFittedLookUrl(null);
          setErrorCode(data?.code || "VTO_GENERATION_FAILED");
          setProviderError(data?.message || t("Virtual Try-On generation could not be completed."));
        }
        setIsFitting(false);
      })
      .catch(() => {
        clearTimeout(t1); clearTimeout(t2);
        setFittedLookUrl(null);
        setErrorCode("VTO_PROVIDER_UNAVAILABLE");
        setProviderError(t("Could not connect to AI Virtual Try-On endpoint."));
        setIsFitting(false);
      });
  };

  useEffect(() => {
    triggerTryOnGeneration();
  }, [userPhotoUrl, product.id, product.imageUrl, product.category, product.title, selectedColor, activeDrapeStyle, activeFabric]);

  return (
    <div className="glass" style={{ padding: "24px", borderRadius: "24px", background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--glass-border)", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      <div>
        {/* Header Badges */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: "11px", fontWeight: 800, color: "#00ff88", background: "rgba(0, 255, 136, 0.12)", border: "1px solid rgba(0, 255, 136, 0.3)", padding: "4px 12px", borderRadius: "12px" }}>
              🤖 DIGITAL FITTING ROOM V4
            </span>
            <button
              onClick={() => setFitMode(fitMode === "contain" ? "cover" : "contain")}
              style={{
                fontSize: "11px",
                fontWeight: 800,
                color: "#ffd700",
                background: "rgba(255, 215, 0, 0.12)",
                border: "1px solid rgba(255, 215, 0, 0.4)",
                padding: "4px 12px",
                borderRadius: "12px",
                cursor: "pointer"
              }}
            >
              {fitMode === "contain" ? t("📐 View: Full Body (Head-to-Toe)") : t("🔍 View: Zoom Portrait")}
            </button>
          </div>

          <span style={{ fontSize: "12px", color: providerError ? "#ff4d4d" : "#00ff88", fontWeight: 800, background: providerError ? "rgba(255, 77, 77, 0.15)" : "rgba(0, 255, 136, 0.12)", border: providerError ? "1px solid rgba(255, 77, 77, 0.3)" : "1px solid rgba(0, 255, 136, 0.3)", padding: "4px 12px", borderRadius: "12px" }}>
            {providerError ? `⚠️ ${errorCode || "Error"}` : `✨ ${t("AI Try-On Ready")}`}
          </span>
        </div>

        {/* Fitting Room Interactive Canvas */}
        <div 
          style={{ 
            position: "relative", 
            width: "100%", 
            height: "540px", 
            borderRadius: "20px", 
            overflow: "hidden", 
            background: "#080612",
            marginBottom: "18px",
            boxShadow: "0 20px 50px rgba(0,0,0,0.85)",
            userSelect: "none"
          }}
        >
          {/* Layer 1: AI Generated Try-On Result (Full Width Base) */}
          {isFitting ? (
            <div style={{ padding: "40px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", background: "linear-gradient(135deg, rgba(10, 20, 40, 0.95), rgba(20, 10, 30, 0.95))" }}>
              <div style={{ fontSize: "28px", marginBottom: "16px" }} className="animate-spin">✨</div>
              <h3 style={{ fontSize: "15px", color: "#00ff88", fontWeight: 800, marginBottom: "8px" }}>{t("AI Model Fitting Garment to Body")}</h3>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", maxWidth: "380px" }}>{loadingStep}</p>
            </div>
          ) : fittedLookUrl ? (
            <Image
              src={fittedLookUrl}
              alt="AI Generated Virtual Try-On"
              fill
              unoptimized
              style={{ objectFit: fitMode, objectPosition: "center top" }}
            />
          ) : providerError ? (
            <div style={{ padding: "32px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", background: "linear-gradient(135deg, rgba(25, 10, 20, 0.95), rgba(15, 10, 30, 0.95))" }}>
              <span style={{ fontSize: "32px", marginBottom: "10px" }}>⚠️</span>
              <h3 style={{ fontSize: "15px", color: "#ff4d4d", fontWeight: 800, marginBottom: "6px" }}>{t("Virtual Try-On Provider Alert")}</h3>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", maxWidth: "420px", lineHeight: 1.5, marginBottom: "14px" }}>
                {providerError}
              </p>
              <button 
                onClick={triggerTryOnGeneration}
                style={{ fontSize: "11px", fontWeight: 800, color: "#00ff88", background: "rgba(0, 255, 136, 0.12)", border: "1px solid rgba(0, 255, 136, 0.3)", padding: "8px 16px", borderRadius: "10px", cursor: "pointer" }}
              >
                🔄 {t("RETRY GENERATION")}
              </button>
            </div>
          ) : (
            <Image
              src={product.imageUrl}
              alt="Product Item"
              fill
              unoptimized
              style={{ objectFit: fitMode, objectPosition: "center top" }}
            />
          )}

          {/* Layer 2: Original User Photo (Clipped by Slider) */}
          {userPhotoUrl && !isFitting && !providerError && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                bottom: 0,
                width: `${sliderPosition}%`,
                overflow: "hidden",
                borderRight: "3px solid #00ff88",
                boxShadow: "5px 0 25px rgba(0,255,136,0.6)",
                zIndex: 10
              }}
            >
              <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", minWidth: "480px" }}>
                <Image
                  src={userPhotoUrl}
                  alt="Original User Photo"
                  fill
                  unoptimized
                  style={{ objectFit: fitMode, objectPosition: "center top" }}
                />
              </div>
              <span style={{ position: "absolute", top: "14px", left: "14px", background: "rgba(0,0,0,0.8)", color: "#00ff88", padding: "4px 10px", borderRadius: "10px", fontSize: "11px", fontWeight: 800, zIndex: 12 }}>
                📷 {t("YOUR PHOTO")}
              </span>
            </div>
          )}

          {/* Right Side Status Badge */}
          <span style={{ position: "absolute", top: "14px", right: "14px", background: "rgba(0,0,0,0.8)", color: providerError ? "#ff4d4d" : "#00ff88", padding: "4px 10px", borderRadius: "10px", fontSize: "11px", fontWeight: 800, zIndex: 5 }}>
            {isFitting ? `✨ ${t("Fitting Garment...")}` : fittedLookUrl ? `✨ ${t("AI VIRTUAL TRY-ON")}` : providerError ? `⚠️ ${t("Provider Unconfigured")}` : ""}
          </span>

          {/* Comparison Slider Handle */}
          {userPhotoUrl && !isFitting && !providerError && (
            <input
              type="range"
              min="0"
              max="100"
              value={sliderPosition}
              onChange={(e) => setSliderPosition(Number(e.target.value))}
              style={{
                position: "absolute",
                bottom: "16px",
                left: "5%",
                width: "90%",
                zIndex: 20,
                accentColor: "#00ff88",
                cursor: "ew-resize"
              }}
            />
          )}
        </div>

        {/* Product Details Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: 800, color: "var(--text-primary)", marginBottom: "4px" }}>
              {t(product.title)}
            </h2>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
              <strong style={{ color: "#ffd700" }}>₹{product.price.toLocaleString("en-IN")}</strong> {t("Store:")} <strong>{t(product.store)}</strong>
            </p>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            {fittedLookUrl && (
              <a
                href={fittedLookUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  fontSize: "11px",
                  fontWeight: 800,
                  color: "#00ff88",
                  background: "rgba(0, 255, 136, 0.12)",
                  border: "1px solid rgba(0, 255, 136, 0.3)",
                  padding: "6px 12px",
                  borderRadius: "10px",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px"
                }}
              >
                🔍 {t("VIEW HIGH-RES AI RESULT ↗")}
              </a>
            )}

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
                  cursor: "pointer"
                }}
              >
                📏 {t("FIT ASSISTANT")}
              </button>
            )}
          </div>
        </div>

        {/* Tip for Best AI Try-On Results */}
        <div style={{ marginBottom: "14px", padding: "10px 14px", borderRadius: "12px", background: "rgba(0, 212, 255, 0.08)", border: "1px solid rgba(0, 212, 255, 0.2)", fontSize: "12px", color: "#00d4ff", display: "flex", alignItems: "center", gap: "8px" }}>
          <span>💡</span>
          <span>
            <strong>{t("AI Fitting Tip:")}</strong> {t("For best saree/garment draping, upload a half-body or full-body standing photo so the AI can drape fabric onto your torso!")}
          </span>
        </div>

        {/* Drape Style Selector if item is a Saree */}
        {isSaree && (
          <div style={{ marginBottom: "16px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {["nivi", "bengali", "lehenga_style", "gujiari"].map((style) => (
              <button
                key={style}
                onClick={() => setActiveDrapeStyle(style)}
                style={{
                  fontSize: "11px",
                  fontWeight: 800,
                  color: activeDrapeStyle === style ? "#00ff88" : "var(--text-secondary)",
                  background: activeDrapeStyle === style ? "rgba(0, 255, 136, 0.15)" : "rgba(255,255,255,0.05)",
                  border: activeDrapeStyle === style ? "1px solid #00ff88" : "1px solid var(--glass-border)",
                  padding: "6px 12px",
                  borderRadius: "10px",
                  cursor: "pointer",
                  textTransform: "capitalize"
                }}
              >
                👗 {style.replace("_", " ")} Drape
              </button>
            ))}
          </div>
        )}

        {/* Weekly Competition Submission Promo Box */}
        <div style={{ marginTop: "16px", padding: "16px", borderRadius: "18px", background: "linear-gradient(135deg, rgba(255, 215, 0, 0.12), rgba(138, 43, 226, 0.15))", border: "1px solid rgba(255, 215, 0, 0.4)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: "12px", fontWeight: 900, color: "#ffd700", display: "flex", alignItems: "center", gap: "6px" }}>
              🏆 WEEKLY BUYWISE TRY-ON CHALLENGE
            </div>
            <div style={{ fontSize: "13px", color: "white", fontWeight: 700, marginTop: "2px" }}>
              Love your AI look? Enter this week&apos;s competition to win ₹5,000 Voucher!
            </div>
          </div>

          <button
            onClick={() => setShowCompModal(true)}
            style={{
              padding: "10px 18px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, #ffd700, #ff8c00)",
              color: "#000",
              fontWeight: 900,
              fontSize: "13px",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 4px 16px rgba(255, 215, 0, 0.4)",
              whiteSpace: "nowrap"
            }}
          >
            🏆 Submit Entry
          </button>
        </div>
      </div>

      {/* Explicit Privacy & Dual-Consent Competition Submission Modal */}
      {showCompModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99999, padding: "20px" }}>
          <div style={{ background: "#120e24", border: "1px solid rgba(255, 215, 0, 0.4)", borderRadius: "24px", padding: "32px", maxWidth: "520px", width: "100%", color: "white", boxShadow: "0 20px 60px rgba(0,0,0,0.9)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "20px", fontWeight: 900, color: "#ffd700", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                🏆 Weekly Try-On Competition Entry
              </h3>
              <button onClick={() => setShowCompModal(false)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.6)", fontSize: "20px", cursor: "pointer" }}>✕</button>
            </div>

            {compSubmitted ? (
              <div style={{ textAlign: "center", padding: "30px 10px" }}>
                <span style={{ fontSize: "48px" }}>🎉</span>
                <h4 style={{ fontSize: "20px", fontWeight: 900, color: "#00ff88", margin: "12px 0 8px 0" }}>Entry Submitted Successfully!</h4>
                <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.8)", marginBottom: "24px" }}>
                  Your Try-On look is now submitted to the Weekly Competition gallery. Best of luck!
                </p>
                <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                  <button onClick={() => setShowCompModal(false)} style={{ padding: "10px 20px", borderRadius: "16px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "white", fontWeight: 800, cursor: "pointer" }}>
                    Close
                  </button>
                  <Link href="/competition">
                    <button style={{ padding: "10px 20px", borderRadius: "16px", background: "#00ff88", color: "#000", fontWeight: 900, border: "none", cursor: "pointer" }}>
                      View Voting Gallery ➔
                    </button>
                  </Link>
                </div>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.75)", marginBottom: "20px" }}>
                  Your Try-On is saved privately by default. Submitting to the competition makes only this specific look public for voting.
                </p>

                <div style={{ marginBottom: "16px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 800, color: "rgba(255,255,255,0.8)", display: "block", marginBottom: "6px" }}>Display Name</label>
                  <input
                    type="text"
                    value={participantName}
                    onChange={(e) => setParticipantName(e.target.value)}
                    placeholder="Your Name (e.g., Priya S.)"
                    style={{ width: "100%", padding: "12px 16px", borderRadius: "14px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", color: "white", fontSize: "14px", outline: "none" }}
                  />
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 800, color: "rgba(255,255,255,0.8)", display: "block", marginBottom: "6px" }}>Caption / Style Note (Optional)</label>
                  <input
                    type="text"
                    value={submissionCaption}
                    onChange={(e) => setSubmissionCaption(e.target.value)}
                    placeholder="e.g. Loved how the silk drape fits!"
                    style={{ width: "100%", padding: "12px 16px", borderRadius: "14px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", color: "white", fontSize: "14px", outline: "none" }}
                  />
                </div>

                {/* Legal Safeguards & 3-Tier Consent Checkboxes */}
                <div style={{ background: "rgba(0,0,0,0.3)", padding: "16px", borderRadius: "16px", border: "1px solid rgba(255, 215, 0, 0.25)", marginBottom: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
                  <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer", fontSize: "12.5px", color: "#ffd700", fontWeight: 800, lineHeight: 1.4 }}>
                    <input
                      type="checkbox"
                      checked={is18Plus}
                      onChange={(e) => setIs18Plus(e.target.checked)}
                      style={{ marginTop: "2px", width: "16px", height: "16px", accentColor: "#ffd700" }}
                    />
                    <span>
                      🔞 <strong>18+ Age Guard:</strong> I confirm that I am 18 years of age or older. (Required)
                    </span>
                  </label>

                  <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer", fontSize: "12.5px", color: "rgba(255,255,255,0.9)", lineHeight: 1.4 }}>
                    <input
                      type="checkbox"
                      checked={consentVoting}
                      onChange={(e) => setConsentVoting(e.target.checked)}
                      style={{ marginTop: "2px", width: "16px", height: "16px", accentColor: "#ffd700" }}
                    />
                    <span>
                      <strong>Consent 1 (Voting):</strong> I agree that this specific image may be displayed to BuyWise users for competition voting. (Required)
                    </span>
                  </label>

                  <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer", fontSize: "12.5px", color: "rgba(255,255,255,0.9)", lineHeight: 1.4 }}>
                    <input
                      type="checkbox"
                      checked={consentWinner}
                      onChange={(e) => setConsentWinner(e.target.checked)}
                      style={{ marginTop: "2px", width: "16px", height: "16px", accentColor: "#ffd700" }}
                    />
                    <span>
                      <strong>Consent 2 (In-App Winner Spotlight):</strong> If selected as winner, I allow BuyWise to feature my submitted image inside the BuyWise app. (Required)
                    </span>
                  </label>

                  <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer", fontSize: "12.5px", color: "rgba(255,255,255,0.75)", lineHeight: 1.4 }}>
                    <input
                      type="checkbox"
                      checked={consentMarketing}
                      onChange={(e) => setConsentMarketing(e.target.checked)}
                      style={{ marginTop: "2px", width: "16px", height: "16px", accentColor: "#00ff88" }}
                    />
                    <span>
                      <strong>Consent 3 (External Marketing - Optional):</strong> I allow BuyWise to feature my winning look on external social media channels &amp; promotional campaigns.
                    </span>
                  </label>

                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", marginTop: "4px" }}>
                    By submitting, you agree to the <Link href="/competition-terms" target="_blank" style={{ color: "#00ff88", textDecoration: "underline" }}>Official Competition Terms &amp; Conditions</Link>.
                  </div>
                </div>

                <div style={{ display: "flex", gap: "12px" }}>
                  <button
                    onClick={() => setShowCompModal(false)}
                    style={{ flex: 1, padding: "12px", borderRadius: "16px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "white", fontWeight: 800, cursor: "pointer" }}
                  >
                    Save Privately
                  </button>

                  <button
                    onClick={handleCompetitionSubmit}
                    disabled={!is18Plus || !consentVoting || !consentWinner}
                    style={{
                      flex: 1.5,
                      padding: "12px",
                      borderRadius: "16px",
                      background: is18Plus && consentVoting && consentWinner ? "linear-gradient(135deg, #ffd700, #ff8c00)" : "rgba(255,255,255,0.1)",
                      color: is18Plus && consentVoting && consentWinner ? "#000" : "rgba(255,255,255,0.4)",
                      fontWeight: 900,
                      fontSize: "14px",
                      border: "none",
                      cursor: is18Plus && consentVoting && consentWinner ? "pointer" : "not-allowed",
                      boxShadow: is18Plus && consentVoting && consentWinner ? "0 4px 20px rgba(255, 215, 0, 0.4)" : "none"
                    }}
                  >
                    🏆 SUBMIT ENTRY
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Footer Buttons */}
      <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
        <button 
          onClick={() => onCompareAddToLook && onCompareAddToLook(product)}
          style={{ 
            flex: 1, 
            padding: "14px", 
            borderRadius: "14px", 
            border: "1px solid var(--glass-border)", 
            background: "rgba(255,255,255,0.05)", 
            color: "#00d4ff", 
            fontWeight: 800, 
            fontSize: "13px", 
            cursor: "pointer" 
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
            padding: "14px", 
            borderRadius: "14px", 
            border: "none", 
            background: "linear-gradient(135deg, #00ff88, #00d4ff)", 
            color: "#000", 
            fontWeight: 900, 
            fontSize: "13px", 
            textDecoration: "none", 
            textAlign: "center",
            display: "block"
          }}
        >
          {t("BUY ON")} {product.store.toUpperCase()} ↗
        </a>
      </div>
    </div>
  );
}

export default GarmentCanvas;

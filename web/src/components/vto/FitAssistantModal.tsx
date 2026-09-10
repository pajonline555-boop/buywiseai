"use client";
import { useState } from "react";
import { GarmentProduct } from "./GarmentCanvas";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  product?: GarmentProduct;
}

type BodyShape = "Hourglass" | "Pear" | "Rectangle" | "Apple" | "Inverted Triangle" | "Athletic";
type FitPreference = "slim" | "regular" | "relaxed";

export default function FitAssistantModal({ isOpen, onClose, product }: Props) {
  const [heightCm, setHeightCm] = useState<string>("165");
  const [weightKg, setWeightKg] = useState<string>("60");
  const [bodyShape, setBodyShape] = useState<BodyShape>("Hourglass");
  const [fitPreference, setFitPreference] = useState<FitPreference>("regular");
  
  const [isCalculating, setIsCalculating] = useState(false);
  const [report, setReport] = useState<{ size: string; prediction: string; stylingAdvice: string } | null>(null);

  if (!isOpen) return null;

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsCalculating(true);
    setReport(null);

    // Simulate AI calculation delay
    setTimeout(() => {
      const h = parseInt(heightCm, 10) || 165;
      const w = parseInt(weightKg, 10) || 60;
      const bmi = w / ((h / 100) * (h / 100));

      let calculatedSize = "M";
      if (bmi < 18.5) calculatedSize = "S";
      else if (bmi >= 25 && bmi < 30) calculatedSize = "L";
      else if (bmi >= 30) calculatedSize = "XL";

      if (fitPreference === "slim" && calculatedSize !== "S") {
        // Adjust for slim fit preference (size down if possible, purely illustrative)
        if (calculatedSize === "M") calculatedSize = "S";
      } else if (fitPreference === "relaxed" && calculatedSize !== "XL") {
        if (calculatedSize === "M") calculatedSize = "L";
        else if (calculatedSize === "L") calculatedSize = "XL";
      }

      const isSaree = product?.isSaree || product?.category?.toLowerCase().includes("saree") || product?.title.toLowerCase().includes("saree");
      const isWestern = product?.category?.toLowerCase().includes("western") || product?.category?.toLowerCase().includes("gown");
      
      let stylingAdvice = "";
      if (isSaree) {
        if (bodyShape === "Pear") stylingAdvice = "A seedha pallu (Gujarati drape) or a well-pleated Nivi drape will balance your proportions beautifully, highlighting your slender waist while allowing the fabric to fall gracefully over the hips.";
        else if (bodyShape === "Apple") stylingAdvice = "Opt for a longer blouse and a relaxed Nivi drape. Avoid heavy pleating at the waist to create a sleek vertical silhouette.";
        else stylingAdvice = "The classic Nivi drape or a chic Lehenga style drape will perfectly accentuate your curves and the woven patterns of this saree.";
      } else if (isWestern) {
        if (bodyShape === "Pear") stylingAdvice = "This gown's A-line or tiered structure works wonderfully for you. Pair with statement earrings to draw attention upwards.";
        else if (bodyShape === "Rectangle") stylingAdvice = "Consider adding a metallic or embellished waist belt to create a defined waistline and give this gown a stunning hourglass illusion.";
        else stylingAdvice = "This evening gown flatters your shape naturally. Pair with minimalist stilettos for a seamless, elongated look.";
      } else {
        stylingAdvice = `Given your ${bodyShape} shape, this ${product?.title ? "item" : "garment"} will fit comfortably. We recommend your standard size for the best look.`;
      }

      setReport({
        size: calculatedSize,
        prediction: `Based on your BMI (${bmi.toFixed(1)}) and ${bodyShape} shape, the ${calculatedSize} will offer a ${fitPreference} fit.`,
        stylingAdvice
      });
      setIsCalculating(false);
    }, 1200);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.85)",
        backdropFilter: "blur(12px)",
        zIndex: 999999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px"
      }}
      onClick={onClose}
    >
      <div
        className="glass"
        style={{
          maxWidth: "540px",
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          borderRadius: "24px",
          border: "1px solid rgba(0, 255, 136, 0.3)",
          background: "linear-gradient(145deg, rgba(20, 15, 35, 0.95), rgba(10, 8, 20, 0.98))",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.8)",
          color: "white",
          padding: "32px",
          position: "relative"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <img
                src="/ai-assistant.png"
                alt="Maya - BuyWise AI Assistant"
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "2px solid #00ff88",
                  boxShadow: "0 0 15px rgba(0, 255, 136, 0.4)"
                }}
              />
              <span
                style={{
                  position: "absolute",
                  bottom: "0",
                  right: "0",
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  background: "#00ff88",
                  border: "2px solid #140f23"
                }}
              />
            </div>
            <div>
              <h3 style={{ fontSize: "20px", fontWeight: 900, marginBottom: "2px", background: "linear-gradient(90deg, #00ff88, #00d4ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                ✨ Maya — AI Fit & Styling Wizard
              </h3>
              {product && (
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>
                  Analyzing fit for: <span style={{ color: "white" }}>{product.title.length > 35 ? product.title.substring(0, 35) + "..." : product.title}</span>
                </p>
              )}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "white", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.2)"} onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}>✕</button>
        </div>

        {!report && !isCalculating && (
          <form onSubmit={handleCalculate} style={{ animation: "fadeIn 0.4s ease-out" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Height (cm)</label>
                <input
                  type="number"
                  required
                  min="100"
                  max="250"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  style={{ width: "100%", padding: "12px 16px", borderRadius: "12px", background: "rgba(0,0,0,0.3)", border: "1px solid var(--glass-border)", color: "white", fontSize: "15px", fontWeight: 600 }}
                />
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Weight (kg)</label>
                <input
                  type="number"
                  required
                  min="30"
                  max="200"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  style={{ width: "100%", padding: "12px 16px", borderRadius: "12px", background: "rgba(0,0,0,0.3)", border: "1px solid var(--glass-border)", color: "white", fontSize: "15px", fontWeight: 600 }}
                />
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Body Shape</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                {(["Hourglass", "Pear", "Rectangle", "Apple", "Inverted Triangle", "Athletic"] as const).map((shape) => (
                  <button
                    type="button"
                    key={shape}
                    onClick={() => setBodyShape(shape)}
                    style={{
                      padding: "10px",
                      borderRadius: "10px",
                      border: bodyShape === shape ? "1px solid #00d4ff" : "1px solid rgba(255,255,255,0.05)",
                      background: bodyShape === shape ? "rgba(0, 212, 255, 0.15)" : "rgba(255,255,255,0.02)",
                      color: bodyShape === shape ? "#00d4ff" : "var(--text-secondary)",
                      fontWeight: bodyShape === shape ? 800 : 600,
                      fontSize: "12px",
                      cursor: "pointer",
                      transition: "all 0.2s ease"
                    }}
                  >
                    {shape}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: "28px" }}>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Preferred Fit</label>
              <div style={{ display: "flex", gap: "8px" }}>
                {(["slim", "regular", "relaxed"] as const).map((fit) => (
                  <button
                    type="button"
                    key={fit}
                    onClick={() => setFitPreference(fit)}
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: "10px",
                      border: fitPreference === fit ? "1px solid #00ff88" : "1px solid rgba(255,255,255,0.05)",
                      background: fitPreference === fit ? "rgba(0,255,136,0.15)" : "rgba(255,255,255,0.02)",
                      color: fitPreference === fit ? "#00ff88" : "var(--text-secondary)",
                      fontWeight: fitPreference === fit ? 800 : 600,
                      fontSize: "13px",
                      cursor: "pointer",
                      textTransform: "capitalize",
                      transition: "all 0.2s ease"
                    }}
                  >
                    {fit}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" style={{ width: "100%", padding: "16px", borderRadius: "14px", border: "none", background: "linear-gradient(135deg, #00ff88, #00d4ff)", color: "#000", fontSize: "14px", fontWeight: 900, cursor: "pointer", boxShadow: "0 10px 20px -10px rgba(0,255,136,0.5)" }}>
              GENERATE FIT REPORT ✨
            </button>
          </form>
        )}

        {isCalculating && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div className="animate-spin" style={{ fontSize: "40px", marginBottom: "20px", display: "inline-block" }}>✨</div>
            <h4 style={{ fontSize: "16px", fontWeight: 800, color: "#00ff88", marginBottom: "8px" }}>Analyzing Body Geometry</h4>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Mapping your measurements to {product?.title || "this garment"}'s dimensions...</p>
          </div>
        )}

        {report && !isCalculating && (
          <div style={{ animation: "fadeIn 0.5s ease-out" }}>
            {/* Recommended Size Box */}
            <div style={{ background: "rgba(0, 255, 136, 0.08)", border: "1px solid rgba(0, 255, 136, 0.4)", borderRadius: "16px", padding: "24px", textAlign: "center", marginBottom: "20px" }}>
              <div style={{ fontSize: "12px", fontWeight: 800, color: "var(--text-secondary)", letterSpacing: "1px", marginBottom: "8px" }}>RECOMMENDED SIZE</div>
              <div style={{ fontSize: "48px", fontWeight: 900, color: "#00ff88", lineHeight: 1 }}>{report.size}</div>
              <div style={{ fontSize: "13px", color: "var(--text-primary)", marginTop: "12px", lineHeight: 1.5 }}>
                {report.prediction}
              </div>
            </div>

            {/* AI Styling Advice */}
            <div style={{ background: "rgba(0, 212, 255, 0.08)", border: "1px solid rgba(0, 212, 255, 0.3)", borderRadius: "16px", padding: "20px", marginBottom: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                <img
                  src="/ai-assistant.png"
                  alt="Maya AI Stylist"
                  style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover", border: "1.5px solid #00d4ff" }}
                />
                <div>
                  <span style={{ fontSize: "14px", fontWeight: 800, color: "#00d4ff", display: "block" }}>Maya's Personal Styling Advice</span>
                  <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>AI Fashion & Fit Specialist</span>
                </div>
              </div>
              <p style={{ fontSize: "13px", color: "var(--text-primary)", lineHeight: 1.6 }}>
                {report.stylingAdvice}
              </p>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={() => setReport(null)} style={{ flex: 1, padding: "14px", borderRadius: "12px", border: "1px solid var(--glass-border)", background: "rgba(255,255,255,0.05)", color: "white", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
                Recalculate
              </button>
              <button onClick={onClose} style={{ flex: 1, padding: "14px", borderRadius: "12px", border: "none", background: "#00ff88", color: "#000", fontSize: "13px", fontWeight: 900, cursor: "pointer" }}>
                Got it
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

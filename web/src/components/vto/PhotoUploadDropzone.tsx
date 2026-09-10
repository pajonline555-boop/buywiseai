"use client"
import { useState, useRef } from "react";
import Image from "next/image";
import { useTranslation } from "@/lib/i18n/i18nContext";

interface Props {
  userPhotoUrl: string | null;
  onPhotoSelected: (url: string, fileInfo: { mimeType: string; sizeBytes: number; width: number; height: number }) => void;
  onPhotoDeleted: () => void;
}

export default function PhotoUploadDropzone({ userPhotoUrl, onPhotoSelected, onPhotoDeleted }: Props) {
  const [dragActive, setDragActive] = useState(false);
  const [hasConsent, setHasConsent] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  const validateAndProcessFile = (file: File) => {
    setErrorMessage(null);

    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedMimeTypes.includes(file.type)) {
      setErrorMessage(t("Unsupported format. Please upload JPG, JPEG, PNG, or WebP."));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage(t("File size exceeds 10MB limit."));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const resultUrl = e.target?.result as string;
      const img = new window.Image();
      img.onload = () => {
        if (img.width < 300 || img.height < 300) {
          setErrorMessage(t("Photo resolution is too low. Please upload a photo with at least 400x400 resolution."));
          return;
        }
        onPhotoSelected(resultUrl, {
          mimeType: file.type,
          sizeBytes: file.size,
          width: img.width,
          height: img.height
        });
      };
      img.src = resultUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (!hasConsent) {
      setErrorMessage(t("Please accept privacy consent before uploading."));
      return;
    }
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!hasConsent) {
      setErrorMessage(t("Please accept privacy consent before uploading."));
      return;
    }
    if (e.target.files && e.target.files[0]) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  return (
    <div className="glass" style={{ padding: "20px 24px", borderRadius: "24px", background: "rgba(255, 255, 255, 0.02)", border: "1px dashed var(--primary)", marginBottom: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        
        {/* Left Side: Photo Avatar & Status */}
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <div style={{ position: "relative", width: "70px", height: "70px", borderRadius: "50%", overflow: "hidden", border: "3px solid #00ff88", flexShrink: 0, background: "#100d24" }}>
            {userPhotoUrl ? (
              <Image src={userPhotoUrl} alt="User Base Photo" fill style={{ objectFit: "cover" }} />
            ) : (
              <span style={{ fontSize: "28px", display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>📸</span>
            )}
          </div>

          <div>
            <h3 style={{ fontSize: "17px", fontWeight: 800, color: "white", marginBottom: "4px" }}>
              {userPhotoUrl ? t("Your Identity, Body & Pose Preserved ✨") : t("Upload Your Photo for AI Try-On")}
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginBottom: "8px" }}>
              {userPhotoUrl 
                ? t("Base photo active. Search any saree, gown, suit, or jewellery below to virtually try on!")
                : t("Upload a front-facing standing photo or portrait (JPG, PNG, WebP up to 10MB).")}
            </p>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "10px", fontWeight: 800, color: "#00ff88", background: "rgba(0, 255, 136, 0.1)", padding: "2px 8px", borderRadius: "8px" }}>
                {t("Mode A: Selfie (Jewellery & Tops)")}
              </span>
              <span style={{ fontSize: "10px", fontWeight: 800, color: "#00d4ff", background: "rgba(0, 212, 255, 0.1)", padding: "2px 8px", borderRadius: "8px" }}>
                {t("Mode B: Half Body (Sarees & Suits)")}
              </span>
              <span style={{ fontSize: "10px", fontWeight: 800, color: "#ff0080", background: "rgba(255, 0, 128, 0.1)", padding: "2px 8px", borderRadius: "8px" }}>
                {t("Mode C: Full Body (Lehengas & Gowns)")}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Upload & Delete Action Controls */}
        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />

          <button
            onClick={() => onPhotoSelected("https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80", { mimeType: "image/jpeg", sizeBytes: 500000, width: 800, height: 1200 })}
            style={{ padding: "10px 18px", borderRadius: "30px", border: "1px solid rgba(0, 255, 136, 0.4)", background: "rgba(0, 255, 136, 0.12)", color: "#00ff88", fontSize: "13px", fontWeight: 800, cursor: "pointer" }}
          >
            💃 {t("Use Standing Sample Model")}
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-primary"
            style={{ padding: "10px 22px", fontSize: "13px", fontWeight: 800, borderRadius: "30px", background: "linear-gradient(90deg, #ff007f, #7928ca)" }}
          >
            {userPhotoUrl ? `📷 ${t("Upload New Photo")}` : `📸 ${t("Upload Your Photo")}`}
          </button>

          {userPhotoUrl && (
            <button
              onClick={onPhotoDeleted}
              style={{ padding: "10px 18px", borderRadius: "30px", border: "1px solid rgba(255, 77, 77, 0.4)", background: "rgba(255, 77, 77, 0.12)", color: "#ff4d4d", fontSize: "13px", fontWeight: 800, cursor: "pointer" }}
            >
              🗑️ {t("Clear Photo")}
            </button>
          )}
        </div>
      </div>

      {/* Privacy Consent Checkbox */}
      <div style={{ marginTop: "14px", display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--text-secondary)" }}>
        <input
          type="checkbox"
          id="privacy-consent"
          checked={hasConsent}
          onChange={(e) => setHasConsent(e.target.checked)}
          style={{ accentColor: "var(--primary)", cursor: "pointer" }}
        />
        <label htmlFor="privacy-consent" style={{ cursor: "pointer" }}>
          {t("Your photo is used solely for generating your private virtual try-on preview. We respect your privacy.")}
        </label>
      </div>

      {errorMessage && (
        <div style={{ marginTop: "10px", padding: "8px 14px", borderRadius: "10px", background: "rgba(255, 77, 77, 0.15)", border: "1px solid rgba(255, 77, 77, 0.4)", color: "#ff4d4d", fontSize: "12px", fontWeight: 700 }}>
          ⚠️ {errorMessage}
        </div>
      )}
    </div>
  );
}

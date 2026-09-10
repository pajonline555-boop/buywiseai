"use client"
import VirtualTryOnStudio from "./vto/VirtualTryOnStudio";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function SelfieDressTryOnModal({ isOpen, onClose }: Props) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.96)",
        backdropFilter: "blur(22px)",
        zIndex: 999999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px"
      }}
      onClick={onClose}
    >
      <div
        className="glass"
        style={{
          maxWidth: "1280px",
          width: "100%",
          maxHeight: "96vh",
          overflowY: "auto",
          borderRadius: "28px",
          border: "1px solid var(--primary)",
          background: "#080612",
          color: "white",
          padding: "24px",
          position: "relative"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "20px",
            right: "24px",
            background: "rgba(255,255,255,0.1)",
            border: "none",
            color: "white",
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            cursor: "pointer",
            fontSize: "20px",
            zIndex: 100
          }}
        >
          ✕
        </button>

        <VirtualTryOnStudio />
      </div>
    </div>
  );
}

"use client"
import { useState } from "react";
import { useTranslation } from "@/lib/i18n/i18nContext";

interface Props {
  onSearch: (query: string) => void;
  onImportUrl: (url: string) => void;
  activeCategory: string;
  onCategorySelect: (category: string) => void;
}

export const VTO_CATEGORIES = [
  { id: "all", label: "🔥 All Items" },
  { id: "sarees", label: "🥻 Sarees & Ethnic Wear" },
  { id: "anarkali", label: "👗 Salwar Suits & Anarkali" },
  { id: "western", label: "🌸 Western Dresses & Gowns" },
  { id: "jewellery", label: "💎 Jewellery & Accessories" },
  { id: "mens_suits", label: "🤵 Men's Suits & Blazers" },
  { id: "sherwanis", label: "✨ Men's Sherwanis & Kurtas" },
  { id: "undergarments", label: "👙 Undergarments & Lingerie" }
];

export default function ProductDiscoveryBar({ onSearch, onImportUrl, activeCategory, onCategorySelect }: Props) {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"search" | "import">("search");
  const [importUrl, setImportUrl] = useState("");
  const { t } = useTranslation();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      // Check if user pasted a URL in the main search bar directly
      if (query.startsWith("http://") || query.startsWith("https://")) {
        onImportUrl(query.trim());
      } else {
        onSearch(query.trim());
      }
    }
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (importUrl.trim()) {
      onImportUrl(importUrl.trim());
    }
  };

  return (
    <div style={{ marginBottom: "28px" }}>
      {/* Mode Switcher Tabs */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "14px" }}>
        <button
          type="button"
          onClick={() => setActiveTab("search")}
          style={{
            padding: "8px 18px",
            borderRadius: "14px",
            border: activeTab === "search" ? "1px solid var(--primary)" : "1px solid var(--glass-border)",
            background: activeTab === "search" ? "rgba(138, 43, 226, 0.2)" : "rgba(255,255,255,0.03)",
            color: "white",
            fontWeight: 800,
            fontSize: "13px",
            cursor: "pointer"
          }}
        >
          🔍 {t("Discover Products & Partners")}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("import")}
          style={{
            padding: "8px 18px",
            borderRadius: "14px",
            border: activeTab === "import" ? "1px solid #00ff88" : "1px solid var(--glass-border)",
            background: activeTab === "import" ? "rgba(0, 255, 136, 0.15)" : "rgba(255,255,255,0.03)",
            color: activeTab === "import" ? "#00ff88" : "white",
            fontWeight: 800,
            fontSize: "13px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          <span>📦 {t("Import Product URL")}</span>
          <span style={{ fontSize: "10px", background: "rgba(0,255,136,0.2)", padding: "2px 6px", borderRadius: "6px" }}>Amazon / Flipkart / Meesho</span>
        </button>
      </div>

      {/* Mode A: Search Bar */}
      {activeTab === "search" && (
        <form onSubmit={handleSearchSubmit} className="glass" style={{ display: "flex", alignItems: "center", padding: "8px 12px", borderRadius: "50px", border: "1px solid var(--glass-border)", marginBottom: "16px" }}>
          <span style={{ fontSize: "18px", marginLeft: "12px", marginRight: "8px" }}>🔍</span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("Search sarees, Kanjivaram silk, Zara dress, Tanishq gold necklace or paste Amazon link...")}
            style={{ flex: 1, background: "transparent", border: "none", color: "white", padding: "10px 12px", outline: "none", fontSize: "15px" }}
          />
          <button type="submit" className="btn-primary" style={{ padding: "10px 24px", fontSize: "13px", fontWeight: 800 }}>
            {t("Discover & Try On ➔")}
          </button>
        </form>
      )}

      {/* Mode B: Import Retailer Product URL Bar */}
      {activeTab === "import" && (
        <form onSubmit={handleImportSubmit} className="glass" style={{ display: "flex", alignItems: "center", padding: "8px 12px", borderRadius: "50px", border: "1px solid rgba(0, 255, 136, 0.4)", background: "rgba(0, 255, 136, 0.04)", marginBottom: "16px" }}>
          <span style={{ fontSize: "18px", marginLeft: "12px", marginRight: "8px" }}>🔗</span>
          <input
            type="url"
            required
            value={importUrl}
            onChange={(e) => setImportUrl(e.target.value)}
            placeholder={t("Paste Amazon, Flipkart, Meesho, Myntra product link or image URL...")}
            style={{ flex: 1, background: "transparent", border: "none", color: "white", padding: "10px 12px", outline: "none", fontSize: "15px" }}
          />
          <button
            type="submit"
            className="btn-primary"
            style={{
              padding: "10px 24px",
              fontSize: "13px",
              fontWeight: 800,
              background: "linear-gradient(90deg, #00ff88, #00d4ff)",
              color: "#080612"
            }}
          >
            {t("Import to Try-On ✨")}
          </button>
        </form>
      )}

      {/* Category Pills */}
      <div style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "6px" }}>
        {VTO_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onCategorySelect(cat.id)}
            style={{
              padding: "8px 18px",
              borderRadius: "16px",
              border: activeCategory === cat.id ? "1px solid var(--primary)" : "1px solid var(--glass-border)",
              background: activeCategory === cat.id ? "var(--gradient-accent)" : "rgba(255,255,255,0.05)",
              color: "white",
              fontWeight: 800,
              fontSize: "13px",
              cursor: "pointer",
              whiteSpace: "nowrap"
            }}
          >
            {t(cat.label)}
          </button>
        ))}
      </div>
    </div>
  );
}

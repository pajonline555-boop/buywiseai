"use client"
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n/i18nContext";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [isNativeApp, setIsNativeApp] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (typeof window !== "undefined" && (navigator.userAgent.includes("BuyWiseNativeApp") || navigator.userAgent.includes("BuyWiseApp"))) {
      setIsNativeApp(true);
    }
  }, []);

  if (isNativeApp) return null;

  const navItems = [
    { label: t("nav_home"), href: "/", icon: "🏠" },
    { label: t("nav_try_on"), href: "/try-on", icon: "✨", highlight: true },
    { label: t("price_alerts"), href: "/alerts", icon: "🔔" },
    { label: t("buywise_partners_portal"), href: "/partner-portal", icon: "⚡" },
    { label: t("nav_profile"), href: "/profile", icon: "👤" },
  ];

  return (
    <div
      className="mobile-only"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 99999,
        background: "rgba(12, 10, 20, 0.94)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(255, 255, 255, 0.12)",
        padding: "8px 12px calc(8px + env(safe-area-inset-bottom, 0px)) 12px",
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center"
      }}
    >
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              textDecoration: "none",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "3px",
              padding: "4px 10px",
              borderRadius: "12px",
              color: isActive ? "var(--primary)" : "rgba(255, 255, 255, 0.6)",
              transition: "all 0.2s ease"
            }}
          >
            <span style={{ fontSize: item.highlight ? "20px" : "18px" }}>{item.icon}</span>
            <span
              style={{
                fontSize: "11px",
                fontWeight: isActive ? 900 : 600,
                color: isActive ? "var(--primary)" : "rgba(255, 255, 255, 0.7)"
              }}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

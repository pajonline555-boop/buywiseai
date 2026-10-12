"use client"
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n/i18nContext";
import { useAuth, checkIsAdminUser } from "@/lib/AuthContext";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [isNativeApp, setIsNativeApp] = useState(false);
  const { t } = useTranslation();
  const { user, userProfile, isAdmin } = useAuth();

  const isUserAdmin = isAdmin || userProfile?.role === "admin" || checkIsAdminUser(user?.email, user?.phoneNumber);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isNativeAgent = navigator.userAgent.includes("BuyWiseNativeApp") || navigator.userAgent.includes("BuyWiseApp") || navigator.userAgent.includes("AndroidWebView");
      const isParamNative = new URLSearchParams(window.location.search).get("native") === "true" || new URLSearchParams(window.location.search).get("in_app") === "1";
      if (isNativeAgent || isParamNative) {
        setIsNativeApp(true);
      }
    }
  }, []);

  if (isNativeApp) return null;

  const navItems = [
    { label: t("nav_home"), href: "/", icon: "🏠" },
    { label: t("nav_try_on"), href: "/try-on", icon: "✨", highlight: true },
    { label: t("price_alerts"), href: "/alerts", icon: "🔔" },
    { label: t("buywise_partners_portal"), href: "/partners", icon: "⚡" },
    ...(isUserAdmin ? [{ label: "Admin", href: "/admin", icon: "👑" }] : []),
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
        background: "rgba(10, 7, 22, 0.96)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderTop: "1px solid rgba(255, 255, 255, 0.12)",
        padding: "6px 8px calc(6px + env(safe-area-inset-bottom, 0px)) 8px",
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        boxShadow: "0 -10px 30px rgba(0, 0, 0, 0.7)"
      }}
    >
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        if (item.highlight) {
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                textDecoration: "none",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "2px",
                padding: "6px 14px",
                borderRadius: "18px",
                background: "linear-gradient(135deg, #a855f7, #ff007f)",
                color: "#ffffff",
                boxShadow: "0 4px 18px rgba(255, 0, 127, 0.5)",
                transform: "translateY(-4px)",
                transition: "all 0.2s ease"
              }}
            >
              <span style={{ fontSize: "19px" }}>{item.icon}</span>
              <span style={{ fontSize: "10px", fontWeight: 900, letterSpacing: "0.02em" }}>
                {item.label}
              </span>
            </Link>
          );
        }

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
              padding: "5px 10px",
              borderRadius: "12px",
              color: isActive ? "#00ff88" : "rgba(255, 255, 255, 0.6)",
              transition: "all 0.2s ease",
              background: isActive ? "rgba(0, 255, 136, 0.1)" : "transparent"
            }}
          >
            <span style={{ fontSize: "18px" }}>{item.icon}</span>
            <span
              style={{
                fontSize: "10px",
                fontWeight: isActive ? 900 : 600,
                color: isActive ? "#00ff88" : "rgba(255, 255, 255, 0.7)"
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

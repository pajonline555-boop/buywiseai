import type { Metadata, Viewport } from "next";
import "./globals.css";
import Chatbot from "@/components/Chatbot";
import MobileBottomNav from "@/components/MobileBottomNav";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
import { AuthProvider } from "@/lib/AuthContext";
import Link from "next/link";
import Image from "next/image";

import { ThemeProvider } from "@/lib/theme/themeProvider";
import { I18nProvider } from "@/lib/i18n/i18nContext";

export const metadata: Metadata = {
  metadataBase: new URL("https://buywiseai.pajonline.co.in"),
  title: "BuyWise AI | Ultimate Product Comparison & Smart Price Drop Alerts",
  description: "Compare live product prices across Amazon India, Flipkart, Myntra, Croma & Meesho with AI-driven deal analysis and AI Virtual Try-On.",
  manifest: "/manifest.json",
  alternates: {
    canonical: "https://buywiseai.pajonline.co.in",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "BuyWise AI | Ultimate Product Comparison & Smart Price Drop Alerts",
    description: "Compare live product prices across Amazon India, Flipkart, Myntra, Croma & Meesho with AI-driven deal analysis and AI Virtual Try-On.",
    url: "https://buywiseai.pajonline.co.in",
    siteName: "BuyWise AI",
    images: [
      {
        url: "/logo-icon.png",
        width: 512,
        height: 512,
        alt: "BuyWise AI Official Logo",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BuyWise AI | Ultimate Product Comparison & Smart Price Drop Alerts",
    description: "Compare live product prices across Amazon India, Flipkart, Myntra, Croma & Meesho with AI-driven deal analysis and AI Virtual Try-On.",
    images: ["/logo-icon.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0C0A14",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://m.media-amazon.com" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0C0A14" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="google-site-verification" content="google8a5cb96a7c1c518a" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "BuyWise AI",
              "url": "https://buywiseai.pajonline.co.in",
              "description": "AI-Powered Product Comparison, Live Price Drop Alerts & AI Virtual Try-On Platform.",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://buywiseai.pajonline.co.in/search?q={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <I18nProvider>
            <AuthProvider>
              <AppHeader />
              {children}
              <Chatbot />
              <MobileBottomNav />
              <AppFooter />

            </AuthProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

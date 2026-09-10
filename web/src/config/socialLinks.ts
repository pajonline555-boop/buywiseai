export interface SocialPlatform {
  id: string;
  name: string;
  url: string;
  handle: string;
  actionText: string;
  badge?: string;
  color: string;
  bgColor: string;
  borderColor: string;
  glowColor: string;
  gradient?: string;
  iconPath: string;
  description: string;
  isDelinked?: boolean;
}

export const SOCIAL_CONFIG = {
  title: "Follow & Community",
  subtitle: "Connect with us on Instagram, WhatsApp, Telegram, Facebook, X & LinkedIn.",
  platforms: [
    {
      id: "youtube",
      name: "YouTube",
      url: "#",
      handle: "Coming Soon",
      actionText: "Channel Coming Soon",
      badge: "Coming Soon",
      color: "#FF0000",
      bgColor: "rgba(255, 0, 0, 0.15)",
      borderColor: "rgba(255, 0, 0, 0.5)",
      glowColor: "rgba(255, 0, 0, 0.6)",
      gradient: "linear-gradient(135deg, #ff0000, #cc0000)",
      description: "BuyWise AI YouTube channel coming soon",
      iconPath: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
      isDelinked: true,
    },
    {
      id: "instagram",
      name: "Instagram",
      url: "https://instagram.com/buywiseai",
      handle: "@buywiseai",
      actionText: "Follow Instagram",
      badge: "Live Stories",
      color: "#E1306C",
      bgColor: "rgba(225, 48, 108, 0.15)",
      borderColor: "rgba(225, 48, 108, 0.5)",
      glowColor: "rgba(225, 48, 108, 0.6)",
      gradient: "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
      description: "Daily outfit inspiration & instant price alerts",
      iconPath: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
    },
    {
      id: "whatsapp",
      name: "WhatsApp",
      url: "https://wa.me/919999999999?text=Hi%20BuyWise%20AI,%20I%20want%20to%20get%20price%20drop%20alerts",
      handle: "WhatsApp Support",
      actionText: "Chat on WhatsApp",
      badge: "Instant Support",
      color: "#25D366",
      bgColor: "rgba(37, 211, 102, 0.15)",
      borderColor: "rgba(37, 211, 102, 0.5)",
      glowColor: "rgba(37, 211, 102, 0.6)",
      gradient: "linear-gradient(135deg, #25d366, #128c7e)",
      description: "Direct WhatsApp support & instant price drop alerts",
      iconPath: "M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"
    },
    {
      id: "telegram",
      name: "Telegram",
      url: "https://t.me/buywiseai",
      handle: "@buywiseai",
      actionText: "Join Telegram Channel",
      badge: "Hot Deals VIP",
      color: "#24A1DE",
      bgColor: "rgba(36, 161, 222, 0.15)",
      borderColor: "rgba(36, 161, 222, 0.5)",
      glowColor: "rgba(36, 161, 222, 0.6)",
      gradient: "linear-gradient(135deg, #24a1de, #0088cc)",
      description: "Real-time deal drop broadcasts & coupon codes",
      iconPath: "M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.562 8.161c-.18.717-.962 4.084-1.362 5.797-.169.727-.436.97-.695.994-.564.053-.993-.372-1.54-.73-.855-.56-1.338-.908-2.167-1.454-.959-.63-.337-.977.209-1.544.143-.148 2.627-2.406 2.675-2.612.006-.026.012-.124-.047-.176-.058-.052-.144-.034-.207-.02-.089.02-1.503.955-4.242 2.805-.401.275-.765.41-1.091.403-.361-.008-1.054-.204-1.569-.371-.633-.206-1.134-.315-1.09-.666.023-.183.272-.371.747-.565 2.923-1.274 4.872-2.115 5.848-2.523 2.784-1.166 3.362-1.368 3.738-1.375.083-.001.268.02.388.118.101.082.13.194.143.273.013.078.028.257.016.399z"
    },
    {
      id: "facebook",
      name: "Facebook",
      url: "https://facebook.com/buywiseai",
      handle: "BuyWise AI",
      actionText: "Like Facebook Page",
      badge: "Community",
      color: "#1877F2",
      bgColor: "rgba(24, 119, 242, 0.15)",
      borderColor: "rgba(24, 119, 242, 0.5)",
      glowColor: "rgba(24, 119, 242, 0.6)",
      gradient: "linear-gradient(135deg, #1877f2, #0056b3)",
      description: "Community deal discussions & product recommendations",
      iconPath: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
    },
    {
      id: "x",
      name: "X (Twitter)",
      url: "https://x.com/buywiseai",
      handle: "@buywiseai",
      actionText: "Follow on X",
      badge: "Flash Alerts",
      color: "#FFFFFF",
      bgColor: "rgba(255, 255, 255, 0.12)",
      borderColor: "rgba(255, 255, 255, 0.4)",
      glowColor: "rgba(255, 255, 255, 0.5)",
      gradient: "linear-gradient(135deg, #333333, #000000)",
      description: "Flash price error alerts & tech deal updates",
      iconPath: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
    },
    {
      id: "linkedin",
      name: "LinkedIn",
      url: "https://linkedin.com/company/buywiseai",
      handle: "BuyWise AI",
      actionText: "Connect on LinkedIn",
      badge: "Company News",
      color: "#0A66C2",
      bgColor: "rgba(10, 102, 194, 0.15)",
      borderColor: "rgba(10, 102, 194, 0.5)",
      glowColor: "rgba(10, 102, 194, 0.6)",
      gradient: "linear-gradient(135deg, #0a66c2, #004182)",
      description: "Company updates, partner programs & career openings",
      iconPath: "M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"
    }
  ] as SocialPlatform[]
};

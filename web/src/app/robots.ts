import { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://buywiseai.pajonline.co.in";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/partner-dashboard/",
        "/api/",
        "/profile/",
        "/verify-email/"
      ]
    },
    sitemap: `${baseUrl}/sitemap.xml`
  };
}

import { MetadataRoute } from "next";
import { getProductionProducts } from "@/lib/categoryData";
import { isIndexableProduct } from "@/lib/seo/productSeo";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://buywiseai.pajonline.co.in";
  const now = new Date().toISOString();

  const staticRoutes = [
    "",
    "/store",
    "/categories",
    "/coupons",
    "/search",
    "/try-on",
    "/knowledge",
    "/faq",
    "/affiliate-disclosure",
    "/privacy-policy",
    "/terms-of-service"
  ];

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map(route => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1.0 : 0.8
  }));

  const productEntries: MetadataRoute.Sitemap = getProductionProducts()
    .filter(p => isIndexableProduct(p) && p.environment !== "TEST")
    .map(p => {
      const slug = p.slug || p.id;
      return {
        url: `${baseUrl}/product/${encodeURIComponent(slug)}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.9
      };
    });

  return [...staticEntries, ...productEntries];
}

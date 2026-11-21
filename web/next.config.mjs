/** @type {import('next').NextConfig} */
const isStaticExport = process.env.NEXT_STATIC_EXPORT?.trim() === "true" || process.env.OUTPUT_EXPORT === "true";

const nextConfig = {
  output: isStaticExport ? "export" : "standalone",
  ...(isStaticExport ? { trailingSlash: true } : {}),
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
};

export default nextConfig;

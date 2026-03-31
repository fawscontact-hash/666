import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],       // serve AVIF/WebP automatically
    deviceSizes: [430, 768, 1080, 1280, 1920],   // breakpoints for srcset
    imageSizes: [64, 128, 256, 384],             // for fixed-size images
    minimumCacheTTL: 86400,                      // cache optimized images 24h
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "3000",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;

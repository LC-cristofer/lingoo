import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Browsers that ask for /favicon.ico anyway get the app icon instead of a 404.
  async rewrites() {
    return [{ source: "/favicon.ico", destination: "/icons/icon-192.png" }];
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

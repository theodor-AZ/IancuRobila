import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  devIndicators: false,
  // the scanner runs a real browser on the server
  serverExternalPackages: ["@axe-core/playwright", "axe-core"],
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    root: path.resolve("."),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

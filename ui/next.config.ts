import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  devIndicators: false,
  // the scanner runs a real browser on the server
  serverExternalPackages: ["@axe-core/playwright", "axe-core"],
  cacheComponents: true,
  partialPrefetching: true,
  // old routes from the previous UI open the template's New scan tab
  async redirects() {
    return [
      { source: "/scan/new", destination: "/?tab=new", permanent: false },
      { source: "/coleg1/:path*", destination: "/", permanent: false },
      { source: "/styleguide", destination: "/", permanent: false },
    ];
  },
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

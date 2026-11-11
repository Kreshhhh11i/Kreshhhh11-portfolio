import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.resolve(process.cwd(), ".."),
  // Keep local production profiling isolated from a running development server.
  distDir: process.env.PORTFOLIO_PERF_BUILD === "1" ? "build" : ".next",
  /* config options here */
  allowedDevOrigins: [
    "192.168.0.246",
    "192.168.*.*",
  ],
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    qualities: [75, 90],
  },
  turbopack: {
    root: path.resolve(process.cwd(), ".."),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

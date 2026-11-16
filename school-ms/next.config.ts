import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  typescript: { ignoreBuildErrors: false },
  // The app is previewed from a proxied sandbox host, so let the dev server
  // serve its own dev resources (HMR, error overlay) to that origin.
  allowedDevOrigins: ["*.e2b.app", "*.arena.ai", "localhost", "127.0.0.1"],
};

export default nextConfig;

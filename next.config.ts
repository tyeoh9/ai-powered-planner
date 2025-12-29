import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Empty turbopack config to silence warning (allows turbopack to work)
  turbopack: {},
  reactStrictMode: true,
  devIndicators: false,
};

export default nextConfig;

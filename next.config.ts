import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  turbopack: {},
  reactStrictMode: true,
  devIndicators: false,
};

export default nextConfig;

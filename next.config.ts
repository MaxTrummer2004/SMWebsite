import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  // Disable source maps in production to protect code
  productionBrowserSourceMaps: false,
  // Pin the workspace root (multiple lockfiles exist higher up the tree)
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;

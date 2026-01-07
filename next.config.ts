import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Disable symlink creation on Windows to avoid permission issues
    outputFileTracingRoot: process.cwd(),
  },
};

export default nextConfig;

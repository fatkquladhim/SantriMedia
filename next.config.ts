import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Reduce bundle size by tree-shaking lucide-react icons
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  // Remove X-Powered-By header
  poweredByHeader: false,
};

export default nextConfig;

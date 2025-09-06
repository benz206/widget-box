import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Continue to lint in CI, but don't block production builds locally
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;

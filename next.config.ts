import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**"
      }
    ]
  },
  outputFileTracingIncludes: {
    "/*": [
      "./backend/node_modules/.prisma/client/**/*",
      "./backend/node_modules/@prisma/client/**/*",
      "./backend/prisma/**/*"
    ]
  }
};

export default nextConfig;

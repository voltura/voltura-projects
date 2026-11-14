import type { NextConfig } from "next";
import { resolve } from "node:path";

const nextConfig: NextConfig = {
  webpack(config) {
    config.resolve.alias['@/lib/server-catalog$'] = resolve('lib/vercel-catalog.ts');
    return config;
  },
};

export default nextConfig;

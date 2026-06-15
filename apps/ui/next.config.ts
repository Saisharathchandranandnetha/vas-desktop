import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: false,
  },
  // Electron loads the app from file:// or localhost
  // Allow images from any source
  images: {
    unoptimized: true,
  },
  // Disable x-powered-by header
  poweredByHeader: false,
};

export default nextConfig;

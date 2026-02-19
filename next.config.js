const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: {
    disableDevLogs: true,
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [],
  },
  images: {
    domains: [],
    formats: ['image/webp', 'image/avif'],
  },
  // Optimize for tablet devices
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // PWA and offline support
  reactStrictMode: true,
  swcMinify: true,
};

module.exports = withPWA(nextConfig);
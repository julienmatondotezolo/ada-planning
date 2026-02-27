const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: {
    disableDevLogs: true,
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use empty turbopack config to silence Turbopack warnings
  turbopack: {},
  
  // Hide dev indicator
  devIndicators: false,
  
  // Updated from experimental.serverComponentsExternalPackages
  serverExternalPackages: [],
  
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
  
  // Force webpack mode to avoid Turbopack issues
  webpack: (config) => {
    return config;
  },
};

module.exports = withPWA(nextConfig);
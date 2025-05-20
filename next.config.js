/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: true,
  // Ensure prerender-manifest.js is generated
  experimental: {
    // This is experimental but may help with the issue
    serverComponentsExternalPackages: ['@prisma/client'],
  },
};

module.exports = nextConfig;

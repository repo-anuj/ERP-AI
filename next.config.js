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

  // Disable middleware to avoid the EvalError
  skipMiddlewareUrlNormalize: true,
  skipTrailingSlashRedirect: true,

  // Experimental features
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
    instrumentationHook: false, // Disable instrumentation hook
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

module.exports = nextConfig;

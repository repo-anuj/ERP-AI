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
    // Improve Edge Runtime compatibility
    optimizePackageImports: ['jose'],
    // Configure middleware to run in Node.js runtime instead of Edge
    // This can help with compatibility issues
    middleware: {
      // Use the Node.js runtime for middleware
      // This can help with jose library compatibility
      runtime: "nodejs"
    }
  },
};

module.exports = nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false, // Enable TypeScript checking in production
  },
  images: {
    unoptimized: true,
    domains: [], // Add your image domains here if needed
    formats: ['image/webp', 'image/avif'],
  },
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
  compress: true,

  // External packages for server components (Next.js 15+)
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],

  // Performance optimizations
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
  experimental: {
    optimizePackageImports: ['jose', 'lucide-react', '@radix-ui/react-icons'],
    // Enable Edge Runtime for middleware
    allowMiddlewareResponseBody: true,
    // Optimize for serverless
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs'],
  },

  // Configure allowed origins for cross-origin requests
  allowedDevOrigins: [
    'erp-ai-3bfk.onrender.com',
    'localhost:3000',
    '127.0.0.1:3000',
  ],

  // Webpack optimizations
  webpack: (config, { isServer, dev }) => {
    // Optimize bundle size
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }

    // Optimize Prisma for serverless
    config.externals = [...(config.externals || []), '_http_common'];

    // Edge Runtime optimizations
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks?.cacheGroups,
            jose: {
              name: 'jose',
              chunks: 'all',
              test: /[\\/]node_modules[\\/]jose[\\/]/,
              priority: 30,
            },
          },
        },
      };
    }

    return config;
  },

  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

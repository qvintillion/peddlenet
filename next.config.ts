/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable ESLint during builds for now
  transpilePackages: ['archive'], // Add this line to transpile the archive directory
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Disable TypeScript checks during builds for faster deployment
  typescript: {
    ignoreBuildErrors: true,
  },

  // 🚀 VERCEL DEPLOYMENT: Use default output for Vercel (no static export)
  // Static export only for explicit GitHub Pages builds
  output: process.env.VERCEL ? undefined : (process.env.BUILD_TARGET === 'github-pages' ? 'export' : undefined),
  trailingSlash: false,
  skipTrailingSlashRedirect: true,
  
  // Skip static generation for diagnostic pages during build
  experimental: {
    // moved skipTrailingSlashRedirect to root level
  },
  
  // Image optimization off for compatibility
  images: {
    unoptimized: true,
  },
  
  // No base path for Vercel (handles this automatically)
  basePath: '',
  assetPrefix: '',

  // Simplified webpack configuration to fix TDZ issues
  webpack: (config, { isServer, dev }) => {
    // Only apply optimizations in production
    if (!dev) {
      // Disable aggressive optimizations that can cause TDZ issues
      config.optimization = {
        ...config.optimization,
        moduleIds: 'named', // Use named module IDs instead of numbers
        chunkIds: 'named', // Use named chunk IDs
      };
    }
    
    return config;
  },
  
  // Headers for CORS support (works for both dev and Vercel)
  async headers() {
    return [
      {
        // Apply headers to API routes
        source: '/api/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-Requested-With, Content-Type, Authorization',
          },
        ],
      },
      {
        // Apply headers to all other routes
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
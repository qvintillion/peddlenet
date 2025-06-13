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

  // Static export for GitHub Pages
  output: 'export',
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
  
  // Only add headers for non-export builds
  ...(!process.env.BUILD_TARGET && {
    // Headers for CORS support (only for dev/server mode)
    async headers() {
      return [
        {
          // Apply headers to all routes
          source: '/(.*)',
          headers: [
            {
              key: 'Access-Control-Allow-Origin',
              value: '*', // Allow all origins in development
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
      ];
    },
  }),
};

module.exports = nextConfig;
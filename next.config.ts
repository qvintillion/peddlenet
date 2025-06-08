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

  // Output for Firebase hosting (static export)
  output: process.env.BUILD_TARGET === 'firebase' ? 'export' : undefined,
  trailingSlash: process.env.BUILD_TARGET === 'firebase' ? true : false,
  
  // Disable problematic features for Firebase export
  ...(process.env.BUILD_TARGET === 'firebase' && {
    // Skip build-time optimizations that don't work with export
    experimental: {
      // Remove the problematic optimizePackageImports
    },
  }),
  
  // Image optimization off for compatibility
  images: {
    unoptimized: true,
  },
  
  // Headers for CORS support
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
};

module.exports = nextConfig;
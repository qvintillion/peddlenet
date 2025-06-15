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

  // 🚀 DEPLOYMENT OUTPUT LOGIC (FIXED):
  // Only use static export for explicit GitHub Pages builds
  // Firebase should ALWAYS use regular Next.js builds with SSR/functions
  output: (() => {
    if (process.env.VERCEL) return undefined; // Vercel default
    if (process.env.BUILD_TARGET === 'github-pages') return 'export'; // ONLY for GitHub Pages
    // Firebase (staging, production, etc.) should NEVER use static export
    return undefined; // Default: regular Next.js build with SSR support
  })(),
  
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

  // Simplified webpack configuration for dev stability
  webpack: (config, { isServer, dev }) => {
    // DEV: Keep it simple to avoid cache corruption
    if (dev) {
      // Reduce cache complexity in development
      config.cache = {
        type: 'memory', // Use memory cache instead of filesystem
      };
    } else {
      // Production: Use the stable configurations
      config.optimization = {
        ...config.optimization,
        moduleIds: 'named',
        chunkIds: 'named',
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
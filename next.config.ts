/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable ESLint during builds for now
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Disable TypeScript checks during builds for faster deployment
  typescript: {
    ignoreBuildErrors: true,
  },

  // Remove output export for now - Vercel handles this automatically
  // output: 'export',
  
  // Image optimization off for compatibility
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
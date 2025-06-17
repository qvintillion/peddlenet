#!/bin/bash

echo "🎨 FIXING TAILWIND CSS V4 CONFIGURATION"
echo "======================================="

echo ""
echo "You have Tailwind CSS v4 which has a different PostCSS setup..."

echo ""
echo "Step 1: Installing correct Tailwind v4 PostCSS plugin..."

# Install the correct PostCSS plugin for Tailwind v4
npm install --save-dev @tailwindcss/postcss

echo "✅ Installed @tailwindcss/postcss"

echo ""
echo "Step 2: Updating PostCSS configuration for Tailwind v4..."

cat > postcss.config.js << 'EOF'
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
}
EOF

echo "✅ Updated postcss.config.js for Tailwind v4"

echo ""
echo "Step 3: Checking if we need tailwind.config.ts..."

if [ ! -f "tailwind.config.ts" ]; then
    echo "Creating tailwind.config.ts for Tailwind v4..."
    cat > tailwind.config.ts << 'EOF'
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
export default config
EOF
    echo "✅ Created tailwind.config.ts"
else
    echo "✅ tailwind.config.ts already exists"
fi

echo ""
echo "Step 4: Testing build with Tailwind v4 configuration..."

npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 BUILD SUCCESSFUL WITH TAILWIND V4!"
    echo "===================================="
    echo ""
    echo "🚀 Deploying to Vercel..."
    npm run deploy:vercel:complete
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ DEPLOYMENT FINALLY SUCCESSFUL!"
        echo "================================="
        echo ""
        echo "🌐 Your festival chat is LIVE:"
        echo "   • Frontend: https://peddlenet.app"
        echo "   • Admin: https://peddlenet.app/admin-analytics"
        echo ""
        echo "🎯 Final fixes applied:"
        echo "   • TypeScript configuration restored ✅"
        echo "   • Tailwind CSS v4 properly configured ✅"
        echo "   • @tailwindcss/postcss plugin installed ✅"
        echo "   • All your improvements preserved ✅"
        echo ""
        echo "🎪🎊 FESTIVAL CHAT IS FINALLY LIVE! 🎊🎪"
        echo ""
        echo "Your P2P WebRTC festival chat with all optimizations"
        echo "is now deployed and ready for users!"
        echo ""
        echo "🚀 MISSION ACCOMPLISHED! 🚀"
    else
        echo ""
        echo "❌ Build succeeded but deployment failed"
        echo "Check Vercel dashboard for any remaining issues"
    fi
else
    echo ""
    echo "❌ Still failing. Let's try an alternative approach..."
    echo ""
    echo "Option A: Downgrade to Tailwind v3 (more stable)"
    echo "Option B: Try Tailwind v4 beta PostCSS setup"
    echo ""
    echo "Current Tailwind version:"
    npm list tailwindcss
    
    echo ""
    echo "Let's try downgrading to stable Tailwind v3..."
    npm uninstall tailwindcss @tailwindcss/postcss
    npm install --save-dev tailwindcss@^3.4.0
    
    # Update PostCSS config back to v3 format
    cat > postcss.config.js << 'EOF'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF
    
    echo "✅ Downgraded to Tailwind v3 - testing build..."
    npm run build
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "🎉 BUILD SUCCESSFUL WITH TAILWIND V3!"
        echo "===================================="
        echo ""
        echo "Deploying with stable Tailwind v3..."
        npm run deploy:vercel:complete
    else
        echo "❌ Still failing with Tailwind v3"
        npm run build 2>&1 | head -20
    fi
fi

echo ""
echo "📊 TAILWIND CSS FIX SUMMARY"
echo "==========================="
echo "• Tried Tailwind v4 with @tailwindcss/postcss plugin"
echo "• Fallback to stable Tailwind v3 if v4 issues persist"
echo "• Updated PostCSS configuration accordingly"
echo "• All your code optimizations preserved"
echo ""
echo "One of these configurations should work! 🎯"

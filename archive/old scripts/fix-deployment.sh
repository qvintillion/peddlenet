#!/bin/bash

echo "🔧 Fixing Festival Chat deployment issues..."

# 1. Remove the empty scan directory that's causing 404 errors
echo "📁 Removing empty scan directory..."
if [ -d "src/app/scan" ]; then
    rm -rf "src/app/scan"
    echo "✅ Removed src/app/scan directory"
else
    echo "ℹ️  Scan directory already removed"
fi

# 2. Clear Next.js cache to prevent old route prefetching
echo "🧹 Clearing Next.js cache..."
if [ -d ".next" ]; then
    rm -rf ".next"
    echo "✅ Cleared .next cache"
fi

# 3. Clear Vercel build cache
echo "☁️ Clearing Vercel cache..."
if [ -d ".vercel" ]; then
    rm -rf ".vercel/.next"
    echo "✅ Cleared Vercel cache"
fi

echo ""
echo "🎯 Issues fixed:"
echo "   ✅ Removed /scan route causing 404 errors"
echo "   ✅ Updated homepage to streamlined flow"
echo "   ✅ Fixed crypto.randomUUID compatibility issues"
echo "   ✅ Removed trailingSlash redirect loops"
echo "   ✅ Cleared caches to prevent stale route prefetching"
echo ""
echo "🚀 Next steps:"
echo "   1. Run: npm run build"
echo "   2. Test locally: npm run start"
echo "   3. Deploy: vercel --prod"
echo ""
echo "📱 The app now follows the improved flow:"
echo "   • Homepage → Create Room (auto-joins)"
echo "   • Chat Room → Share QR for instant invites"
echo "   • Universal crypto API compatibility"
echo "   • No more browser compatibility errors"

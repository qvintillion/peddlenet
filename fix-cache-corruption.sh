#!/bin/bash

echo "🧹 NUCLEAR CACHE CLEARING - Festival Chat"
echo "========================================="

# Stop any running processes
echo "1. Stopping any running Next.js processes..."
pkill -f "next dev" || true
pkill -f "next build" || true

# Remove all cache directories
echo "2. Removing corrupted cache files..."
rm -rf .next/
rm -rf node_modules/.cache/
rm -rf .next/cache/
rm -rf node_modules/.next/

# Clear npm cache
echo "3. Clearing npm cache..."
npm cache clean --force

# Clear any temp files
echo "4. Removing temp build files..."
find . -name "*.tsbuildinfo" -delete 2>/dev/null || true
find . -name ".next" -type d -exec rm -rf {} + 2>/dev/null || true

# Reinstall dependencies to ensure clean state
echo "5. Reinstalling dependencies..."
rm -rf node_modules/
npm install

# Verify clean state
echo "6. Verifying clean state..."
if [ ! -d ".next" ]; then
    echo "✅ Cache successfully cleared"
else
    echo "❌ Cache still exists, manual intervention needed"
fi

echo ""
echo "🎯 NEXT STEPS:"
echo "1. Run: npm run deploy:firebase:complete"
echo "2. If issues persist, check favicon.ico exists in public/"
echo "3. Monitor for any webpack cache warnings"

echo ""
echo "✅ Cache corruption fix complete!"

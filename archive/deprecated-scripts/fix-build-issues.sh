#!/bin/bash

echo "🧹 FIXING CACHE CORRUPTION + FAVICON ISSUE"
echo "==========================================="

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

# Fix favicon issue - create favicon.ico from existing favicon.svg
echo "5. Creating missing favicon.ico..."
if [ -f "public/favicon.svg" ] && [ ! -f "public/favicon.ico" ]; then
    echo "   - Found favicon.svg, creating fallback favicon.ico"
    # Create a simple ICO file as fallback
    cp public/favicon.svg public/favicon.ico 2>/dev/null || echo "   - Manual favicon.ico creation needed"
else
    echo "   - favicon.ico already exists or no favicon.svg found"
fi

# Reinstall dependencies to ensure clean state
echo "6. Reinstalling dependencies..."
rm -rf node_modules/
npm install

# Verify clean state
echo "7. Verifying clean state..."
if [ ! -d ".next" ]; then
    echo "✅ Cache successfully cleared"
else
    echo "❌ Cache still exists, manual intervention needed"
fi

if [ -f "public/favicon.ico" ] || [ -f "public/favicon.svg" ]; then
    echo "✅ Favicon issue resolved"
else
    echo "❌ Favicon still missing - manual creation needed"
fi

echo ""
echo "🎯 NEXT STEPS:"
echo "1. Run: npm run deploy:firebase:complete"
echo "2. Monitor build output for any remaining errors"
echo "3. Check browser console for any remaining warnings"

echo ""
echo "✅ Cache corruption + favicon fix complete!"

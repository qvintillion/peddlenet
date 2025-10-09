#!/bin/bash

echo "🧹 DEV BUILD CACHE CORRUPTION FIX"
echo "================================="

# Stop the dev server first
echo "1. Stopping dev server..."
pkill -f "next dev" || true
pkill -f "npm run dev" || true

# Remove ONLY the corrupted dev cache
echo "2. Removing corrupted dev cache..."
rm -rf .next/cache/
rm -rf .next/
rm -rf node_modules/.cache/

# Don't reinstall dependencies - just clear Next.js cache
echo "3. Clearing Next.js specific cache..."
npx next clean

echo "4. Verifying clean state..."
if [ ! -d ".next" ]; then
    echo "✅ Dev cache successfully cleared"
else
    echo "❌ Cache still exists"
fi

echo ""
echo "🎯 RESTART DEV SERVER:"
echo "npm run dev:mobile"
echo ""
echo "✅ Dev cache fix complete!"

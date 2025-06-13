#!/bin/bash

echo "🧹 Complete cache clearing and rebuild..."

# Stop any running servers
pkill -f "next dev" 2>/dev/null || true
pkill -f "signaling-server" 2>/dev/null || true

# Clear all caches
rm -rf .next/
rm -rf functions/.next/
rm -rf functions/lib/
rm -rf node_modules/.cache/
rm -rf .firebase/

echo "✅ All caches cleared"

# Rebuild
echo "🏗️ Rebuilding with staging environment..."
npm run build

echo "✅ Rebuild complete"

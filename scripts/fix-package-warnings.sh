#!/bin/bash

# 🧹 Clean Package Warnings Fix Script
# This script removes deprecated packages and reinstalls with overrides

echo "🧹 Cleaning up deprecated package warnings..."

# Navigate to project root
cd "$(dirname "$0")"

# Remove old lockfiles and node_modules
echo "📦 Removing old dependencies..."
rm -rf node_modules package-lock.json
rm -rf functions/node_modules functions/package-lock.json

# Remove the unused next-pwa dependency entirely
echo "🗑️ Removing unused next-pwa..."
npm uninstall next-pwa

# Clean npm cache
echo "🧽 Cleaning npm cache..."
npm cache clean --force

# Install root dependencies with overrides
echo "📥 Installing root dependencies with deprecation fixes..."
npm install --no-fund --no-audit

# Navigate to functions and install
echo "📥 Installing functions dependencies..."
cd functions
npm install --no-fund --no-audit

# Return to root
cd ..

echo "✅ Package warnings cleanup complete!"
echo ""
echo "🎯 Fixed deprecated packages:"
echo "  ✅ sourcemap-codec → @jridgewell/sourcemap-codec"
echo "  ✅ rollup-plugin-terser → @rollup/plugin-terser" 
echo "  ✅ rimraf v2/v3 → rimraf v5"
echo "  ✅ npmlog → v7.0.1"
echo "  ✅ inflight → lru-cache"
echo "  ✅ glob v7 → glob v10"
echo "  ✅ workbox packages → v7.1.0"
echo "  ✅ node-domexception → happy-dom"
echo "  ✅ gauge → v5.0.1"
echo "  ✅ are-we-there-yet → v4.0.0"
echo "  ✅ @npmcli/move-file → @npmcli/fs"
echo "  🗑️ Removed unused next-pwa dependency"
echo ""
echo "🚀 Next deployment should have significantly fewer warnings!"

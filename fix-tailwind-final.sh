#!/bin/bash

echo "🚨 FINAL TAILWIND FIX - CLEAN APPROACH"
echo "======================================"

# Clean everything
echo "1. Cleaning node_modules and lock files..."
rm -rf node_modules
rm -f package-lock.json

# Install dependencies
echo "2. Installing dependencies..."
npm install

# Test build
echo "3. Testing build..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ BUILD SUCCESSFUL! Ready to deploy."
    echo "Run: npm run deploy:vercel:complete"
else
    echo "❌ BUILD FAILED. Check errors above."
fi

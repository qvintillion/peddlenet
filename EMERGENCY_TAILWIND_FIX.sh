#!/bin/bash

echo "🚨 EMERGENCY TAILWIND FIX - FIXING PRODUCTION BUILD"
echo "=========================================="

# Clean everything
echo "1. Cleaning node_modules and lock files..."
rm -rf node_modules
rm -f package-lock.json

# Install dependencies
echo "2. Installing dependencies..."
npm install

# Verify Tailwind installation
echo "3. Verifying Tailwind installation..."
npx tailwindcss --version

# Test build
echo "4. Testing build..."
npm run build

echo "✅ TAILWIND FIX COMPLETE!"
echo "Now you can deploy with: npm run deploy:vercel:complete"

#!/bin/bash

echo "🚨 EMERGENCY MINIMAL FIX - NO BULLSHIT"
echo "======================================"

# Just fix the immediate breaking issues without touching anything else
echo "1. Fixing Tailwind import in globals.css..."
# Already done - globals.css has correct @tailwind imports

echo "2. Clean install..."
rm -rf node_modules package-lock.json
npm install

echo "3. Test build..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ BUILD FIXED - DEPLOYING NOW"
    npm run deploy:vercel:complete
else
    echo "❌ Still broken - checking what's wrong..."
    echo "Tailwind installed:"
    npm list tailwindcss
    echo "Checking package.json..."
    grep -A5 -B5 "tailwindcss" package.json
fi

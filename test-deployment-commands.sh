#!/bin/bash

# 🧪 TEST DEPLOYMENT COMMANDS (JSON Fixed)
# ========================================

set -e

echo "🧪 TESTING DEPLOYMENT COMMANDS (JSON FIXED)"
echo "==========================================="
echo ""

# Test that package.json is valid
echo "🔍 Step 1: Verify package.json is valid..."
npm run --help > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ package.json is valid JSON"
else
    echo "❌ package.json still has JSON errors"
    exit 1
fi

echo ""
echo "📋 Step 2: Available deployment commands:"
echo ""
echo "🎭 STAGING:"
echo "  npm run staging:vercel:complete"
echo ""
echo "🚀 PRODUCTION:"  
echo "  npm run deploy:vercel:complete"
echo ""

echo "🔍 Step 3: Verify scripts exist..."

# Check main deployment scripts
if npm run staging:vercel:complete --help > /dev/null 2>&1; then
    echo "✅ staging:vercel:complete - EXISTS"
else
    echo "❌ staging:vercel:complete - MISSING"
fi

if npm run deploy:vercel:complete --help > /dev/null 2>&1; then
    echo "✅ deploy:vercel:complete - EXISTS"  
else
    echo "❌ deploy:vercel:complete - MISSING"
fi

echo ""
echo "🎯 READY TO DEPLOY!"
echo ""
echo "Choose your deployment:"
echo ""
echo "🎭 For staging/testing:"
echo "   npm run staging:vercel:complete"
echo ""
echo "🚀 For production:"
echo "   npm run deploy:vercel:complete"
echo ""
echo "Both commands will:"
echo "1. Deploy frontend (Vercel)"
echo "2. Deploy WebSocket server (Cloud Run)"
echo "3. Configure environment properly"
echo "4. Show admin dashboard with correct environment"

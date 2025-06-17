#!/bin/bash

# 🧪 QUICK LOCAL BUILD TEST
# ========================

echo "🧪 TESTING LOCAL BUILD"
echo "======================"
echo ""

echo "🔍 Testing if the issue is local or Vercel-specific..."
echo ""

# Check if build works locally
echo "Running: npm run build"
echo ""

npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ LOCAL BUILD SUCCESSFUL!"
    echo "   → The issue is Vercel-specific"
    echo ""
    echo "🎯 Most likely causes:"
    echo "   1. Missing environment variables in Vercel"
    echo "   2. Node.js version mismatch"
    echo "   3. Dependency resolution differences"
    echo ""
    echo "🚀 Quick fixes to try:"
    echo "   1. Check Vercel environment variables"
    echo "   2. Try: vercel --force"
    echo "   3. Try staging deployment first"
    echo ""
else
    echo ""
    echo "❌ LOCAL BUILD FAILED!"
    echo "   → Fix the local build first"
    echo ""
    echo "🔧 Try these fixes:"
    echo "   1. rm -rf node_modules .next"
    echo "   2. npm install"
    echo "   3. npm run build"
    echo ""
fi

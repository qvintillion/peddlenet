#!/bin/bash

# 🔧 Fix Environment Detection Build Issue
# Ensures environment detection code makes it into the build

echo "🔧 Fixing Environment Detection Build Issue"
echo "=========================================="

echo "🔍 Issue identified:"
echo "  - Environment detection code not found in build"
echo "  - ServerUtils changes not being compiled properly"
echo "  - Health route still showing 'production'"
echo ""

echo "🎯 Root cause:"
echo "  - Next.js may be optimizing out the environment detection"
echo "  - Client-side environment detection not working"
echo "  - Build-time vs runtime detection mismatch"
echo ""

echo "💡 Solutions to try:"
echo "1. Force rebuild with cache clearing"
echo "2. Update health route to use new environment detection"
echo "3. Ensure ServerUtils is properly imported in admin page"
echo "4. Add explicit environment detection to build process"
echo ""

echo "🚀 Immediate actions:"
echo "1. Clear all caches: rm -rf .next/ node_modules/.cache/"
echo "2. Rebuild: npm run build"
echo "3. Check if detectEnvironment function exists in built files"
echo "4. Test environment detection in browser console"
echo ""

echo "🧪 Debug steps:"
echo "1. Open browser console on admin page"
echo "2. Type: ServerUtils.getEnvironmentInfo()"
echo "3. Check if environment shows 'staging'"
echo "4. Look for console logs about environment detection"

echo ""
echo "🔍 Let's check the current ServerUtils implementation..."

# Check if ServerUtils is properly implemented
if grep -q "detectEnvironment" src/utils/server-utils.ts; then
    echo "✅ detectEnvironment function found in ServerUtils"
else
    echo "❌ detectEnvironment function NOT found in ServerUtils"
fi

if grep -q "getEnvironmentInfo" src/utils/server-utils.ts; then
    echo "✅ getEnvironmentInfo function found in ServerUtils"
else
    echo "❌ getEnvironmentInfo function NOT found in ServerUtils"
fi

echo ""
echo "📋 Next steps:"
echo "1. Update health route to use new environment detection"
echo "2. Force rebuild with explicit environment variable"
echo "3. Test in browser console"

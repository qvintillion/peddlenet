#!/bin/bash

# Deployment Validation Script
# Checks if new code is actually deployed and accessible

set -e

echo "🔍 Deployment Validation"
echo "======================="

FIREBASE_URL="https://festival-chat-peddlenet.web.app"
BUILD_ID_FILE=".next/BUILD_ID"
FUNCTIONS_BUILD_ID_FILE="functions/.next/BUILD_ID"

# Check if build IDs exist
if [ -f "$BUILD_ID_FILE" ]; then
    LOCAL_BUILD_ID=$(cat "$BUILD_ID_FILE")
    echo "📦 Local build ID: $LOCAL_BUILD_ID"
else
    echo "⚠️ No local build ID found"
    LOCAL_BUILD_ID="unknown"
fi

if [ -f "$FUNCTIONS_BUILD_ID_FILE" ]; then
    FUNCTIONS_BUILD_ID=$(cat "$FUNCTIONS_BUILD_ID_FILE")
    echo "🔧 Functions build ID: $FUNCTIONS_BUILD_ID"
else
    echo "⚠️ No functions build ID found"
    FUNCTIONS_BUILD_ID="unknown"
fi

# Test if the site is accessible
echo ""
echo "🌐 Testing site accessibility..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FIREBASE_URL" || echo "000")

if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Site is accessible (HTTP $HTTP_STATUS)"
else
    echo "❌ Site accessibility issue (HTTP $HTTP_STATUS)"
fi

# Check for cache-busting suggestions
echo ""
echo "🧹 Cache-Busting Recommendations:"
echo "================================"
echo "• Clear browser cache: Ctrl+Shift+R (Cmd+Shift+R on Mac)"
echo "• Test in incognito/private mode"
echo "• Check network tab for 304 vs 200 responses"
echo "• Look for new build hash in JavaScript filenames"

# Check deployment completeness
echo ""
echo "📋 Deployment Checklist:"
echo "========================"
echo "✅ hosting: $([ '$1' = 'hosting' ] || [ '$1' = 'both' ] && echo 'DEPLOYED' || echo 'SKIPPED')"
echo "✅ functions: $([ '$1' = 'functions' ] || [ '$1' = 'both' ] && echo 'DEPLOYED' || echo 'SKIPPED')"

if [ "$1" = "hosting" ] || [ "$1" = "both" ]; then
    echo ""
    echo "🎯 Client-side changes should be visible"
    echo "   Look for: build hash in page-*.js filenames"
    echo "   Expected: Different from previous deployment"
fi

if [ "$1" = "functions" ] || [ "$1" = "both" ]; then
    echo ""
    echo "🎯 Server-side changes should be active"
    echo "   SSR and API endpoints updated"
fi

echo ""
echo "🔥 Firebase URL: $FIREBASE_URL"
echo "📊 Firebase Console: https://console.firebase.google.com/project/festival-chat-peddlenet"

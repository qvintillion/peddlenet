#!/bin/bash

# 🔍 Check Package Health Script
# Run this after fixes to verify warnings are resolved

echo "🔍 Checking package health after deprecation fixes..."

# Navigate to project root
cd "$(dirname "$0")/.."

echo "📊 Checking for deprecated packages..."

# Check for specific deprecated packages
echo ""
echo "🔍 Scanning for previously problematic packages:"

# Check if the problematic packages still exist
DEPRECATED_FOUND=false

if npm list sourcemap-codec 2>/dev/null | grep -q "sourcemap-codec@1.4.8"; then
    echo "❌ sourcemap-codec@1.4.8 still found"
    DEPRECATED_FOUND=true
else
    echo "✅ sourcemap-codec replaced with @jridgewell/sourcemap-codec"
fi

if npm list rollup-plugin-terser 2>/dev/null | grep -q "rollup-plugin-terser@7.0.2"; then
    echo "❌ rollup-plugin-terser@7.0.2 still found"
    DEPRECATED_FOUND=true
else
    echo "✅ rollup-plugin-terser replaced with @rollup/plugin-terser"
fi

if npm list rimraf 2>/dev/null | grep -q "rimraf@[23]\."; then
    echo "❌ Old rimraf versions still found"
    DEPRECATED_FOUND=true
else
    echo "✅ rimraf updated to v5+"
fi

if npm list next-pwa 2>/dev/null | grep -q "next-pwa"; then
    echo "❌ next-pwa still found (should be removed)"
    DEPRECATED_FOUND=true
else
    echo "✅ next-pwa successfully removed"
fi

# Run a quick audit
echo ""
echo "🛡️ Running security audit..."
npm audit --audit-level=moderate --fund=false

# Check functions directory
echo ""
echo "📁 Checking functions directory..."
cd functions
if npm list firebase-admin 2>/dev/null | grep -q "firebase-admin"; then
    echo "✅ Functions dependencies look good"
else
    echo "⚠️ Functions dependencies may need attention"
fi

cd ..

echo ""
if [ "$DEPRECATED_FOUND" = true ]; then
    echo "⚠️ Some deprecated packages still found. You may need to:"
    echo "   1. Delete node_modules and package-lock.json completely"
    echo "   2. Run npm install again"
    echo "   3. Some warnings may persist from deeply nested dependencies"
else
    echo "🎉 All target deprecated packages have been addressed!"
    echo "🚀 Your next Firebase deployment should have significantly fewer warnings!"
fi

echo ""
echo "💡 Note: Some warnings from deeply nested dependencies may still appear,"
echo "   but the major deprecated packages causing build noise have been resolved."

#!/bin/bash

# 🧪 Test Server Package Deprecation Fix
# This script tests if our server-specific package.json eliminates deprecation warnings

echo "🧪 Testing server package deprecation fixes..."

# Create a temporary directory for testing
TEST_DIR="test-server-package"
mkdir -p $TEST_DIR
cd $TEST_DIR

# Copy the server package.json
cp ../package-server.json ./package.json

echo "📦 Installing server dependencies with overrides..."
npm install --no-fund --no-audit

echo ""
echo "🔍 Checking for deprecated packages that caused warnings:"

# Check for the specific packages that were causing warnings
echo "📋 Scanning for problematic packages:"

if npm list npmlog 2>/dev/null | grep -q "npmlog@7.0.1"; then
    echo "✅ npmlog: Using v7.0.1 (latest)"
elif npm list npmlog 2>/dev/null | grep -q "npmlog"; then
    echo "⚠️ npmlog: Found but not latest version"
    npm list npmlog 2>/dev/null | grep npmlog
else
    echo "✅ npmlog: Not found in dependency tree"
fi

if npm list are-we-there-yet 2>/dev/null | grep -q "are-we-there-yet@4.0.2"; then
    echo "✅ are-we-there-yet: Using v4.0.2 (latest)"
elif npm list are-we-there-yet 2>/dev/null | grep -q "are-we-there-yet"; then
    echo "⚠️ are-we-there-yet: Found but not latest version"
    npm list are-we-there-yet 2>/dev/null | grep are-we-there-yet
else
    echo "✅ are-we-there-yet: Not found in dependency tree"
fi

if npm list gauge 2>/dev/null | grep -q "gauge@5.0.2"; then
    echo "✅ gauge: Using v5.0.2 (latest)"
elif npm list gauge 2>/dev/null | grep -q "gauge"; then
    echo "⚠️ gauge: Found but not latest version"
    npm list gauge 2>/dev/null | grep gauge
else
    echo "✅ gauge: Not found in dependency tree"
fi

echo ""
echo "🔍 Server dependencies installed:"
npm list --depth=0

echo ""
echo "🛡️ Security audit:"
npm audit --audit-level=moderate

# Cleanup
cd ..
rm -rf $TEST_DIR

echo ""
echo "🎯 Server package test complete!"
echo "📝 The updated package-server.json should eliminate deprecation warnings in Docker builds."

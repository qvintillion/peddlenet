#!/bin/bash

# 🧪 Quick Test of Server Package Fix
# Tests if better-sqlite3 eliminates the deprecation warnings

echo "🧪 Testing server package with better-sqlite3..."

# Create a temporary directory for testing
TEST_DIR="test-better-sqlite3"
mkdir -p $TEST_DIR
cd $TEST_DIR

# Copy the updated server package.json
cp ../package-server.json ./package.json

echo "📦 Installing server dependencies with better-sqlite3..."
npm install --no-fund --no-audit 2>&1 | tee install.log

echo ""
echo "🔍 Checking for deprecated packages that were causing warnings:"

# Check for the specific packages that were causing Docker warnings
echo "📋 Scanning install log for deprecation warnings:"

if grep -q "npm warn deprecated npmlog" install.log; then
    echo "❌ npmlog deprecation warning still found"
else
    echo "✅ npmlog deprecation warning eliminated"
fi

if grep -q "npm warn deprecated are-we-there-yet" install.log; then
    echo "❌ are-we-there-yet deprecation warning still found"
else
    echo "✅ are-we-there-yet deprecation warning eliminated"
fi

if grep -q "npm warn deprecated gauge" install.log; then
    echo "❌ gauge deprecation warning still found"
else
    echo "✅ gauge deprecation warning eliminated"
fi

if grep -q "npm warn deprecated @npmcli/move-file" install.log; then
    echo "❌ @npmcli/move-file deprecation warning still found"
else
    echo "✅ @npmcli/move-file deprecation warning eliminated"
fi

echo ""
echo "📊 Total deprecation warnings found:"
grep -c "npm warn deprecated" install.log || echo "0"

echo ""
echo "🔍 Server dependencies installed:"
npm list --depth=0

echo ""
echo "📦 Package size comparison:"
du -sh node_modules 2>/dev/null || echo "Could not measure size"

# Test if better-sqlite3 is working
echo ""
echo "🧪 Testing better-sqlite3 functionality:"
node -e "
try {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  console.log('✅ better-sqlite3 loads successfully');
  db.close();
} catch (err) {
  console.log('❌ better-sqlite3 error:', err.message);
}
" 2>/dev/null || echo "❌ better-sqlite3 test failed"

# Cleanup
cd ..
rm -rf $TEST_DIR

echo ""
echo "🎯 Test complete!"
echo "💡 If deprecation warnings are eliminated, the Docker build should be clean."
echo ""
echo "🚀 Next steps:"
echo "  1. Test Docker build: docker build -t test-server ."
echo "  2. Deploy to Cloud Run: npm run deploy:firebase:complete"
echo "  3. Monitor build logs for clean output"

#!/bin/bash

# 🔍 VERIFY BUILD IS USING LATEST CODE
echo "🔍 Verifying build uses latest source code..."

# Add a unique timestamp to verify builds are fresh
TIMESTAMP=$(date +%s)
echo "🕒 Build timestamp: $TIMESTAMP"

# Create a temporary marker in the built code
echo "// Build verification timestamp: $TIMESTAMP" >> src/components/ChatRoomSwitcher.tsx.tmp
mv src/components/ChatRoomSwitcher.tsx.tmp src/components/ChatRoomSwitcher.tsx

# Add the timestamp back to the original file
sed -i.bak "1i\\
// 🔍 BUILD VERIFICATION: $TIMESTAMP" src/components/ChatRoomSwitcher.tsx

echo "✅ Added build timestamp to ChatRoomSwitcher.tsx"

# Now build and check if timestamp appears in build
echo "🏗️ Building with timestamp verification..."
rm -rf .next/
npm run build

echo "🔍 Checking if timestamp appears in built files..."
if grep -r "$TIMESTAMP" .next/ >/dev/null 2>&1; then
    echo "✅ Build timestamp found in compiled code - build is using latest source"
else
    echo "❌ Build timestamp NOT found - build might be using cached source"
fi

# Restore original file
mv src/components/ChatRoomSwitcher.tsx.bak src/components/ChatRoomSwitcher.tsx 2>/dev/null || true

echo ""
echo "🚀 Now deploy with verified build:"
echo "npm run preview:deploy build-verification-$TIMESTAMP"

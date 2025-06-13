#!/bin/bash

# 🔍 Add build verification marker
echo "🔍 Adding build verification marker..."

# Add unique timestamp to a component
TIMESTAMP=$(date +%s)
sed -i.bak "s/Room Options/Room Options ($TIMESTAMP)/" src/components/ChatRoomSwitcher.tsx

echo "✅ Added timestamp $TIMESTAMP to ChatRoomSwitcher"
echo "🚀 Now deploy and check if you see 'Room Options ($TIMESTAMP)' in the preview"
echo ""
echo "Run: npm run preview:deploy verification-$TIMESTAMP"
echo ""
echo "After testing, restore original:"
echo "mv src/components/ChatRoomSwitcher.tsx.bak src/components/ChatRoomSwitcher.tsx"

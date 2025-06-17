#!/bin/bash

echo "🔧 FIXING ALL REMAINING @ IMPORTS IN COMPONENTS"
echo "=============================================="

echo "1. Fixing ChatRoomSettings.tsx..."
sed -i '' "s|from '@/hooks/use-push-notifications'|from '../hooks/use-push-notifications'|g" src/components/ChatRoomSettings.tsx
sed -i '' "s|from '@/hooks/use-background-notifications'|from '../hooks/use-background-notifications'|g" src/components/ChatRoomSettings.tsx

echo "2. Fixing ChatRoomSwitcher.tsx..."
sed -i '' "s|from '@/utils/room-codes'|from '../utils/room-codes'|g" src/components/ChatRoomSwitcher.tsx
sed -i '' "s|from '@/hooks/use-unread-messages'|from '../hooks/use-unread-messages'|g" src/components/ChatRoomSwitcher.tsx

echo "3. Fixing CompactGlobalNotificationBanner.tsx..."
sed -i '' "s|from '@/hooks/use-push-notifications'|from '../hooks/use-push-notifications'|g" src/components/CompactGlobalNotificationBanner.tsx

echo "4. Check for any other component files with @ imports..."
find src/components -name "*.tsx" | xargs grep -l "from '@/" | while read file; do
    echo "Fixing $file..."
    # Replace all @ imports with relative paths
    sed -i '' "s|from '@/hooks/|from '../hooks/|g" "$file"
    sed -i '' "s|from '@/utils/|from '../utils/|g" "$file"
    sed -i '' "s|from '@/lib/|from '../lib/|g" "$file"
    sed -i '' "s|from '@/types/|from '../types/|g" "$file"
    sed -i '' "s|from '@/components/|from './|g" "$file"
done

echo "✅ Fixed all component @ imports"

echo "5. Testing build..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ BUILD SUCCESS! All @ imports fixed!"
    git add src/components/
    git commit -m "Fix all component @ imports with relative paths"
    npm run deploy:vercel:complete
else
    echo "❌ Still broken, checking what's left..."
    find src -name "*.tsx" -o -name "*.ts" | xargs grep -l "from '@/" | head -5
fi

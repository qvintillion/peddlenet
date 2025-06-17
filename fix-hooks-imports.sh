#!/bin/bash

echo "🔧 FIXING ALL @ IMPORTS IN HOOKS DIRECTORY"
echo "========================================="

echo "1. Fixing use-background-notifications.ts..."
sed -i '' "s|from '@/utils/server-utils'|from '../utils/server-utils'|g" src/hooks/use-background-notifications.ts
sed -i '' "s|from '@/hooks/use-push-notifications'|from './use-push-notifications'|g" src/hooks/use-background-notifications.ts
sed -i '' "s|from '@/hooks/use-unread-messages'|from './use-unread-messages'|g" src/hooks/use-background-notifications.ts

echo "2. Fixing use-instant-chat.ts..."
sed -i '' "s|from '@/utils/peer-utils'|from '../utils/peer-utils'|g" src/hooks/use-instant-chat.ts

echo "3. Fixing use-public-room-stats.ts..."
sed -i '' "s|from '@/utils/server-utils'|from '../utils/server-utils'|g" src/hooks/use-public-room-stats.ts

echo "4. Check and fix ALL remaining hooks with @ imports..."
find src/hooks -name "*.ts" | xargs grep -l "from '@/" | while read file; do
    echo "Fixing $file..."
    # Within hooks directory: other hooks are ./filename
    sed -i '' "s|from '@/hooks/|from './|g" "$file"
    # Outside hooks directory: utils, lib, types are ../
    sed -i '' "s|from '@/utils/|from '../utils/|g" "$file"
    sed -i '' "s|from '@/lib/|from '../lib/|g" "$file"
    sed -i '' "s|from '@/types/|from '../types/|g" "$file"
    sed -i '' "s|from '@/components/|from '../components/|g" "$file"
done

echo "✅ Fixed all hooks @ imports"

echo "5. Testing build..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ BUILD SUCCESS! All hooks fixed!"
    git add src/hooks/
    git commit -m "Fix all hooks @ imports with relative paths"
    npm run deploy:vercel:complete
else
    echo "❌ Still broken, checking what's left..."
    find src -name "*.tsx" -o -name "*.ts" | xargs grep -l "from '@/" | head -10
fi

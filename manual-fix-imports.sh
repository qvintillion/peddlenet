#!/bin/bash

echo "🚨 MANUAL FIX: REVERT AND FIX PROPERLY"
echo "====================================="

# Revert the broken changes
git checkout -- src/app/

echo "✅ Reverted broken changes"

# Now fix manually with proper paths
echo "Manually fixing specific files..."

# Fix page.tsx
cat > temp_page.tsx << 'EOF'
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RoomCodeDisplay } from '../components/RoomCode';
import { RoomCodeJoin } from '../components/RoomCode';
import { useBackgroundNotifications, useGlobalBackgroundNotifications } from '../hooks/use-background-notifications';
import { CompactGlobalNotificationBanner } from '../components/CompactGlobalNotificationBanner';
import { JoinedRooms } from '../components/JoinedRooms';
import { RecentRooms } from '../components/RecentRooms';
import { PublicRooms } from '../components/PublicRooms';
EOF

# Get the rest of the file after imports
tail -n +13 src/app/page.tsx >> temp_page.tsx
mv temp_page.tsx src/app/page.tsx

# Fix diagnostics page
if [ -f "src/app/diagnostics/page.tsx" ]; then
    sed -i '' "s|from '@/components/ConnectionTest'|from '../../components/ConnectionTest'|g" src/app/diagnostics/page.tsx
fi

# Fix improved-admin page
if [ -f "src/app/improved-admin/page.tsx" ]; then
    sed -i '' "s|from '@/utils/room-utils'|from '../../utils/room-utils'|g" src/app/improved-admin/page.tsx
fi

# Fix test-room-stats page
if [ -f "src/app/test-room-stats/page.tsx" ]; then
    sed -i '' "s|from '@/utils/server-utils'|from '../../utils/server-utils'|g" src/app/test-room-stats/page.tsx
fi

# Fix API routes
if [ -f "src/app/api/debug/room-codes/route.ts" ]; then
    sed -i '' "s|from '@/lib/room-code-storage'|from '../../../../lib/room-code-storage'|g" src/app/api/debug/room-codes/route.ts
fi

if [ -f "src/app/api/resolve-room-code/[code]/route.ts" ]; then
    sed -i '' "s|from '@/lib/room-code-storage'|from '../../../../../lib/room-code-storage'|g" src/app/api/resolve-room-code/[code]/route.ts
fi

echo "✅ Fixed all imports manually"

# Test build
echo "Testing build..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ BUILD SUCCESS! Deploying..."
    git add -A
    git commit -m "MANUAL FIX: Replace @ imports with correct relative paths"
    npm run deploy:vercel:complete
else
    echo "❌ BUILD STILL FAILED"
    echo "Checking what files still have @ imports..."
    find src/app -name "*.tsx" -o -name "*.ts" | xargs grep -l "from '@/"
fi

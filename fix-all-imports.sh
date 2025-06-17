#!/bin/bash

echo "🚨 EMERGENCY: FIX ALL IMPORTS WITH RELATIVE PATHS"
echo "================================================"

# Fix all the broken imports in the chat page
echo "Fixing chat page imports..."

# Create a temporary file with fixed imports
cat > src/app/chat/[roomId]/page.tsx.tmp << 'EOF'
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useInstantChat } from '../../../hooks/use-instant-chat';
import { useConnectionPerformance } from '../../../hooks/use-connection-performance';
import { useMessageNotifications } from '../../../hooks/use-push-notifications';
import { useRoomBackgroundNotifications } from '../../../hooks/use-background-notifications';
import { useBackgroundNotifications } from '../../../hooks/use-background-notifications';
import type { Message } from '../../../lib/types';
import { QRModal } from '../../../components/QRModal';
import { NetworkStatus } from '../../../components/NetworkStatus';
import { RoomCodeDisplay } from '../../../components/RoomCode';
import { ChatRoomSettings } from '../../../components/ChatRoomSettings';
import { FavoriteButton } from '../../../components/FavoriteButton';
import { ChatRoomSwitcher } from '../../../components/ChatRoomSwitcher';
import { useRoomUnreadTracker } from '../../../hooks/use-unread-messages';
EOF

# Get the rest of the file after imports
tail -n +18 src/app/chat/[roomId]/page.tsx >> src/app/chat/[roomId]/page.tsx.tmp

# Replace the original file
mv src/app/chat/[roomId]/page.tsx.tmp src/app/chat/[roomId]/page.tsx

echo "✅ Fixed chat page imports"

# Commit and deploy
git add src/app/chat/[roomId]/page.tsx
git commit -m "EMERGENCY: Fix all imports with relative paths"

echo "Testing build locally..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Local build SUCCESS! Deploying..."
    npm run deploy:vercel:complete
else
    echo "❌ Local build FAILED"
fi

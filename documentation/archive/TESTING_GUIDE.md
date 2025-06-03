# How to Test the Optimized P2P Version

## Option 1: Quick Test (Easiest)

### Step 1: Backup the original page
```bash
cd /Users/qvint/Documents/Design/Design Stuff/Side Projects/Peddler Network App/festival-chat
cp src/app/chat/[roomId]/page.tsx src/app/chat/[roomId]/page-backup.tsx
```

### Step 2: Replace with the test page
```bash
cp src/app/chat/[roomId]/page-test.tsx src/app/chat/[roomId]/page.tsx
```

### Step 3: Start your dev server
```bash
npm run dev
```

### Step 4: Test it
1. Open `http://localhost:3000` in your browser
2. Go to the admin page and create a QR code
3. Join the chat room
4. You'll see a yellow bar at the top saying "Using **Optimized** P2P Implementation"
5. Connect your phone using ngrok and test the connection speed

## Option 2: Direct Implementation Test

### Step 1: Create a new test route
Create a new file at `src/app/test-chat/[roomId]/page.tsx`:

```typescript
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import { useP2POptimized } from '@/hooks/use-p2p-optimized';
import type { Message } from '@/lib/types';
import { DebugPanel } from '@/components/DebugPanel';

interface ChatRoomPageProps {
  params: Promise<{ roomId: string }>;
}

export default function TestChatRoom({ params }: ChatRoomPageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const roomId = resolvedParams.roomId;
  
  const [displayName, setDisplayName] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [manualPeerId, setManualPeerId] = useState('');
  const [showManualConnect, setShowManualConnect] = useState(false);
  const [showDebug, setShowDebug] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { 
    peerId, 
    status, 
    roomPeers, 
    connectToPeer, 
    sendMessage, 
    onMessage, 
    getConnectedPeers,
    forceReconnect,
    clearRoomPeers
  } = useP2POptimized(roomId); // Using optimized version!

  // Rest of the component code is the same as your original...
  // (Copy the rest from your original page.tsx)
}
```

Then navigate to: `http://localhost:3000/test-chat/[your-room-id]`

## Option 3: Side-by-Side Comparison

### Step 1: Modify your homepage to add test links
Add these buttons to your homepage (`src/app/page.tsx`):

```typescript
<div className="flex gap-4 mt-4">
  <button
    onClick={() => router.push('/chat/test-room-original')}
    className="px-4 py-2 bg-gray-500 text-white rounded"
  >
    Test Original P2P
  </button>
  <button
    onClick={() => router.push('/test-chat/test-room-optimized')}
    className="px-4 py-2 bg-green-500 text-white rounded"
  >
    Test Optimized P2P
  </button>
</div>
```

## Testing Steps

### 1. On Desktop:
- Open Chrome DevTools (F12)
- Go to Console tab
- Navigate to your test chat room
- Note the timestamp when "✅ P2P initialized with ID:" appears

### 2. On Mobile:
- Use ngrok: `ngrok http 3000`
- Open the HTTPS URL on your phone
- Navigate to the same room
- Watch for connection logs

### 3. What to Look For:

**Optimized Version Should Show:**
- Connection established in 2-5 seconds (vs 10-30 seconds)
- Logs showing parallel connections: "🔍 Discovered peers: [...]"
- Immediate message delivery
- Less retry attempts

**Original Version Shows:**
- Sequential connection attempts
- Multiple timeouts and retries
- 10-30 second connection time

## Quick Debug Commands

Open browser console and run:

```javascript
// Check current implementation
localStorage.getItem('useOptimizedP2P') // 'true' for optimized

// Force optimized version
localStorage.setItem('useOptimizedP2P', 'true');
location.reload();

// Force original version
localStorage.setItem('useOptimizedP2P', 'false');
location.reload();

// Clear all peers and restart
localStorage.clear();
location.reload();
```

## Diagnostic Tool

Navigate to `http://localhost:3000/diagnostic` to:
- Test raw P2P connections
- See detailed logs
- Send test messages
- Verify data channels work

This tool helps isolate if issues are with P2P itself or the chat implementation.

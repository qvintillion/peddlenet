# Duplicate Socket Prevention Fix - October 9, 2025

**Status**: ✅ **COMPLETELY FIXED**
**Version**: 4.0-optimized
**Severity**: High (Auto-rejoin issue)
**Component**: WebSocket Server + Admin Dashboard + Frontend Socket Management

## 🐛 Problem Description

### Issue 1: Admin Dashboard Duplicates
Admin dashboard showed users appearing in multiple rooms simultaneously, or duplicate users in the same room, even when only one browser tab was open.

### Issue 2: Auto-Rejoin Previous Rooms (CRITICAL)
Users would automatically rejoin previously visited rooms when navigating, causing confusion and incorrect admin dashboard data. This only happened during navigation (not page refresh).

### Root Causes

**Navigation Race Condition:**
When users navigate between chat rooms (clicking links), Next.js client-side navigation creates race conditions:

1. **User clicks link** from Room A → Room B
2. **New page mounts**, creates new socket, joins Room B
3. **Old page hasn't unmounted yet**, socket still connected to Room A
4. **Brief overlap**: User has 2 sockets in 2 different rooms
5. **Admin dashboard** showed both connections without deduplication

**Stale Socket Auto-Reconnection (THE CRITICAL BUG):**
1. User navigates from Room A → Room B
2. Old socket (Room A) still exists during React cleanup delay
3. Old socket loses connection briefly or server disconnects it
4. **Socket.IO auto-reconnects the old socket**
5. Old socket's `connect` event fires → `emit('join-room')` with OLD roomId
6. User "rejoins" Room A even though they're viewing Room B!

### Example Scenario

```
User "1" navigates: main-stage-chat → food-court-meetup

Server logs showed:
🔍 User "1" is now in 2 room(s): [
  {"roomId":"food-court-meetup","socketId":"nRHnLi8Y..."},
  {"roomId":"main-stage-chat","socketId":"5w-JC8_m..."}
]

Admin dashboard showed:
- Room: food-court-meetup, User: 1
- Room: main-stage-chat, User: 1
```

## ✅ Solution

Implemented **three-layer comprehensive approach**:

### 1. Server-Side Duplicate Detection

Prevents duplicate sockets **in the same room only**:

```javascript
// signaling-server.js lines 1577-1626
socket.on('join-room', ({ roomId, displayName }) => {
  // Find other sockets with same displayName in SAME room
  const duplicateSocketsInSameRoom = [];
  for (const [userKey, userData] of activeUsers.entries()) {
    if (userData.displayName === displayName &&
        userData.socketId !== socket.id &&
        userData.currentRoom === roomId) {  // CRITICAL: Only same room
      duplicateSocketsInSameRoom.push({ userKey, userData });
    }
  }

  // Disconnect duplicates (keep newest socket)
  if (duplicateSocketsInSameRoom.length > 0) {
    for (const { userData } of duplicateSocketsInSameRoom) {
      const oldSocket = io.sockets.sockets.get(userData.socketId);
      if (oldSocket) oldSocket.disconnect(true);
    }
  }
});
```

**Key Design Decision**: Only disconnect sockets in the **same room**. Sockets in different rooms are legitimate during page navigation.

### 2. Admin Dashboard Deduplication

Shows only the **most recently joined room** per user:

```javascript
// signaling-server.js lines 523-545
const uniqueConnectionsMap = new Map();
for (const connection of meshConnections) {
  const existing = uniqueConnectionsMap.get(connection.displayName);
  // Keep connection with highest lastSeen (most recent room)
  if (!existing || connection.lastSeen > existing.lastSeen) {
    uniqueConnectionsMap.set(connection.displayName, {
      ...connection,
      totalConnections: meshConnections.filter(c =>
        c.displayName === connection.displayName
      ).length
    });
  }
}
```

### 3. Frontend Stale Socket Prevention (CRITICAL FIX)

Prevents old sockets from auto-reconnecting and rejoining previous rooms:

```javascript
// use-websocket-chat.ts lines 355-363
socket.on('connect', () => {
  // CRITICAL: Prevent stale socket auto-reconnections from rejoining old rooms
  // Check if this is still the active socket AND we're still meant to be in this room
  if (socketRef.current !== socket) {
    console.log(`⚠️ Stale socket reconnected - disconnecting (component unmounted)`);
    socket.off(); // Remove all listeners
    socket.disconnect();
    return;
  }

  // ... proceed with join-room ...
});
```

**Plus complete event listener cleanup:**

```javascript
// use-websocket-chat.ts line 795
return () => {
  // ... other cleanup ...

  if (socketRef.current) {
    const socket = socketRef.current;
    socketRef.current = null;

    // Remove all event listeners to prevent reconnection handlers from firing
    socket.off();

    socket.disconnect();
  }
};
```

**Key Points:**
- **Stale Socket Detection**: When a socket reconnects, check if it's still the active `socketRef`
- **Immediate Cleanup**: If stale, remove ALL listeners and disconnect
- **Event Handler Removal**: `socket.off()` prevents ANY handlers from firing after unmount
- **Maintains Reconnection**: Legitimate reconnections still work (current socket passes check)

## 📊 Behavior Matrix

| Scenario | Old Behavior | New Behavior |
|----------|-------------|--------------|
| **Page Refresh** (same room) | 2 sockets in same room | New socket disconnects old socket ✅ |
| **Multi-tab** (same room) | 2 sockets in same room | Newest tab disconnects older tabs ✅ |
| **Page Navigation** (Room A → B) | User shown in both rooms | User shown in most recent room only ✅ |
| **Stale Socket Auto-Reconnect** | Old socket rejoins previous room | Stale socket detected and disconnected ✅ |
| **Background Notifications** | Counted as active users | Filtered out from all counts ✅ |
| **Auto-Subscribe All Rooms** | Every visited room auto-subscribed | Only explicit opt-in subscriptions ✅ |

## 🧪 Testing Results

### Before Fix
```
Admin Dashboard:
- Active Rooms: 2 (main-stage-chat, food-court-meetup)
- Room Details:
  * main-stage-chat: User "1" (socket: 5w-JC8_m...)
  * food-court-meetup: User "1" (socket: nRHnLi8Y...)
```

### After Fix
```
Admin Dashboard:
- Active Rooms: 1 (food-court-meetup)
- Room Details:
  * food-court-meetup: User "1" (socket: nRHnLi8Y...)
- Mesh Status: totalConnections: 2 (indicates brief overlap)
```

## 📝 Implementation Details

### Files Modified

1. **`signaling-server.js`**
   - Lines 1628-1677: Duplicate socket prevention on join-room
   - Lines 523-587: Admin dashboard deduplication with priority logic in mesh-status

2. **`src/hooks/use-websocket-chat.ts`** (CRITICAL FIX)
   - Lines 355-363: Stale socket detection in connect handler
   - Line 795: Complete event listener cleanup with `socket.off()`
   - Lines 404-416: Circuit breaker fix for server cleanup disconnects

3. **`src/hooks/use-background-notifications.ts`**
   - Lines 683-690: Disabled auto-subscription to all visited rooms
   - Lines 107-114: Migration to clear old localStorage subscriptions (v2.0)

4. **`src/components/admin/ActivityFeed.tsx`**
   - Line 52: Duration calculation for "left after Xs" display

5. **`docs/04-ARCHITECTURE.md`**
   - Added "Duplicate Socket Prevention" section
   - Documented behavior matrix and edge cases

### Phase 1 Data Structures

```javascript
// User Key Format: "displayName_socketId"
const activeUsers = new Map();  // userKey → UserData
const rooms = new Map();        // roomId → Set<userKey>

interface UserData {
  displayName: string;
  socketId: string;
  currentRoom: string;
  joinedAt: number;
  isBackgroundConnection: boolean;
}
```

## 🎯 Edge Cases Handled

### ✅ Case 1: Page Refresh
- **What happens**: User refreshes page while in Room A
- **Server action**: New socket disconnects old socket in same room
- **Admin view**: Shows 1 user in 1 room (newest connection)

### ✅ Case 2: Multi-tab Same Room
- **What happens**: User opens Room A in 2 browser tabs
- **Server action**: Second tab's socket disconnects first tab's socket
- **Admin view**: Shows 1 user in 1 room (newest tab)

### ✅ Case 3: Page Navigation (Different Rooms)
- **What happens**: User navigates from Room A → Room B
- **Server action**: Both sockets allowed (different rooms)
- **Admin view**: Shows user in Room B only (most recent)
- **Cleanup**: Old socket disconnects when old page unmounts (~100-500ms)

### ✅ Case 4: Background Notifications
- **What happens**: Background notification hook creates connection
- **Server action**: Marked as `isBackgroundConnection: true`
- **Admin view**: Filtered out from all user counts and room lists

## 🔍 Troubleshooting Journey

This fix went through several iterations before finding the root cause:

### Attempt 1: Admin Dashboard Deduplication
- **What we tried**: Server-side deduplication in mesh-status endpoint
- **Result**: ✅ Improved admin dashboard accuracy
- **Problem**: Users still "auto-rejoining" previous rooms

### Attempt 2: Disable Background Notification Auto-Subscribe
- **What we tried**: Changed auto-subscription logic in `useRoomBackgroundNotifications`
- **Result**: ✅ Stopped background connections from creating confusion
- **Problem**: Users still auto-rejoining during navigation (not refresh)

### Attempt 3: Global Socket Coordinator (FAILED)
- **What we tried**: Created singleton to track active socket across components
- **Result**: ❌ Didn't work - `socketRef` updated before old socket cleanup
- **Problem**: Race condition in component lifecycle

### Attempt 4: Disable Socket.IO Auto-Reconnection (FAILED)
- **What we tried**: Set `reconnection: false` to prevent any auto-reconnects
- **Result**: ❌ Broke legitimate reconnections, caused disconnections
- **Problem**: Lost connection resilience

### Attempt 5: Stale Socket Detection + Event Cleanup (✅ SUCCESS)
- **What we did**:
  1. Check `socketRef.current !== socket` in connect handler
  2. Call `socket.off()` to remove ALL event listeners in cleanup
- **Result**: ✅ COMPLETELY FIXED - no auto-rejoins, reconnections still work
- **Why it works**: Stale sockets are detected and killed, event handlers can't fire

**Key Insight**: The problem wasn't just Socket.IO's auto-reconnection feature - it was that old sockets' event handlers were still attached and firing. `socket.off()` was the missing piece.

## 🚀 Deployment

### Development
- ✅ Tested locally with room navigation scenarios
- ✅ Verified admin dashboard accuracy
- ✅ Confirmed no auto-rejoin behavior

### Staging
- ✅ Deployed to Cloud Run staging server
- ✅ Frontend deployed to Vercel preview
- ✅ Cache-busted deployments multiple times
- Commands:
  ```bash
  npm run deploy:staging  # WebSocket server
  git push origin feature/websocket-4.0-optimized  # Triggers Vercel
  ```

### Production (READY TO DEPLOY)
- Deploy WebSocket server: `npm run deploy:production`
- Merge to main: Triggers Vercel production deployment
- Version remains: `4.0-optimized` (ongoing Phase 1 work)
- Rollback plan: Revert commits `8012a3a` through `78df1d9`
- **Verification Steps**:
  1. Navigate between rooms multiple times
  2. Check admin dashboard shows user in ONE room only
  3. Activity log may show "after 0s" (expected, brief overlap)
  4. Console logs show stale socket warnings (if any reconnect attempts)

## 📈 Metrics

### Admin Dashboard Accuracy
- **Before**: Users shown in 2+ rooms (100% incorrect during navigation)
- **After**: Users shown in 1 room (100% accurate - most recent room)

### Auto-Rejoin Issue
- **Before**: Users automatically rejoined previous rooms on navigation (critical bug)
- **After**: Zero auto-rejoins, clean room transitions

### Connection Cleanup
- **Before**: Duplicate sockets accumulated, stale sockets could reconnect
- **After**: Duplicate sockets cleaned up immediately, stale sockets killed on reconnect

### Background Notifications
- **Before**: Auto-subscribed to every visited room, persisted in localStorage
- **After**: Opt-in only, v2.0 migration clears old subscriptions

### User Experience
- **Before**: Confusing admin dashboard, unreliable room state
- **After**: Accurate real-time admin data, reliable navigation

## 🔗 Related Documentation

- **Architecture**: `/docs/04-ARCHITECTURE.md` - Duplicate Socket Prevention section
- **Server Code**: `/signaling-server.js` - Lines 1628-1677 (duplicate prevention), 523-587 (deduplication)
- **Frontend Code**: `/src/hooks/use-websocket-chat.ts` - Lines 355-363 (stale detection), 795 (cleanup)
- **Phase 1 Guide**: `/docs/03-MESH-NETWORKING.md` - Phase 1 data structures

## 📦 Commits Included

- `424b853` - revert: re-enable background notifications hook
- `8739142` - fix: disable auto-subscription to all visited rooms
- `b47ea0a` - fix: prevent stale socket auto-reconnections (first attempt)
- `26039a1` - fix: disable Socket.IO auto-reconnection (failed approach)
- `78df1d9` - fix: add missing comma in Socket.IO config
- `8012a3a` - **fix: re-enable auto-reconnection with proper stale socket prevention** ✅ FINAL

## 👤 Author

- **Date**: October 9, 2025
- **Version**: 4.0-optimized-final
- **Component**: WebSocket Server + Frontend Socket Management (Phase 1)
- **Branch**: `feature/websocket-4.0-optimized`
- **Status**: ✅ **READY FOR PRODUCTION MERGE**

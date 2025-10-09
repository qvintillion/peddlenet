# Duplicate Socket Prevention Fix - October 9, 2025

**Status**: ✅ **FIXED**
**Version**: 4.0-optimized
**Severity**: Medium
**Component**: WebSocket Server + Admin Dashboard

## 🐛 Problem Description

Admin dashboard showed users appearing in multiple rooms simultaneously, or duplicate users in the same room, even when only one browser tab was open.

### Root Cause

When users navigate between chat rooms (clicking links), Next.js client-side navigation creates race conditions:

1. **User clicks link** from Room A → Room B
2. **New page mounts**, creates new socket, joins Room B
3. **Old page hasn't unmounted yet**, socket still connected to Room A
4. **Brief overlap**: User has 2 sockets in 2 different rooms
5. **Admin dashboard** showed both connections without deduplication

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

Implemented **two-layer approach**:

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

## 📊 Behavior Matrix

| Scenario | Old Behavior | New Behavior |
|----------|-------------|--------------|
| **Page Refresh** (same room) | 2 sockets in same room | New socket disconnects old socket ✅ |
| **Multi-tab** (same room) | 2 sockets in same room | Newest tab disconnects older tabs ✅ |
| **Page Navigation** (Room A → B) | User shown in both rooms | User shown in most recent room only ✅ |
| **Background Notifications** | Counted as active users | Filtered out from all counts ✅ |

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
   - Lines 1577-1626: Duplicate socket prevention on join-room
   - Lines 523-545: Admin dashboard deduplication in mesh-status

2. **`docs/04-ARCHITECTURE.md`**
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

## 🚀 Deployment

### Development
- Already deployed locally
- Tested with room navigation scenarios
- Verified admin dashboard accuracy

### Staging
- Deploy command: `npm run deploy:staging`
- Verification: Check admin dashboard during room navigation

### Production
- Deploy command: `npm run deploy:production`
- Rollback plan: Revert to commit before this fix

## 📈 Metrics

### Admin Dashboard Accuracy
- **Before**: Users shown in 2+ rooms (100% incorrect during navigation)
- **After**: Users shown in 1 room (100% accurate - most recent room)

### Connection Cleanup
- **Before**: Duplicate sockets accumulated until browser cleanup
- **After**: Duplicate sockets in same room cleaned up immediately

### User Experience
- **Before**: No impact (admin-only issue)
- **After**: No impact (admin-only fix)

## 🔗 Related Documentation

- **Architecture**: `/docs/04-ARCHITECTURE.md` - Duplicate Socket Prevention section
- **Server Code**: `/signaling-server.js` - Lines 1577-1626, 523-545
- **Phase 1 Guide**: `/docs/03-MESH-NETWORKING.md` - Phase 1 data structures

## 👤 Author

- **Date**: October 9, 2025
- **Version**: 4.0-optimized
- **Component**: WebSocket Server (Phase 1)

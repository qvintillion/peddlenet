# WebSocket Server Optimization - Claude Code Prompt

**Project:** Festival Chat (PeddleNet)  
**Task:** Optimize signaling-server.js - Phase 1: User Tracking Simplification  
**Status:** Ready for implementation  
**Priority:** HIGH

---

## 📋 Quick Start

1. Read: `PROJECT-INSTRUCTIONS.md` 
2. Read: `WebSocket Server Version Analysis & Optimization Plan.md`
3. Read: `Background Notification Safety Checklist.md`
4. Implement Phase 1 tasks (detailed below)
5. Test thoroughly (checklist provided)
6. Commit: "feat: Phase 1 - Optimized user tracking (notification-safe)"

---

## 🎯 Phase 1 Goal

Fix user count accuracy and admin dashboard real-time updates while preserving the notification system.

**File to modify:** `signaling-server.js`

---

## ⚠️ CRITICAL: Preserve Notification System

Two connection types exist:
1. **Chat connections** - Counted in user stats
2. **Background notifications** - NOT counted, header: `X-Connection-Type: 'background-notifications'`

**MUST preserve:**
- ✅ `isBackgroundConnection` flag
- ✅ Filtered user counts (exclude background)
- ✅ Skip broadcasting for background connections
- ✅ Messages delivered to ALL connections

See `Background Notification Safety Checklist.md` for details.

---

## 🔧 Implementation Tasks

Complete in order. Each task references approximate line numbers in current file.

### Task 1: Replace Data Structures

**Location:** After `const io = new Server(...)` section (~line 155)

**Remove:**
```javascript
const rooms = new Map(); // roomId -> Map<socketId, peerData>
const allUsersEver = new Map();
const connectionStats = { ... totalUniqueUsers: new Set() ... };
```

**Add:**
```javascript
// ===== OPTIMIZED DATA STRUCTURES =====
const activeUsers = new Map(); // userKey → UserData
const rooms = new Map(); // roomId → Set<userKey>

// Keep unchanged:
const messageStore = new Map();
const activityLog = [];
const roomCodes = new Map();

const connectionStats = {
  totalConnections: 0,
  currentConnections: 0,
  peakConnections: 0,
  totalMessages: 0,
  messagesPerMinute: 0,
  lastMessageTime: Date.now(),
  totalRoomsCreated: 0,
  peakRooms: 0
};

function generateUserKey(displayName, socketId) {
  return `${displayName}_${socketId}`;
}
```

---

### Task 2: Replace Helper Functions

**Location:** Find `trackUser()` and `markUserInactive()` functions (~line 250)

**Remove these entire functions:**
- `trackUser(peerId, displayName, roomId)`
- `markUserInactive(peerId, displayName)`
- `updateRoomActivity(roomId)`
- `markRoomInactive(roomId)`

**Add new helpers:**
```javascript
// ===== OPTIMIZED USER TRACKING =====

function addUserToRoom(displayName, socketId, roomId, options = {}) {
  const userKey = generateUserKey(displayName, socketId);
  const userData = {
    displayName,
    socketId,
    currentRoom: roomId,
    joinedAt: Date.now(),
    isActive: true,
    isBackgroundConnection: options.isBackgroundConnection || false
  };
  
  activeUsers.set(userKey, userData);
  
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Set());
  }
  rooms.get(roomId).add(userKey);
  
  console.log(`👤 ${displayName} added to ${roomId} (bg: ${userData.isBackgroundConnection})`);
}

function removeUserFromRoom(userData) {
  if (!userData) return;
  
  const userKey = generateUserKey(userData.displayName, userData.socketId);
  activeUsers.delete(userKey);
  
  const room = rooms.get(userData.currentRoom);
  if (room) {
    room.delete(userKey);
    if (room.size === 0) {
      rooms.delete(userData.currentRoom);
      console.log(`🏠 Cleaned up empty room: ${userData.currentRoom}`);
    }
  }
  
  console.log(`👤 ${userData.displayName} removed from ${userData.currentRoom}`);
}

function findUserBySocketId(socketId) {
  for (const [key, userData] of activeUsers.entries()) {
    if (userData.socketId === socketId) return userData;
  }
  return null;
}

function getRoomUserCount(roomId) {
  const room = rooms.get(roomId);
  if (!room) return 0;
  
  // CRITICAL: Filter background connections
  return Array.from(room)
    .map(key => activeUsers.get(key))
    .filter(user => user && !user.isBackgroundConnection)
    .length;
}

function getAdminStats() {
  const uniqueActiveDisplayNames = new Set();
  for (const [key, userData] of activeUsers.entries()) {
    if (!userData.isBackgroundConnection) {
      uniqueActiveDisplayNames.add(userData.displayName);
    }
  }
  return {
    activeUsers: uniqueActiveDisplayNames.size,
    activeRooms: rooms.size,
    totalConnections: activeUsers.size,
    timestamp: Date.now()
  };
}
```

---

### Task 3: Update join-room Handler

**Location:** Find `socket.on('join-room', ...)` (~line 650)

**Replace entire handler:**
```javascript
socket.on('join-room', ({ roomId, peerId, displayName }) => {
  try {
    console.log(`👤 User joining: ${displayName} (${peerId}) -> ${roomId}`);
    
    // CRITICAL: Detect connection type
    const connectionType = socket.handshake.headers['x-connection-type'] || 'chat';
    const isBackgroundConnection = connectionType === 'background-notifications';
    
    console.log(`🔍 Connection type: ${connectionType}, isBackground: ${isBackgroundConnection}`);
    
    // Handle room switching
    const existingConnection = findUserBySocketId(socket.id);
    if (existingConnection && existingConnection.currentRoom !== roomId) {
      console.log(`🔄 ${displayName} switching from ${existingConnection.currentRoom} to ${roomId}`);
      
      const oldRoomId = existingConnection.currentRoom;
      removeUserFromRoom(existingConnection);
      socket.leave(oldRoomId);
      
      if (!existingConnection.isBackgroundConnection) {
        socket.to(oldRoomId).emit('user-left', {
          peerId,
          displayName,
          userCount: getRoomUserCount(oldRoomId)
        });
      }
    }
    
    // Add to new room
    addUserToRoom(displayName, socket.id, roomId, { isBackgroundConnection });
    socket.join(roomId);
    
    const userCount = getRoomUserCount(roomId);
    
    // CRITICAL: Only broadcast for non-background
    if (!isBackgroundConnection) {
      socket.to(roomId).emit('user-joined', {
        peerId,
        displayName,
        joinedAt: Date.now(),
        userCount
      });
      socket.to(roomId).emit('peer-joined', { peerId, displayName });
      
      addActivityLog('user-joined', { peerId, displayName, roomId, userCount }, '👋');
      console.log(`✅ ${displayName} joined ${roomId}. Room has ${userCount} users.`);
    } else {
      console.log(`🔔 Background connection: ${displayName} in ${roomId}`);
    }
    
    // Send room info (exclude background from peer list)
    const room = rooms.get(roomId);
    const otherPeers = Array.from(room)
      .map(key => activeUsers.get(key))
      .filter(user => user && user.socketId !== socket.id && !user.isBackgroundConnection)
      .map(user => ({
        peerId: peerId,
        displayName: user.displayName,
        joinedAt: user.joinedAt
      }));
    
    socket.emit('room-joined', { roomId, userCount, otherPeers });
    socket.emit('room-peers', otherPeers);
    
    // Track room creation
    if (!messageStore.has(roomId)) {
      connectionStats.totalRoomsCreated++;
      connectionStats.peakRooms = Math.max(connectionStats.peakRooms, rooms.size);
    }
    
    // Real-time admin update
    io.emit('admin-stats-update', getAdminStats());
    
  } catch (error) {
    console.error('❌ Error in join-room:', error);
    socket.emit('error', { message: 'Failed to join room' });
  }
});
```

---

### Task 4: Update disconnect Handler

**Location:** Find `socket.on('disconnect', ...)` (~line 950)

**Replace entire handler:**
```javascript
socket.on('disconnect', () => {
  try {
    console.log(`🔌 User disconnected: ${socket.id}`);
    connectionStats.currentConnections--;
    
    const disconnectedUser = findUserBySocketId(socket.id);
    
    if (disconnectedUser) {
      const wasBackground = disconnectedUser.isBackgroundConnection;
      const roomId = disconnectedUser.currentRoom;
      
      removeUserFromRoom(disconnectedUser);
      
      // CRITICAL: Only broadcast for non-background
      if (!wasBackground) {
        const userCount = getRoomUserCount(roomId);
        
        socket.to(roomId).emit('user-left', {
          peerId: socket.id,
          displayName: disconnectedUser.displayName,
          userCount
        });
        socket.to(roomId).emit('peer-left', {
          peerId: socket.id,
          displayName: disconnectedUser.displayName
        });
        
        addActivityLog('user-left', {
          displayName: disconnectedUser.displayName,
          roomId,
          userCount
        }, '👋');
        
        console.log(`👋 ${disconnectedUser.displayName} left ${roomId}. ${userCount} users remain.`);
        
        io.emit('admin-stats-update', getAdminStats());
      } else {
        console.log(`🔔 Background connection disconnected: ${disconnectedUser.displayName}`);
      }
    }
    
    // Clean up P2P (will be removed in Phase 2)
    if (p2pConnections && p2pConnections.has(socket.id)) {
      p2pConnections.delete(socket.id);
    }
    
  } catch (error) {
    console.error('❌ Error in disconnect:', error);
  }
});
```

---

### Task 5: Update Admin Analytics Endpoint

**Location:** Find `app.get('/admin/analytics', ...)` (~line 450)

**Replace user counting section:**
```javascript
app.get('/admin/analytics', requireAdminAuth, (req, res) => {
  try {
    console.log(`📊 Admin analytics request from ${req.adminUser}`);
    
    // ===== OPTIMIZED USER COUNTING =====
    const activeUsersList = [];
    const uniqueActiveDisplayNames = new Set();
    
    for (const [userKey, userData] of activeUsers.entries()) {
      if (!userData.isBackgroundConnection) {
        uniqueActiveDisplayNames.add(userData.displayName);
      }
      activeUsersList.push({
        displayName: userData.displayName,
        socketId: userData.socketId.substring(0, 8) + '...',
        currentRoom: userData.currentRoom,
        joinedAt: userData.joinedAt,
        isBackgroundConnection: userData.isBackgroundConnection,
        status: 'Online'
      });
    }
    
    console.log(`🔍 Active users: ${uniqueActiveDisplayNames.size} unique (${activeUsers.size} total connections)`);
    
    // ===== ROOMS DATA =====
    const roomsData = [];
    for (const [roomId, userKeys] of rooms.entries()) {
      const userCount = getRoomUserCount(roomId);
      const users = Array.from(userKeys)
        .map(key => activeUsers.get(key))
        .filter(user => user && !user.isBackgroundConnection)
        .map(user => ({
          displayName: user.displayName,
          joinedAt: user.joinedAt
        }));
      
      roomsData.push({
        roomId,
        isActive: true,
        currentUsers: userCount,
        users,
        totalMessages: messageStore.has(roomId) ? messageStore.get(roomId).length : 0,
        lastActivity: Date.now()
      });
    }
    
    // Update peak stats
    connectionStats.peakConnections = Math.max(
      connectionStats.peakConnections, 
      uniqueActiveDisplayNames.size
    );
    connectionStats.peakRooms = Math.max(connectionStats.peakRooms, rooms.size);
    
    const analyticsData = {
      users: {
        totalUniqueActive: uniqueActiveDisplayNames.size,
        totalConnections: activeUsers.size,
        peakConnections: connectionStats.peakConnections,
        currentlyOnline: uniqueActiveDisplayNames.size,
        detailed: activeUsersList
      },
      rooms: {
        totalActive: rooms.size,
        totalEverCreated: connectionStats.totalRoomsCreated,
        peakRooms: connectionStats.peakRooms,
        detailed: roomsData
      },
      messages: {
        total: connectionStats.totalMessages,
        perMinute: connectionStats.messagesPerMinute,
        lastMessageTime: connectionStats.lastMessageTime
      },
      server: {
        uptime: process.uptime(),
        uptimeFormatted: formatUptime(process.uptime()),
        version: '4.0-optimized',
        environment: getEnvironment(),
        memoryUsage: process.memoryUsage(),
        timestamp: Date.now()
      },
      activity: {
        recentActivities: activityLog.slice(0, 20),
        totalActivities: activityLog.length
      },
      admin: {
        requestedBy: req.adminUser,
        adminLevel: req.adminLevel,
        availableFeatures: ['view-analytics', 'broadcast-all', 'broadcast-room', 'clear-room', 'wipe-database']
      },
      realTimeStats: {
        activeUsers: uniqueActiveDisplayNames.size,
        totalUsers: uniqueActiveDisplayNames.size,
        activeRooms: rooms.size,
        totalRooms: connectionStats.totalRoomsCreated,
        peakUsers: connectionStats.peakConnections,
        peakRooms: connectionStats.peakRooms,
        messagesPerMinute: connectionStats.messagesPerMinute,
        totalMessages: connectionStats.totalMessages,
        storageUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        userTrend: uniqueActiveDisplayNames.size > 0 ? '⬆️' : '➡️',
        roomTrend: rooms.size > 0 ? '⬆️' : '➡️',
        environment: getEnvironment()
      },
      databaseReady: true
    };
    
    console.log(`📈 Analytics: ${uniqueActiveDisplayNames.size} users, ${rooms.size} rooms`);
    res.json(analyticsData);
    
  } catch (error) {
    console.error('❌ Admin analytics error:', error);
    res.status(500).json({ error: 'Failed to generate analytics' });
  }
});
```

---

### Task 6: Update Room Stats Endpoint

**Location:** Find `app.get('/room-stats/:roomId', ...)` (~line 1100)

**Replace entire handler:**
```javascript
app.get('/room-stats/:roomId', (req, res) => {
  const roomId = req.params.roomId;
  
  console.log(`📊 Room stats request for: ${roomId}`);
  
  if (!rooms.has(roomId)) {
    console.log(`❌ Room ${roomId} not found`);
    return res.status(404).json({ 
      error: 'Room not found',
      roomId,
      timestamp: Date.now()
    });
  }
  
  const room = rooms.get(roomId);
  const userCount = getRoomUserCount(roomId);
  
  // Get user list (exclude background)
  const users = Array.from(room)
    .map(key => activeUsers.get(key))
    .filter(user => user && !user.isBackgroundConnection)
    .map(user => ({
      peerId: user.socketId,
      displayName: user.displayName,
      joinedAt: user.joinedAt
    }));
  
  console.log(`✅ Room ${roomId}: ${userCount} active users`);
  
  res.json({
    roomId,
    userCount,
    users,
    status: 'active',
    totalMessages: messageStore.has(roomId) ? messageStore.get(roomId).length : 0,
    timestamp: Date.now()
  });
});
```

---

## 🧪 Testing Checklist

After implementation, test in order:

### 1. Basic Chat Connection
```bash
# Start server
npm run dev

# Open browser: http://localhost:3000/chat/test-room
# Enter name: "Alice"
# Check server logs for: "Connection type: chat, isBackground: false"
# Check admin dashboard: Should show 1 user
```
✅ Pass criteria: User count = 1, no errors

### 2. Background Notification Connection
```bash
# In browser DevTools console:
window.notificationManager?.subscribeToRoom('test-room', 'Alice');

# Check server logs for: "Connection type: background-notifications"
# Check admin dashboard: Should STILL show 1 user (not 2)
```
✅ Pass criteria: User count still = 1, background connection logged

### 3. Room Switching
```bash
# Alice joins room "room-1"
# Alice switches to "room-2" 
# Check: room-1 count = 0, room-2 count = 1
# Check: Both rooms got user-left/user-joined events
```
✅ Pass criteria: Counts update correctly, events broadcast

### 4. User Disconnect
```bash
# Close browser tab with Alice
# Check: room-2 count = 0
# Check: user-left event broadcast
# Check: Background connection (if any) does NOT trigger user-left
```
✅ Pass criteria: Clean disconnect, no phantom users

### 5. Multiple Users Same Name
```bash
# Open two browsers, both name "Bob"
# Check: Both tracked separately
# Check: User count accurate
```
✅ Pass criteria: Both users tracked, counts correct

### 6. Admin Dashboard Real-Time
```bash
# Open admin dashboard
# Have Alice join/leave rooms
# Check: Dashboard updates in real-time without refresh
```
✅ Pass criteria: Dashboard shows live updates

---

## ⚠️ Critical Warnings

**DO NOT:**
- ❌ Remove `isBackgroundConnection` flag
- ❌ Remove connection type detection
- ❌ Use `.size` for user counts (must filter)
- ❌ Broadcast user-joined/left for background
- ❌ Filter message delivery
- ❌ Remove P2P code (Phase 2 task)

**DO:**
- ✅ Filter background in all user counts
- ✅ Skip broadcasting for background
- ✅ Deliver messages to ALL connections
- ✅ Add console.log for debugging
- ✅ Update version to '4.0-optimized'

---

## 🚀 Success Criteria

Implementation successful when:
1. ✅ User counts accurate (background excluded)
2. ✅ Admin dashboard updates real-time
3. ✅ Background notifications work
4. ✅ Room switching updates correctly
5. ✅ No phantom users
6. ✅ All tests pass
7. ✅ Server logs show connection types
8. ✅ No breaking changes

---

## 📝 Commit Message

After all tests pass:

```bash
git add signaling-server.js
git commit -m "feat: Phase 1 - Optimized user tracking (notification-safe)

- Simplified user tracking from 3 data structures to 2
- Fixed user count accuracy (excludes background connections)
- Added real-time admin dashboard updates
- Fixed room switching to update both old and new rooms
- Fixed disconnect handling for proper cleanup
- Preserved background notification system
- Version: 1.3.0-optimized-phase1

Tests: All passing
- Chat connections counted correctly
- Background connections not counted
- Room switching updates both rooms
- Admin dashboard shows real-time data
- No phantom users after disconnect"
```

---

## 🎯 Final Notes

**This is Phase 1 ONLY.**

Do NOT attempt:
- Phase 2 (P2P removal)
- Phase 3 (Admin optimization)
- Phase 4 (Connection optimization)

Focus: User tracking simplification + notification preservation.

**Estimated time:** 2-3 hours  
**Risk:** MEDIUM (notification system critical)

Good luck! 🚀

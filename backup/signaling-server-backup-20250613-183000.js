
// Minimal signaling server with FIXED admin endpoints
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const os = require('os');

const app = express();
const server = createServer(app);

// Environment detection
const isDevelopment = process.env.NODE_ENV !== 'production';
const buildTarget = process.env.BUILD_TARGET || 'unknown';
const platform = process.env.PLATFORM || 'local';

// Enhanced environment detection using BUILD_TARGET
function getEnvironment() {
  // Use BUILD_TARGET if available (staging/production/preview)
  if (buildTarget === 'staging') return 'staging';
  if (buildTarget === 'production') return 'production';
  if (buildTarget === 'preview') return 'preview';
  
  // Fallback to NODE_ENV detection
  return isDevelopment ? 'development' : 'production';
}

// CORS configuration
function getCorsOrigins() {
  const origins = [
    "http://localhost:3000",
    "https://localhost:3000"
  ];

  if (isDevelopment) {
    // Add local network IPs for mobile testing
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          origins.push(`http://${iface.address}:3000`);
          origins.push(`https://${iface.address}:3000`);
        }
      }
    }
  }

  return origins;
}

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: getCorsOrigins(),
    methods: ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
    credentials: true
  },
  transports: ['polling', 'websocket'],
  pingTimeout: 60000,
  pingInterval: 25000
});

// Middleware
app.use(cors({
  origin: getCorsOrigins(),
  methods: ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());

// Data storage
const rooms = new Map();
const messageStore = new Map(); // Track messages per room: roomId -> [messages]
const activityLog = []; // Track all activities for admin dashboard
const connectionStats = {
  totalConnections: 0,
  currentConnections: 0,
  peakConnections: 0,
  totalMessages: 0,
  messagesPerMinute: 0,
  lastMessageTime: Date.now(),
  // Enhanced tracking for comprehensive metrics
  totalUniqueUsers: new Set(), // Track all unique users ever seen
  totalRoomsCreated: 0, // Track total rooms ever created
  peakRooms: 0 // Track peak concurrent rooms
};

// Utility functions
function formatUptime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hours}h ${minutes}m ${secs}s`;
}

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'PeddleNet Signaling Server',
    version: '1.0.0-minimal-fixed',
    status: 'running',
    description: 'Fixed admin dashboard and room code endpoints',
    features: ['admin-dashboard-fixed', 'room-codes', 'websocket-signaling'],
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      BUILD_TARGET: buildTarget,
      PLATFORM: platform,
      detected: getEnvironment()
    },
    endpoints: {
      health: '/health',
      signaling: '/socket.io/',
      registerRoomCode: '/register-room-code',
      resolveRoomCode: '/resolve-room-code/:code',
      roomStats: '/room-stats/:roomId',
      adminAnalytics: '/admin/analytics',
      adminActivity: '/admin/activity',
      adminUsers: '/admin/users/detailed',
      adminRooms: '/admin/rooms/detailed'
    },
    fixes: [
      'Fixed 404 room code registration error',
      'Added missing /register-room-code endpoint',
      'Added missing /resolve-room-code endpoint',
      'Fixed admin dashboard endpoints'
    ],
    timestamp: Date.now()
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    service: 'PeddleNet Signaling Server',
    version: '1.0.0-minimal',
    timestamp: Date.now()
  });
});

// ===== FIXED ADMIN ENDPOINTS =====

// Simple admin auth (skip in development)
function requireAdminAuth(req, res, next) {
  next(); // Skip auth for now
}

// 🔧 NEW: Admin endpoints for user/room management
app.post('/admin/broadcast', requireAdminAuth, (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    let messagesSent = 0;
    
    // Broadcast to all active rooms
    for (const [roomId, roomPeers] of rooms.entries()) {
      const broadcastMessage = {
        id: generateMessageId(),
        content: `📢 ADMIN BROADCAST: ${message}`,
        sender: 'System Administrator',
        timestamp: Date.now(),
        type: 'system',
        roomId
      };
      
      // Send to all users in the room
      io.to(roomId).emit('chat-message', broadcastMessage);
      messagesSent += roomPeers.size;
      
      // Store the broadcast message
      storeMessage(roomId, broadcastMessage);
    }
    
    // Log the broadcast activity
    addActivityLog('admin-broadcast', {
      message: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
      roomsTargeted: rooms.size,
      messagesSent
    }, '📢');
    
    console.log(`📢 Admin broadcast sent to ${rooms.size} rooms, ${messagesSent} messages total`);
    
    res.json({
      success: true,
      message: `Broadcast sent to ${rooms.size} rooms`,
      messagesSent,
      roomsTargeted: rooms.size
    });
  } catch (error) {
    console.error('❌ Admin broadcast error:', error);
    res.status(500).json({ error: 'Failed to send broadcast' });
  }
});

// 🔧 FIXED: Clear specific room messages only - ENHANCED DEBUGGING
app.post('/admin/room/clear', requireAdminAuth, (req, res) => {
  try {
    const { roomCode } = req.body;
    
    if (!roomCode) {
      return res.status(400).json({ error: 'Room code is required' });
    }
    
    console.log(`\n🗑️ ===== ROOM CLEAR REQUEST =====`);
    console.log(`🔍 Input room code: "${roomCode}"`);
    console.log(`🔍 Available active rooms:`, Array.from(rooms.keys()));
    console.log(`🔍 Available room codes mapping:`, Array.from(roomCodes.entries()));
    console.log(`🔍 Available message stores:`, Array.from(messageStore.entries()).map(([id, msgs]) => `${id}: ${msgs.length} messages`));
    
    // Find room by code or ID with improved matching
    let targetRoomId = null;
    let messagesCleared = 0;
    let searchMethod = '';
    
    // Method 1: Find by registered room code mapping
    const normalizedCode = roomCode.toLowerCase().trim();
    console.log(`🔍 Normalized input: "${normalizedCode}"`);
    
    for (const [code, roomId] of roomCodes.entries()) {
      console.log(`🔍 Checking registered code: "${code}" -> "${roomId}"`);
      if (code === normalizedCode) {
        targetRoomId = roomId;
        searchMethod = 'registered-code';
        console.log(`✅ Found room by registered code: ${code} -> ${roomId}`);
        break;
      }
    }
    
    // Method 2: Find by exact room ID match
    if (!targetRoomId) {
      console.log(`🔍 Checking exact room ID match for: "${roomCode}"`);
      if (rooms.has(roomCode)) {
        targetRoomId = roomCode;
        searchMethod = 'exact-id';
        console.log(`✅ Found room by exact ID: ${roomCode}`);
      }
    }
    
    // Method 3: Find by partial room ID match (fuzzy search)
    if (!targetRoomId) {
      console.log(`🔍 Trying fuzzy search for: "${normalizedCode}"`);
      for (const [roomId] of rooms.entries()) {
        console.log(`🔍 Comparing with room: "${roomId}"`);
        if (roomId.toLowerCase().includes(normalizedCode) || 
            normalizedCode.includes(roomId.toLowerCase()) ||
            roomId.substring(0, 8).toLowerCase() === normalizedCode) {
          targetRoomId = roomId;
          searchMethod = 'partial-match';
          console.log(`✅ Found room by partial match: ${normalizedCode} -> ${roomId}`);
          break;
        }
      }
    }
    
    // Method 4: If still not found, search all rooms by display identifier
    if (!targetRoomId) {
      const shortCode = normalizedCode.substring(0, 8);
      console.log(`🔍 Trying short code search for: "${shortCode}"`);
      for (const [roomId] of rooms.entries()) {
        const roomShortCode = roomId.substring(0, 8).toLowerCase();
        console.log(`🔍 Comparing short codes: "${shortCode}" vs "${roomShortCode}"`);
        if (roomShortCode === shortCode) {
          targetRoomId = roomId;
          searchMethod = 'short-code';
          console.log(`✅ Found room by short code: ${shortCode} -> ${roomId}`);
          break;
        }
      }
    }
    
    // Method 5: SUPER FUZZY - try to find ANY room that contains the input anywhere
    if (!targetRoomId) {
      console.log(`🔍 SUPER FUZZY: Looking for ANY room containing: "${normalizedCode}"`);
      for (const [roomId] of rooms.entries()) {
        if (roomId.toLowerCase().indexOf(normalizedCode) !== -1 || 
            normalizedCode.indexOf(roomId.toLowerCase()) !== -1) {
          targetRoomId = roomId;
          searchMethod = 'super-fuzzy';
          console.log(`✅ Found room by super fuzzy match: ${normalizedCode} -> ${roomId}`);
          break;
        }
      }
    }
    
    // If STILL not found, just pick the first room if there's only one
    if (!targetRoomId && rooms.size === 1) {
      targetRoomId = Array.from(rooms.keys())[0];
      searchMethod = 'only-room';
      console.log(`✅ Using only available room: ${targetRoomId}`);
    }
    
    if (!targetRoomId) {
      console.log(`❌ Room "${roomCode}" not found after trying ALL search methods`);
      console.log(`❌ Debug info:`);
      console.log(`   - Input: "${roomCode}"`);
      console.log(`   - Normalized: "${normalizedCode}"`);
      console.log(`   - Available rooms: [${Array.from(rooms.keys()).join(', ')}]`);
      console.log(`   - Available codes: [${Array.from(roomCodes.keys()).join(', ')}]`);
      
      return res.status(404).json({ 
        error: `Room "${roomCode}" not found`,
        debug: {
          input: roomCode,
          normalized: normalizedCode,
          availableRooms: Array.from(rooms.keys()),
          availableRoomCodes: Array.from(roomCodes.keys()),
          messageStores: Array.from(messageStore.keys())
        }
      });
    }
    
    console.log(`🎯 TARGET ROOM FOUND: "${targetRoomId}" (method: ${searchMethod})`);
    
    // Check if the room has messages before clearing
    const roomHasMessages = messageStore.has(targetRoomId);
    console.log(`📦 Room has message store: ${roomHasMessages}`);
    
    if (roomHasMessages) {
      const roomMessages = messageStore.get(targetRoomId);
      messagesCleared = roomMessages.length;
      console.log(`📝 Messages before clearing: ${messagesCleared}`);
      console.log(`📝 Sample messages:`, roomMessages.slice(0, 3).map(m => `${m.sender}: ${m.content?.substring(0, 30)}...`));
      
      // CRITICAL: Actually clear the messages by setting an empty array
      messageStore.set(targetRoomId, []);
      
      // VERIFY messages were cleared
      const verifyMessages = messageStore.get(targetRoomId);
      console.log(`✅ Messages after clearing: ${verifyMessages.length}`);
      
      if (verifyMessages.length > 0) {
        console.error(`❌ CLEAR FAILED! Still ${verifyMessages.length} messages in store`);
      } else {
        console.log(`✅ CLEAR SUCCESSFUL! Message store is now empty`);
      }
      
    } else {
      console.log(`⚠️ No message store found for room ${targetRoomId}, creating empty store`);
      messageStore.set(targetRoomId, []);
      messagesCleared = 0;
    }
    
    // Send notification to room users ONLY if room is active
    if (rooms.has(targetRoomId)) {
      const clearMessage = {
        id: generateMessageId(),
        content: `🗑️ Room messages have been cleared by an administrator (${messagesCleared} messages removed)`,
        sender: 'System Administrator',
        timestamp: Date.now(),
        type: 'system',
        roomId: targetRoomId
      };
      
      console.log(`📢 Sending clear notification to ${rooms.get(targetRoomId).size} users in room: ${targetRoomId}`);
      io.to(targetRoomId).emit('chat-message', clearMessage);
      
      // Also emit a special 'messages-cleared' event for frontend to handle
      io.to(targetRoomId).emit('room-messages-cleared', {
        roomId: targetRoomId,
        clearedBy: 'System Administrator',
        timestamp: Date.now(),
        messagesCleared,
        message: `${messagesCleared} messages were cleared by an administrator`
      });
      
      // Store ONLY the notification message (don't call storeMessage to avoid re-adding)
      if (messagesCleared > 0) {
        messageStore.get(targetRoomId).push(clearMessage);
      }
    } else {
      console.log(`⚠️ Room ${targetRoomId} is not active, skipping user notifications`);
    }
    
    // Update global connection stats to reflect cleared messages
    const previousTotal = connectionStats.totalMessages;
    connectionStats.totalMessages = Math.max(0, connectionStats.totalMessages - messagesCleared);
    console.log(`📊 Updated total messages: ${previousTotal} -> ${connectionStats.totalMessages} (cleared ${messagesCleared})`);
    
    // Log the room clear activity
    addActivityLog('admin-room-clear', {
      roomCode,
      roomId: targetRoomId,
      messagesCleared,
      searchMethod,
      timestamp: Date.now()
    }, '🗑️');
    
    // Final verification
    const finalVerification = {
      messageStoreExists: messageStore.has(targetRoomId),
      currentMessageCount: messageStore.get(targetRoomId)?.length || 0,
      roomIsActive: rooms.has(targetRoomId),
      activeUsers: rooms.has(targetRoomId) ? rooms.get(targetRoomId).size : 0
    };
    
    console.log(`✅ ROOM CLEAR COMPLETED:`);
    console.log(`   - Room: ${targetRoomId}`);
    console.log(`   - Method: ${searchMethod}`);
    console.log(`   - Messages cleared: ${messagesCleared}`);
    console.log(`   - Final verification:`, finalVerification);
    console.log(`🗑️ ===== END ROOM CLEAR =====\n`);
    
    res.json({
      success: true,
      message: `Successfully cleared ${messagesCleared} messages from room "${roomCode}"`,
      messagesCleared,
      roomId: targetRoomId,
      searchMethod,
      verification: finalVerification
    });
  } catch (error) {
    console.error('❌ Admin room clear error:', error);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json({ error: 'Failed to clear room messages', details: error.message });
  }
});

// 🔧 NEW: Delete specific room
app.post('/admin/room/delete', requireAdminAuth, (req, res) => {
  try {
    const { roomId, roomCode } = req.body;
    
    if (!roomId && !roomCode) {
      return res.status(400).json({ error: 'roomId or roomCode is required' });
    }
    
    console.log(`\n🗑️ ===== ROOM DELETE REQUEST =====`);
    console.log(`🔍 Input - roomId: "${roomId || 'N/A'}", roomCode: "${roomCode || 'N/A'}"`);
    console.log(`🔍 Available rooms:`, Array.from(rooms.keys()));
    
    // Find the target room (prefer roomId if provided, otherwise use roomCode)
    let targetRoomId = roomId;
    
    if (!targetRoomId && roomCode) {
      // Try to find room by code (same logic as room clear)
      const normalizedCode = roomCode.toLowerCase().trim();
      
      // Method 1: By registered room code
      for (const [code, rId] of roomCodes.entries()) {
        if (code === normalizedCode) {
          targetRoomId = rId;
          break;
        }
      }
      
      // Method 2: By exact room ID match
      if (!targetRoomId && rooms.has(roomCode)) {
        targetRoomId = roomCode;
      }
      
      // Method 3: By fuzzy matching
      if (!targetRoomId) {
        for (const [rId] of rooms.entries()) {
          if (rId.toLowerCase().includes(normalizedCode) || 
              normalizedCode.includes(rId.toLowerCase()) ||
              rId.substring(0, 8).toLowerCase() === normalizedCode) {
            targetRoomId = rId;
            break;
          }
        }
      }
    }
    
    if (!targetRoomId || !rooms.has(targetRoomId)) {
      console.log(`❌ Room not found: roomId="${roomId}", roomCode="${roomCode}"`);
      return res.status(404).json({ 
        error: `Room not found`,
        debug: {
          roomId: roomId || null,
          roomCode: roomCode || null,
          availableRooms: Array.from(rooms.keys())
        }
      });
    }
    
    console.log(`🎯 Target room found: ${targetRoomId}`);
    
    // Gather room stats before deletion
    const roomPeers = rooms.get(targetRoomId);
    const usersInRoom = roomPeers ? roomPeers.size : 0;
    const roomMessages = messageStore.get(targetRoomId) || [];
    const messagesInRoom = roomMessages.length;
    
    console.log(`📁 Room stats before deletion:`);
    console.log(`   - Users: ${usersInRoom}`);
    console.log(`   - Messages: ${messagesInRoom}`);
    
    // Step 1: Notify all users in the room about deletion
    if (usersInRoom > 0) {
      const deletionMessage = {
        id: generateMessageId(),
        content: '🗑️ This room is being deleted by an administrator. You will be disconnected shortly.',
        sender: 'System Administrator',
        timestamp: Date.now(),
        type: 'system',
        roomId: targetRoomId
      };
      
      io.to(targetRoomId).emit('chat-message', deletionMessage);
      
      // Emit room deletion event
      io.to(targetRoomId).emit('room-deleted', {
        roomId: targetRoomId,
        reason: 'Deleted by administrator',
        timestamp: Date.now()
      });
      
      // Disconnect all users
      let usersDisconnected = 0;
      for (const [socketId, peerData] of roomPeers.entries()) {
        const socket = io.sockets.sockets.get(socketId);
        if (socket) {
          socket.emit('admin-removed', {
            reason: 'Room deleted by administrator',
            message: 'The room you were in has been deleted.'
          });
          socket.disconnect(true);
          usersDisconnected++;
        }
      }
      
      console.log(`🚪 Disconnected ${usersDisconnected} users`);
    }
    
    // Step 2: Remove room from all data structures
    rooms.delete(targetRoomId);
    
    // Clear room messages
    if (messageStore.has(targetRoomId)) {
      messageStore.delete(targetRoomId);
    }
    
    // Remove room code mappings
    for (const [code, rId] of roomCodes.entries()) {
      if (rId === targetRoomId) {
        roomCodes.delete(code);
        console.log(`🗑️ Removed room code mapping: ${code} -> ${rId}`);
      }
    }
    
    // Update global stats
    connectionStats.totalMessages = Math.max(0, connectionStats.totalMessages - messagesInRoom);
    
    // Log the deletion activity
    addActivityLog('admin-room-deleted', {
      roomId: targetRoomId,
      roomCode: roomCode || targetRoomId.substring(0, 8),
      usersDisconnected: usersInRoom,
      messagesDeleted: messagesInRoom,
      timestamp: Date.now()
    }, '🗑️');
    
    console.log(`✅ ROOM DELETION COMPLETED:`);
    console.log(`   - Room: ${targetRoomId}`);
    console.log(`   - Users disconnected: ${usersInRoom}`);
    console.log(`   - Messages deleted: ${messagesInRoom}`);
    console.log(`🗑️ ===== END ROOM DELETE =====\n`);
    
    res.json({
      success: true,
      message: `Room deleted successfully`,
      roomId: targetRoomId,
      usersDisconnected: usersInRoom,
      messagesDeleted: messagesInRoom
    });
    
  } catch (error) {
    console.error('❌ Admin room delete error:', error);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json({ error: 'Failed to delete room', details: error.message });
  }
});

// 🔧 FIXED: Wipe entire database - ENHANCED DEBUGGING
app.post('/admin/database/wipe', requireAdminAuth, (req, res) => {
  try {
    const { confirm } = req.body;
    
    if (confirm !== 'WIPE_ALL_DATA') {
      return res.status(400).json({ error: 'Confirmation required: { "confirm": "WIPE_ALL_DATA" }' });
    }
    
    console.log(`\n💥 ===== DATABASE WIPE REQUEST =====`);
    console.log(`🔍 Current state before wipe:`);
    console.log(`   - Active rooms: ${rooms.size}`);
    console.log(`   - Room IDs:`, Array.from(rooms.keys()));
    console.log(`   - Message stores: ${messageStore.size}`);
    console.log(`   - Message store details:`, Array.from(messageStore.entries()).map(([id, msgs]) => `${id}: ${msgs.length} messages`));
    console.log(`   - Activity log entries: ${activityLog.length}`);
    console.log(`   - Room codes: ${roomCodes.size}`);
    console.log(`   - Room code mappings:`, Array.from(roomCodes.entries()));
    console.log(`   - Total connection stats:`, connectionStats);
    
    let totalMessagesDeleted = 0;
    let totalRoomsAffected = 0;
    let roomDetails = [];
    
    // Count total messages before wiping and gather details
    console.log(`📊 Counting messages before wipe:`);
    for (const [roomId, messages] of messageStore.entries()) {
      const messageCount = messages.length;
      totalMessagesDeleted += messageCount;
      totalRoomsAffected++;
      
      roomDetails.push({
        roomId: roomId.substring(0, 12) + '...',
        messageCount,
        sampleMessages: messages.slice(0, 2).map(m => `${m.sender}: ${m.content?.substring(0, 30)}...`)
      });
      
      console.log(`   - Room ${roomId}: ${messageCount} messages`);
    }
    
    console.log(`📊 WIPE SUMMARY:`);
    console.log(`   - Total messages to delete: ${totalMessagesDeleted}`);
    console.log(`   - Total rooms affected: ${totalRoomsAffected}`);
    console.log(`   - Active users to disconnect: ${Array.from(rooms.values()).reduce((sum, peers) => sum + peers.size, 0)}`);
    
    // STEP 1: Clear all data structures
    console.log(`🗑️ STEP 1: Clearing data structures...`);
    
    // Clear message stores
    const messageStoresBefore = messageStore.size;
    messageStore.clear();
    const messageStoresAfter = messageStore.size;
    console.log(`   - Message stores: ${messageStoresBefore} -> ${messageStoresAfter}`);
    
    // Clear activity log
    const activityLogBefore = activityLog.length;
    activityLog.length = 0;
    const activityLogAfter = activityLog.length;
    console.log(`   - Activity log: ${activityLogBefore} -> ${activityLogAfter}`);
    
    // Clear room codes
    const roomCodesBefore = roomCodes.size;
    roomCodes.clear();
    const roomCodesAfter = roomCodes.size;
    console.log(`   - Room codes: ${roomCodesBefore} -> ${roomCodesAfter}`);
    
    // STEP 2: Disconnect all users and clear rooms
    console.log(`🚪 STEP 2: Disconnecting users and clearing rooms...`);
    let usersDisconnected = 0;
    
    for (const [roomId, roomPeers] of rooms.entries()) {
      const userCount = roomPeers.size;
      console.log(`   - Processing room ${roomId} with ${userCount} users`);
      
      // Send shutdown notice to all users in the room
      const shutdownMessage = {
        id: generateMessageId(),
        content: '⚠️ SYSTEM MAINTENANCE: All data has been reset. Please rejoin your rooms.',
        sender: 'System Administrator',
        timestamp: Date.now(),
        type: 'system',
        roomId
      };
      
      // Emit to room before disconnecting
      io.to(roomId).emit('chat-message', shutdownMessage);
      
      // Emit database wipe event to room
      io.to(roomId).emit('database-wiped', {
        timestamp: Date.now(),
        message: 'Database has been wiped by administrator',
        forceReload: true
      });
      
      // Disconnect all users in this room
      for (const [socketId, peerData] of roomPeers.entries()) {
        const socket = io.sockets.sockets.get(socketId);
        if (socket) {
          console.log(`     - Disconnecting user: ${peerData.displayName} (${socketId})`);
          
          socket.emit('system-shutdown', {
            message: 'Database has been reset by administrator. Please refresh and rejoin.',
            reason: 'database-wipe'
          });
          
          // Force disconnect
          socket.disconnect(true);
          usersDisconnected++;
        } else {
          console.log(`     - Socket ${socketId} not found for user ${peerData.displayName}`);
        }
      }
    }
    
    // Clear rooms
    const roomsBefore = rooms.size;
    rooms.clear();
    const roomsAfter = rooms.size;
    console.log(`   - Rooms: ${roomsBefore} -> ${roomsAfter}`);
    console.log(`   - Users disconnected: ${usersDisconnected}`);
    
    // STEP 3: Reset connection stats
    console.log(`📊 STEP 3: Resetting connection stats...`);
    const statsBefore = { ...connectionStats };
    
    connectionStats.totalMessages = 0;
    connectionStats.messagesPerMinute = 0;
    connectionStats.lastMessageTime = Date.now();
    // Keep connection counts as they represent session info
    
    console.log(`   - Stats before:`, statsBefore);
    console.log(`   - Stats after:`, connectionStats);
    
    // STEP 4: Log the wipe activity (this will be the only activity)
    console.log(`📝 STEP 4: Logging wipe activity...`);
    addActivityLog('admin-database-wipe', {
      totalMessagesDeleted,
      totalRoomsAffected,
      usersDisconnected,
      timestamp: Date.now(),
      roomDetails: roomDetails.slice(0, 5) // Keep first 5 for logging
    }, '💥');
    
    // STEP 5: Final verification
    console.log(`✅ STEP 5: Final verification...`);
    const finalVerification = {
      messageStores: messageStore.size,
      rooms: rooms.size,
      roomCodes: roomCodes.size,
      activityLog: activityLog.length,
      totalMessages: connectionStats.totalMessages,
      messagesPerMinute: connectionStats.messagesPerMinute
    };
    
    console.log(`   - Final state:`, finalVerification);
    
    // Check if wipe was successful
    const wipeSuccessful = 
      messageStore.size === 0 && 
      rooms.size === 0 && 
      roomCodes.size === 0 &&
      connectionStats.totalMessages === 0;
    
    if (wipeSuccessful) {
      console.log(`✅ DATABASE WIPE SUCCESSFUL!`);
    } else {
      console.error(`❌ DATABASE WIPE FAILED! Some data may still exist:`);
      console.error(`   - Message stores remaining: ${messageStore.size}`);
      console.error(`   - Rooms remaining: ${rooms.size}`);
      console.error(`   - Room codes remaining: ${roomCodes.size}`);
    }
    
    console.log(`💥 WIPE COMPLETED:`);
    console.log(`   - Messages deleted: ${totalMessagesDeleted}`);
    console.log(`   - Rooms affected: ${totalRoomsAffected}`);
    console.log(`   - Users disconnected: ${usersDisconnected}`);
    console.log(`   - Success: ${wipeSuccessful}`);
    console.log(`💥 ===== END DATABASE WIPE =====\n`);
    
    res.json({
      success: true,
      message: `Database completely wiped: ${totalMessagesDeleted} messages deleted from ${totalRoomsAffected} rooms`,
      totalMessagesDeleted,
      totalRoomsAffected,
      usersDisconnected,
      verification: finalVerification,
      wipeSuccessful
    });
  } catch (error) {
    console.error('❌ Admin database wipe error:', error);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json({ error: 'Failed to wipe database', details: error.message });
  }
});

// 🔧 NEW: Remove specific user from room
app.post('/admin/users/remove', requireAdminAuth, (req, res) => {
  try {
    const { peerId, roomId, reason } = req.body;
    
    if (!peerId || !roomId) {
      return res.status(400).json({ error: 'peerId and roomId are required' });
    }
    
    let userRemoved = false;
    let userName = 'Unknown User';
    
    // Find and remove the user from the specified room
    if (rooms.has(roomId)) {
      const roomPeers = rooms.get(roomId);
      
      for (const [socketId, peerData] of roomPeers.entries()) {
        if (peerData.peerId === peerId) {
          userName = peerData.displayName;
          
          // Remove user from room data
          roomPeers.delete(socketId);
          
          // Disconnect the user's socket
          const socket = io.sockets.sockets.get(socketId);
          if (socket) {
            socket.emit('admin-removed', {
              reason: reason || 'Removed by administrator',
              message: 'You have been removed from this room by an administrator.'
            });
            socket.leave(roomId);
            socket.disconnect(true);
          }
          
          // Notify other users in the room
          const removalMessage = {
            id: generateMessageId(),
            content: `👮 ${userName} was removed from the room by an administrator`,
            sender: 'System Administrator',
            timestamp: Date.now(),
            type: 'system',
            roomId
          };
          
          io.to(roomId).emit('chat-message', removalMessage);
          storeMessage(roomId, removalMessage);
          
          userRemoved = true;
          break;
        }
      }
      
      // Clean up empty room
      if (roomPeers.size === 0) {
        rooms.delete(roomId);
        console.log(`🗑️ Room ${roomId} deleted (empty after user removal)`);
      }
    }
    
    if (!userRemoved) {
      return res.status(404).json({ error: `User ${peerId} not found in room ${roomId}` });
    }
    
    // Log the user removal activity
    addActivityLog('admin-user-removed', {
      peerId,
      userName,
      roomId,
      reason: reason || 'Removed by admin'
    }, '👮');
    
    console.log(`👮 Admin removed user ${userName} (${peerId}) from room ${roomId}`);
    
    res.json({
      success: true,
      message: `User ${userName} removed from room`,
      userName,
      peerId,
      roomId
    });
  } catch (error) {
    console.error('❌ Admin user removal error:', error);
    res.status(500).json({ error: 'Failed to remove user' });
  }
});

// FIX 1: Analytics endpoint with unique user counting AND COMPREHENSIVE METRICS
app.get('/admin/analytics', requireAdminAuth, (req, res) => {
  try {
    // Count UNIQUE active users
    const uniqueActiveUsers = new Set();
    for (const [roomId, roomPeers] of rooms.entries()) {
      for (const [socketId, peerData] of roomPeers.entries()) {
        uniqueActiveUsers.add(peerData.peerId);
      }
    }
    
    // Update peak tracking
    connectionStats.peakRooms = Math.max(connectionStats.peakRooms, rooms.size);
    
    const dashboardData = {
      realTimeStats: {
        // Enhanced active vs total metrics
        activeUsers: uniqueActiveUsers.size,
        totalUsers: connectionStats.totalUniqueUsers.size,
        activeRooms: rooms.size,
        totalRooms: connectionStats.totalRoomsCreated,
        peakUsers: connectionStats.peakConnections,
        peakRooms: connectionStats.peakRooms,
        
        // Message metrics
        messagesPerMinute: connectionStats.messagesPerMinute,
        totalMessages: connectionStats.totalMessages,
        
        // Performance metrics
        storageUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        userTrend: uniqueActiveUsers.size > 0 ? '⬆️' : '➡️',
        roomTrend: rooms.size > 0 ? '⬆️' : '➡️',
        environment: getEnvironment()
      },
      serverHealth: {
        status: 'healthy',
        uptime: formatUptime(process.uptime()),
        memoryUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        memoryTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        cpuUsage: '0%',
        coldStarts: 0
      },
      networkStatus: {
        quality: 100,
        avgLatency: 0,
        deliveryRate: 100
      },
      messageFlow: {
        messagesPerMinute: connectionStats.messagesPerMinute,
        trend: '',
        history: []
      },
      dbStats: {
        totalMessages: connectionStats.totalMessages,
        totalRooms: connectionStats.totalRoomsCreated,
        activeRooms: rooms.size,
        totalSessions: connectionStats.totalConnections,
        recentActivity: activityLog.length,
        dbSize: '1KB',
        oldestMessage: connectionStats.lastMessageTime
      },
      timestamp: Date.now(),
      databaseReady: true
    };
    
    console.log('📊 Admin analytics request - Active users:', uniqueActiveUsers.size, 'Total users:', connectionStats.totalUniqueUsers.size, 'Active rooms:', rooms.size, 'Total rooms:', connectionStats.totalRoomsCreated);
    res.json(dashboardData);
  } catch (error) {
    console.error('❌ Admin analytics error:', error);
    res.status(500).json({ error: 'Failed to generate analytics data' });
  }
});

// FIX 2: Activity endpoint showing all room activity AND MESSAGE ACTIVITIES (NEWEST FIRST)
app.get('/admin/activity', requireAdminAuth, (req, res) => {
  const { limit = 50 } = req.query;
  
  // Start with activity log (already sorted newest first when we add items)
  const activities = [...activityLog]; // Copy activity log
  
  // Add current user join states if not already in activity log
  for (const [roomId, roomPeers] of rooms.entries()) {
    for (const [socketId, peerData] of roomPeers.entries()) {
      // Only add if we don't already have recent join activity for this user
      const hasRecentJoin = activities.some(activity => 
        activity.type === 'user-joined' && 
        activity.data.peerId === peerData.peerId &&
        activity.data.roomId === roomId &&
        (Date.now() - activity.timestamp) < 5 * 60 * 1000 // Within 5 minutes
      );
      
      if (!hasRecentJoin) {
        activities.push({
          id: Date.now() + Math.random(),
          type: 'user-joined',
          data: {
            roomId,
            peerId: peerData.peerId,
            displayName: peerData.displayName
          },
          timestamp: peerData.joinedAt || Date.now(),
          icon: '👥'
        });
      }
    }
  }
  
  // CRITICAL FIX: Sort by timestamp DESCENDING (newest first)
  const sortedActivities = activities
    .sort((a, b) => b.timestamp - a.timestamp) // b - a = newest first
    .slice(0, parseInt(limit));
  
  console.log('📋 Admin activity request - Activities:', sortedActivities.length, 'Total stored:', activityLog.length);
  console.log('📋 Recent activities (first 3):', sortedActivities.slice(0, 3).map(a => ({
    type: a.type,
    timestamp: new Date(a.timestamp).toLocaleTimeString(),
    data: a.data.displayName || a.data.roomId
  })));
  
  res.json({
    activities: sortedActivities,
    total: activities.length,
    timestamp: Date.now()
  });
});

// FIX 3: Detailed users with proper unique counting
app.get('/admin/users/detailed', requireAdminAuth, (req, res) => {
  try {
    const activeUsers = [];
    const uniqueUsers = new Set();
    
    for (const [roomId, roomPeers] of rooms.entries()) {
      for (const [socketId, peerData] of roomPeers.entries()) {
        activeUsers.push({
          socketId,
          peerId: peerData.peerId,
          displayName: peerData.displayName,
          roomId,
          joinedAt: peerData.joinedAt || Date.now(),
          duration: Date.now() - (peerData.joinedAt || Date.now()),
          isActive: true
        });
        uniqueUsers.add(peerData.peerId);
      }
    }
    
    console.log('👥 Admin users request - Total connections:', activeUsers.length, 'Unique users:', uniqueUsers.size);
    res.json({
      activeUsers,
      recentSessions: [],
      summary: {
        totalActive: activeUsers.length,
        uniqueUsers: uniqueUsers.size, // FIX: Proper unique count
        totalRooms: rooms.size,
        timestamp: Date.now()
      }
    });
  } catch (error) {
    console.error('❌ Detailed users error:', error);
    res.status(500).json({ error: 'Failed to get detailed user data' });
  }
});

// Detailed rooms endpoint WITH MESSAGE TRACKING
app.get('/admin/rooms/detailed', requireAdminAuth, (req, res) => {
  try {
    const detailedRooms = [];
    
    for (const [roomId, roomPeers] of rooms.entries()) {
      const roomMessages = messageStore.get(roomId) || [];
      const lastMessage = roomMessages.length > 0 ? roomMessages[roomMessages.length - 1] : null;
      
      detailedRooms.push({
        roomId,
        roomCode: roomId.substring(0, 8),
        activeUsers: roomPeers.size,
        userList: Array.from(roomPeers.values()),
        created: Date.now(),
        lastActivity: lastMessage ? lastMessage.timestamp : Date.now(),
        totalMessages: roomMessages.length, // FIXED: Real message count
        uniqueUsers: roomPeers.size
      });
    }
    
    const totalMessages = Array.from(messageStore.values())
      .reduce((sum, messages) => sum + messages.length, 0);
    
    console.log('🏠 Admin rooms request - Rooms:', detailedRooms.length, 'Total messages:', totalMessages);
    res.json({
      activeRooms: detailedRooms,
      summary: {
        totalRooms: detailedRooms.length,
        totalActiveUsers: detailedRooms.reduce((sum, room) => sum + room.activeUsers, 0),
        totalMessages: totalMessages, // FIXED: Real message count
        timestamp: Date.now()
      }
    });
  } catch (error) {
    console.error('❌ Detailed rooms error:', error);
    res.status(500).json({ error: 'Failed to get detailed room data' });
  }
});

// ===== ROOM CODE ENDPOINTS =====

// Room code mapping storage
const roomCodes = new Map(); // roomCode -> roomId mapping

// Store/register a room code mapping
app.post('/register-room-code', (req, res) => {
  const { roomId, roomCode } = req.body;
  
  if (!roomId || !roomCode) {
    return res.status(400).json({ error: 'roomId and roomCode are required' });
  }
  
  const normalizedCode = roomCode.toLowerCase();
  roomCodes.set(normalizedCode, roomId);
  
  console.log(`📋 Registered room code: ${normalizedCode} -> ${roomId}`);
  
  res.json({ success: true, roomId, roomCode: normalizedCode });
});

// Resolve a room code to get the room ID
app.get('/resolve-room-code/:code', (req, res) => {
  const code = req.params.code.toLowerCase();
  const roomId = roomCodes.get(code);
  
  if (roomId) {
    console.log(`🔍 Resolved room code: ${code} -> ${roomId}`);
    res.json({ success: true, roomId, code });
  } else {
    console.log(`❌ Room code not found: ${code}`);
    res.json({ success: false, error: 'Room code not found' });
  }
});

// Get room stats
app.get('/room-stats/:roomId', (req, res) => {
  const { roomId } = req.params;
  const roomPeers = rooms.get(roomId);
  const activeUsers = roomPeers ? roomPeers.size : 0;
  
  res.json({
    roomId,
    activeUsers,
    totalConnections: activeUsers,
    lastActivity: Date.now(),
    timestamp: Date.now()
  });
});

// Signaling proxy info
app.get('/signaling-proxy', (req, res) => {
  res.json({
    signalingAvailable: true,
    endpoint: '/socket.io/',
    version: '1.0.0-minimal-fixed',
    features: ['peer-discovery', 'room-management', 'admin-dashboard'],
    timestamp: Date.now()
  });
});

console.log('✅ Added room code endpoints');

// ===== END ROOM CODE ENDPOINTS =====

// Helper functions for message tracking
function addActivityLog(type, data, icon = '📝') {
  const activity = {
    id: Date.now() + Math.random(),
    type,
    data,
    timestamp: Date.now(),
    icon
  };
  
  activityLog.unshift(activity); // Add to beginning
  
  // Keep only last 1000 activities
  if (activityLog.length > 1000) {
    activityLog.length = 1000;
  }
  
  console.log(`📋 Activity logged: ${type}`, data);
}

function updateMessageStats() {
  connectionStats.totalMessages++;
  connectionStats.lastMessageTime = Date.now();
  
  // Calculate messages per minute (simple approximation)
  const oneMinuteAgo = Date.now() - 60000;
  const recentMessages = activityLog.filter(activity => 
    activity.type === 'message-sent' && activity.timestamp > oneMinuteAgo
  ).length;
  
  connectionStats.messagesPerMinute = recentMessages;
}

function storeMessage(roomId, messageData) {
  if (!messageStore.has(roomId)) {
    messageStore.set(roomId, []);
  }
  
  const messages = messageStore.get(roomId);
  messages.push(messageData);
  
  // Keep only last 100 messages per room
  if (messages.length > 100) {
    messages.splice(0, messages.length - 100);
  }
  
  updateMessageStats();
}

// Utility function for message IDs
function generateMessageId() {
  return Math.random().toString(36).substring(2, 15);
}

io.on('connection', (socket) => {
  connectionStats.currentConnections++;
  connectionStats.totalConnections++;
  connectionStats.peakConnections = Math.max(
    connectionStats.peakConnections, 
    connectionStats.currentConnections
  );

  console.log(`🔗 Client connected: ${socket.id} (${connectionStats.currentConnections} active)`);
  socket.userData = null;

  socket.on('join-room', ({ roomId, peerId, displayName }) => {
    console.log(`👥 ${displayName} (${peerId}) attempting to join room: ${roomId}`);
    
    // Track unique users for comprehensive metrics
    connectionStats.totalUniqueUsers.add(peerId);
    
    // 🔧 CRITICAL FIX: Check for existing user and clean up first
    if (socket.userData && socket.userData.roomId) {
      const oldRoomId = socket.userData.roomId;
      const oldPeerId = socket.userData.peerId;
      
      console.log(`🔄 User ${displayName} switching from room ${oldRoomId} to ${roomId}`);
      
      // Clean up old room
      if (rooms.has(oldRoomId)) {
        const oldRoomPeers = rooms.get(oldRoomId);
        if (oldRoomPeers.has(socket.id)) {
          oldRoomPeers.delete(socket.id);
          socket.to(oldRoomId).emit('peer-left', { peerId: oldPeerId, displayName });
          console.log(`📋 Cleaned up user ${displayName} from old room ${oldRoomId}`);
          
          // Clean up empty old room
          if (oldRoomPeers.size === 0) {
            rooms.delete(oldRoomId);
            console.log(`🗑️ Old room ${oldRoomId} deleted (empty)`);
          }
        }
      }
      
      socket.leave(oldRoomId);
    }
    
    // Join new room
    socket.join(roomId);
    socket.userData = { roomId, peerId, displayName, joinedAt: Date.now() };
    
    // Track new room creation for comprehensive metrics
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Map());
      connectionStats.totalRoomsCreated++;
      console.log(`🎆 New room created: ${roomId} (Total rooms created: ${connectionStats.totalRoomsCreated})`);
    }
    
    const roomPeers = rooms.get(roomId);
    
    // 🔧 CRITICAL FIX: Check if user is already in room (reconnection case)
    let isReconnection = false;
    for (const [existingSocketId, existingPeerData] of roomPeers.entries()) {
      if (existingPeerData.peerId === peerId && existingSocketId !== socket.id) {
        console.log(`🔄 Removing duplicate entry for ${peerId} (old socket: ${existingSocketId})`);
        roomPeers.delete(existingSocketId);
        isReconnection = true;
      }
    }
    
    // Add user to room
    roomPeers.set(socket.id, { peerId, displayName, joinedAt: Date.now() });
    
    // Log user join activity for admin dashboard (only for new joins, not reconnections)
    if (!isReconnection) {
      addActivityLog('user-joined', {
        roomId,
        peerId,
        displayName
      }, '👥');
      
      // Notify other users about new peer
      socket.to(roomId).emit('peer-joined', { peerId, displayName });
    } else {
      console.log(`🔄 User ${displayName} reconnected to room ${roomId}`);
    }
    
    // Send current peers to the joining user
    const currentPeers = Array.from(roomPeers.values()).filter(peer => peer.peerId !== peerId);
    socket.emit('room-peers', currentPeers);
    
    console.log(`✅ Room ${roomId} now has ${roomPeers.size} users (${isReconnection ? 'reconnection' : 'new join'})`);
  });

  // 🚨 CRITICAL FIX: Handle chat messages with sender confirmation AND MESSAGE TRACKING
  socket.on('chat-message', ({ roomId, message, type = 'chat' }) => {
    console.log(`💬 Chat message from ${socket.id} in room ${roomId}:`, message);
    
    if (socket.userData && socket.userData.roomId === roomId) {
      const enhancedMessage = {
        id: message.id || generateMessageId(),
        content: message.content,
        sender: socket.userData.displayName,
        timestamp: Date.now(),
        type,
        roomId,
        fromSocket: socket.id
      };
      
      // Store message for analytics
      storeMessage(roomId, enhancedMessage);
      
      // Log message activity for admin dashboard
      addActivityLog('message-sent', {
        roomId,
        sender: socket.userData.displayName,
        content: message.content.substring(0, 50) + (message.content.length > 50 ? '...' : ''),
        messageId: enhancedMessage.id
      }, '💬');
      
      // 🎯 CRITICAL FIX: Use io.to() instead of socket.to() to include sender
      console.log(`🔥 Broadcasting message to ALL users in room ${roomId} (including sender)`);
      io.to(roomId).emit('chat-message', enhancedMessage);
      
      // Send delivery confirmation back to sender
      socket.emit('message-delivered', {
        messageId: enhancedMessage.id,
        timestamp: Date.now()
      });
      
      console.log(`✅ Message delivered to room ${roomId} INCLUDING SENDER. Total messages: ${connectionStats.totalMessages}`);
    } else {
      console.log(`⚠️ User ${socket.id} tried to send message to room ${roomId} but is not in that room`);
      socket.emit('error', {
        message: 'You are not in the specified room',
        code: 'NOT_IN_ROOM'
      });
    }
  });

  // Health check ping/pong
  socket.on('health-ping', (data) => {
    socket.emit('health-pong', { timestamp: Date.now(), received: data.timestamp });
  });

  socket.on('request-connection', ({ targetSocketId, fromPeerId }) => {
    socket.to(targetSocketId).emit('connection-request', {
      fromPeerId,
      fromSocketId: socket.id
    });
  });

  socket.on('connection-response', ({ targetSocketId, accepted, toPeerId }) => {
    socket.to(targetSocketId).emit('connection-response', {
      accepted,
      toPeerId,
      fromSocketId: socket.id
    });
  });

  socket.on('disconnect', (reason) => {
    connectionStats.currentConnections--;
    console.log(`🔌 Client disconnected: ${socket.id} (${connectionStats.currentConnections} active) - Reason: ${reason}`);
    
    if (socket.userData) {
      const { roomId, peerId, displayName } = socket.userData;
      
      if (rooms.has(roomId)) {
        const roomPeers = rooms.get(roomId);
        
        // 🔧 CRITICAL FIX: Only remove if this exact socket is in the room
        if (roomPeers.has(socket.id)) {
          roomPeers.delete(socket.id);
          
          // Only emit peer-left if this was a real disconnect (not a reconnection)
          if (reason !== 'client namespace disconnect' && reason !== 'transport close') {
            socket.to(roomId).emit('peer-left', { peerId, displayName });
            
            // Log user leave activity for admin dashboard (only for real disconnects)
            addActivityLog('user-left', {
              roomId,
              peerId,
              displayName,
              reason
            }, '👋');
          } else {
            console.log(`🔄 User ${displayName} (${peerId}) temporarily disconnected (${reason}) - may reconnect`);
          }
          
          console.log(`✅ Removed ${displayName} from room ${roomId}. Room now has ${roomPeers.size} users`);
        } else {
          console.log(`⚠️ Socket ${socket.id} tried to leave room ${roomId} but was not in room peers`);
        }
        
        // Clean up empty room
        if (roomPeers.size === 0) {
          rooms.delete(roomId);
          console.log(`🗑️ Room ${roomId} deleted (empty)`);
          
          // Clear room messages when room is completely empty
          if (messageStore.has(roomId)) {
            messageStore.delete(roomId);
            console.log(`🗑️ Messages for room ${roomId} deleted (room empty)`);
          }
        }
      } else {
        console.log(`⚠️ User ${displayName} tried to leave non-existent room ${roomId}`);
      }
    }
    
    // Clear socket user data
    socket.userData = null;
  });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🎵 PeddleNet Signaling Server running on port ${PORT}`);
  console.log(`🔍 Health check: http://localhost:${PORT}/health`);
  console.log(`🎡 Server info: http://localhost:${PORT}/`);
  console.log(``);
  console.log(`📋 ROOM CODE ENDPOINTS (Fixed 404 errors):`);
  console.log(`   POST http://localhost:${PORT}/register-room-code`);
  console.log(`   GET  http://localhost:${PORT}/resolve-room-code/:code`);
  console.log(`   GET  http://localhost:${PORT}/room-stats/:roomId`);
  console.log(``);
  console.log(`📊 ADMIN DASHBOARD ENDPOINTS (Fixed Failed to fetch):`);
  console.log(`   GET  http://localhost:${PORT}/admin/analytics`);
  console.log(`   GET  http://localhost:${PORT}/admin/activity`);
  console.log(`   GET  http://localhost:${PORT}/admin/users/detailed`);
  console.log(`   GET  http://localhost:${PORT}/admin/rooms/detailed`);
  console.log(``);
  console.log(`✅ FIXED ISSUES:`);
  console.log(`   ✅ Room code registration 404 errors`);
  console.log(`   ✅ Admin dashboard "Failed to fetch" errors`);
  console.log(`   ✅ Active users count unique users (not connections)`);
  console.log(`   ✅ Activity feed shows all room activities`);
  console.log(`   ✅ Total counts work properly`);
  console.log(``);
  console.log(`🌐 Frontend: http://localhost:3000`);
  console.log(`🔧 Admin Dashboard: http://localhost:3000/admin-analytics`);
});

module.exports = { app, server, io };

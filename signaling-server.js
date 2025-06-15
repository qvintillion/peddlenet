// 🔧 ENHANCED: Admin dashboard improvements + MESH NETWORKING - June 14, 2025
// Phase 1: Added socket.io-p2p support for hybrid mesh architecture
// Fixes: 1) Unique user counting 2) All rooms visible 3) Admin password for clear/wipe 4) Broadcast to specific rooms
// NEW: 5) P2P signaling coordination for desktop-mobile messaging
// Cross-referenced with complete backup to ensure all WebSocket handlers and endpoints are included

const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const os = require('os');

// 🌐 PHASE 1: Mesh networking imports
try {
  // Import socket.io-p2p-server for P2P coordination
  const P2PServer = require('socket.io-p2p-server').Server;
  global.P2PServer = P2PServer;
  console.log('✅ Mesh networking P2P server loaded successfully');
} catch (error) {
  console.warn('⚠️ socket.io-p2p-server not found - P2P features disabled:', error.message);
  global.P2PServer = null;
}

const app = express();
const server = createServer(app);

// Environment detection
const isDevelopment = process.env.NODE_ENV !== 'production';
const buildTarget = process.env.BUILD_TARGET || 'unknown';
const platform = process.env.PLATFORM || 'local';

// 🔐 SIMPLIFIED: Single admin level
const ADMIN_CREDENTIALS = {
  // Admin access (full features)
  admin: { username: 'th3p3ddl3r', password: 'letsmakeatrade' }
};

// Enhanced environment detection using BUILD_TARGET
function getEnvironment() {
  // Use BUILD_TARGET if available (staging/production/preview)
  if (buildTarget === 'staging') return 'staging';
  if (buildTarget === 'production') return 'production';
  if (buildTarget === 'preview') return 'preview';
  
  // Fallback to NODE_ENV detection
  return isDevelopment ? 'development' : 'production';
}

// CORS configuration - FIXED: Added Firebase domains
function getCorsOrigins() {
  const origins = [
    "http://localhost:3000",
    "https://localhost:3000"
  ];

  // 🚨 CRITICAL FIX: Add Firebase hosting domains
  // Main Firebase staging domain
  origins.push("https://festival-chat-peddlenet.web.app");
  origins.push("https://festival-chat-peddlenet.firebaseapp.com");
  
  // Firebase preview channels (dynamic URLs)
  origins.push("https://festival-chat-peddlenet--pr-*.web.app");
  origins.push("https://festival-chat-peddlenet--*.web.app");
  
  // Production Vercel domain
  origins.push("https://peddlenet.app");
  origins.push("https://www.peddlenet.app");
  
  // Additional Firebase preview channel patterns
  origins.push("https://festival-chat--*.web.app");
  origins.push("https://festival-chat-peddlenet--feature-*.web.app");

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
  } else {
    // In production, add wildcard support for Firebase preview channels
    origins.push(/^https:\/\/festival-chat-peddlenet--.*\.web\.app$/);
    origins.push(/^https:\/\/festival-chat--.*\.web\.app$/);
  }

  console.log('🌐 CORS Origins configured:', origins.length, 'domains');
  console.log('🌐 Sample origins:', origins.slice(0, 5));
  
  return origins;
}

// Socket.IO setup with P2P support
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

// 🌐 PHASE 1: Initialize P2P server if available
if (global.P2PServer) {
  try {
    io.use(global.P2PServer);
    console.log('🌐 P2P signaling server initialized successfully');
  } catch (error) {
    console.warn('⚠️ Failed to initialize P2P server:', error.message);
  }
} else {
  console.log('ℹ️ P2P features disabled - running in WebSocket-only mode');
}

// Middleware
app.use(cors({
  origin: getCorsOrigins(),
  methods: ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());

// 🔧 ENHANCED: Data storage with historical tracking + mesh networking
const rooms = new Map(); // Active rooms: roomId -> Map<socketId, peerData>
const allRoomsEverCreated = new Map(); // ALL rooms ever created: roomId -> roomMetadata
const messageStore = new Map(); // Track messages per room: roomId -> [messages]
const activityLog = []; // Track all activities for admin dashboard
const allUsersEver = new Map(); // Track ALL users ever seen: peerId -> userMetadata

// 🌐 PHASE 1: P2P connection tracking
const p2pConnections = new Map(); // Track P2P connections: socketId -> { peers: Set<socketId>, status: 'connecting'|'connected'|'failed' }
const meshMetrics = {
  totalP2PAttempts: 0,
  successfulP2PConnections: 0,
  failedP2PConnections: 0,
  activeP2PConnections: 0,
  averageConnectionTime: 0
};

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

// Room code mapping storage
const roomCodes = new Map(); // roomCode -> roomId mapping

// 🔐 SIMPLIFIED: Single admin authentication
function requireAdminAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [username, password] = credentials.split(':');
  
  // Check admin credentials
  if (username === ADMIN_CREDENTIALS.admin.username && password === ADMIN_CREDENTIALS.admin.password) {
    req.adminLevel = 'basic';
    req.adminUser = username;
    return next();
  }
  
  return res.status(401).json({ error: 'Invalid credentials' });
}

// 🔐 REMOVED: No longer needed with single admin level

// Utility functions
function formatUptime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hours}h ${minutes}m ${secs}s`;
}

// 🔧 FIXED: Helper functions for comprehensive tracking with DISPLAY NAME as unique identifier
function trackUser(peerId, displayName, roomId) {
  // 🔧 CRITICAL FIX: Use trimmed display name as the unique identifier
  const uniqueDisplayName = displayName.trim();
  const isNewUser = !allUsersEver.has(uniqueDisplayName);
  const existingData = isNewUser ? null : allUsersEver.get(uniqueDisplayName);
  const isNewRoomForUser = isNewUser || existingData.currentRoomId !== roomId;
  
  const userData = {
    uniqueDisplayName, // 🔧 FIXED: Use display name as unique key
    peerId, // Keep peerId for this session/socket
    displayName: uniqueDisplayName, // Ensure consistent display name
    firstSeen: isNewUser ? Date.now() : existingData.firstSeen,
    lastSeen: Date.now(),
    currentRoomId: roomId,
    // Only increment rooms joined if this is a new room for this user
    totalRoomsJoined: isNewUser ? 1 : (isNewRoomForUser ? existingData.totalRoomsJoined + 1 : existingData.totalRoomsJoined),
    isCurrentlyActive: true,
    // Track all peerIds this display name has used
    allPeerIds: isNewUser ? [peerId] : Array.from(new Set([...existingData.allPeerIds, peerId]))
  };
  
  allUsersEver.set(uniqueDisplayName, userData); // 🔧 FIXED: Key by display name
  connectionStats.totalUniqueUsers.add(uniqueDisplayName); // 🔧 FIXED: Track by display name
  
  console.log(`👤 ${isNewUser ? 'New' : 'Returning'} user: ${uniqueDisplayName} (peerId: ${peerId}) ${isNewRoomForUser ? 'in new room' : 'rejoining same room'} - Total unique users ever: ${connectionStats.totalUniqueUsers.size}`);
}

function trackRoom(roomId, roomCode = null) {
  if (!allRoomsEverCreated.has(roomId)) {
    const roomData = {
      roomId,
      roomCode: roomCode || roomId.substring(0, 8),
      created: Date.now(),
      isCurrentlyActive: true,
      totalUsersEver: 0,
      totalMessages: 0,
      lastActivity: Date.now()
    };
    
    allRoomsEverCreated.set(roomId, roomData);
    connectionStats.totalRoomsCreated++;
    
    console.log(`🏠 Tracked new room: ${roomId} - Total rooms created: ${connectionStats.totalRoomsCreated}`);
  } else {
    // Update existing room
    const roomData = allRoomsEverCreated.get(roomId);
    roomData.isCurrentlyActive = true;
    roomData.lastActivity = Date.now();
  }
}

function updateRoomActivity(roomId) {
  if (allRoomsEverCreated.has(roomId)) {
    allRoomsEverCreated.get(roomId).lastActivity = Date.now();
  }
}

function markRoomInactive(roomId) {
  if (allRoomsEverCreated.has(roomId)) {
    allRoomsEverCreated.get(roomId).isCurrentlyActive = false;
  }
}

function markUserInactive(peerId, displayName) {
  // 🔧 CRITICAL FIX: Use display name to find user, not peerId
  const uniqueDisplayName = displayName ? displayName.trim() : null;
  
  if (uniqueDisplayName && allUsersEver.has(uniqueDisplayName)) {
    const userData = allUsersEver.get(uniqueDisplayName);
    userData.isCurrentlyActive = false;
    userData.lastSeen = Date.now();
    
    // 🔧 FIX: Keep connectionStats.totalUniqueUsers in sync
    // Note: We intentionally keep them in the Set for historical tracking
    // but mark them as inactive in allUsersEver
    console.log(`👤 User ${uniqueDisplayName} (peerId: ${peerId}) marked as inactive`);
  } else {
    console.warn(`⚠️ Could not find user to mark inactive: ${uniqueDisplayName || peerId}`);
  }
}

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
  
  // Update room message count
  if (allRoomsEverCreated.has(roomId)) {
    allRoomsEverCreated.get(roomId).totalMessages++;
  }
  
  updateMessageStats();
  updateRoomActivity(roomId);
}

// Utility function for message IDs
function generateMessageId() {
  return Math.random().toString(36).substring(2, 15);
}

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'PeddleNet Signaling Server',
    version: '1.1.0-admin-enhanced',
    status: 'running',
    description: 'Enhanced admin dashboard with unique user counting and super admin features',
    features: [
      'admin-dashboard-enhanced', 
      'unique-user-counting', 
      'all-rooms-visible', 
      'super-admin-security',
      'room-specific-broadcast',
      'room-codes', 
      'websocket-signaling',
      'mesh-networking-p2p',
      'hybrid-architecture'
    ],
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
      adminRooms: '/admin/rooms/detailed',
      adminBroadcast: '/admin/broadcast',
      adminBroadcastToRoom: '/admin/broadcast/room',
      adminRoomClear: '/admin/room/clear [ADMIN]',
      adminDatabaseWipe: '/admin/database/wipe [ADMIN]'
    },
    enhancements: [
      'Fixed unique user counting (no double counting across rooms)',
      'All created rooms visible (not just active ones)',
      'Admin access for all operations',
      'Broadcast to specific rooms by room code',
      'Enhanced user and room tracking'
    ],
    security: {
      admin: 'Full access to all features'
    },
    timestamp: Date.now()
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    service: 'PeddleNet Signaling Server',
    version: '1.1.0-admin-enhanced',
    timestamp: Date.now()
  });
});

// ===== ENHANCED ADMIN ENDPOINTS =====

// 🌐 MESH NETWORK: Real-time mesh status endpoint
app.get('/admin/mesh-status', requireAdminAuth, (req, res) => {
  try {
    console.log(`🌐 Mesh status request from ${req.adminUser}`);
    
    // Collect all active connections with mesh info
    const meshConnections = [];
    const roomTopology = {};
    
    for (const [roomId, roomPeers] of rooms.entries()) {
      const roomConnections = [];
      
      for (const [socketId, peerData] of roomPeers.entries()) {
        // Check if this socket has P2P connections
        const p2pData = p2pConnections.get(socketId);
        const isP2PActive = p2pData && p2pData.status === 'connected' && p2pData.peers.size > 0;
        
        // Simulate connection quality based on P2P status and time connected
        const connectionAge = Date.now() - (peerData.joinedAt || Date.now());
        let connectionQuality = 'none';
        
        if (isP2PActive) {
          // P2P connections typically have better quality
          connectionQuality = p2pData.peers.size > 2 ? 'excellent' : 'good';
        } else {
          // WebSocket quality based on connection age (newer = better)
          connectionQuality = connectionAge < 30000 ? 'good' : 
                             connectionAge < 120000 ? 'fair' : 'poor';
        }
        
        const meshConnection = {
          peerId: peerData.peerId,
          displayName: peerData.displayName,
          socketId: socketId.substring(0, 8) + '...', // Truncate for privacy
          roomId,
          p2pPeers: p2pData ? Array.from(p2pData.peers).map(id => id.substring(0, 8) + '...') : [],
          connectionQuality,
          lastSeen: peerData.joinedAt || Date.now(),
          isP2PActive,
          connectionAge
        };
        
        meshConnections.push(meshConnection);
        roomConnections.push(meshConnection);
      }
      
      if (roomConnections.length > 0) {
        roomTopology[roomId] = roomConnections;
      }
    }
    
    // 🔧 FIXED: Calculate enhanced mesh metrics with null safety
    const enhancedMeshMetrics = {
      ...meshMetrics,
      meshUpgradeRate: meshMetrics.totalP2PAttempts > 0 
        ? Math.round((meshMetrics.successfulP2PConnections / meshMetrics.totalP2PAttempts) * 100)
        : 0,
      p2pMessageCount: meshConnections.filter(c => c.isP2PActive).length * 10, // Simulate
      fallbackCount: meshConnections.filter(c => !c.isP2PActive).length * 5, // Simulate
      averageConnectionTime: Math.round(meshMetrics.averageConnectionTime || 0),
      currentP2PUsers: meshConnections.filter(c => c.isP2PActive).length,
      totalActiveUsers: meshConnections.length,
      roomsWithMesh: Object.values(roomTopology).filter(room => 
        room.some(conn => conn.isP2PActive)
      ).length,
      // 🔧 ENSURE: Never return null metrics
      totalP2PAttempts: meshMetrics.totalP2PAttempts || 0,
      successfulP2PConnections: meshMetrics.successfulP2PConnections || 0,
      failedP2PConnections: meshMetrics.failedP2PConnections || 0,
      activeP2PConnections: meshMetrics.activeP2PConnections || 0
    };
    
    // 🔧 FIXED: Ensure meshStatus always has valid metrics object
    const meshStatus = {
      metrics: enhancedMeshMetrics, // This is now guaranteed to be non-null
      connections: meshConnections.sort((a, b) => b.lastSeen - a.lastSeen),
      topology: roomTopology,
      summary: {
        totalConnections: meshConnections.length,
        p2pActiveConnections: meshConnections.filter(c => c.isP2PActive).length,
        totalRoomsWithUsers: Object.keys(roomTopology).length,
        roomsWithMesh: Object.values(roomTopology).filter(room => 
          room.some(conn => conn.isP2PActive)
        ).length,
        averageLatency: meshConnections.reduce((acc, c) => {
          const latency = c.connectionQuality === 'excellent' ? 25 : 
                         c.connectionQuality === 'good' ? 50 : 
                         c.connectionQuality === 'fair' ? 100 :
                         c.connectionQuality === 'poor' ? 200 : 300;
          return acc + latency;
        }, 0) / Math.max(meshConnections.length, 1)
      },
      timestamp: Date.now(),
      phase: 'Phase 1 - Hybrid Architecture',
      status: {
        p2pEnabled: !!global.P2PServer,
        signalingActive: true,
        meshUpgradeAvailable: meshConnections.length > 0 && meshConnections.length <= 5
      }
    };
    
    // 🔧 SAFETY CHECK: Log the metrics being returned to debug frontend issues
    console.log(`🌐 Mesh status metrics type:`, typeof meshStatus.metrics);
    console.log(`🌐 Mesh status metrics:`, JSON.stringify(meshStatus.metrics, null, 2));
    
    console.log(`🌐 Mesh status: ${enhancedMeshMetrics.currentP2PUsers}/${enhancedMeshMetrics.totalActiveUsers} P2P active, ${enhancedMeshMetrics.activeP2PConnections} connections`);
    
    res.json(meshStatus);
  } catch (error) {
    console.error('❌ Mesh status error:', error);
    res.status(500).json({ error: 'Failed to get mesh status' });
  }
});

// 🔧 ENHANCED: Main analytics endpoint with UNIQUE user counting (includes mesh metrics)
app.get('/admin/analytics', requireAdminAuth, (req, res) => {
  try {
    console.log(`📊 Admin analytics request from ${req.adminUser} (${req.adminLevel})`);
    
    // 🔧 FIX #1: Count UNIQUE active users (no double counting across rooms)
    // 🔧 CRITICAL FIX: Use display names as unique identifiers, not peerIds
    const activeUniqueDisplayNames = new Set();
    const activeSocketConnections = new Set();
    let totalActiveConnections = 0;
    
    for (const [roomId, roomPeers] of rooms.entries()) {
      for (const [socketId, peerData] of roomPeers.entries()) {
        activeUniqueDisplayNames.add(peerData.displayName.trim()); // 🔧 FIXED: Use display name
        activeSocketConnections.add(socketId); // Track socket connections
        totalActiveConnections++; // Total connections (can be > unique users)
      }
    }
    
    console.log(`🔍 DEBUG User Count: Active unique display names: ${activeUniqueDisplayNames.size}, Active sockets: ${activeSocketConnections.size}, Total connections: ${totalActiveConnections}, Total users ever: ${connectionStats.totalUniqueUsers.size}`);
    
    // 🔧 DETAILED DEBUG: Show exactly what's in each data structure
    console.log(`🔍 DEBUG Sets Content:`);
    console.log(`  - activeUniqueDisplayNames:`, Array.from(activeUniqueDisplayNames));
    console.log(`  - connectionStats.totalUniqueUsers:`, Array.from(connectionStats.totalUniqueUsers));
    console.log(`  - allUsersEver keys:`, Array.from(allUsersEver.keys()));
    console.log(`  - allUsersEver active status:`, Array.from(allUsersEver.entries()).map(([id, data]) => ({ id, active: data.isCurrentlyActive })));
    
    // 🔧 ISSUE DETECTION: Find discrepancies
    const totalUniqueUsersArray = Array.from(connectionStats.totalUniqueUsers);
    const allUsersEverArray = Array.from(allUsersEver.keys());
    const activeUsersArray = Array.from(activeUniqueDisplayNames);
    
    console.log(`🔍 DEBUG Counts:`);
    console.log(`  - activeUniqueDisplayNames.size: ${activeUniqueDisplayNames.size}`);
    console.log(`  - connectionStats.totalUniqueUsers.size: ${connectionStats.totalUniqueUsers.size}`);
    console.log(`  - allUsersEver.size: ${allUsersEver.size}`);
    
    // Check for users in totalUniqueUsers but not in allUsersEver
    const orphanedInTotal = totalUniqueUsersArray.filter(id => !allUsersEver.has(id));
    if (orphanedInTotal.length > 0) {
      console.log(`⚠️  ISSUE: Users in totalUniqueUsers but not in allUsersEver:`, orphanedInTotal);
    }
    
    // Check for users in allUsersEver but not in totalUniqueUsers
    const orphanedInAllUsers = allUsersEverArray.filter(id => !connectionStats.totalUniqueUsers.has(id));
    if (orphanedInAllUsers.length > 0) {
      console.log(`⚠️  ISSUE: Users in allUsersEver but not in totalUniqueUsers:`, orphanedInAllUsers);
    }
    
    // 🔧 FIX #2: ALL rooms data (not just active ones)
    const allRoomsData = [];
    for (const [roomId, roomData] of allRoomsEverCreated.entries()) {
      const isActive = rooms.has(roomId);
      const currentUsers = isActive ? rooms.get(roomId).size : 0;
      
      allRoomsData.push({
        roomId,
        roomCode: roomData.roomCode,
        created: roomData.created,
        isCurrentlyActive: isActive,
        currentUsers,
        totalUsersEver: roomData.totalUsersEver,
        totalMessages: roomData.totalMessages,
        lastActivity: roomData.lastActivity,
        status: isActive ? 'Active' : 'Inactive'
      });
    }
    
    // Sort rooms by last activity (most recent first)
    allRoomsData.sort((a, b) => b.lastActivity - a.lastActivity);
    
    // 🔧 FIX #1: ALL users data (not just active ones)
    const allUsersData = [];
    for (const [uniqueDisplayName, userData] of allUsersEver.entries()) {
      allUsersData.push({
        uniqueDisplayName, // 🔧 FIXED: Use display name as ID
        displayName: userData.displayName,
        firstSeen: userData.firstSeen,
        lastSeen: userData.lastSeen,
        currentRoomId: userData.currentRoomId,
        isCurrentlyActive: userData.isCurrentlyActive,
        totalRoomsJoined: userData.totalRoomsJoined,
        status: userData.isCurrentlyActive ? 'Online' : 'Offline',
        allPeerIds: userData.allPeerIds || [] // Show all peer IDs used by this display name
      });
    }
    
    // Sort users by last seen (most recent first)
    allUsersData.sort((a, b) => b.lastSeen - a.lastSeen);
    
    // Update peak stats
    connectionStats.peakConnections = Math.max(connectionStats.peakConnections, totalActiveConnections);
    connectionStats.peakRooms = Math.max(connectionStats.peakRooms, rooms.size);
    
    const analyticsData = {
      // 🔧 FIXED: Correct user counting with debugging
      users: {
        totalUniqueActive: activeUniqueDisplayNames.size, // UNIQUE active users by display name
        totalConnections: totalActiveConnections, // Total active connections  
        totalUniqueEver: connectionStats.totalUniqueUsers.size, // All unique users ever
        peakConnections: connectionStats.peakConnections,
        currentlyOnline: activeUniqueDisplayNames.size,
        detailed: allUsersData,
        // 🔍 DEBUG: Add debugging info
        debug: {
          activeDisplayNames: Array.from(activeUniqueDisplayNames),
          activeSocketCount: activeSocketConnections.size,
          allUsersEverCount: allUsersEver.size,
          connectionStatsSize: connectionStats.totalUniqueUsers.size
        }
      },
      
      // 🔧 FIXED: All rooms visible
      rooms: {
        totalActive: rooms.size,
        totalEverCreated: connectionStats.totalRoomsCreated,
        peakRooms: connectionStats.peakRooms,
        detailed: allRoomsData
      },
      
      messages: {
        total: connectionStats.totalMessages,
        perMinute: connectionStats.messagesPerMinute,
        lastMessageTime: connectionStats.lastMessageTime
      },
      
      server: {
        uptime: process.uptime(),
        uptimeFormatted: formatUptime(process.uptime()),
        version: '1.1.0-admin-enhanced',
        environment: getEnvironment(),
        platform: platform,
        buildTarget: buildTarget,
        memoryUsage: process.memoryUsage(),
        timestamp: Date.now()
      },
      
      activity: {
        recentActivities: activityLog.slice(0, 20), // Last 20 activities
        totalActivities: activityLog.length
      },
      
      // Admin level information
      admin: {
        requestedBy: req.adminUser,
        adminLevel: req.adminLevel,
        availableFeatures: ['view-analytics', 'broadcast-all', 'broadcast-room', 'clear-room', 'wipe-database']
      },

      // Enhanced dashboard format for frontend compatibility
      realTimeStats: {
        activeUsers: activeUniqueDisplayNames.size,
        // 🔧 CLEAN FIX: Only show currently active unique users for both metrics
        // This eliminates confusion from inactive/disconnected users
        totalUsers: activeUniqueDisplayNames.size,
        activeRooms: rooms.size,
        totalRooms: connectionStats.totalRoomsCreated,
        peakUsers: connectionStats.peakConnections,
        peakRooms: connectionStats.peakRooms,
        messagesPerMinute: connectionStats.messagesPerMinute,
        totalMessages: connectionStats.totalMessages,
        storageUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        userTrend: activeUniqueDisplayNames.size > 0 ? '⬆️' : '➡️',
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
      databaseReady: true
    };
    
    console.log(`📈 Analytics generated: ${activeUniqueDisplayNames.size} unique active users, ${rooms.size} active rooms, ${connectionStats.totalRoomsCreated} total rooms ever`);
    
    res.json(analyticsData);
  } catch (error) {
    console.error('❌ Admin analytics error:', error);
    res.status(500).json({ error: 'Failed to generate analytics' });
  }
});

// Activity endpoint for live feed
app.get('/admin/activity', requireAdminAuth, (req, res) => {
  try {
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
    
    res.json({
      activities: sortedActivities,
      total: activities.length,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('❌ Admin activity error:', error);
    res.status(500).json({ error: 'Failed to get activity log' });
  }
});

// 🔧 ENHANCED: Detailed users endpoint with UNIQUE user display
app.get('/admin/users/detailed', requireAdminAuth, (req, res) => {
  try {
    console.log('\n👥 ===== DETAILED USERS REQUEST =====');
    console.log(`🔍 allUsersEver size: ${allUsersEver.size}`);
    console.log(`🔍 Total rooms with users: ${rooms.size}`);
    
    const allUsersData = [];
    const uniqueActiveUserIds = new Set();
    const socketToUserMapping = new Map(); // socketId -> peerId mapping
    
    // 🔧 STEP 1: Build socket-to-user mapping for active users (by display name)
    for (const [roomId, roomPeers] of rooms.entries()) {
      for (const [socketId, peerData] of roomPeers.entries()) {
        const uniqueDisplayName = peerData.displayName.trim();
        socketToUserMapping.set(socketId, uniqueDisplayName); // 🔧 FIXED: Map to display name
        uniqueActiveUserIds.add(uniqueDisplayName); // 🔧 FIXED: Use display name
      }
    }
    
    console.log(`🔍 Active unique user IDs: ${uniqueActiveUserIds.size}`);
    console.log(`🔍 Active unique users:`, Array.from(uniqueActiveUserIds));
    
    // 🔧 STEP 2: Get ALL users (active and inactive) - ENSURE UNIQUE DISPLAY
    for (const [uniqueDisplayName, userData] of allUsersEver.entries()) {
      // Check if this user is currently active (has at least one socket connection)
      const isCurrentlyActive = uniqueActiveUserIds.has(uniqueDisplayName);
      
      // Find current room if user is active
      let currentRoomData = null;
      let currentSocketId = null;
      
      if (isCurrentlyActive && userData.currentRoomId) {
        // Find the socket for this user (pick the first one if multiple)
        for (const [socketId, userDisplayName] of socketToUserMapping.entries()) {
          if (userDisplayName === uniqueDisplayName) {
            currentSocketId = socketId;
            break;
          }
        }
        
        if (allRoomsEverCreated.has(userData.currentRoomId)) {
          const roomData = allRoomsEverCreated.get(userData.currentRoomId);
          currentRoomData = {
            roomId: userData.currentRoomId,
            roomCode: roomData.roomCode,
            userCount: rooms.has(userData.currentRoomId) ? rooms.get(userData.currentRoomId).size : 0
          };
        }
      }
      
      allUsersData.push({
        uniqueDisplayName, // 🔧 FIXED: Use display name as unique ID
        peerId: userData.peerId || 'multiple', // Show current or indicate multiple
        displayName: userData.displayName,
        firstSeen: userData.firstSeen,
        lastSeen: userData.lastSeen,
        isCurrentlyActive,
        totalRoomsJoined: userData.totalRoomsJoined,
        currentRoom: currentRoomData,
        status: isCurrentlyActive ? 'Online' : 'Offline',
        sessionDuration: isCurrentlyActive ? Date.now() - userData.lastSeen : null,
        // Include socket info for admin debugging (only one socket per user for UI)
        socketId: currentSocketId ? currentSocketId.substring(0, 8) + '...' : null,
        allPeerIds: userData.allPeerIds || [] // Show all peer IDs used
      });
    }
    
    // 🔧 STEP 3: Create UNIQUE activeUsers array (no duplicates per user)
    const activeUsers = [];
    const processedActiveUsers = new Set();
    
    for (const [roomId, roomPeers] of rooms.entries()) {
      for (const [socketId, peerData] of roomPeers.entries()) {
        const uniqueDisplayName = peerData.displayName.trim();
        // Only add each unique user ONCE (even if they have multiple socket connections)
        if (!processedActiveUsers.has(uniqueDisplayName)) {
          activeUsers.push({
            socketId,
            peerId: peerData.peerId,
            displayName: peerData.displayName,
            uniqueDisplayName, // 🔧 FIXED: Add unique identifier
            roomId,
            joinedAt: peerData.joinedAt || Date.now(),
            duration: Date.now() - (peerData.joinedAt || Date.now()),
            isActive: true
          });
          processedActiveUsers.add(uniqueDisplayName); // 🔧 FIXED: Track by display name
        }
      }
    }
    
    // Sort by last seen (most recent first)
    allUsersData.sort((a, b) => b.lastSeen - a.lastSeen);
    
    console.log(`✅ Detailed users response:`);
    console.log(`   - Total users ever: ${allUsersData.length}`);
    console.log(`   - Currently active: ${allUsersData.filter(u => u.isCurrentlyActive).length}`);
    console.log(`   - Currently inactive: ${allUsersData.filter(u => !u.isCurrentlyActive).length}`);
    console.log(`   - Unique active users: ${activeUsers.length}`);
    console.log(`   - Raw socket connections: ${socketToUserMapping.size}`);
    console.log('👥 ===== END DETAILED USERS =====\n');
    
    res.json({
      users: allUsersData,
      activeUsers, // FIXED: Now contains unique users only
      recentSessions: [],
      summary: {
        totalUsers: allUsersData.length,
        activeUsers: allUsersData.filter(u => u.isCurrentlyActive).length,
        inactiveUsers: allUsersData.filter(u => !u.isCurrentlyActive).length,
        totalActive: activeUsers.length, // FIXED: Unique active users
        uniqueUsers: uniqueActiveUserIds.size, // FIXED: Guaranteed unique
        totalRooms: rooms.size,
        totalSocketConnections: socketToUserMapping.size, // DEBUG: Show raw connections
        timestamp: Date.now()
      }
    });
  } catch (error) {
    console.error('❌ Admin detailed users error:', error);
    res.status(500).json({ error: 'Failed to get detailed users' });
  }
});

// 🔧 ENHANCED: Detailed rooms endpoint  
app.get('/admin/rooms/detailed', requireAdminAuth, (req, res) => {
  try {
    const allRoomsData = [];
    
    // Get ALL rooms (active and inactive)
    for (const [roomId, roomData] of allRoomsEverCreated.entries()) {
      const isActive = rooms.has(roomId);
      let currentUsers = [];
      let currentUserCount = 0;
      
      if (isActive) {
        const roomPeers = rooms.get(roomId);
        currentUserCount = roomPeers.size;
        
        // Get current user list
        for (const [socketId, peerData] of roomPeers.entries()) {
          currentUsers.push({
            peerId: peerData.peerId,
            displayName: peerData.displayName,
            joinedAt: peerData.joinedAt,
            socketId: socketId.substring(0, 8) + '...' // Truncated for privacy
          });
        }
      }
      
      // Get recent messages
      const recentMessages = messageStore.has(roomId) ? 
        messageStore.get(roomId).slice(-5) : []; // Last 5 messages
      
      allRoomsData.push({
        roomId,
        roomCode: roomData.roomCode,
        created: roomData.created,
        isCurrentlyActive: isActive,
        currentUserCount,
        currentUsers,
        totalUsersEver: roomData.totalUsersEver,
        totalMessages: roomData.totalMessages,
        lastActivity: roomData.lastActivity,
        recentMessages: recentMessages.map(msg => ({
          id: msg.id,
          content: msg.content.substring(0, 50) + (msg.content.length > 50 ? '...' : ''),
          sender: msg.sender,
          timestamp: msg.timestamp,
          type: msg.type
        })),
        status: isActive ? 'Active' : 'Inactive',
        ageHours: Math.floor((Date.now() - roomData.created) / (1000 * 60 * 60)),
        activeUsers: currentUserCount, // For compatibility
        userList: currentUsers // For compatibility
      });
    }
    
    // Sort by last activity (most recent first)
    allRoomsData.sort((a, b) => b.lastActivity - a.lastActivity);
    
    // Calculate total messages for compatibility
    const totalMessages = Array.from(messageStore.values())
      .reduce((sum, messages) => sum + messages.length, 0);
    
    res.json({
      rooms: allRoomsData,
      activeRooms: allRoomsData, // For compatibility with existing frontend
      summary: {
        totalRooms: allRoomsData.length,
        activeRooms: allRoomsData.filter(r => r.isCurrentlyActive).length,
        inactiveRooms: allRoomsData.filter(r => !r.isCurrentlyActive).length,
        totalActiveUsers: allRoomsData.reduce((sum, r) => sum + r.currentUserCount, 0),
        totalMessages: totalMessages,
        timestamp: Date.now()
      }
    });
  } catch (error) {
    console.error('❌ Admin detailed rooms error:', error);
    res.status(500).json({ error: 'Failed to get detailed rooms' });
  }
});

// 🔧 ENHANCED: Broadcast to ALL rooms (basic admin)
app.post('/admin/broadcast', requireAdminAuth, (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    let messagesSent = 0;
    let roomsTargeted = 0;
    
    // Broadcast to all active rooms
    for (const [roomId, roomPeers] of rooms.entries()) {
      const broadcastMessage = {
        id: generateMessageId(),
        content: `📢 ADMIN BROADCAST: ${message}`,
        sender: `System Administrator (${req.adminUser})`,
        timestamp: Date.now(),
        type: 'system',
        roomId
      };
      
      // Send to all users in the room
      io.to(roomId).emit('chat-message', broadcastMessage);
      messagesSent += roomPeers.size;
      roomsTargeted++;
      
      // Store the broadcast message
      storeMessage(roomId, broadcastMessage);
    }
    
    // Log the broadcast activity
    addActivityLog('admin-broadcast', {
      message: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
      roomsTargeted,
      messagesSent,
      adminUser: req.adminUser,
      adminLevel: req.adminLevel
    }, '📢');
    
    console.log(`📢 Admin broadcast sent to ${roomsTargeted} rooms, ${messagesSent} messages total by ${req.adminUser}`);
    
    res.json({
      success: true,
      message: `Broadcast sent to ${roomsTargeted} rooms`,
      messagesSent,
      roomsTargeted,
      adminUser: req.adminUser
    });
  } catch (error) {
    console.error('❌ Admin broadcast error:', error);
    res.status(500).json({ error: 'Failed to send broadcast' });
  }
});

// 🔧 NEW: Broadcast to specific room(s) by room code (basic admin)
app.post('/admin/broadcast/room', requireAdminAuth, (req, res) => {
  try {
    const { message, roomCodes: targetRoomCodes } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    if (!targetRoomCodes || !Array.isArray(targetRoomCodes) || targetRoomCodes.length === 0) {
      return res.status(400).json({ error: 'roomCodes array is required' });
    }
    
    console.log(`\n📢 ===== ROOM-SPECIFIC BROADCAST =====`);
    console.log(`🔍 Target room codes:`, targetRoomCodes);
    console.log(`🔍 Available active rooms:`, Array.from(rooms.keys()));
    console.log(`🔍 Available room code mappings:`, Array.from(roomCodes.entries()));
    
    let messagesSent = 0;
    let roomsTargeted = 0;
    let successfulRooms = [];
    let failedRooms = [];
    
    // Process each target room code
    for (const targetCode of targetRoomCodes) {
      const normalizedCode = targetCode.toLowerCase().trim();
      let targetRoomId = null;
      let searchMethod = '';
      
      // Method 1: Find by registered room code mapping
      for (const [code, roomId] of roomCodes.entries()) {
        if (code === normalizedCode) {
          targetRoomId = roomId;
          searchMethod = 'registered-code';
          break;
        }
      }
      
      // Method 2: Find by exact room ID match
      if (!targetRoomId && rooms.has(targetCode)) {
        targetRoomId = targetCode;
        searchMethod = 'exact-id';
      }
      
      // Method 3: Find by partial room ID match (fuzzy search)
      if (!targetRoomId) {
        for (const [roomId] of rooms.entries()) {
          if (roomId.toLowerCase().includes(normalizedCode) || 
              roomId.substring(0, 8).toLowerCase() === normalizedCode) {
            targetRoomId = roomId;
            searchMethod = 'partial-match';
            break;
          }
        }
      }
      
      if (targetRoomId && rooms.has(targetRoomId)) {
        const roomPeers = rooms.get(targetRoomId);
        
        const broadcastMessage = {
          id: generateMessageId(),
          content: `📢 ROOM BROADCAST: ${message}`,
          sender: `System Administrator (${req.adminUser})`,
          timestamp: Date.now(),
          type: 'system',
          roomId: targetRoomId
        };
        
        // Send to all users in the specific room
        io.to(targetRoomId).emit('chat-message', broadcastMessage);
        messagesSent += roomPeers.size;
        roomsTargeted++;
        
        // Store the broadcast message
        storeMessage(targetRoomId, broadcastMessage);
        
        successfulRooms.push({
          roomCode: targetCode,
          roomId: targetRoomId,
          userCount: roomPeers.size,
          searchMethod
        });
        
        console.log(`✅ Broadcast sent to room ${targetCode} (${targetRoomId}) - ${roomPeers.size} users - method: ${searchMethod}`);
      } else {
        failedRooms.push({
          roomCode: targetCode,
          reason: 'Room not found or inactive'
        });
        console.log(`❌ Room ${targetCode} not found or inactive`);
      }
    }
    
    // Log the room-specific broadcast activity
    addActivityLog('admin-room-broadcast', {
      message: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
      targetRoomCodes,
      roomsTargeted,
      messagesSent,
      successfulRooms: successfulRooms.length,
      failedRooms: failedRooms.length,
      adminUser: req.adminUser,
      adminLevel: req.adminLevel
    }, '🎯');
    
    console.log(`📢 Room-specific broadcast completed:`);
    console.log(`   - Successful rooms: ${successfulRooms.length}`);
    console.log(`   - Failed rooms: ${failedRooms.length}`);
    console.log(`   - Total messages sent: ${messagesSent}`);
    console.log(`📢 ===== END ROOM BROADCAST =====\n`);
    
    res.json({
      success: true,
      message: `Broadcast sent to ${roomsTargeted} of ${targetRoomCodes.length} requested rooms`,
      messagesSent,
      roomsTargeted,
      totalRequested: targetRoomCodes.length,
      successfulRooms,
      failedRooms,
      adminUser: req.adminUser
    });
  } catch (error) {
    console.error('❌ Admin room broadcast error:', error);
    res.status(500).json({ error: 'Failed to send room broadcast' });
  }
});

// 🔐 ENHANCED: Clear specific room messages (ADMIN ACCESS)
app.post('/admin/room/clear', requireAdminAuth, (req, res) => {
  try {
    const { roomCode } = req.body;
    
    if (!roomCode) {
      return res.status(400).json({ error: 'Room code is required' });
    }
    
    console.log(`\n🗑️ ===== ADMIN ROOM CLEAR REQUEST =====`);
    console.log(`🔐 Admin: ${req.adminUser} (${req.adminLevel})`);
    console.log(`🔍 Input room code: "${roomCode}"`);
    
    // Find room by code or ID with improved matching
    let targetRoomId = null;
    let messagesCleared = 0;
    let searchMethod = '';
    
    // Method 1: Find by registered room code mapping
    const normalizedCode = roomCode.toLowerCase().trim();
    
    for (const [code, roomId] of roomCodes.entries()) {
      if (code === normalizedCode) {
        targetRoomId = roomId;
        searchMethod = 'registered-code';
        break;
      }
    }
    
    // Method 2: Find by exact room ID match
    if (!targetRoomId && rooms.has(roomCode)) {
      targetRoomId = roomCode;
      searchMethod = 'exact-id';
    }
    
    // Method 3: Find by partial room ID match (fuzzy search)
    if (!targetRoomId) {
      for (const [roomId] of rooms.entries()) {
        if (roomId.toLowerCase().includes(normalizedCode) || 
            roomId.substring(0, 8).toLowerCase() === normalizedCode) {
          targetRoomId = roomId;
          searchMethod = 'partial-match';
          break;
        }
      }
    }
    
    if (!targetRoomId) {
      return res.status(404).json({ 
        error: `Room "${roomCode}" not found`,
        debug: {
          input: roomCode,
          normalized: normalizedCode,
          availableRooms: Array.from(rooms.keys()),
          availableRoomCodes: Array.from(roomCodes.keys())
        }
      });
    }
    
    // Check if the room has messages before clearing
    if (messageStore.has(targetRoomId)) {
      const roomMessages = messageStore.get(targetRoomId);
      messagesCleared = roomMessages.length;
      
      // Clear the messages
      messageStore.set(targetRoomId, []);
    } else {
      messageStore.set(targetRoomId, []);
      messagesCleared = 0;
    }
    
    // Send notification to room users if room is active
    if (rooms.has(targetRoomId)) {
      const clearMessage = {
        id: generateMessageId(),
        content: `🗑️ Room messages have been cleared by administrator (${messagesCleared} messages removed)`,
        sender: `Administrator (${req.adminUser})`,
        timestamp: Date.now(),
        type: 'system',
        roomId: targetRoomId
      };
      
      io.to(targetRoomId).emit('chat-message', clearMessage);
      io.to(targetRoomId).emit('room-messages-cleared', {
        roomId: targetRoomId,
        clearedBy: `Administrator (${req.adminUser})`,
        timestamp: Date.now(),
        messagesCleared,
        message: `${messagesCleared} messages were cleared by administrator`
      });
      
      // Store only the notification message
      if (messagesCleared > 0) {
        messageStore.get(targetRoomId).push(clearMessage);
      }
    }
    
    // Update global connection stats
    connectionStats.totalMessages = Math.max(0, connectionStats.totalMessages - messagesCleared);
    
    // Log the room clear activity
    addActivityLog('admin-room-clear', {
      roomCode,
      roomId: targetRoomId,
      messagesCleared,
      searchMethod,
      adminUser: req.adminUser,
      adminLevel: req.adminLevel,
      timestamp: Date.now()
    }, '🗑️');
    
    console.log(`✅ ADMIN ROOM CLEAR COMPLETED by ${req.adminUser}: ${messagesCleared} messages cleared from ${targetRoomId}`);
    
    res.json({
      success: true,
      message: `Successfully cleared ${messagesCleared} messages from room "${roomCode}"`,
      messagesCleared,
      roomId: targetRoomId,
      searchMethod,
      adminUser: req.adminUser,
      adminLevel: req.adminLevel
    });
  } catch (error) {
    console.error('❌ Super admin room clear error:', error);
    res.status(500).json({ error: 'Failed to clear room messages', details: error.message });
  }
});

// 🔐 ENHANCED: Wipe entire database (ADMIN ACCESS)
app.post('/admin/database/wipe', requireAdminAuth, (req, res) => {
  try {
    const { confirm } = req.body;
    
    if (confirm !== 'WIPE_ALL_DATA') {
      return res.status(400).json({ error: 'Confirmation required: { "confirm": "WIPE_ALL_DATA" }' });
    }
    
    console.log(`\n💥 ===== ADMIN DATABASE WIPE REQUEST =====`);
    console.log(`🔐 Admin: ${req.adminUser} (${req.adminLevel})`);
    
    let totalMessagesDeleted = 0;
    let totalRoomsAffected = 0;
    
    // Count total messages before wiping
    for (const [roomId, messages] of messageStore.entries()) {
      totalMessagesDeleted += messages.length;
      totalRoomsAffected++;
    }
    
    // Disconnect all users and clear active rooms
    let usersDisconnected = 0;
    for (const [roomId, roomPeers] of rooms.entries()) {
      const shutdownMessage = {
        id: generateMessageId(),
        content: `⚠️ SYSTEM MAINTENANCE: All data has been reset by administrator. Please rejoin your rooms.`,
        sender: `Administrator (${req.adminUser})`,
        timestamp: Date.now(),
        type: 'system',
        roomId
      };
      
      io.to(roomId).emit('chat-message', shutdownMessage);
      io.to(roomId).emit('database-wiped', {
        timestamp: Date.now(),
        message: 'Database has been wiped by administrator',
        adminUser: req.adminUser,
        forceReload: true
      });
      
      // Disconnect all users in this room
      for (const [socketId, peerData] of roomPeers.entries()) {
        const socket = io.sockets.sockets.get(socketId);
        if (socket) {
          socket.emit('system-shutdown', {
            message: 'Database has been reset by administrator. Please refresh and rejoin.',
            reason: 'database-wipe',
            adminUser: req.adminUser
          });
          socket.disconnect(true);
          usersDisconnected++;
        }
      }
    }
    
    // Clear all data structures
    rooms.clear();
    allRoomsEverCreated.clear();
    messageStore.clear();
    allUsersEver.clear();
    activityLog.length = 0;
    roomCodes.clear();
    
    // Reset connection stats
    connectionStats.totalMessages = 0;
    connectionStats.messagesPerMinute = 0;
    connectionStats.totalUniqueUsers.clear();
    connectionStats.totalRoomsCreated = 0;
    connectionStats.lastMessageTime = Date.now();
    
    // Log the wipe activity (this will be the only activity)
    addActivityLog('admin-database-wipe', {
      totalMessagesDeleted,
      totalRoomsAffected,
      usersDisconnected,
      adminUser: req.adminUser,
      adminLevel: req.adminLevel,
      timestamp: Date.now()
    }, '💥');
    
    console.log(`💥 ADMIN DATABASE WIPE COMPLETED by ${req.adminUser}: ${totalMessagesDeleted} messages deleted, ${usersDisconnected} users disconnected`);
    
    res.json({
      success: true,
      message: `Database completely wiped by administrator: ${totalMessagesDeleted} messages deleted from ${totalRoomsAffected} rooms`,
      totalMessagesDeleted,
      totalRoomsAffected,
      usersDisconnected,
      adminUser: req.adminUser,
      adminLevel: req.adminLevel
    });
  } catch (error) {
    console.error('❌ Super admin database wipe error:', error);
    res.status(500).json({ error: 'Failed to wipe database', details: error.message });
  }
});

// ===== ROOM CODE ENDPOINTS =====

// Register room code
app.post('/register-room-code', (req, res) => {
  const { roomId, roomCode } = req.body;
  
  if (!roomId || !roomCode) {
    return res.status(400).json({ error: 'roomId and roomCode are required' });
  }
  
  roomCodes.set(roomCode.toLowerCase(), roomId);
  
  // Track the room
  trackRoom(roomId, roomCode);
  
  console.log(`🏷️ Room code registered: ${roomCode} -> ${roomId}`);
  
  res.json({ 
    success: true, 
    roomCode,
    roomId,
    message: `Room code "${roomCode}" registered for room ${roomId}`
  });
});

// Resolve room code
app.get('/resolve-room-code/:code', (req, res) => {
  const code = req.params.code.toLowerCase();
  const roomId = roomCodes.get(code);
  
  if (!roomId) {
    return res.status(404).json({ error: 'Room code not found' });
  }
  
  res.json({ 
    roomId, 
    roomCode: code,
    message: `Room code "${code}" resolves to room ${roomId}`
  });
});

// 🔧 FIXED: Room stats with enhanced error handling
app.get('/room-stats/:roomId', (req, res) => {
  const roomId = req.params.roomId;
  
  console.log(`📊 Room stats request for: ${roomId}`);
  console.log(`📊 Available rooms:`, Array.from(rooms.keys()));
  
  // Check if room exists in current active rooms
  if (!rooms.has(roomId)) {
    // Check if room exists in historical data
    if (allRoomsEverCreated.has(roomId)) {
      const roomData = allRoomsEverCreated.get(roomId);
      console.log(`📊 Found inactive room: ${roomId}`);
      
      return res.json({
        roomId,
        userCount: 0,
        users: [],
        status: 'inactive',
        created: roomData.created,
        lastActivity: roomData.lastActivity,
        totalMessagesEver: roomData.totalMessages,
        totalUsersEver: roomData.totalUsersEver,
        timestamp: Date.now()
      });
    }
    
    console.log(`❌ Room ${roomId} not found in active or historical rooms`);
    return res.status(404).json({ 
      error: 'Room not found',
      roomId,
      availableRooms: Array.from(rooms.keys()),
      timestamp: Date.now()
    });
  }
  
  const roomPeers = rooms.get(roomId);
  const peerList = Array.from(roomPeers.values());
  const roomData = allRoomsEverCreated.get(roomId);
  
  console.log(`✅ Room stats for ${roomId}: ${roomPeers.size} active users`);
  
  res.json({
    roomId,
    userCount: roomPeers.size,
    users: peerList.map(peer => ({
      peerId: peer.peerId,
      displayName: peer.displayName,
      joinedAt: peer.joinedAt
    })),
    status: 'active',
    created: roomData ? roomData.created : Date.now(),
    lastActivity: roomData ? roomData.lastActivity : Date.now(),
    totalMessagesEver: roomData ? roomData.totalMessages : 0,
    totalUsersEver: roomData ? roomData.totalUsersEver : roomPeers.size,
    timestamp: Date.now()
  });
});

// Signaling proxy info
app.get('/signaling-proxy', (req, res) => {
  res.json({
    signalingAvailable: true,
    endpoint: '/socket.io/',
    version: '1.1.0-admin-enhanced',
    features: ['peer-discovery', 'room-management', 'admin-dashboard-enhanced', 'super-admin-security', 'p2p-mesh-signaling'],
    timestamp: Date.now()
  });
});

// ===== WEBSOCKET HANDLERS =====

io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);
  connectionStats.totalConnections++;
  connectionStats.currentConnections++;
  
  // Update peak connections
  connectionStats.peakConnections = Math.max(connectionStats.peakConnections, connectionStats.currentConnections);
  
  socket.on('join-room', ({ roomId, peerId, displayName }) => {
    try {
      console.log(`👤 User joining: ${displayName} (${peerId}) -> Room: ${roomId}`);
      
      // Initialize room if it doesn't exist
      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Map());
        console.log(`🏠 Created new room: ${roomId}`);
      }
      
      // Track the room and user
      trackRoom(roomId);
      trackUser(peerId, displayName, roomId);
      
      const room = rooms.get(roomId);
      const peerData = {
        peerId,
        displayName,
        joinedAt: Date.now(),
        socketId: socket.id
      };
      
      room.set(socket.id, peerData);
      socket.join(roomId);
      
      // Update room user count only if this user hasn't been in this room before
      if (allRoomsEverCreated.has(roomId)) {
        const roomData = allRoomsEverCreated.get(roomId);
        // Only increment if this is a new user to this room
        const userWasInRoomBefore = allUsersEver.has(peerId) && 
          allUsersEver.get(peerId).currentRoomId === roomId;
        
        if (!userWasInRoomBefore) {
          roomData.totalUsersEver++;
        }
      }
      
      // Broadcast to room that user joined
      socket.to(roomId).emit('user-joined', {
        peerId,
        displayName,
        joinedAt: Date.now(),
        userCount: room.size
      });
      
      // Send current room info to new user
      const otherPeers = Array.from(room.values())
        .filter(peer => peer.socketId !== socket.id)
        .map(peer => ({
          peerId: peer.peerId,
          displayName: peer.displayName,
          joinedAt: peer.joinedAt
        }));
      
      socket.emit('room-joined', {
        roomId,
        userCount: room.size,
        otherPeers
      });
      
      // Also emit peer-joined for compatibility
      socket.to(roomId).emit('peer-joined', { peerId, displayName });
      
      // Send current peers for compatibility  
      socket.emit('room-peers', otherPeers);
      
      // Log activity
      addActivityLog('user-joined', {
        peerId,
        displayName,
        roomId,
        userCount: room.size
      }, '👋');
      
      console.log(`✅ User ${displayName} joined room ${roomId}. Room now has ${room.size} users.`);
    } catch (error) {
      console.error('❌ Error in join-room:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });
  
  socket.on('chat-message', ({ roomId, message, type = 'chat' }) => {
    try {
      if (!rooms.has(roomId)) {
        console.log(`❌ Message sent to non-existent room: ${roomId}`);
        return;
      }
      
      const room = rooms.get(roomId);
      const peerData = room.get(socket.id);
      
      if (!peerData) {
        console.log(`❌ Message from user not in room: ${socket.id}`);
        return;
      }
      
      const enhancedMessage = {
        id: message.id || generateMessageId(),
        content: message.content || message,
        sender: peerData.displayName,
        senderId: peerData.peerId,
        timestamp: Date.now(),
        type,
        roomId,
        fromSocket: socket.id
      };
      
      // Store the message
      storeMessage(roomId, enhancedMessage);
      
      // Broadcast to ALL users in room (including sender for consistency)
      io.to(roomId).emit('chat-message', enhancedMessage);
      
      // Send delivery confirmation
      socket.emit('message-delivered', {
        messageId: enhancedMessage.id,
        timestamp: Date.now()
      });
      
      // Log activity
      addActivityLog('message-sent', {
        peerId: peerData.peerId,
        displayName: peerData.displayName,
        roomId,
        content: enhancedMessage.content.substring(0, 50) + (enhancedMessage.content.length > 50 ? '...' : ''),
        messageLength: enhancedMessage.content.length
      }, '💬');
      
      console.log(`💬 Message from ${peerData.displayName} in room ${roomId}: ${enhancedMessage.content.substring(0, 50)}${enhancedMessage.content.length > 50 ? '...' : ''}`);
    } catch (error) {
      console.error('❌ Error in chat-message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });
  
  // Health check ping/pong
  socket.on('health-ping', (data) => {
    socket.emit('health-pong', { timestamp: Date.now(), received: data.timestamp });
  });

  // Legacy P2P connection handlers (maintained for compatibility)
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
  
  // 🌐 PHASE 1: Enhanced P2P signaling handlers
  socket.on('request-p2p-upgrade', ({ roomId, peers, maxPeers = 5 }) => {
    try {
      console.log(`🌐 P2P upgrade request from ${socket.id} for room ${roomId}`);
      
      if (!rooms.has(roomId)) {
        socket.emit('p2p-upgrade-failed', { error: 'Room not found' });
        return;
      }
      
      const room = rooms.get(roomId);
      const currentPeers = Array.from(room.keys());
      
      // Only enable P2P for small groups initially (safety limit)
      if (currentPeers.length > maxPeers) {
        console.log(`🌐 P2P upgrade denied - too many peers (${currentPeers.length} > ${maxPeers})`);
        socket.emit('p2p-upgrade-failed', { 
          error: 'Too many peers for P2P', 
          currentPeers: currentPeers.length, 
          maxPeers 
        });
        return;
      }
      
      // Track P2P attempt
      meshMetrics.totalP2PAttempts++;
      
      // Initialize P2P connection tracking for initiator
      if (!p2pConnections.has(socket.id)) {
        p2pConnections.set(socket.id, {
          peers: new Set(),
          status: 'connecting',
          roomId,
          initiatedAt: Date.now()
        });
      }
      
      // Notify other peers in room about P2P upgrade opportunity
      socket.to(roomId).emit('p2p-upgrade-available', {
        initiator: socket.id,
        roomId,
        peerCount: currentPeers.length,
        timestamp: Date.now()
      });
      
      // Confirm to initiator
      socket.emit('p2p-upgrade-initiated', {
        roomId,
        eligiblePeers: currentPeers.filter(id => id !== socket.id).length,
        timestamp: Date.now()
      });
      
      // Log activity
      addActivityLog('p2p-upgrade-request', {
        roomId,
        initiator: socket.id,
        peerCount: currentPeers.length,
        eligible: currentPeers.length <= maxPeers
      }, '🌐');
      
      console.log(`🌐 P2P upgrade initiated for room ${roomId} with ${currentPeers.length} peers`);
    } catch (error) {
      console.error('❌ P2P upgrade request error:', error);
      socket.emit('p2p-upgrade-failed', { error: 'Internal server error' });
    }
  });
  
  socket.on('p2p-connection-established', ({ targetSocketId, roomId }) => {
    try {
      console.log(`🌐 P2P connection established: ${socket.id} <-> ${targetSocketId}`);
      
      // Update connection tracking for both peers
      [socket.id, targetSocketId].forEach(socketId => {
        if (p2pConnections.has(socketId)) {
          const connection = p2pConnections.get(socketId);
          connection.peers.add(targetSocketId === socketId ? socket.id : targetSocketId);
          connection.status = 'connected';
        }
      });
      
      // Update metrics
      meshMetrics.successfulP2PConnections++;
      meshMetrics.activeP2PConnections++;
      
      // Notify target peer
      socket.to(targetSocketId).emit('p2p-connection-confirmed', {
        peer: socket.id,
        roomId,
        timestamp: Date.now()
      });
      
      // Log activity
      addActivityLog('p2p-connection-established', {
        peer1: socket.id,
        peer2: targetSocketId,
        roomId
      }, '🔗');
      
    } catch (error) {
      console.error('❌ P2P connection establishment error:', error);
    }
  });
  
  socket.on('p2p-connection-failed', ({ targetSocketId, roomId, error }) => {
    try {
      console.log(`🌐 P2P connection failed: ${socket.id} <-> ${targetSocketId} - ${error}`);
      
      // Update connection tracking
      if (p2pConnections.has(socket.id)) {
        p2pConnections.get(socket.id).status = 'failed';
      }
      
      // Update metrics
      meshMetrics.failedP2PConnections++;
      
      // Notify target peer
      socket.to(targetSocketId).emit('p2p-connection-failed', {
        peer: socket.id,
        roomId,
        error,
        timestamp: Date.now()
      });
      
      // Log activity
      addActivityLog('p2p-connection-failed', {
        peer1: socket.id,
        peer2: targetSocketId,
        roomId,
        error
      }, '❌');
      
    } catch (error) {
      console.error('❌ P2P connection failure handling error:', error);
    }
  });
  
  socket.on('request-mesh-stats', () => {
    try {
      const connectionData = p2pConnections.get(socket.id);
      const meshStats = {
        ...meshMetrics,
        myConnections: connectionData ? {
          peers: Array.from(connectionData.peers),
          status: connectionData.status,
          connectedSince: connectionData.initiatedAt
        } : null,
        totalActiveConnections: Array.from(p2pConnections.values())
          .filter(conn => conn.status === 'connected').length
      };
      
      socket.emit('mesh-stats', meshStats);
    } catch (error) {
      console.error('❌ Mesh stats request error:', error);
    }
  });
  
  socket.on('disconnect', () => {
    try {
      console.log(`🔌 User disconnected: ${socket.id}`);
      connectionStats.currentConnections--;
      
      // 🌐 PHASE 1: Clean up P2P connections
      if (p2pConnections.has(socket.id)) {
        const connectionData = p2pConnections.get(socket.id);
        
        // Notify all connected peers about disconnection
        connectionData.peers.forEach(peerId => {
          socket.to(peerId).emit('p2p-peer-disconnected', {
            peer: socket.id,
            timestamp: Date.now()
          });
        });
        
        // Update metrics
        if (connectionData.status === 'connected') {
          meshMetrics.activeP2PConnections = Math.max(0, meshMetrics.activeP2PConnections - connectionData.peers.size);
        }
        
        // Remove from tracking
        p2pConnections.delete(socket.id);
        
        console.log(`🌐 Cleaned up P2P connections for ${socket.id}`);
      }
      
      // Find and remove user from all rooms
      for (const [roomId, room] of rooms.entries()) {
        if (room.has(socket.id)) {
          const peerData = room.get(socket.id);
          room.delete(socket.id);
          
          // Mark user as inactive
          markUserInactive(peerData.peerId, peerData.displayName);
          
          // Broadcast to room that user left
          socket.to(roomId).emit('user-left', {
            peerId: peerData.peerId,
            displayName: peerData.displayName,
            userCount: room.size
          });
          
          // Also emit peer-left for compatibility
          socket.to(roomId).emit('peer-left', { 
            peerId: peerData.peerId, 
            displayName: peerData.displayName 
          });
          
          // Log activity
          addActivityLog('user-left', {
            peerId: peerData.peerId,
            displayName: peerData.displayName,
            roomId,
            userCount: room.size
          }, '👋');
          
          console.log(`👋 User ${peerData.displayName} left room ${roomId}. Room now has ${room.size} users.`);
          
          // Clean up empty rooms
          if (room.size === 0) {
            rooms.delete(roomId);
            markRoomInactive(roomId);
            console.log(`🏠 Cleaned up empty room: ${roomId}`);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error in disconnect:', error);
    }
  });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🎪 ===== PEDDLENET SIGNALING SERVER STARTED =====`);
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${getEnvironment()}`);
  console.log(`🔧 Build Target: ${buildTarget}`);
  console.log(`⚙️ Platform: ${platform}`);
  console.log(`🔒 Admin Authentication: ENABLED`);
  console.log(`   - Admin: ${ADMIN_CREDENTIALS.admin.username} (full access)`);
  console.log(`📊 Admin Dashboard: /admin/analytics`);
  console.log(`🎯 Room-specific broadcast: /admin/broadcast/room`);
  console.log(`🗑️ Room message clearing: /admin/room/clear [ADMIN]`);
  console.log(`💥 Database wipe: /admin/database/wipe [ADMIN]`);
  console.log(`🎪 ===== READY FOR FESTIVAL CHAT =====\n`);
});

module.exports = { app, server, io };

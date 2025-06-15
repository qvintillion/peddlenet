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

// 🔧 ENHANCED: Helper functions for comprehensive tracking
function trackUser(peerId, displayName, roomId) {
  const isNewUser = !allUsersEver.has(peerId);
  const existingData = isNewUser ? null : allUsersEver.get(peerId);
  const isNewRoomForUser = isNewUser || existingData.currentRoomId !== roomId;
  
  const userData = {
    peerId,
    displayName,
    firstSeen: isNewUser ? Date.now() : existingData.firstSeen,
    lastSeen: Date.now(),
    currentRoomId: roomId,
    // Only increment rooms joined if this is a new room for this user
    totalRoomsJoined: isNewUser ? 1 : (isNewRoomForUser ? existingData.totalRoomsJoined + 1 : existingData.totalRoomsJoined),
    isCurrentlyActive: true
  };
  
  allUsersEver.set(peerId, userData);
  connectionStats.totalUniqueUsers.add(peerId);
  
  console.log(`👤 ${isNewUser ? 'New' : 'Returning'} user: ${displayName} (${peerId}) ${isNewRoomForUser ? 'in new room' : 'rejoining same room'} - Total unique users ever: ${connectionStats.totalUniqueUsers.size}`);
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

function markUserInactive(peerId) {
  if (allUsersEver.has(peerId)) {
    const userData = allUsersEver.get(pe
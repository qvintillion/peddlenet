// signaling-server.js - CORRECTED Performance Optimized Universal Server 
// FIXED: High CPU usage (483%) AND missing admin endpoints
// Restores full admin functionality while maintaining performance optimizations
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const os = require('os');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const server = createServer(app);

// Universal environment detection
const NODE_ENV = process.env.NODE_ENV || 'development';
const PLATFORM = process.env.PLATFORM || 'local'; // local, firebase, github, cloudrun
const BUILD_TARGET = process.env.BUILD_TARGET || 'development'; // development, staging, production

const isDevelopment = NODE_ENV === 'development' || PLATFORM === 'local';
const isStaging = BUILD_TARGET === 'staging' || PLATFORM === 'firebase';
const isProduction = NODE_ENV === 'production' && (PLATFORM === 'github' || PLATFORM === 'cloudrun');

console.log(`🎪 PeddleNet Universal Server Starting... (PERFORMANCE OPTIMIZED + FULL ADMIN)`);
console.log(`📍 Environment: ${NODE_ENV}`);
console.log(`🏗️ Platform: ${PLATFORM}`);
console.log(`🎯 Build Target: ${BUILD_TARGET}`);
console.log(`🎯 Mode: ${isDevelopment ? 'DEVELOPMENT' : isStaging ? 'STAGING' : 'PRODUCTION'}`);

// 📊 PERFORMANCE-OPTIMIZED ANALYTICS - Fixed CPU issues
const dbPath = isDevelopment ? './festival-chat-dev.db' : './festival-chat.db';
let db = null;
let dbReady = false;

// FIXED: Reduced memory footprint and improved performance
const messageStore = new Map(); // roomId -> Message[] (limited to 25 per room)
const activityLog = []; // Reduced to last 15 activities
const MAX_ACTIVITY_LOG = 15; // Reduced from 100
const MAX_ROOM_MESSAGES = 25; // Reduced from 50

// FIXED: Simplified analytics to reduce CPU overhead
const analyticsData = {
  totalMessages: 0,
  messagesPerMinute: 0,
  messageHistory: [], // Last 3 minutes only (was 5)
  roomActivity: new Map(), // Simplified room tracking
  startTime: Date.now()
};

// PERFORMANCE FIX: Throttled database operations to reduce CPU load
let dbOperationQueue = [];
let dbFlushTimer = null;
const DB_FLUSH_INTERVAL = 5000; // Increased from 2s to 5s

// Initialize lightweight database
async function initializeDatabase() {
  return new Promise((resolve, reject) => {
    console.log('🗄️ Initializing lightweight database...');
    
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ SQLite connection failed:', err.message);
        reject(err);
        return;
      } else {
        console.log(`✅ SQLite connected: ${dbPath}`);
      }
    });

    // Only essential tables for performance
    db.serialize(() => {
      // Messages table (simplified)
      db.run(`
        CREATE TABLE IF NOT EXISTS messages (
          id TEXT PRIMARY KEY,
          room_id TEXT NOT NULL,
          sender TEXT NOT NULL,
          content TEXT NOT NULL,
          timestamp INTEGER NOT NULL
        )
      `, (err) => {
        if (err) {
          console.error('❌ Messages table creation failed:', err.message);
          reject(err);
          return;
        }
      });

      // Basic room analytics
      db.run(`
        CREATE TABLE IF NOT EXISTS room_analytics (
          room_id TEXT PRIMARY KEY,
          total_messages INTEGER DEFAULT 0,
          last_activity INTEGER DEFAULT 0
        )
      `, (err) => {
        if (err) {
          console.error('❌ Room analytics table creation failed:', err.message);
          reject(err);
          return;
        }
      });

      // User sessions for admin dashboard
      db.run(`
        CREATE TABLE IF NOT EXISTS user_sessions (
          id TEXT PRIMARY KEY,
          room_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          display_name TEXT NOT NULL,
          joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          left_at DATETIME,
          duration INTEGER,
          messages_sent INTEGER DEFAULT 0
        )
      `, (err) => {
        if (err) {
          console.error('❌ User sessions table creation failed:', err.message);
          reject(err);
          return;
        }
      });

      // Essential indexes only
      db.run(`CREATE INDEX IF NOT EXISTS idx_messages_room ON messages (room_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages (timestamp)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_user_sessions_room ON user_sessions (room_id)`);

      console.log('✅ Database initialization complete');
      dbReady = true;
      resolve();
    });
  });
}

// PERFORMANCE FIX: Improved batched database operations
function queueDbOperation(operation) {
  if (!dbReady || !db) return;
  
  dbOperationQueue.push(operation);
  
  // FIXED: Increased batch interval to reduce CPU overhead
  if (!dbFlushTimer) {
    dbFlushTimer = setTimeout(flushDbOperations, DB_FLUSH_INTERVAL);
  }
}

function flushDbOperations() {
  if (dbOperationQueue.length === 0) {
    dbFlushTimer = null;
    return;
  }

  const operations = dbOperationQueue.splice(0); // Take all pending operations
  dbFlushTimer = null;

  // Execute batched operations
  db.serialize(() => {
    operations.forEach(op => {
      db.run(op.query, op.params, op.callback);
    });
  });
}

// Safe database operations with batching
function safeDbRun(query, params = [], callback = () => {}) {
  if (!dbReady || !db) {
    if (isDevelopment) console.warn('⚠️ Database not ready, queuing operation');
    return;
  }
  
  queueDbOperation({ query, params, callback });
}

function safeDbGet(query, params = [], callback = () => {}) {
  if (!dbReady || !db) {
    if (typeof callback === 'function') callback(new Error('Database not ready'), null);
    return;
  }
  db.get(query, params, callback);
}

function safeDbAll(query, params = [], callback = () => {}) {
  if (!dbReady || !db) {
    if (typeof callback === 'function') callback(new Error('Database not ready'), []);
    return;
  }
  db.all(query, params, callback);
}

// PERFORMANCE FIX: Heavily throttled activity logging 
let lastActivityTime = 0;
const ACTIVITY_THROTTLE = 10000; // Increased from 5s to 10s

function logActivity(type, data) {
  const now = Date.now();
  
  // FIXED: More aggressive throttling to reduce CPU overhead
  if (now - lastActivityTime < ACTIVITY_THROTTLE && type !== 'server-start') {
    return;
  }
  lastActivityTime = now;
  
  const activity = {
    id: now,
    type,
    data,
    timestamp: now,
    icon: getActivityIcon(type)
  };
  
  activityLog.unshift(activity);
  if (activityLog.length > MAX_ACTIVITY_LOG) {
    activityLog.pop();
  }

  // FIXED: Only broadcast to admin if there are actual admin connections
  if (io && io.to && adminConnections.size > 0) {
    io.to('admin-channel').emit('live-activity', activity);
  }
}

function getActivityIcon(type) {
  const icons = {
    'user-joined': '👥',
    'user-left': '👋',
    'message-sent': '💬',
    'room-created': '🏠',
    'server-start': '🚀',
    'admin-action': '🛡️'
  };
  return icons[type] || '📝';
}

// PERFORMANCE FIX: Simplified message analytics
function updateMessageAnalytics(roomId) {
  analyticsData.totalMessages++;
  
  // Update room activity with minimal overhead
  if (!analyticsData.roomActivity.has(roomId)) {
    analyticsData.roomActivity.set(roomId, {
      messages: 0,
      lastActivity: Date.now()
    });
  }
  
  const roomStats = analyticsData.roomActivity.get(roomId);
  roomStats.messages++;
  roomStats.lastActivity = Date.now();
  
  // FIXED: Less frequent messages per minute calculation
  updateMessagesPerMinute();
}

function updateMessagesPerMinute() {
  const now = Math.floor(Date.now() / 60000); // Current minute
  
  // FIXED: Keep only last 3 minutes for better performance
  if (analyticsData.messageHistory.length === 0 || analyticsData.messageHistory[0].minute !== now) {
    analyticsData.messageHistory.unshift({ minute: now, count: 1 });
    
    if (analyticsData.messageHistory.length > 3) {
      analyticsData.messageHistory = analyticsData.messageHistory.slice(0, 3);
    }
  } else {
    analyticsData.messageHistory[0].count++;
  }
  
  // Calculate messages per minute
  const totalMessages = analyticsData.messageHistory.reduce((sum, m) => sum + m.count, 0);
  analyticsData.messagesPerMinute = Math.round(totalMessages / Math.min(analyticsData.messageHistory.length, 3));
}

// Enhanced CORS origins
function getCorsOrigins() {
  const baseOrigins = [
    "http://localhost:3000",
    "https://localhost:3000",
    "https://peddlenet.app",
    "https://www.peddlenet.app",
    "https://*.vercel.app",
    "https://*.ngrok.io",
    "https://*.ngrok-free.app",
    "https://*.firebaseapp.com",
    "https://*.web.app",
    /^https:\/\/[a-zA-Z0-9-]+\.ngrok(-free)?\.app$/,
    /^https:\/\/[a-zA-Z0-9-]+\.ngrok\.io$/,
    /^https:\/\/[a-zA-Z0-9-]+\.vercel\.app$/,
    /^https:\/\/[a-zA-Z0-9-]+\.firebaseapp\.com$/,
    /^https:\/\/.*\.web\.app$/
  ];

  if (isDevelopment) {
    const interfaces = os.networkInterfaces();
    const localIPs = ['http://localhost:3000', 'https://localhost:3000'];
    
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          localIPs.push(`http://${iface.address}:3000`);
          localIPs.push(`https://${iface.address}:3000`);
        }
      }
    }
    
    return [
      ...baseOrigins,
      ...localIPs,
      /^http:\/\/192\.168\.[0-9]+\.[0-9]+:3000$/,
      /^http:\/\/10\.[0-9]+\.[0-9]+\.[0-9]+:3000$/,
      /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.[0-9]+\.[0-9]+:3000$/
    ];
  }

  return baseOrigins;
}

// PERFORMANCE FIX: Optimized Socket.IO configuration
const io = new Server(server, {
  cors: {
    origin: getCorsOrigins(),
    methods: ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin", "X-Connection-Type"]
  },
  transports: ['polling', 'websocket'],
  
  // FIXED: More conservative timeouts to reduce overhead
  pingTimeout: 45000,           // Increased from 30s
  pingInterval: 20000,          // Increased from 15s  
  upgradeTimeout: 20000,        // Increased from 15s
  connectTimeout: 30000,        // Increased from 20s
  
  allowUpgrades: true,
  maxHttpBufferSize: 1e6,
  allowEIO3: true,
  cookie: false,
  serveClient: false,
  
  connectionStateRecovery: {
    maxDisconnectionDuration: 90 * 1000, // Increased from 60s
    skipMiddlewares: true,
  },
  
  allowRequest: (req, callback) => {
    const origin = req.headers.origin;
    const corsOrigins = getCorsOrigins();
    
    const isAllowed = corsOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return allowedOrigin === origin;
      } else if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });
    
    if (isAllowed || !origin) {
      callback(null, true);
    } else {
      console.warn(`🚫 CORS rejected origin: ${origin}`);
      callback('CORS policy violation', false);
    }
  }
});

// Enhanced CORS middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const corsOrigins = getCorsOrigins();
  
  const isAllowed = corsOrigins.some(allowedOrigin => {
    if (typeof allowedOrigin === 'string') {
      return allowedOrigin === origin;
    } else if (allowedOrigin instanceof RegExp) {
      return allowedOrigin.test(origin);
    }
    return false;
  });
  
  if (isAllowed || !origin) {
    res.header('Access-Control-Allow-Origin', origin || '*');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS,PUT,DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,Authorization,X-Connection-Type');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

app.use(cors({
  origin: getCorsOrigins(),
  methods: ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin", "X-Connection-Type"]
}));

app.use(express.json());

// Simple admin auth (production only)
function requireAdminAuth(req, res, next) {
  if (!isProduction) {
    return next();
  }
  
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Festival Chat Admin Dashboard"');
    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'Admin access requires authentication'
    });
  }
  
  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [username, password] = credentials.split(':');
  
  const validUsername = process.env.ADMIN_USERNAME || 'th3p3ddl3r';
  const validPassword = process.env.ADMIN_PASSWORD || 'letsmakeatrade';
  
  if (username !== validUsername || password !== validPassword) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Festival Chat Admin Dashboard"');
    return res.status(401).json({ 
      error: 'Invalid credentials',
      message: 'Access denied - invalid username or password'
    });
  }
  
  console.log(`🛡️ Admin authenticated: ${username} from ${req.ip || 'unknown IP'}`);
  next();
}

// Core data structures
const rooms = new Map();
const adminConnections = new Set();
const connectionStats = {
  totalConnections: 0,
  currentConnections: 0,
  peakConnections: 0,
  startTime: Date.now()
};

const roomCodes = new Map(); // roomCode -> roomId mapping

// Enhanced logging for development
function devLog(...args) {
  if (isDevelopment && typeof args[0] === 'string') {
    args[0] = args[0].replace(/^([🔗🎵👥📊💬🔥✅⚠️🔔🗑️📋🔍🚨🎯])/g, '$1 DEV:');
  }
  console.log(...args);
}

// Room code generation
function generateRoomCodeOnServer(roomId) {
  if (!roomId || typeof roomId !== 'string') return null;
  
  const adjectives = [
    'blue', 'red', 'gold', 'green', 'bright', 'magic', 'cosmic', 'electric',
    'neon', 'disco', 'wild', 'epic', 'mega', 'super', 'ultra', 'hyper'
  ];
  
  const nouns = [
    'stage', 'beat', 'vibe', 'party', 'crew', 'squad', 'tribe', 'gang',
    'fest', 'wave', 'zone', 'spot', 'camp', 'den', 'base', 'hub'
  ];
  
  let hash = 0;
  for (let i = 0; i < roomId.length; i++) {
    const char = roomId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  const adjIndex = Math.abs(hash) % adjectives.length;
  const nounIndex = Math.abs(hash >> 8) % nouns.length;
  const number = (Math.abs(hash >> 16) % 99) + 1;
  
  return `${adjectives[adjIndex]}-${nouns[nounIndex]}-${number}`;
}

// Health check endpoints
app.get('/_ah/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: Date.now(),
    uptime: process.uptime(),
    service: 'PeddleNet WebSocket Server'
  });
});

app.get('/health', (req, res) => {
  const origin = req.headers.origin;
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  
  res.json({ 
    status: 'ok',
    service: 'PeddleNet Universal Server',
    version: '3.2.0-performance-optimized-full-admin',
    uptime: Math.floor(uptime),
    uptimeHuman: formatUptime(uptime),
    connections: {
      current: connectionStats.currentConnections,
      peak: connectionStats.peakConnections,
      total: connectionStats.totalConnections
    },
    rooms: {
      active: rooms.size,
      totalPeers: Array.from(rooms.values()).reduce((sum, room) => sum + room.size, 0)
    },
    analytics: {
      totalMessages: analyticsData.totalMessages,
      messagesPerMinute: analyticsData.messagesPerMinute,
      activeRooms: analyticsData.roomActivity.size
    },
    database: {
      connected: dbReady,
      path: dbPath
    },
    memory: {
      used: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
      total: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB'
    },
    environment: BUILD_TARGET || NODE_ENV,
    platform: PLATFORM,
    timestamp: Date.now()
  });
});

// 📊 RESTORED FULL ADMIN ENDPOINTS - Optimized for performance

// Main analytics dashboard endpoint - RESTORED with full data structure
app.get('/admin/analytics', requireAdminAuth, async (req, res) => {
  try {
    const actualActiveUsers = Array.from(rooms.values()).reduce((total, roomPeers) => total + roomPeers.size, 0);
    
    // Get database stats if available
    let dbStats = {
      totalMessages: analyticsData.totalMessages,
      totalRooms: rooms.size,
      totalSessions: 0,
      recentActivity: 0,
      dbSize: '1MB',
      oldestMessage: Date.now() - (24 * 60 * 60 * 1000)
    };

    if (dbReady) {
      // Quick database queries for admin dashboard
      safeDbGet('SELECT COUNT(*) as count FROM messages', [], (err, row) => {
        if (!err && row) {
          dbStats.totalMessages = Math.max(dbStats.totalMessages, row.count);
        }
      });
      
      safeDbGet('SELECT COUNT(*) as count FROM user_sessions', [], (err, row) => {
        if (!err && row) {
          dbStats.totalSessions = row.count;
        }
      });
    }
    
    const dashboardData = {
      realTimeStats: {
        activeUsers: actualActiveUsers,
        activeRooms: rooms.size,
        messagesPerMinute: analyticsData.messagesPerMinute,
        totalMessages: analyticsData.totalMessages,
        peakConnections: connectionStats.peakConnections,
        storageUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        userTrend: '',
        roomTrend: '',
        environment: NODE_ENV
      },
      serverHealth: {
        status: 'healthy',
        uptime: formatUptime(process.uptime()),
        memoryUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        memoryTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        cpuUsage: `${Math.round(process.cpuUsage().user / 1000)}%`,
        coldStarts: 0
      },
      networkStatus: {
        quality: 100,
        avgLatency: 0,
        deliveryRate: 100
      },
      messageFlow: {
        messagesPerMinute: analyticsData.messagesPerMinute,
        trend: '',
        history: analyticsData.messageHistory
      },
      dbStats,
      timestamp: Date.now(),
      databaseReady: dbReady
    };
    
    res.json(dashboardData);
  } catch (error) {
    console.error('❌ Analytics dashboard error:', error);
    res.status(500).json({ error: 'Failed to generate analytics data' });
  }
});

// Live activity feed endpoint - RESTORED
app.get('/admin/activity', requireAdminAuth, (req, res) => {
  const { limit = 10 } = req.query;
  res.json({
    activities: activityLog.slice(0, parseInt(limit)),
    total: activityLog.length,
    timestamp: Date.now()
  });
});

// RESTORED: Detailed active users endpoint
app.get('/admin/users/detailed', requireAdminAuth, async (req, res) => {
  try {
    const activeUsers = [];
    
    // Get users currently in rooms
    for (const [roomId, roomPeers] of rooms.entries()) {
      for (const [socketId, peerData] of roomPeers.entries()) {
        activeUsers.push({
          socketId,
          peerId: peerData.peerId,
          displayName: peerData.displayName,
          roomId,
          joinedAt: peerData.joinedAt,
          duration: Date.now() - peerData.joinedAt,
          isActive: true
        });
      }
    }
    
    // Also get recent user sessions from database for context
    safeDbAll(
      'SELECT * FROM user_sessions WHERE joined_at > datetime("now", "-1 hour") ORDER BY joined_at DESC LIMIT 50',
      [],
      (err, recentSessions) => {
        if (err) {
          console.error('Error fetching recent sessions:', err);
          recentSessions = [];
        }
        
        res.json({
          activeUsers,
          recentSessions: recentSessions || [],
          summary: {
            totalActive: activeUsers.length,
            uniqueUsers: new Set(activeUsers.map(u => u.peerId)).size,
            totalRooms: rooms.size,
            timestamp: Date.now()
          }
        });
      }
    );
  } catch (error) {
    console.error('❌ Detailed users error:', error);
    res.status(500).json({ error: 'Failed to get detailed user data' });
  }
});

// RESTORED: Detailed active rooms endpoint
app.get('/admin/rooms/detailed', requireAdminAuth, async (req, res) => {
  try {
    const detailedRooms = [];
    
    for (const [roomId, roomPeers] of rooms.entries()) {
      const roomStats = analyticsData.roomActivity.get(roomId);
      const roomCode = Array.from(roomCodes.entries()).find(([code, id]) => id === roomId)?.[0];
      
      detailedRooms.push({
        roomId,
        roomCode: roomCode || 'N/A',
        activeUsers: roomPeers.size,
        userList: Array.from(roomPeers.values()),
        created: roomStats?.created || Date.now(),
        lastActivity: roomStats?.lastActivity || Date.now(),
        totalMessages: roomStats?.messages || 0,
        uniqueUsers: roomPeers.size
      });
    }
    
    // Sort by last activity (most recent first)
    detailedRooms.sort((a, b) => b.lastActivity - a.lastActivity);
    
    res.json({
      activeRooms: detailedRooms,
      summary: {
        totalRooms: detailedRooms.length,
        totalActiveUsers: detailedRooms.reduce((sum, room) => sum + room.activeUsers, 0),
        totalMessages: detailedRooms.reduce((sum, room) => sum + room.totalMessages, 0),
        timestamp: Date.now()
      }
    });
  } catch (error) {
    console.error('❌ Detailed rooms error:', error);
    res.status(500).json({ error: 'Failed to get detailed room data' });
  }
});

// RESTORED: Admin action - Remove user from room
app.post('/admin/users/:peerId/remove', requireAdminAuth, (req, res) => {
  const { peerId } = req.params;
  const { roomId, reason = 'Removed by admin' } = req.body;
  
  let removedUser = null;
  let socketToDisconnect = null;
  
  // Find the user in the specified room
  if (rooms.has(roomId)) {
    const roomPeers = rooms.get(roomId);
    for (const [socketId, peerData] of roomPeers.entries()) {
      if (peerData.peerId === peerId) {
        removedUser = peerData;
        socketToDisconnect = socketId;
        roomPeers.delete(socketId);
        break;
      }
    }
  }
  
  if (removedUser && socketToDisconnect) {
    // Disconnect the user's socket
    const socket = io.sockets.sockets.get(socketToDisconnect);
    if (socket) {
      socket.emit('admin-removed', {
        reason,
        message: 'You have been removed from the room by an administrator.',
        timestamp: Date.now()
      });
      socket.disconnect(true);
    }
    
    // Notify others in the room
    io.to(roomId).emit('peer-left', {
      peerId,
      displayName: removedUser.displayName,
      reason: 'admin-removed'
    });
    
    // Log the admin action
    logActivity('admin-action', {
      action: 'remove-user',
      peerId,
      displayName: removedUser.displayName,
      roomId,
      reason
    });
    
    res.json({
      success: true,
      removedUser: {
        peerId,
        displayName: removedUser.displayName,
        roomId
      },
      reason,
      timestamp: Date.now()
    });
  } else {
    res.status(404).json({
      success: false,
      error: 'User not found in specified room'
    });
  }
});

// RESTORED: Broadcast admin message to all rooms
app.post('/admin/broadcast', requireAdminAuth, (req, res) => {
  const { message, targetRooms = 'all', priority = 'normal' } = req.body;
  
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message content required' });
  }
  
  const adminMessage = {
    id: generateMessageId(),
    content: message.trim(),
    sender: '🛡️ Festival Staff',
    timestamp: Date.now(),
    type: 'admin-broadcast',
    priority
  };

  let targetCount = 0;
  
  if (targetRooms === 'all') {
    io.emit('admin-message', adminMessage);
    targetCount = connectionStats.currentConnections;
  } else if (Array.isArray(targetRooms)) {
    targetRooms.forEach(roomId => {
      io.to(roomId).emit('admin-message', adminMessage);
      const room = rooms.get(roomId);
      if (room) {
        targetCount += room.size;
      }
    });
  }

  logActivity('admin-action', {
    action: 'broadcast-message',
    message: message.substring(0, 100),
    targetRooms,
    targetCount
  });

  res.json({ 
    success: true, 
    messagesSent: targetCount,
    targetRooms,
    timestamp: Date.now()
  });
});

// RESTORED: Clear room messages with proper client cache clearing
app.delete('/admin/room/:roomId/messages', requireAdminAuth, (req, res) => {
  const { roomId } = req.params;
  
  safeDbRun('DELETE FROM messages WHERE room_id = ?', [roomId], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      const messagesDeleted = this.changes || 0;
      
      // Also clear from memory
      if (messageStore.has(roomId)) {
        messageStore.delete(roomId);
      }
      
      // CRITICAL: Notify all users in this room to clear their local cache
      io.to(roomId).emit('room-messages-cleared', {
        roomId,
        message: `All messages in this room have been cleared by an administrator.`,
        messagesDeleted,
        clearLocalCache: true, // Signal to clear React state, localStorage, unread counts
        timestamp: Date.now()
      });
      
      // Log admin action
      logActivity('admin-action', {
        action: 'clear-room-messages',
        roomId,
        messagesDeleted,
        usersNotified: rooms.has(roomId) ? rooms.get(roomId).size : 0
      });
      
      // Broadcast to admin clients
      if (io && io.to) {
        io.to('admin-channel').emit('room-cleared', { 
          roomId, 
          messagesDeleted,
          usersNotified: rooms.has(roomId) ? rooms.get(roomId).size : 0,
          timestamp: Date.now()
        });
      }
      
      console.log(`🗑️ Room ${roomId} messages cleared: ${messagesDeleted} messages deleted, ${rooms.has(roomId) ? rooms.get(roomId).size : 0} users notified`);
      
      res.json({ 
        success: true, 
        roomId, 
        messagesDeleted,
        usersNotified: rooms.has(roomId) ? rooms.get(roomId).size : 0,
        timestamp: Date.now()
      });
    }
  });
});

// RESTORED: DANGER - Wipe entire database
app.delete('/admin/database', requireAdminAuth, (req, res) => {
  const { confirm } = req.body;
  
  if (confirm !== 'WIPE_EVERYTHING') {
    return res.status(400).json({ error: 'Confirmation required: send "WIPE_EVERYTHING"' });
  }
  
  if (!dbReady || !db) {
    return res.status(503).json({ error: 'Database not ready' });
  }
  
  console.log('🗑️ Starting database wipe...');
  
  // Enhanced database wipe with proper error handling
  const wipeOperations = [
    'DELETE FROM messages',
    'DELETE FROM room_analytics', 
    'DELETE FROM user_sessions'
  ];
  
  let completedOperations = 0;
  const totalOperations = wipeOperations.length;
  const results = [];
  
  const handleWipeComplete = () => {
    completedOperations++;
    console.log(`📊 Wipe progress: ${completedOperations}/${totalOperations}`);
    
    if (completedOperations === totalOperations) {
      // Clear in-memory data after database operations complete
      messageStore.clear();
      analyticsData.roomActivity.clear();
      rooms.clear();
      roomCodes.clear();
      activityLog.length = 0;
      
      // Reset analytics
      analyticsData.totalMessages = 0;
      analyticsData.messagesPerMinute = 0;
      analyticsData.messageHistory = [];
      
      // Force all clients to refresh
      io.emit('database-wiped', { 
        message: 'Database has been wiped. Please refresh the page.', 
        forceReload: true 
      });
      
      // Disconnect all clients to force reconnection
      io.disconnectSockets(true);
      
      console.log('✅ Database wipe completed successfully');
      
      logActivity('admin-action', {
        action: 'wipe-database-complete',
        results,
        timestamp: Date.now()
      });
      
      res.json({ 
        success: true, 
        message: 'Database completely wiped - all data cleared',
        operations: results,
        timestamp: Date.now()
      });
    }
  };
  
  // Execute wipe operations with proper error handling
  db.serialize(() => {
    wipeOperations.forEach((query, index) => {
      db.run(query, function(err) {
        if (err) {
          console.error(`❌ Wipe operation ${index + 1} failed:`, err.message);
          results.push({ query, success: false, error: err.message });
        } else {
          console.log(`✅ Wipe operation ${index + 1} completed: ${this.changes || 0} rows affected`);
          results.push({ query, success: true, rowsAffected: this.changes || 0 });
        }
        handleWipeComplete();
      });
    });
  });
});

// Room code resolution endpoint
app.get('/resolve-room-code/:code', (req, res) => {
  const code = req.params.code.toLowerCase();
  const roomId = roomCodes.get(code);
  
  if (roomId) {
    res.json({ success: true, roomId, code });
  } else {
    // Try auto-resolving with deterministic generation
    const possibleRoomIds = generatePossibleRoomIds(code);
    
    for (const possibleRoomId of possibleRoomIds) {
      try {
        const testCode = generateRoomCodeOnServer(possibleRoomId);
        if (testCode && testCode.toLowerCase() === code) {
          // Auto-register this mapping
          roomCodes.set(code, possibleRoomId);
          devLog(`✨ Auto-resolved room code: ${code} -> ${possibleRoomId}`);
          res.json({ success: true, roomId: possibleRoomId, code, autoResolved: true });
          return;
        }
      } catch (error) {
        continue;
      }
    }
    
    res.json({ success: false, error: 'Room code not found' });
  }
});

// Helper function for room code resolution
function generatePossibleRoomIds(roomCode) {
  const parts = roomCode.split('-');
  if (parts.length !== 3) return [];
  
  const [adjective, noun, numberStr] = parts;
  
  return [
    roomCode,
    parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('-'),
    parts.join(' '),
    `${adjective}-${noun}`,
    noun,
    `${adjective}-${noun}-room`,
    `${noun}-${numberStr}`
  ].filter(id => id && id.length > 0);
}

// Register room code endpoint
app.post('/register-room-code', (req, res) => {
  const { roomId, roomCode } = req.body;
  
  if (!roomId || !roomCode) {
    return res.status(400).json({ error: 'roomId and roomCode are required' });
  }
  
  const normalizedCode = roomCode.toLowerCase();
  
  // Check if code is already taken by a different room
  const existingRoomId = roomCodes.get(normalizedCode);
  if (existingRoomId && existingRoomId !== roomId) {
    return res.status(409).json({ error: 'Room code already taken by another room' });
  }
  
  // Register the mapping
  roomCodes.set(normalizedCode, roomId);
  devLog(`📋 Registered room code: ${normalizedCode} -> ${roomId}`);
  
  res.json({ success: true, roomId, roomCode: normalizedCode });
});

// Room statistics endpoint
app.get('/room-stats/:roomId', (req, res) => {
  const { roomId } = req.params;
  
  // Get current room data
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

// Basic signaling endpoint
app.get('/signaling-proxy', (req, res) => {
  res.json({
    signalingAvailable: true,
    endpoint: '/socket.io/',
    version: '3.2.0-performance-optimized-full-admin',
    features: ['peer-discovery', 'connection-assistance', 'room-management', 'messaging', 'cors-fix', 'performance-optimized', 'full-admin-restored'],
    timestamp: Date.now()
  });
});

// Debug endpoint (development only)
if (isDevelopment) {
  app.get('/debug/rooms', (req, res) => {
    const roomData = Array.from(rooms.entries()).map(([id, peers]) => ({
      id,
      peers: peers.size,
      peerList: Array.from(peers.values())
    }));
    
    res.json({
      rooms: roomData,
      analytics: analyticsData,
      recentActivity: activityLog.slice(0, 5),
      environment: 'development',
      stats: connectionStats,
      performance: {
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        uptime: process.uptime()
      },
      database: {
        ready: dbReady,
        path: dbPath,
        operationQueueSize: dbOperationQueue.length
      }
    });
  });
}

app.get('/', (req, res) => {
  res.json({
    service: 'PeddleNet Universal Signaling Server',
    version: '3.2.0-performance-optimized-full-admin',
    status: 'running',
    environment: NODE_ENV,
    platform: PLATFORM,
    mode: isDevelopment ? 'development' : isStaging ? 'staging' : 'production',
    description: 'Performance-optimized WebRTC signaling server with full admin functionality',
    features: ['cors-headers', 'cloud-run-optimization', 'polling-first-transport', 'performance-optimized', 'full-admin-dashboard'],
    endpoints: {
      health: '/health',
      cloudRunHealth: '/_ah/health',
      signaling: '/socket.io/',
      analytics: '/admin/analytics',
      activity: '/admin/activity',
      usersDetailed: '/admin/users/detailed',
      roomsDetailed: '/admin/rooms/detailed',
      broadcast: '/admin/broadcast',
      clearRoom: '/admin/room/:roomId/messages',
      wipeDatabase: '/admin/database',
      ...(isDevelopment && { 
        debug: '/debug/rooms'
      })
    },
    database: {
      ready: dbReady,
      path: dbPath
    },
    timestamp: Date.now()
  });
});

// PERFORMANCE FIX: Socket.IO connection handling - optimized to reduce CPU overhead
io.on('connection', (socket) => {
  connectionStats.currentConnections++;
  connectionStats.totalConnections++;
  connectionStats.peakConnections = Math.max(
    connectionStats.peakConnections, 
    connectionStats.currentConnections
  );

  devLog(`🔗 Client connected: ${socket.id} (${connectionStats.currentConnections} active)`);

  socket.userData = null;

  // FIXED: Less frequent health pings to reduce CPU overhead
  socket.on('health-ping', (data) => {
    socket.emit('health-pong', {
      timestamp: Date.now(),
      serverTime: Date.now(),
      received: data.timestamp
    });
  });

  // Admin dashboard connection
  socket.on('join-admin', () => {
    socket.join('admin-channel');
    adminConnections.add(socket.id);
    socket.isAdmin = true;
    
    devLog(`🛡️ Admin client connected: ${socket.id}`);
    
    logActivity('admin-action', {
      action: 'admin-connected',
      socketId: socket.id
    });
  });

  // Join room - optimized
  socket.on('join-room', ({ roomId, peerId, displayName }) => {
    devLog(`👥 ${displayName} (${peerId}) joining room: ${roomId}`);
    
    socket.join(roomId);
    socket.userData = { roomId, peerId, displayName, joinedAt: Date.now() };
    
    // Initialize room if it doesn't exist
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Map());
      logActivity('room-created', { roomId, creator: displayName });
    }
    
    const roomPeers = rooms.get(roomId);
    
    // Remove any existing connections for this peer ID
    for (const [socketId, peer] of roomPeers.entries()) {
      if (peer.peerId === peerId && socketId !== socket.id) {
        devLog(`🔄 Removing duplicate connection for peer ${peerId}: ${socketId}`);
        roomPeers.delete(socketId);
        const oldSocket = io.sockets.sockets.get(socketId);
        if (oldSocket) {
          oldSocket.disconnect(true);
        }
      }
    }
    
    roomPeers.set(socket.id, { peerId, displayName, joinedAt: Date.now() });
    
    // Update room analytics (simplified)
    if (!analyticsData.roomActivity.has(roomId)) {
      analyticsData.roomActivity.set(roomId, {
        messages: 0,
        lastActivity: Date.now()
      });
    }
    
    const roomStats = analyticsData.roomActivity.get(roomId);
    roomStats.lastActivity = Date.now();
    
    // Store user session in database (batched)
    const sessionId = `${peerId}-${Date.now()}`;
    safeDbRun(
      'INSERT INTO user_sessions (id, room_id, user_id, display_name, joined_at) VALUES (?, ?, ?, ?, datetime("now"))',
      [sessionId, roomId, peerId, displayName]
    );
    
    // Notify others in the room
    socket.to(roomId).emit('peer-joined', { peerId, displayName });
    
    // Send current peers to new user
    const currentPeers = Array.from(roomPeers.values()).filter(peer => peer.peerId !== peerId);
    socket.emit('room-peers', currentPeers);
    
    // Send recent message history (last 24h, limited to 10 messages for performance)
    safeDbAll(
      'SELECT * FROM messages WHERE room_id = ? AND timestamp > ? ORDER BY timestamp DESC LIMIT 10',
      [roomId, Date.now() - (24 * 60 * 60 * 1000)],
      (err, rows) => {
        if (!err && rows && rows.length > 0) {
          socket.emit('room-history', {
            roomId,
            messages: rows.reverse(),
            historyCount: rows.length
          });
        }
      }
    );
    
    logActivity('user-joined', { roomId, peerId, displayName });
  });

  // Handle connection requests
  socket.on('request-connection', ({ targetSocketId, fromPeerId }) => {
    socket.to(targetSocketId).emit('connection-request', {
      fromPeerId,
      fromSocketId: socket.id
    });
  });

  // Handle connection responses
  socket.on('connection-response', ({ targetSocketId, accepted, toPeerId }) => {
    socket.to(targetSocketId).emit('connection-response', {
      accepted,
      toPeerId,
      fromSocketId: socket.id
    });
  });

  // Chat message handling - optimized
  socket.on('chat-message', ({ roomId, message, type = 'chat' }) => {
    devLog(`💬 Chat message from ${socket.id} in room ${roomId}`);
    
    if (socket.userData && socket.userData.roomId === roomId) {
      const enhancedMessage = {
        id: message.id || generateMessageId(),
        content: message.content,
        sender: socket.userData.displayName,
        timestamp: Date.now(),
        type,
        roomId
      };
      
      // Store message in database (batched)
      safeDbRun(
        'INSERT INTO messages (id, room_id, sender, content, timestamp) VALUES (?, ?, ?, ?, ?)',
        [enhancedMessage.id, roomId, enhancedMessage.sender, enhancedMessage.content, enhancedMessage.timestamp]
      );
      
      // Store in memory with size limit
      if (!messageStore.has(roomId)) {
        messageStore.set(roomId, []);
      }
      const roomMessages = messageStore.get(roomId);
      roomMessages.push(enhancedMessage);
      
      // FIXED: Smaller memory footprint
      if (roomMessages.length > MAX_ROOM_MESSAGES) {
        roomMessages.splice(0, roomMessages.length - MAX_ROOM_MESSAGES);
      }
      
      // Update analytics
      updateMessageAnalytics(roomId);
      
      // Broadcast to room
      io.to(roomId).emit('chat-message', enhancedMessage);
      
      // Send delivery confirmation
      socket.emit('message-delivered', {
        messageId: enhancedMessage.id,
        timestamp: Date.now()
      });
      
      devLog(`✅ Message delivered to room ${roomId}`);
    } else {
      devLog(`⚠️ User ${socket.id} tried to send message to unauthorized room ${roomId}`);
      socket.emit('error', {
        message: 'You are not in the specified room',
        code: 'NOT_IN_ROOM'
      });
    }
  });

  // Handle disconnect
  socket.on('disconnect', (reason) => {
    connectionStats.currentConnections--;
    devLog(`🔌 Client disconnected: ${socket.id} (${connectionStats.currentConnections} active, reason: ${reason})`);
    
    // Clean up admin connections
    if (socket.isAdmin && adminConnections.has(socket.id)) {
      adminConnections.delete(socket.id);
      devLog(`🛡️ Admin client disconnected: ${socket.id}`);
    }
    
    if (socket.userData) {
      const { roomId, peerId, displayName, joinedAt } = socket.userData;
      
      // Update user session in database (batched)
      const sessionDuration = Date.now() - joinedAt;
      safeDbRun(
        'UPDATE user_sessions SET left_at = datetime("now"), duration = ? WHERE user_id = ? AND room_id = ? AND left_at IS NULL',
        [sessionDuration, peerId, roomId]
      );
      
      // Remove from room
      if (rooms.has(roomId)) {
        const roomPeers = rooms.get(roomId);
        roomPeers.delete(socket.id);
        
        // Notify others
        socket.to(roomId).emit('peer-left', { peerId, displayName });
        
        // Clean up empty rooms
        if (roomPeers.size === 0) {
          rooms.delete(roomId);
          devLog(`🗑️ Room ${roomId} deleted (empty)`);
        }
      }
      
      logActivity('user-left', { roomId, peerId, displayName });
    }
  });
});

// Utility functions
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}

function generateMessageId() {
  return Math.random().toString(36).substring(2, 15);
}

// PERFORMANCE FIX: Much less frequent cleanup to reduce CPU overhead
setInterval(() => {
  let cleanedRooms = 0;
  for (const [roomId, peers] of rooms.entries()) {
    if (peers.size === 0) {
      rooms.delete(roomId);
      cleanedRooms++;
    }
  }
  if (cleanedRooms > 0) {
    devLog(`🧹 Cleaned up ${cleanedRooms} empty rooms`);
  }
}, 10 * 60 * 1000); // Every 10 minutes instead of 5

// PERFORMANCE FIX: Much less frequent database cleanup 
async function setupDatabaseCleanup() {
  if (!dbReady) return;
  
  // Clean up old messages once every 12 hours instead of 6 hours
  setInterval(() => {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
    safeDbRun('DELETE FROM messages WHERE timestamp < ?', [cutoff], function(err) {
      if (err) {
        console.error('❌ Message cleanup failed:', err.message);
      } else if (this.changes > 0) {
        console.log(`🧹 Cleaned up ${this.changes} old messages`);
      }
    });
  }, 12 * 60 * 60 * 1000); // Every 12 hours
}

// Initialize and start server
async function startServer() {
  try {
    await initializeDatabase();
    await setupDatabaseCleanup();
    
    logActivity('server-start', {
      environment: NODE_ENV,
      platform: PLATFORM,
      timestamp: Date.now()
    });

    const PORT = process.env.PORT || 3001;
    server.listen(PORT, '0.0.0.0', () => {
      devLog(`🎵 PeddleNet Universal Server v3.2.0-performance-optimized-full-admin running on port ${PORT}`);
      devLog(`🔍 Health check: http://localhost:${PORT}/health`);
      devLog(`📊 Analytics dashboard: http://localhost:${PORT}/admin/analytics`);
      devLog(`🚀 PERFORMANCE OPTIMIZED + FULL ADMIN FUNCTIONALITY RESTORED`);
      devLog(`✅ ALL ADMIN ENDPOINTS: analytics, activity, users/detailed, rooms/detailed, broadcast, clear room, wipe database`);
      
      if (isDevelopment) {
        devLog(`🐛 Debug endpoint: http://localhost:${PORT}/debug/rooms`);
        
        const interfaces = os.networkInterfaces();
        for (const name of Object.keys(interfaces)) {
          for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
              devLog(`📱 Mobile: http://${iface.address}:3000 → http://${iface.address}:${PORT}`);
            }
          }
        }
      }
    });

  } catch (error) {
    console.error('❌ Failed to initialize server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
let isShuttingDown = false;

function gracefulShutdown(signal) {
  if (isShuttingDown) {
    console.log(`${signal} already in progress, ignoring...`);
    return;
  }
  
  isShuttingDown = true;
  console.log(`${signal} received, shutting down gracefully`);
  
  // Flush any pending database operations
  if (dbFlushTimer) {
    clearTimeout(dbFlushTimer);
    flushDbOperations();
  }
  
  // Close database connection
  if (db) {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
      } else {
        console.log('Database connection closed');
      }
    });
  }
  
  // Close Socket.IO connections
  if (io) {
    io.close(() => {
      console.log('Socket.IO connections closed');
      
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });
  } else {
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  }
  
  // Force exit after 5 seconds
  setTimeout(() => {
    console.log('Force shutdown after timeout');
    process.exit(1);
  }, 5000);
}

process.once('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.once('SIGINT', () => gracefulShutdown('SIGINT'));

startServer();

module.exports = { app, server, io, db };

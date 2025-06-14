// signaling-server.js - Universal server with COMPREHENSIVE ANALYTICS & SQLite Integration
// Auto-detects environment and adapts configuration accordingly
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

console.log(`🎪 PeddleNet Universal Server Starting... (ANALYTICS ENHANCED)`);
console.log(`📍 Environment: ${NODE_ENV}`);
console.log(`🏗️ Platform: ${PLATFORM}`);
console.log(`🎯 Build Target: ${BUILD_TARGET}`);
console.log(`🎯 Mode: ${isDevelopment ? 'DEVELOPMENT' : isStaging ? 'STAGING' : 'PRODUCTION'}`);

// 📊 ANALYTICS & STORAGE ENHANCEMENT
// Initialize SQLite database for message persistence and analytics
const dbPath = isDevelopment ? './festival-chat-dev.db' : './festival-chat.db';
let db = null;
let dbReady = false;

// Message storage for analytics and persistence
const messageStore = new Map(); // roomId -> Message[] (in-memory for real-time)
const activityLog = []; // Real-time activity feed
const MAX_ACTIVITY_LOG = 100; // Keep last 100 activities

// Analytics tracking
const analyticsData = {
  totalMessages: 0,
  messagesPerMinute: 0,
  messageHistory: [], // Last 10 minutes of message counts
  roomActivity: new Map(), // roomId -> { messages, users, lastActivity }
  userSessions: new Map(), // userId -> session data
  networkQuality: {
    avgLatency: 0,
    successRate: 100,
    deliveryRate: 100
  },
  startTime: Date.now()
};

// Initialize database tables with proper async handling
async function initializeDatabase() {
  return new Promise((resolve, reject) => {
    console.log('🗄️ Initializing database tables...');
    
    // Connect to database
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ SQLite connection failed:', err.message);
        reject(err);
        return;
      } else {
        console.log(`✅ SQLite connected: ${dbPath}`);
      }
    });

    // Create tables in series to avoid race conditions
    db.serialize(() => {
      // Messages table for 24-hour persistence
      db.run(`
        CREATE TABLE IF NOT EXISTS messages (
          id TEXT PRIMARY KEY,
          room_id TEXT NOT NULL,
          sender TEXT NOT NULL,
          content TEXT NOT NULL,
          timestamp INTEGER NOT NULL,
          type TEXT DEFAULT 'chat',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('❌ Messages table creation failed:', err.message);
          reject(err);
          return;
        }
      });

      // Room analytics table
      db.run(`
        CREATE TABLE IF NOT EXISTS room_analytics (
          room_id TEXT PRIMARY KEY,
          room_code TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
          total_messages INTEGER DEFAULT 0,
          unique_users INTEGER DEFAULT 0,
          peak_concurrent INTEGER DEFAULT 0,
          total_sessions INTEGER DEFAULT 0
        )
      `, (err) => {
        if (err) {
          console.error('❌ Room analytics table creation failed:', err.message);
          reject(err);
          return;
        }
      });

      // User sessions for analytics
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

      // System events for monitoring
      db.run(`
        CREATE TABLE IF NOT EXISTS system_events (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          event_type TEXT NOT NULL,
          event_data TEXT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('❌ System events table creation failed:', err.message);
          reject(err);
          return;
        }
      });

      // Create indexes for performance
      db.run(`CREATE INDEX IF NOT EXISTS idx_messages_room_timestamp ON messages (room_id, timestamp)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages (timestamp)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_room_analytics_activity ON room_analytics (last_activity)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_user_sessions_room ON user_sessions (room_id)`);

      console.log('✅ Database initialization complete');
      dbReady = true;
      resolve();
    });
  });
}

// Safe database operations - only execute when DB is ready
function safeDbRun(query, params = [], callback = () => {}) {
  if (!dbReady || !db) {
    console.warn('⚠️ Database not ready, skipping query:', query.substring(0, 50));
    if (typeof callback === 'function') callback(new Error('Database not ready'));
    return;
  }
  db.run(query, params, callback);
}

function safeDbGet(query, params = [], callback = () => {}) {
  if (!dbReady || !db) {
    console.warn('⚠️ Database not ready, skipping query:', query.substring(0, 50));
    if (typeof callback === 'function') callback(new Error('Database not ready'), null);
    return;
  }
  db.get(query, params, callback);
}

function safeDbAll(query, params = [], callback = () => {}) {
  if (!dbReady || !db) {
    console.warn('⚠️ Database not ready, skipping query:', query.substring(0, 50));
    if (typeof callback === 'function') callback(new Error('Database not ready'), []);
    return;
  }
  db.all(query, params, callback);
}

// Enhanced analytics functions
function logActivity(type, data) {
  const activity = {
    id: Date.now() + Math.random(),
    type,
    data,
    timestamp: Date.now(),
    icon: getActivityIcon(type)
  };
  
  activityLog.unshift(activity);
  if (activityLog.length > MAX_ACTIVITY_LOG) {
    activityLog.pop();
  }

  // Store in database for historical analysis (safe)
  safeDbRun(
    'INSERT INTO system_events (event_type, event_data) VALUES (?, ?)',
    [type, JSON.stringify(data)]
  );

  // Broadcast to admin dashboard if connected
  if (io && io.to) {
    io.to('admin-channel').emit('live-activity', activity);
  }
}

function getActivityIcon(type) {
  const icons = {
    'user-joined': '👥',
    'user-left': '👋',
    'message-sent': '💬',
    'room-created': '🏠',
    'room-deleted': '🗑️',
    'server-start': '🚀',
    'error': '⚠️',
    'admin-action': '🛡️'
  };
  return icons[type] || '📝';
}

function updateMessageAnalytics(roomId) {
  analyticsData.totalMessages++;
  
  // Update room-specific analytics
  if (!analyticsData.roomActivity.has(roomId)) {
    analyticsData.roomActivity.set(roomId, {
      messages: 0,
      users: new Set(),
      lastActivity: Date.now(),
      created: Date.now()
    });
  }
  
  const roomStats = analyticsData.roomActivity.get(roomId);
  roomStats.messages++;
  roomStats.lastActivity = Date.now();
  
  // Update database (safe)
  safeDbRun(`
    INSERT OR REPLACE INTO room_analytics 
    (room_id, last_activity, total_messages) 
    VALUES (?, datetime('now'), ?)
  `, [roomId, roomStats.messages]);

  // Update messages per minute calculation
  updateMessagesPerMinute();
}

function updateMessagesPerMinute() {
  const now = Math.floor(Date.now() / 60000); // Current minute
  
  // Initialize or update current minute
  if (analyticsData.messageHistory.length === 0 || analyticsData.messageHistory[0].minute !== now) {
    analyticsData.messageHistory.unshift({ minute: now, count: 1 });
    
    // Keep only last 10 minutes
    if (analyticsData.messageHistory.length > 10) {
      analyticsData.messageHistory = analyticsData.messageHistory.slice(0, 10);
    }
  } else {
    analyticsData.messageHistory[0].count++;
  }
  
  // Calculate messages per minute average
  const totalMessages = analyticsData.messageHistory.reduce((sum, m) => sum + m.count, 0);
  analyticsData.messagesPerMinute = Math.round(totalMessages / Math.min(analyticsData.messageHistory.length, 10));
}

// CRITICAL FIX: Enhanced CORS origins with proper Cloud Run support
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
    // Explicit patterns for better Cloud Run compatibility
    /^https:\/\/[a-zA-Z0-9-]+\.ngrok(-free)?\.app$/,
    /^https:\/\/[a-zA-Z0-9-]+\.ngrok\.io$/,
    /^https:\/\/[a-zA-Z0-9-]+\.vercel\.app$/,
    /^https:\/\/[a-zA-Z0-9-]+\.firebaseapp\.com$/,
    /^https:\/\/.*\.web\.app$/
  ];

  if (isDevelopment) {
    // Add local network IPs for mobile testing in development
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

// CRITICAL FIX: Enhanced Socket.IO configuration with Cloud Run optimizations
const io = new Server(server, {
  cors: {
    origin: getCorsOrigins(),
    methods: ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin", "X-Connection-Type"]
  },
  // CRITICAL: Polling FIRST for Cloud Run compatibility
  transports: ['polling', 'websocket'], // Polling first for better Cloud Run support
  
  // Enhanced timeouts for Cloud Run cold starts
  pingTimeout: 60000,           // 60 seconds before considering connection dead
  pingInterval: 25000,          // Ping every 25 seconds
  upgradeTimeout: 30000,        // 30 seconds to upgrade connection
  connectTimeout: 45000,        // 45 seconds to establish initial connection
  
  // Cloud Run optimizations
  allowUpgrades: true,          // Allow WebSocket upgrades after polling
  maxHttpBufferSize: 1e6,       // 1MB buffer for messages
  allowEIO3: true,              // Backward compatibility
  cookie: false,                // Disable cookies for Cloud Run
  serveClient: false,           // Don't serve Socket.IO client files
  
  // Connection state recovery for mobile devices & cold starts
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
    skipMiddlewares: true,
  },
  
  // Enhanced error handling
  allowRequest: (req, callback) => {
    const origin = req.headers.origin;
    const corsOrigins = getCorsOrigins();
    
    // Check if origin is allowed
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

// Admin info endpoint (shows auth status)
app.get('/admin/info', (req, res) => {
  res.json({
    adminDashboard: 'Festival Chat Admin Dashboard',
    version: '3.0.0-analytics-enhanced',
    authRequired: isProduction,
    environment: BUILD_TARGET || NODE_ENV,
    platform: PLATFORM,
    securityNote: isProduction ? 'Authentication required for admin access' : 'Open access in staging/development',
    endpoints: {
      analytics: '/admin/analytics',
      activity: '/admin/activity', 
      export: '/admin/export',
      users: '/admin/users/detailed',
      rooms: '/admin/rooms/detailed'
    },
    timestamp: Date.now()
  });
});

// CRITICAL FIX: Enhanced CORS middleware for all routes
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const corsOrigins = getCorsOrigins();
  
  // Check if origin is allowed
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
  res.header('Access-Control-Max-Age', '86400'); // 24 hours preflight cache
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

// Standard CORS middleware as backup
app.use(cors({
  origin: getCorsOrigins(),
  methods: ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin", "X-Connection-Type"]
}));

app.use(express.json());

// 🔒 ADMIN AUTHENTICATION (Production Only)
// Simple HTTP Basic Auth for admin dashboard security
function requireAdminAuth(req, res, next) {
  // Skip authentication in development and staging
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
  
  // Decode base64 credentials
  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [username, password] = credentials.split(':');
  
  // Check credentials (allow environment override)
  const validUsername = process.env.ADMIN_USERNAME || 'th3p3ddl3r';
  const validPassword = process.env.ADMIN_PASSWORD || 'letsmakeatrade';
  
  if (username !== validUsername || password !== validPassword) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Festival Chat Admin Dashboard"');
    return res.status(401).json({ 
      error: 'Invalid credentials',
      message: 'Access denied - invalid username or password'
    });
  }
  
  // Log successful admin access
  console.log(`🛡️ Admin authenticated: ${username} from ${req.ip || 'unknown IP'}`);
  
  next();
}

// Store room and connection information
const rooms = new Map();
const notificationSubscribers = new Map(); // Track background notification subscribers
const adminConnections = new Set(); // Track admin dashboard connections
const connectionStats = {
  totalConnections: 0,
  currentConnections: 0,
  currentChatUsers: 0, // NEW: Track actual chat users (exclude admin)
  peakConnections: 0,
  startTime: Date.now(),
  coldStarts: 0,
  corsRejections: 0
};

// Room code mapping for server-side lookup
const roomCodes = new Map(); // roomCode -> roomId mapping

// Enhanced logging for development
function devLog(...args) {
  if (isDevelopment && typeof args[0] === 'string') {
    // Add DEV prefix to development logs
    args[0] = args[0].replace(/^([🔗🎵👥📊💬🔥✅⚠️🔔🗑️📋🔍🚨🎯])/g, '$1 DEV:');
  }
  console.log(...args);
}

// Room code generation (matching client-side)
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
  
  // Simple hash function (matching client-side)
  let hash = 0;
  for (let i = 0; i < roomId.length; i++) {
    const char = roomId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  const adjIndex = Math.abs(hash) % adjectives.length;
  const nounIndex = Math.abs(hash >> 8) % nouns.length;
  const number = (Math.abs(hash >> 16) % 99) + 1;
  
  return `${adjectives[adjIndex]}-${nouns[nounIndex]}-${number}`;
}

// CRITICAL: Cloud Run health check endpoint
app.get('/_ah/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: Date.now(),
    uptime: process.uptime(),
    service: 'PeddleNet WebSocket Server'
  });
});

// Enhanced health check endpoint with comprehensive analytics
app.get('/health', (req, res) => {
  // Ensure CORS headers are set
  const origin = req.headers.origin;
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  
  res.json({ 
    status: 'ok',
    service: 'PeddleNet Universal Server',
    version: '3.0.0-analytics-enhanced',
    uptime: Math.floor(uptime),
    uptimeHuman: formatUptime(uptime),
    connections: {
      current: connectionStats.currentConnections,
      peak: connectionStats.peakConnections,
      total: connectionStats.totalConnections,
      coldStarts: connectionStats.coldStarts,
      corsRejections: connectionStats.corsRejections
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
    cors: {
      enabled: true,
      allowedOrigins: ['https://peddlenet.app', 'http://localhost:3000'],
      requestOrigin: origin || 'none'
    },
    environment: BUILD_TARGET || NODE_ENV,
    platform: PLATFORM,
    timestamp: Date.now()
  });
});

// 📊 COMPREHENSIVE ANALYTICS ENDPOINTS (Protected)

app.get('/admin/analytics', requireAdminAuth, async (req, res) => {
  try {
    // FIX 1: Count UNIQUE users instead of connections
    const uniqueActiveUsers = new Set();
    for (const [roomId, roomPeers] of rooms.entries()) {
      for (const [socketId, peerData] of roomPeers.entries()) {
        uniqueActiveUsers.add(peerData.peerId);
      }
    }
    const actualActiveUsers = uniqueActiveUsers.size;
    
    // FIXED: Improved database query with proper error handling and null checks
    const getTotalStats = () => {
      return new Promise((resolve) => {
        if (!dbReady || !db) {
          console.log('📊 Database not ready, returning fallback totals');
          resolve({ totalUsers: 0, totalRooms: 0 });
          return;
        }
        
        // Get total unique users from user_sessions table
        safeDbGet('SELECT COUNT(DISTINCT user_id) as total_users FROM user_sessions', [], (err, userResult) => {
          if (err) {
            console.warn('⚠️ User count query failed:', err.message);
            resolve({ totalUsers: 0, totalRooms: 0 });
            return;
          }
          
          const totalUsers = userResult?.total_users || 0;
          console.log('📊 Total users from DB:', totalUsers);
          
          // Get total unique rooms from user_sessions table
          safeDbGet('SELECT COUNT(DISTINCT room_id) as total_rooms FROM user_sessions', [], (err, roomResult) => {
            if (err) {
              console.warn('⚠️ Room count query failed:', err.message);
              resolve({ totalUsers, totalRooms: 0 });
              return;
            }
            
            const totalRooms = roomResult?.total_rooms || 0;
            console.log('📊 Total rooms from DB:', totalRooms);
            
            resolve({ totalUsers, totalRooms });
          });
        });
      });
    };
    
    const { totalUsers, totalRooms } = await getTotalStats();
    
    const dashboardData = {
      realTimeStats: {
        activeUsers: actualActiveUsers, // FIX: Use unique users, not connections
        totalUsers: totalUsers,
        activeRooms: rooms.size,
        totalRooms: totalRooms,
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
        cpuUsage: `${cpuUsage.percent}%`,
        cpuUser: `${cpuUsage.user}%`,
        cpuSystem: `${cpuUsage.system}%`,
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
      dbStats: {
        totalMessages: analyticsData.totalMessages,
        totalRooms: rooms.size,
        totalSessions: 0,
        recentActivity: 0,
        dbSize: '1MB',
        oldestMessage: Date.now() - (24 * 60 * 60 * 1000)
      },
      timestamp: Date.now(),
      databaseReady: dbReady
    };
    
    console.log('📊 Sending analytics data:', {
      activeUsers: actualActiveUsers,
      totalUsers,
      activeRooms: rooms.size,
      totalRooms,
      dbReady
    });
    
    res.json(dashboardData);
  } catch (error) {
    console.error('❌ Analytics dashboard error:', error);
    res.status(500).json({ error: 'Failed to generate analytics data' });
  }
});

// FIX 3: Activity endpoint shows activities from ALL rooms
app.get('/admin/activity', requireAdminAuth, (req, res) => {
  const { limit = 50 } = req.query; // Increased default limit
  res.json({
    activities: activityLog.slice(0, parseInt(limit)),
    total: activityLog.length,
    timestamp: Date.now()
  });
});

// Room-specific analytics
app.get('/admin/room/:roomId/analytics', requireAdminAuth, async (req, res) => {
  const { roomId } = req.params;
  
  try {
    const roomAnalytics = await getRoomAnalytics(roomId);
    res.json(roomAnalytics);
  } catch (error) {
    console.error('❌ Room analytics error:', error);
    res.status(500).json({ error: 'Failed to get room analytics' });
  }
});

// Message history for admin (last 24h)
app.get('/admin/room/:roomId/messages', requireAdminAuth, (req, res) => {
  const { roomId } = req.params;
  const { limit = 100 } = req.query;
  
  safeDbAll(
    'SELECT * FROM messages WHERE room_id = ? ORDER BY timestamp DESC LIMIT ?',
    [roomId, limit],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({ 
          messages: rows.reverse(),
          roomId,
          total: rows.length,
          timestamp: Date.now()
        });
      }
    }
  );
});

// Network health and performance metrics
app.get('/admin/network-health', requireAdminAuth, (req, res) => {
  res.json({
    serverHealth: getServerHealth(),
    connectionStats: getConnectionStats(),
    networkQuality: analyticsData.networkQuality,
    transport: {
      websocket: connectionStats.currentConnections,
      polling: 0 // TODO: Track polling connections separately
    },
    timestamp: Date.now()
  });
});

// 🛡️ ADMIN CONTROL ENDPOINTS (Protected)

// Clear room messages with proper client cache clearing
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
      // This is similar to database wipe but targeted to specific room
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

// DANGER: Wipe entire database
app.delete('/admin/database', requireAdminAuth, (req, res) => {
  const { confirm } = req.body;
  
  if (confirm !== 'WIPE_EVERYTHING') {
    return res.status(400).json({ error: 'Confirmation required: send "WIPE_EVERYTHING"' });
  }
  
  if (!dbReady || !db) {
    return res.status(503).json({ error: 'Database not ready' });
  }
  
  console.log('🗑️ Starting database wipe...');
  
  // First, check current state
  db.get('SELECT COUNT(*) as count FROM messages', [], (err, beforeRow) => {
    const messagesBefore = beforeRow ? beforeRow.count : 0;
    console.log(`📊 Messages before wipe: ${messagesBefore}`);
    
    // Enhanced database wipe with proper error handling
    const wipeOperations = [
      'DELETE FROM messages',
      'DELETE FROM room_analytics', 
      'DELETE FROM user_sessions',
      'DELETE FROM system_events'
    ];
    
    let completedOperations = 0;
    const totalOperations = wipeOperations.length;
    const results = [];
    
    const handleWipeComplete = () => {
      completedOperations++;
      console.log(`📊 Wipe progress: ${completedOperations}/${totalOperations}`);
      
      if (completedOperations === totalOperations) {
        // Verify the wipe by checking message count
        db.get('SELECT COUNT(*) as count FROM messages', [], (err, afterRow) => {
          const messagesAfter = afterRow ? afterRow.count : 0;
          console.log(`📊 Messages after wipe: ${messagesAfter}`);
          
          // Clear in-memory data after database operations complete
          const inMemoryBefore = {
            messageStore: messageStore.size,
            roomActivity: analyticsData.roomActivity.size,
            rooms: rooms.size,
            totalMessages: analyticsData.totalMessages
          };
          
          messageStore.clear();
          analyticsData.roomActivity.clear();
          rooms.clear();
          roomCodes.clear();
          activityLog.length = 0;
          
          // Reset analytics
          analyticsData.totalMessages = 0;
          analyticsData.messagesPerMinute = 0;
          analyticsData.messageHistory = [];
          
          const inMemoryAfter = {
            messageStore: messageStore.size,
            roomActivity: analyticsData.roomActivity.size,
            rooms: rooms.size,
            totalMessages: analyticsData.totalMessages
          };
          
          // Force all clients to refresh
          io.emit('database-wiped', { 
            message: 'Database has been wiped. Please refresh the page.', 
            forceReload: true 
          });
          
          // Disconnect all clients to force reconnection
          io.disconnectSockets(true);
          
          console.log('✅ Database wipe completed successfully');
          console.log('📊 In-memory before:', inMemoryBefore);
          console.log('📊 In-memory after:', inMemoryAfter);
          
          logActivity('admin-action', {
            action: 'wipe-database-complete',
            results,
            messagesBefore,
            messagesAfter,
            inMemoryBefore,
            inMemoryAfter,
            timestamp: Date.now()
          });
          
          res.json({ 
            success: true, 
            message: 'Database completely wiped - all data cleared',
            operations: results,
            verification: {
              messagesBefore,
              messagesAfter,
              inMemoryBefore,
              inMemoryAfter
            },
            timestamp: Date.now()
          });
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
});

// ... (rest of the server implementation continues as in original file)
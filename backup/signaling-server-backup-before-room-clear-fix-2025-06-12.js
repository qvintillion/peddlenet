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
const isDevelopment = NODE_ENV === 'development' || PLATFORM === 'local';
const isStaging = PLATFORM === 'firebase' || NODE_ENV === 'staging';
const isProduction = PLATFORM === 'github' || PLATFORM === 'cloudrun' || NODE_ENV === 'production';

console.log(`🎪 PeddleNet Universal Server Starting... (ANALYTICS ENHANCED)`);
console.log(`📍 Environment: ${NODE_ENV}`);
console.log(`🏗️ Platform: ${PLATFORM}`);
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
    /^https:\/\/[a-zA-Z0-9-]+\.firebaseapp.com$/,
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
    environment: NODE_ENV,
    platform: PLATFORM,
    timestamp: Date.now()
  });
});

// 📊 COMPREHENSIVE ANALYTICS ENDPOINTS

// Main analytics dashboard endpoint
app.get('/admin/analytics', async (req, res) => {
  try {
    const dashboardData = await generateComprehensiveDashboardData();
    res.json(dashboardData);
  } catch (error) {
    console.error('❌ Analytics dashboard error:', error);
    res.status(500).json({ error: 'Failed to generate analytics data' });
  }
});

// Live activity feed endpoint
app.get('/admin/activity', (req, res) => {
  const { limit = 20 } = req.query;
  res.json({
    activities: activityLog.slice(0, parseInt(limit)),
    total: activityLog.length,
    timestamp: Date.now()
  });
});

// Room-specific analytics
app.get('/admin/room/:roomId/analytics', async (req, res) => {
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
app.get('/admin/room/:roomId/messages', (req, res) => {
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
app.get('/admin/network-health', (req, res) => {
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

// 🛡️ ADMIN CONTROL ENDPOINTS

// Clear room messages
app.delete('/admin/room/:roomId/messages', (req, res) => {
  const { roomId } = req.params;
  
  safeDbRun('DELETE FROM messages WHERE room_id = ?', [roomId], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      // Also clear from memory
      if (messageStore.has(roomId)) {
        messageStore.delete(roomId);
      }
      
      // Log admin action
      logActivity('admin-action', {
        action: 'clear-room-messages',
        roomId,
        messagesDeleted: this.changes || 0
      });
      
      // Broadcast to admin clients
      if (io && io.to) {
        io.to('admin-channel').emit('room-cleared', { roomId, messagesDeleted: this.changes || 0 });
      }
      
      res.json({ 
        success: true, 
        roomId, 
        messagesDeleted: this.changes || 0,
        timestamp: Date.now()
      });
    }
  });
});

// DANGER: Wipe entire database
app.delete('/admin/database', (req, res) => {
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

// Broadcast admin message to all rooms
app.post('/admin/broadcast', (req, res) => {
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

// Export analytics data
app.get('/admin/export', async (req, res) => {
  const { format = 'json', timeframe = '24h' } = req.query;
  
  try {
    const exportData = await generateExportData(timeframe);
    
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=festival-chat-analytics.csv');
      res.send(convertToCSV(exportData));
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=festival-chat-analytics.json');
      res.json(exportData);
    }
  } catch (error) {
    console.error('❌ Export error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 📊 DETAILED USER & ROOM MANAGEMENT ENDPOINTS

// Detailed active users endpoint
app.get('/admin/users/detailed', async (req, res) => {
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
      'SELECT * FROM user_sessions WHERE joined_at > datetime("now", "-1 hour") ORDER BY joined_at DESC LIMIT 100',
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

// Detailed active rooms endpoint
app.get('/admin/rooms/detailed', async (req, res) => {
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
        uniqueUsers: roomStats?.users?.size || roomPeers.size
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

// Admin action: Remove user from room
app.post('/admin/users/:peerId/remove', (req, res) => {
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

// Setup database cleanup after initialization
async function setupDatabaseCleanup() {
  if (!dbReady) return;
  
  // Set up automatic cleanup for messages older than 24 hours
  setInterval(() => {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
    safeDbRun('DELETE FROM messages WHERE timestamp < ?', [cutoff], function(err) {
      if (err) {
        console.error('❌ Message cleanup failed:', err.message);
      } else if (this.changes > 0) {
        console.log(`🧹 Cleaned up ${this.changes} old messages`);
      }
    });

    // Clean up completed user sessions older than 7 days
    const sessionCutoff = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days ago
    safeDbRun('DELETE FROM user_sessions WHERE left_at IS NOT NULL AND joined_at < ?', [sessionCutoff]);
  }, 60 * 60 * 1000); // Run every hour
}

// Helper functions for analytics
async function generateComprehensiveDashboardData() {
  return new Promise((resolve, reject) => {
    // Calculate actual active users by counting room participants
    const actualActiveUsers = Array.from(rooms.values()).reduce((total, roomPeers) => total + roomPeers.size, 0);
    
    if (!dbReady) {
      // Return mock data if database not ready
      resolve({
        realTimeStats: {
          activeUsers: actualActiveUsers,
          activeRooms: rooms.size,
          messagesPerMinute: analyticsData.messagesPerMinute,
          totalMessages: analyticsData.totalMessages,
          peakConnections: connectionStats.peakConnections,
          storageUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          userTrend: '+5%',
          roomTrend: '+2%',
          environment: NODE_ENV
        },
        serverHealth: {
          status: 'healthy',
          uptime: formatUptime(process.uptime()),
          memoryUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          memoryTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          cpuUsage: '15%',
          coldStarts: connectionStats.coldStarts
        },
        networkStatus: {
          quality: 95,
          avgLatency: 45,
          deliveryRate: 99.5
        },
        messageFlow: {
          messagesPerMinute: analyticsData.messagesPerMinute,
          trend: '+12%',
          history: analyticsData.messageHistory
        },
        dbStats: {
          totalMessages: analyticsData.totalMessages,
          totalRooms: rooms.size,
          totalSessions: 0,
          recentActivity: 0,
          dbSize: '0MB',
          oldestMessage: Date.now()
        },
        timestamp: Date.now(),
        databaseReady: false
      });
      return;
    }

    const queries = {
      totalMessages: 'SELECT COUNT(*) as count FROM messages',
      totalRooms: 'SELECT COUNT(*) as count FROM room_analytics',
      totalSessions: 'SELECT COUNT(*) as count FROM user_sessions',
      recentActivity: 'SELECT COUNT(*) as count FROM messages WHERE timestamp > ?'
    };

    const last24h = Date.now() - (24 * 60 * 60 * 1000);
    
    const results = {};
    let completed = 0;
    const total = Object.keys(queries).length;

    for (const [key, query] of Object.entries(queries)) {
      const params = key === 'recentActivity' ? [last24h] : [];
      
      safeDbGet(query, params, (err, row) => {
        if (err) {
          console.error(`Query ${key} failed:`, err);
          results[key] = 0;
        } else {
          results[key] = row ? row.count : 0;
        }
        
        completed++;
        if (completed === total) {
          // Calculate actual active users by counting room participants
          const actualActiveUsers = Array.from(rooms.values()).reduce((total, roomPeers) => total + roomPeers.size, 0);
          
          resolve({
            // Real-time stats
            realTimeStats: {
              activeUsers: actualActiveUsers,
              activeRooms: rooms.size,
              messagesPerMinute: analyticsData.messagesPerMinute,
              totalMessages: results.totalMessages,
              peakConnections: connectionStats.peakConnections,
              storageUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024), // MB
              userTrend: '+5%', // TODO: Calculate real trends
              roomTrend: '+2%',
              environment: NODE_ENV
            },
            
            // Server health
            serverHealth: {
              status: 'healthy',
              uptime: formatUptime(process.uptime()),
              memoryUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
              memoryTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
              cpuUsage: '15%', // TODO: Implement real CPU monitoring
              coldStarts: connectionStats.coldStarts
            },
            
            // Network status
            networkStatus: {
              quality: 95, // TODO: Calculate based on connection success rates
              avgLatency: analyticsData.networkQuality.avgLatency || 45,
              deliveryRate: analyticsData.networkQuality.deliveryRate || 99.5
            },
            
            // Message flow
            messageFlow: {
              messagesPerMinute: analyticsData.messagesPerMinute,
              trend: '+12%', // TODO: Calculate real trend
              history: analyticsData.messageHistory
            },
            
            // Database stats
            dbStats: {
              totalMessages: results.totalMessages,
              totalRooms: results.totalRooms,
              totalSessions: results.totalSessions,
              recentActivity: results.recentActivity,
              dbSize: '2.5MB', // TODO: Get real database size
              oldestMessage: Date.now() - (24 * 60 * 60 * 1000) // 24h ago
            },
            
            timestamp: Date.now(),
            databaseReady: true
          });
        }
      });
    }
  });
}

async function getRoomAnalytics(roomId) {
  return new Promise((resolve, reject) => {
    if (!dbReady) {
      resolve({
        roomId,
        analytics: {},
        currentState: {
          activeUsers: rooms.has(roomId) ? rooms.get(roomId).size : 0,
          isActive: rooms.has(roomId),
          lastSeen: Date.now()
        },
        timestamp: Date.now(),
        databaseReady: false
      });
      return;
    }

    safeDbGet(
      'SELECT * FROM room_analytics WHERE room_id = ?',
      [roomId],
      (err, row) => {
        if (err) {
          reject(err);
        } else {
          const currentRoom = rooms.get(roomId);
          resolve({
            roomId,
            analytics: row || {},
            currentState: {
              activeUsers: currentRoom ? currentRoom.size : 0,
              isActive: rooms.has(roomId),
              lastSeen: Date.now()
            },
            timestamp: Date.now(),
            databaseReady: true
          });
        }
      }
    );
  });
}

function getServerHealth() {
  const memUsage = process.memoryUsage();
  return {
    status: 'healthy',
    uptime: formatUptime(process.uptime()),
    memory: {
      used: Math.round(memUsage.heapUsed / 1024 / 1024),
      total: Math.round(memUsage.heapTotal / 1024 / 1024),
      percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
    },
    connections: connectionStats.currentConnections,
    rooms: rooms.size,
    database: {
      connected: dbReady,
      path: dbPath
    }
  };
}

function getConnectionStats() {
  return {
    active: connectionStats.currentConnections,
    total: connectionStats.totalConnections,
    peak: connectionStats.peakConnections,
    reconnecting: 0, // TODO: Track reconnecting connections
    coldStarts: connectionStats.coldStarts,
    corsRejections: connectionStats.corsRejections
  };
}

async function generateExportData(timeframe) {
  // TODO: Implement comprehensive export functionality
  return {
    exportInfo: {
      timeframe,
      generatedAt: Date.now(),
      format: 'comprehensive'
    },
    analytics: await generateComprehensiveDashboardData(),
    recentActivity: activityLog,
    connectionStats,
    placeholder: 'Full export implementation coming soon'
  };
}

function convertToCSV(data) {
  // Simple CSV conversion - TODO: Implement comprehensive CSV export
  const headers = ['timestamp', 'type', 'data'];
  const rows = [headers.join(',')];
  
  if (data.recentActivity) {
    data.recentActivity.forEach(activity => {
      rows.push([
        activity.timestamp,
        activity.type,
        JSON.stringify(activity.data).replace(/,/g, ';')
      ].join(','));
    });
  }
  
  return rows.join('\n');
}

// CRITICAL: Keep-alive strategy for Cloud Run (prevent cold starts)
if (isProduction && PLATFORM === 'cloudrun') {
  console.log('🔥 Enabling Cloud Run keep-alive strategy');
  
  // Ping self every 4 minutes to prevent cold starts (Cloud Run timeout is 5 min)
  setInterval(async () => {
    try {
      const PORT = process.env.PORT || 3001;
      const response = await fetch(`http://localhost:${PORT}/_ah/health`, {
        method: 'GET',
        timeout: 5000
      });
      console.log('🏥 Keep-alive ping successful:', response.status);
    } catch (error) {
      console.warn('Keep-alive ping failed:', error.message);
    }
  }, 4 * 60 * 1000); // Every 4 minutes
}

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
  
  // Get notification subscribers for this room
  const subscribers = notificationSubscribers.get(roomId);
  const notificationSubscriberCount = subscribers ? subscribers.size : 0;
  
  res.json({
    roomId,
    activeUsers,
    notificationSubscribers: notificationSubscriberCount,
    totalConnections: activeUsers + notificationSubscriberCount,
    lastActivity: Date.now(),
    timestamp: Date.now()
  });
});

// Basic signaling endpoint
app.get('/signaling-proxy', (req, res) => {
  res.json({
    signalingAvailable: true,
    endpoint: '/socket.io/',
    version: '3.0.0-analytics-enhanced',
    features: ['peer-discovery', 'connection-assistance', 'room-management', 'messaging-fix', 'cors-fix', 'cold-start-fix', 'analytics', 'admin-controls'],
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
    
    const roomCodeData = Array.from(roomCodes.entries()).map(([code, roomId]) => ({
      code,
      roomId
    }));
    
    res.json({
      rooms: roomData,
      roomCodes: roomCodeData,
      analytics: analyticsData,
      recentActivity: activityLog.slice(0, 10),
      environment: 'development',
      stats: connectionStats,
      adminConnections: {
        count: adminConnections.size,
        socketIds: Array.from(adminConnections)
      },
      userCalculation: {
        totalConnections: connectionStats.currentConnections,
        adminConnections: adminConnections.size,
        roomParticipants: Array.from(rooms.values()).reduce((total, roomPeers) => total + roomPeers.size, 0),
        calculatedActiveUsers: Array.from(rooms.values()).reduce((total, roomPeers) => total + roomPeers.size, 0),
        oldCalculation: connectionStats.currentConnections - adminConnections.size
      },
      cors: {
        allowedOrigins: getCorsOrigins(),
        rejections: connectionStats.corsRejections
      },
      database: {
        ready: dbReady,
        path: dbPath
      }
    });
  });

  // Debug: Check database state
  app.get('/debug/database', (req, res) => {
    if (!dbReady || !db) {
      return res.json({ error: 'Database not ready', ready: dbReady });
    }

    const queries = {
      messages: 'SELECT COUNT(*) as count FROM messages',
      recentMessages: 'SELECT * FROM messages ORDER BY timestamp DESC LIMIT 10',
      roomAnalytics: 'SELECT COUNT(*) as count FROM room_analytics',
      userSessions: 'SELECT COUNT(*) as count FROM user_sessions',
      systemEvents: 'SELECT COUNT(*) as count FROM system_events'
    };

    const results = {};
    let completed = 0;
    const total = Object.keys(queries).length;
    
    for (const [key, query] of Object.entries(queries)) {
      if (key === 'recentMessages') {
        db.all(query, [], (err, rows) => {
          if (err) {
            results[key] = { error: err.message };
          } else {
            results[key] = rows;
          }
          completed++;
          if (completed === total) {
            res.json({
              database: {
                ready: dbReady,
                path: dbPath
              },
              queries: results,
              inMemory: {
                messageStore: Object.fromEntries(messageStore),
                roomActivity: Object.fromEntries(analyticsData.roomActivity),
                totalMessages: analyticsData.totalMessages
              },
              timestamp: Date.now()
            });
          }
        });
      } else {
        db.get(query, [], (err, row) => {
          if (err) {
            results[key] = { error: err.message };
          } else {
            results[key] = row;
          }
          completed++;
          if (completed === total) {
            res.json({
              database: {
                ready: dbReady,
                path: dbPath
              },
              queries: results,
              inMemory: {
                messageStore: Object.fromEntries(messageStore),
                roomActivity: Object.fromEntries(analyticsData.roomActivity),
                totalMessages: analyticsData.totalMessages
              },
              timestamp: Date.now()
            });
          }
        });
      }
    }
  });

  // Debug: Force clear everything
  app.post('/debug/force-clear', (req, res) => {
    console.log('🚨 DEBUG: Force clearing all data...');
    
    // Clear in-memory data
    messageStore.clear();
    analyticsData.roomActivity.clear();
    rooms.clear();
    roomCodes.clear();
    activityLog.length = 0;
    
    // Reset analytics
    analyticsData.totalMessages = 0;
    analyticsData.messagesPerMinute = 0;
    analyticsData.messageHistory = [];
    
    // Notify all clients
    io.emit('force-refresh', { message: 'Data cleared, please refresh' });
    
    res.json({ success: true, message: 'All data cleared', timestamp: Date.now() });
  });
}

app.get('/', (req, res) => {
  res.json({
    service: 'PeddleNet Universal Signaling Server',
    version: '3.0.0-analytics-enhanced',
    status: 'running',
    environment: NODE_ENV,
    platform: PLATFORM,
    mode: isDevelopment ? 'development' : isStaging ? 'staging' : 'production',
    description: 'Universal WebRTC signaling server with comprehensive analytics and admin controls',
    features: ['cors-headers', 'cloud-run-optimization', 'polling-first-transport', 'keep-alive-strategy', 'sqlite-persistence', 'real-time-analytics', 'admin-dashboard'],
    endpoints: {
      health: '/health',
      cloudRunHealth: '/_ah/health',
      signaling: '/socket.io/',
      analytics: '/admin/analytics',
      activity: '/admin/activity',
      export: '/admin/export',
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

// Enhanced Socket.IO connection handling with better error tracking
io.engine.on('connection_error', (err) => {
  connectionStats.corsRejections++;
  console.error('🚨 Socket.IO connection error:', {
    message: err.message,
    code: err.code,
    context: err.context,
    type: err.type,
    origin: err.req?.headers?.origin,
    userAgent: err.req?.headers['user-agent']?.substring(0, 100)
  });
});

// Socket.IO connection handling with analytics
io.on('connection', (socket) => {
  connectionStats.currentConnections++;
  connectionStats.totalConnections++;
  connectionStats.peakConnections = Math.max(
    connectionStats.peakConnections, 
    connectionStats.currentConnections
  );

  devLog(`🔗 Client connected: ${socket.id} (${connectionStats.currentConnections} active)`);
  devLog(`🔗 Connection transport: ${socket.conn?.transport?.name || 'unknown'}`);
  devLog(`📊 Current breakdown: Total=${connectionStats.currentConnections}, Admin=${adminConnections.size}, Users=${connectionStats.currentConnections - adminConnections.size}`);

  // Store user data
  socket.userData = null;

  // Enhanced health ping for connection monitoring
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
    socket.isAdmin = true; // Mark this socket as admin
    
    devLog(`🛡️ Admin client connected: ${socket.id} (Admin connections: ${adminConnections.size})`);
    devLog(`📊 Connection breakdown: Total=${connectionStats.currentConnections}, Admin=${adminConnections.size}, Users=${connectionStats.currentConnections - adminConnections.size}`);
    
    // Send initial dashboard data
    generateComprehensiveDashboardData().then(data => {
      socket.emit('dashboard-data', data);
    });
    
    logActivity('admin-action', {
      action: 'admin-connected',
      socketId: socket.id,
      totalAdmins: adminConnections.size
    });
  });

  // Join room with enhanced analytics
  socket.on('join-room', ({ roomId, peerId, displayName }) => {
    devLog(`👥 ${displayName} (${peerId}) joining room: ${roomId}`);
    
    // Auto-register deterministic room code if not already registered
    if (roomId && !roomCodes.has(generateRoomCodeOnServer(roomId)?.toLowerCase())) {
      try {
        const autoCode = generateRoomCodeOnServer(roomId);
        if (autoCode) {
          roomCodes.set(autoCode.toLowerCase(), roomId);
          devLog(`📋 Auto-registered room code: ${autoCode} -> ${roomId}`);
        }
      } catch (error) {
        // Ignore auto-registration errors
      }
    }
    
    socket.join(roomId);
    socket.userData = { roomId, peerId, displayName, joinedAt: Date.now() };
    
    // Initialize room if it doesn't exist
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Map());
      logActivity('room-created', { roomId, creator: displayName });
    }
    
    const roomPeers = rooms.get(roomId);
    
    // Remove any existing connections for this peer ID (deduplication)
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
    
    // Update room analytics
    if (!analyticsData.roomActivity.has(roomId)) {
      analyticsData.roomActivity.set(roomId, {
        messages: 0,
        users: new Set(),
        lastActivity: Date.now(),
        created: Date.now()
      });
    }
    
    const roomStats = analyticsData.roomActivity.get(roomId);
    roomStats.users.add(peerId);
    roomStats.lastActivity = Date.now();
    
    // Store user session in database (safe)
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
    
    // Send recent message history for "lost & found" scenario (safe)
    safeDbAll(
      'SELECT * FROM messages WHERE room_id = ? AND timestamp > ? ORDER BY timestamp ASC LIMIT 50',
      [roomId, Date.now() - (24 * 60 * 60 * 1000)], // Last 24 hours
      (err, rows) => {
        if (!err && rows && rows.length > 0) {
          socket.emit('room-history', {
            roomId,
            messages: rows,
            historyCount: rows.length
          });
        }
      }
    );
    
    logActivity('user-joined', { roomId, peerId, displayName });
    
    // Log the updated user count calculation
    const actualActiveUsers = Array.from(rooms.values()).reduce((total, roomPeers) => total + roomPeers.size, 0);
    devLog(`👥 Updated active users: ${actualActiveUsers} (counting actual room participants)`);
    devLog(`📊 Room ${roomId} now has ${roomPeers.size} peers`);
    
    // Broadcast updated user count to admins
    io.to('admin-channel').emit('user-count-update', {
      activeUsers: actualActiveUsers,
      activeRooms: rooms.size,
      timestamp: Date.now()
    });
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

  // Enhanced chat message handling with persistence and analytics
  socket.on('chat-message', ({ roomId, message, type = 'chat' }) => {
    devLog(`💬 Chat message from ${socket.id} in room ${roomId}:`, message);
    
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
      
      // Store message in database for persistence (safe)
      safeDbRun(
        'INSERT INTO messages (id, room_id, sender, content, timestamp, type) VALUES (?, ?, ?, ?, ?, ?)',
        [enhancedMessage.id, roomId, enhancedMessage.sender, enhancedMessage.content, enhancedMessage.timestamp, type],
        (err) => {
          if (err) {
            console.error('❌ Failed to store message:', err.message);
          }
        }
      );
      
      // Store in memory for real-time access
      if (!messageStore.has(roomId)) {
        messageStore.set(roomId, []);
      }
      const roomMessages = messageStore.get(roomId);
      roomMessages.push(enhancedMessage);
      
      // Keep only recent messages in memory (last 100)
      if (roomMessages.length > 100) {
        roomMessages.splice(0, roomMessages.length - 100);
      }
      
      // Update analytics
      updateMessageAnalytics(roomId);
      
      // Broadcast to room
      devLog(`🔥 Broadcasting message to ALL users in room ${roomId} (including sender)`);
      io.to(roomId).emit('chat-message', enhancedMessage);
      
      // Send delivery confirmation back to sender
      socket.emit('message-delivered', {
        messageId: enhancedMessage.id,
        timestamp: Date.now()
      });
      
      // ALSO broadcast to background notification subscribers for this room
      const subscribers = notificationSubscribers.get(roomId);
      if (subscribers && subscribers.size > 0) {
        devLog(`🔔 Broadcasting to ${subscribers.size} notification subscribers for room ${roomId}`);
        subscribers.forEach(subscriberSocketId => {
          const subscriberSocket = io.sockets.sockets.get(subscriberSocketId);
          if (subscriberSocket && subscriberSocket.id !== socket.id) {
            subscriberSocket.emit('chat-message', {
              ...enhancedMessage,
              isBackgroundNotification: true
            });
          }
        });
      }
      
      logActivity('message-sent', {
        roomId,
        sender: socket.userData.displayName,
        length: message.content.length
      });
      
      devLog(`✅ Message delivered to room ${roomId} INCLUDING SENDER`);
    } else {
      devLog(`⚠️ User ${socket.id} tried to send message to room ${roomId} but is not in that room`);
      socket.emit('error', {
        message: 'You are not in the specified room',
        code: 'NOT_IN_ROOM'
      });
    }
  });

  // Handle background notification subscriptions
  socket.on('subscribe-notifications', ({ roomId, displayName }) => {
    devLog(`🔔 ${displayName} subscribing to notifications for room: ${roomId}`);
    
    // Initialize notification subscribers for this room if it doesn't exist
    if (!notificationSubscribers.has(roomId)) {
      notificationSubscribers.set(roomId, new Set());
    }
    
    // Add this socket to the notification subscribers
    const subscribers = notificationSubscribers.get(roomId);
    subscribers.add(socket.id);
    
    // Store notification subscription info on socket
    if (!socket.notificationSubscriptions) {
      socket.notificationSubscriptions = new Set();
    }
    socket.notificationSubscriptions.add(roomId);
    
    devLog(`🔔 Socket ${socket.id} now subscribed to notifications for ${roomId}`);
    
    // Send confirmation
    socket.emit('subscription-confirmed', {
      roomId,
      success: true,
      timestamp: Date.now()
    });
  });

  // Handle background notification unsubscriptions
  socket.on('unsubscribe-notifications', ({ roomId }) => {
    devLog(`🔕 Unsubscribing from notifications for room: ${roomId}`);
    
    // Remove from notification subscribers
    const subscribers = notificationSubscribers.get(roomId);
    if (subscribers) {
      subscribers.delete(socket.id);
      
      // Clean up empty subscriber sets
      if (subscribers.size === 0) {
        notificationSubscribers.delete(roomId);
        devLog(`🗑️ Removed empty notification subscriber set for room ${roomId}`);
      }
    }
    
    // Remove from socket's subscription list
    if (socket.notificationSubscriptions) {
      socket.notificationSubscriptions.delete(roomId);
    }
    
    devLog(`🔕 Socket ${socket.id} unsubscribed from notifications for ${roomId}`);
    
    // Send confirmation
    socket.emit('unsubscription-confirmed', {
      roomId,
      success: true,
      timestamp: Date.now()
    });
  });

  // Handle disconnect with session cleanup
  socket.on('disconnect', (reason) => {
    connectionStats.currentConnections--;
    devLog(`🔌 Client disconnected: ${socket.id} (${connectionStats.currentConnections} active, reason: ${reason})`);
    
    // Track cold start disconnections
    if (reason === 'transport close' || reason === 'ping timeout') {
      connectionStats.coldStarts++;
      devLog(`❄️ Cold start disconnect detected (${connectionStats.coldStarts} total)`);
    }
    
    // Clean up admin connections
    if (socket.isAdmin && adminConnections.has(socket.id)) {
      adminConnections.delete(socket.id);
      devLog(`🛡️ Admin client disconnected: ${socket.id} (Admin connections: ${adminConnections.size})`);
    }
    
    // Clean up notification subscriptions for this socket
    if (socket.notificationSubscriptions) {
      socket.notificationSubscriptions.forEach(roomId => {
        const subscribers = notificationSubscribers.get(roomId);
        if (subscribers) {
          subscribers.delete(socket.id);
          if (subscribers.size === 0) {
            notificationSubscribers.delete(roomId);
            devLog(`🗑️ Cleaned up empty notification subscribers for room ${roomId}`);
          }
        }
      });
    }
    
    if (socket.userData) {
      const { roomId, peerId, displayName, joinedAt } = socket.userData;
      
      // Update user session in database (safe)
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
          logActivity('room-deleted', { roomId });
          devLog(`🗑️ Room ${roomId} deleted (empty)`);
        }
        
        // Log the updated user count calculation
        const actualActiveUsers = Array.from(rooms.values()).reduce((total, roomPeers) => total + roomPeers.size, 0);
        devLog(`👥 Updated active users: ${actualActiveUsers} (counting actual room participants)`);
        
        // Broadcast updated user count to admins
        io.to('admin-channel').emit('user-count-update', {
          activeUsers: actualActiveUsers,
          activeRooms: rooms.size,
          timestamp: Date.now()
        });
      }
      
      logActivity('user-left', { roomId, peerId, displayName, duration: sessionDuration });
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

// Cleanup empty rooms periodically
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
}, 30 * 60 * 1000); // Every 30 minutes

// Initialize database and start server
async function startServer() {
  try {
    // Initialize database first
    await initializeDatabase();
    
    // Setup cleanup after successful initialization
    await setupDatabaseCleanup();
    
    // Log server start
    logActivity('server-start', {
      environment: NODE_ENV,
      platform: PLATFORM,
      timestamp: Date.now()
    });

    // Start server
    const PORT = process.env.PORT || 3001;
    server.listen(PORT, '0.0.0.0', () => {
      devLog(`🎵 PeddleNet Universal Server v3.0.0-analytics-enhanced running on port ${PORT}`);
      devLog(`🔍 Health check: http://localhost:${PORT}/health`);
      devLog(`🔧 Cloud Run health: http://localhost:${PORT}/_ah/health`);
      devLog(`📊 Analytics dashboard: http://localhost:${PORT}/admin/analytics`);
      devLog(`🔔 Features: SQLite persistence + Real-time analytics + Admin controls`);
      devLog(`🎯 NEW: Message persistence for "lost & found" + Comprehensive dashboard data`);
      
      if (isDevelopment) {
        devLog(`🐛 Debug endpoint: http://localhost:${PORT}/debug/rooms`);
        
        // Show mobile access URLs in development
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

// 🚨 FIXED: Graceful shutdown handling - prevent multiple listeners
let isShuttingDown = false;

function gracefulShutdown(signal) {
  if (isShuttingDown) {
    console.log(`${signal} already in progress, ignoring...`);
    return;
  }
  
  isShuttingDown = true;
  console.log(`${signal} received, shutting down gracefully`);
  
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
  
  // Close Socket.IO connections first
  if (io) {
    io.close(() => {
      console.log('Socket.IO connections closed');
      
      // Then close HTTP server
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });
  } else {
    // Fallback if io not initialized
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  }
  
  // Force exit after 5 seconds if graceful shutdown fails
  setTimeout(() => {
    console.log('Force shutdown after timeout');
    process.exit(1);
  }, 5000);
}

// Only register signal handlers once to prevent MaxListenersExceededWarning
process.once('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.once('SIGINT', () => gracefulShutdown('SIGINT'));

// Start the server
startServer();

module.exports = { app, server, io, db };
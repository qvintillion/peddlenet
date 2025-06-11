// signaling-server-sqlite-enhanced.js - SQLite + Enhanced Connection Stability
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const os = require('os');
const MessagePersistence = require('./sqlite-persistence');

// Initialize persistence
const persistence = new MessagePersistence();

// Add startup logging
console.log('🎪 Festival Chat Server Starting...');
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Platform:', process.env.PLATFORM || 'local');
console.log('Port:', process.env.PORT || 3001);
console.log('🔧 Enhanced Stability + SQLite Persistence: v2.2.0-enhanced');

// Get all local IP addresses for CORS
function getLocalIPs() {
  const interfaces = os.networkInterfaces();
  const ips = ['http://localhost:3000'];
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push(`http://${iface.address}:3000`);
        ips.push(`https://${iface.address}:3000`);
      }
    }
  }
  
  return ips;
}

const app = express();
const server = createServer(app);
const localIPs = getLocalIPs();

console.log('🌐 Allowing CORS for:', localIPs);

// Enhanced Socket.IO configuration for maximum stability + SQLite features
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://localhost:3000",
      ...localIPs,
      "https://*.ngrok.io",
      "https://*.ngrok-free.app",
      /^https:\/\/[a-zA-Z0-9-]+\.ngrok(-free)?\.app$/,
      /^https:\/\/[a-zA-Z0-9-]+\.ngrok\.io$/,
      /^http:\/\/192\.168\.[0-9]+\.[0-9]+:3000$/,
      /^http:\/\/10\.[0-9]+\.[0-9]+\.[0-9]+:3000$/,
      /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.[0-9]+\.[0-9]+:3000$/,
      "https://peddlenet.app",
      "https://*.vercel.app",
      "https://festival-chat-peddlenet.web.app",
      "https://*.firebaseapp.com",
      "https://*.web.app"
    ],
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["*"]
  },
  
  // ** ENHANCED STABILITY: Mobile-optimized transport configuration **
  transports: ['polling', 'websocket'], // Polling first for reliability
  
  // Enhanced ping/pong for mobile stability
  pingTimeout: 30000,           // 30s before considering connection dead (vs 60s)
  pingInterval: 15000,          // Ping every 15s (vs 25s) for better mobile detection
  upgradeTimeout: 20000,        // 20s to upgrade (vs 30s)
  
  // Enhanced connection handling
  allowUpgrades: true,          // Allow WebSocket upgrades
  rememberUpgrade: false,       // Don't remember upgrades (mobile networks change)
  perMessageDeflate: true,      // WebSocket compression
  httpCompression: true,        // Enable compression
  
  // ** CONNECTION STATE RECOVERY - Key for mobile **
  connectionStateRecovery: {
    maxDisconnectionDuration: 3 * 60 * 1000, // 3 minutes (increased from 2)
    skipMiddlewares: true,
  },
  
  // Connection quality improvements  
  maxHttpBufferSize: 1e6,       // 1MB buffer for message bursts
  connectTimeout: 20000,        // 20s connection timeout (adaptive)
  
  // Enhanced polling configuration for mobile reliability
  polling: {
    maxHttpBufferSize: 1e6      // 1MB polling buffer
  },
  
  // WebSocket-specific optimizations
  websocket: {
    compression: true,          // Enable compression for efficiency
    perMessageDeflate: true
  }
});

// ** BACKGROUND NOTIFICATION SUBSCRIPTIONS **
const notificationSubscriptions = new Map(); // socketId -> Set<roomIds>
const roomNotificationSubscribers = new Map(); // roomId -> Set<socketIds>

// ** CORE DATA STRUCTURES **
const connections = new Map(); // socketId -> enhanced connection info
const rooms = new Map(); // roomId -> { peers: Map<socketId, peerInfo>, created: timestamp }

// Track notification subscriptions
function addNotificationSubscription(socketId, roomId) {
  if (!notificationSubscriptions.has(socketId)) {
    notificationSubscriptions.set(socketId, new Set());
  }
  notificationSubscriptions.get(socketId).add(roomId);
  
  if (!roomNotificationSubscribers.has(roomId)) {
    roomNotificationSubscribers.set(roomId, new Set());
  }
  roomNotificationSubscribers.get(roomId).add(socketId);
  
  console.log(`🔔 Added notification subscription: ${socketId} -> ${roomId}`);
}

function removeNotificationSubscription(socketId, roomId) {
  if (notificationSubscriptions.has(socketId)) {
    notificationSubscriptions.get(socketId).delete(roomId);
    if (notificationSubscriptions.get(socketId).size === 0) {
      notificationSubscriptions.delete(socketId);
    }
  }
  
  if (roomNotificationSubscribers.has(roomId)) {
    roomNotificationSubscribers.get(roomId).delete(socketId);
    if (roomNotificationSubscribers.get(roomId).size === 0) {
      roomNotificationSubscribers.delete(roomId);
    }
  }
  
  console.log(`🔔 Removed notification subscription: ${socketId} -> ${roomId}`);
}

function cleanupNotificationSubscriptions(socketId) {
  if (notificationSubscriptions.has(socketId)) {
    const subscribedRooms = notificationSubscriptions.get(socketId);
    subscribedRooms.forEach(roomId => {
      removeNotificationSubscription(socketId, roomId);
    });
  }
}

function sendNotificationToSubscribers(roomId, message, excludeSocketId = null) {
  const subscribers = roomNotificationSubscribers.get(roomId);
  if (!subscribers || subscribers.size === 0) return;
  
  console.log(`🔔 Sending notification to ${subscribers.size} subscribers for room: ${roomId}`);
  
  subscribers.forEach(socketId => {
    if (socketId !== excludeSocketId) {
      const socket = io.sockets.sockets.get(socketId);
      if (socket) {
        // Check if the subscriber is not currently in this room
        const isCurrentlyInRoom = socket.rooms.has(roomId);
        if (!isCurrentlyInRoom) {
          console.log(`🔔 Sending background notification to ${socketId} for room ${roomId}`);
          socket.emit('chat-message', {
            ...message,
            roomId: roomId,
            isBackgroundNotification: true
          });
        } else {
          console.log(`🔔 Skipping notification to ${socketId} - currently in room ${roomId}`);
        }
      } else {
        // Clean up stale subscription
        removeNotificationSubscription(socketId, roomId);
      }
    }
  });
}
const connectionStats = {
  totalConnections: 0,
  currentConnections: 0,
  peakConnections: 0,
  reconnections: 0,
  timeouts: 0,
  transportCloses: 0,
  startTime: Date.now()
};

// ** ENHANCED HEALTH MONITORING SYSTEM **
const healthMonitor = {
  checkInterval: 30000, // 30 seconds
  connectionChecks: new Map(),
  
  startMonitoring() {
    setInterval(() => {
      this.performHealthChecks();
    }, this.checkInterval);
    
    console.log('🏥 Enhanced health monitoring started - checking every 30s');
  },
  
  performHealthChecks() {
    const now = Date.now();
    let staleConnections = 0;
    let unhealthyConnections = 0;
    
    // Check all tracked connections
    for (const [socketId, connInfo] of connections.entries()) {
      const socket = io.sockets.sockets.get(socketId);
      
      if (!socket) {
        // Socket doesn't exist anymore, clean up
        connections.delete(socketId);
        continue;
      }
      
      // Check if connection is stale (no activity for 2 minutes)
      const timeSinceActivity = now - connInfo.lastActivity;
      if (timeSinceActivity > 120000) { // 2 minutes
        staleConnections++;
        console.log(`🔍 Stale connection detected: ${socketId} (${Math.round(timeSinceActivity/1000)}s inactive)`);
        
        // Send ping to check if connection is alive
        socket.emit('health-ping', { timestamp: now });
        connInfo.lastHealthCheck = now;
      }
      
      // Check if connection missed multiple health checks
      if (connInfo.lastHealthCheck && (now - connInfo.lastHealthCheck) > 90000) { // 90s
        unhealthyConnections++;
        console.log(`⚠️ Unhealthy connection: ${socketId} - forcing reconnection`);
        socket.disconnect(true);
      }
    }
    
    if (staleConnections > 0 || unhealthyConnections > 0) {
      console.log(`🏥 Health check: ${staleConnections} stale, ${unhealthyConnections} unhealthy connections`);
    }
  },
  
  recordActivity(socketId) {
    const connInfo = connections.get(socketId);
    if (connInfo) {
      connInfo.lastActivity = Date.now();
    }
  }
};

// Start enhanced health monitoring
healthMonitor.startMonitoring();

// Enhanced connection throttling (keep SQLite version but with better tracking)
const connectionAttempts = new Map(); // IP -> { count: number, lastAttempt: number, blocked: boolean }
const CONNECTION_LIMIT = 15; // Increased from 5 to 15 for mobile compatibility
const CONNECTION_WINDOW = 60000; // 1 minute window
const THROTTLE_DURATION = 10000; // Reduced from 30s to 10s for faster recovery

// Initialize database
async function initializeDatabase() {
  try {
    await persistence.initialize();
    console.log('✅ Database ready for message persistence');
    
    // Schedule cleanup every hour
    setInterval(async () => {
      try {
        await persistence.cleanupOldData(24); // Clean data older than 24 hours
      } catch (err) {
        console.error('Cleanup error:', err);
      }
    }, 60 * 60 * 1000);
    
  } catch (err) {
    console.error('❌ Database initialization failed:', err);
    console.log('⚠️  Falling back to memory-only mode');
  }
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Root endpoint for service info
app.get('/', (req, res) => {
  res.json({
    service: 'PeddleNet Enhanced Signaling Server',
    version: '2.2.0-enhanced',
    status: 'running',
    description: 'Enhanced WebRTC signaling server with SQLite persistence and mobile optimization',
    enhancements: [
      'Connection state recovery',
      'Active health monitoring',
      'SQLite message persistence', 
      'Room code system',
      'Transport optimization',
      'Enhanced connection tracking'
    ],
    endpoints: {
      health: '/health',
      stability: '/stability',
      registerCode: '/register-room-code',
      resolveCode: '/resolve-room-code/:code',
      debugRooms: '/debug/rooms'
    },
    websocket: {
      available: true,
      transports: ['polling', 'websocket']
    },
    timestamp: Date.now()
  });
});

// ** ENHANCED HEALTH CHECK with SQLite stats **
app.get('/health', async (req, res) => {
  let dbStats = null;
  try {
    dbStats = await persistence.getStats();
  } catch (err) {
    console.warn('Could not fetch database stats:', err);
  }

  const memUsage = process.memoryUsage();
  const uptime = process.uptime();
  
  res.json({ 
    status: 'ok',
    timestamp: Date.now(),
    uptime: Math.round(uptime),
    uptimeHuman: formatUptime(uptime),
    version: '2.2.0-enhanced', // Enhanced version
    
    // Enhanced connection metrics
    connections: {
      current: connectionStats.currentConnections,
      peak: connectionStats.peakConnections,
      total: connectionStats.totalConnections,
      reconnections: connectionStats.reconnections,
      timeouts: connectionStats.timeouts,
      transportCloses: connectionStats.transportCloses,
      rooms: rooms.size,
      totalUsers: Array.from(rooms.values()).reduce((sum, room) => sum + room.peers.size, 0),
      socketIOConnections: io.engine.clientsCount || 0
    },
    
    // Connection throttling metrics (from SQLite version)
    throttling: {
      activeIPs: connectionAttempts.size,
      blockedIPs: Array.from(connectionAttempts.values()).filter(a => a.blocked).length,
      totalAttempts: Array.from(connectionAttempts.values()).reduce((sum, a) => sum + a.count, 0)
    },
    
    // Enhanced memory and performance
    memory: {
      used: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
      total: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
      rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB',
      external: Math.round(memUsage.external / 1024 / 1024) + 'MB'
    },
    
    // Enhanced performance monitoring
    performance: {
      eventLoopUtilization: require('perf_hooks').performance.eventLoopUtilization?.() || 'N/A',
      gcCount: global.gc ? 'Available' : 'Not Available'
    },
    
    // Enhanced transport configuration info
    transport: {
      transports: ['polling', 'websocket'],
      upgradeTimeout: '20s',
      pingInterval: '15s',
      pingTimeout: '30s',
      compression: true,
      connectionStateRecovery: '3min'
    },
    
    database: dbStats || { error: 'Database unavailable' }
  });
});

// ** NEW: Enhanced stability metrics endpoint **
app.get('/stability', (req, res) => {
  const connectionDetails = Array.from(connections.entries()).map(([socketId, info]) => ({
    id: socketId.substring(0, 8) + '...',
    connectedAt: info.connectedAt,
    lastActivity: info.lastActivity,
    reconnectCount: info.reconnectCount,
    transportUpgrades: info.transportUpgrades,
    roomId: info.roomId ? info.roomId.substring(0, 12) + '...' : null,
    healthChecks: info.healthChecks
  }));
  
  res.json({
    version: '2.2.0-enhanced',
    totalConnections: connections.size,
    connectionDetails,
    stats: connectionStats,
    healthChecks: {
      lastCheck: Date.now() - 30000,
      intervalMs: healthMonitor.checkInterval,
      staleThreshold: '2min',
      unhealthyThreshold: '90s'
    },
    cleanup: {
      roomCleanupInterval: '5min',
      connectionCleanupInterval: '30s'
    }
  });
});

// Keep all SQLite room code functionality
const roomCodes = new Map(); // code -> { roomId, timestamp, hits }
const roomCodesByRoomId = new Map(); // roomId -> Set of codes for faster lookup

// Enhanced room code registration with better tracking (keep SQLite version)
app.post('/register-room-code', async (req, res) => {
  try {
    const { roomId, roomCode } = req.body;
    
    if (!roomId || !roomCode) {
      return res.status(400).json({ success: false, error: 'Missing roomId or roomCode' });
    }
    
    const normalizedCode = roomCode.toLowerCase();
    
    // Store the enhanced mapping
    const codeData = {
      roomId,
      timestamp: Date.now(),
      hits: 0,
      auto: false // Manually registered
    };
    
    roomCodes.set(normalizedCode, codeData);
    
    // Update reverse mapping
    if (!roomCodesByRoomId.has(roomId)) {
      roomCodesByRoomId.set(roomId, new Set());
    }
    roomCodesByRoomId.get(roomId).add(normalizedCode);
    
    console.log(`📋 Room code registered: ${roomCode} -> ${roomId}`);
    
    res.json({ success: true, roomCode, roomId });
  } catch (error) {
    console.error('Error registering room code:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Enhanced room code resolution (keep SQLite version)
app.get('/resolve-room-code/:code', async (req, res) => {
  try {
    const code = req.params.code.toLowerCase();
    const codeData = roomCodes.get(code);
    
    if (codeData) {
      // Update hit counter
      codeData.hits++;
      codeData.lastAccessed = Date.now();
      
      console.log(`🔍 Room code resolved: ${code} -> ${codeData.roomId} (${codeData.hits} hits)`);
      res.json({ success: true, roomId: codeData.roomId, roomCode: code });
      return;
    }
    
    // Enhanced fallback: Try to auto-generate deterministic room codes
    console.log(`❌ Room code not found in memory: ${code}`);
    console.log(`🧮 Server has ${roomCodes.size} room codes in memory`);
    
    // Try common room ID patterns that could generate this code
    const possibleRoomIds = generatePossibleRoomIds(code);
    console.log(`🔎 Trying ${possibleRoomIds.length} possible room IDs for code: ${code}`);
    
    for (const possibleRoomId of possibleRoomIds) {
      try {
        const testCode = generateRoomCodeOnServer(possibleRoomId);
        if (testCode && testCode.toLowerCase() === code) {
          console.log(`✨ Auto-resolved room code: ${code} -> ${possibleRoomId}`);
          
          // Auto-register this mapping for future use
          const autoCodeData = {
            roomId: possibleRoomId,
            timestamp: Date.now(),
            hits: 1,
            auto: true // Auto-generated
          };
          
          roomCodes.set(code, autoCodeData);
          
          if (!roomCodesByRoomId.has(possibleRoomId)) {
            roomCodesByRoomId.set(possibleRoomId, new Set());
          }
          roomCodesByRoomId.get(possibleRoomId).add(code);
          
          res.json({ success: true, roomId: possibleRoomId, roomCode: code, autoResolved: true });
          return;
        }
      } catch (error) {
        // Skip this possibility
        continue;
      }
    }
    
    // Still not found - return 404 with helpful context
    res.status(404).json({ 
      success: false, 
      error: 'Room code not found', 
      code,
      serverMemory: {
        totalCodes: roomCodes.size,
        sampleCodes: Array.from(roomCodes.keys()).slice(0, 3),
        triedPatterns: possibleRoomIds.length
      }
    });
    
  } catch (error) {
    console.error('Error resolving room code:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Helper functions from SQLite version
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

function generatePossibleRoomIds(roomCode) {
  const parts = roomCode.split('-');
  if (parts.length !== 3) return [];
  
  const [adjective, noun, numberStr] = parts;
  
  return [
    roomCode,
    parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('-'),
    parts.join(' '),
    parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' '),
    `${adjective}-${noun}`,
    `${adjective} ${noun}`,
    noun,
    `${adjective}-${noun}-room`,
    `${adjective}-${noun}-chat`,
    `${noun}-${numberStr}`,
    `main-${noun}`,
    `${noun}-main`,
    roomCode.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  ].filter(id => id && id.length > 0);
}

// Enhanced debug endpoint (keep SQLite version)
app.get('/debug/rooms', async (req, res) => {
  try {
    const dbRooms = await persistence.getAllRooms();
    const memoryRooms = Array.from(rooms.entries()).map(([id, room]) => ({
      id,
      peers: room.peers.size,
      created: room.created
    }));
    
    // Room code debugging info
    const roomCodeStats = {
      totalCodes: roomCodes.size,
      codes: Array.from(roomCodes.entries()).map(([code, data]) => ({
        code,
        roomId: data.roomId,
        hits: data.hits,
        auto: data.auto,
        age: Math.round((Date.now() - data.timestamp) / 1000 / 60) + 'm'
      })),
      roomsWithCodes: roomCodesByRoomId.size,
      roomMappings: Array.from(roomCodesByRoomId.entries()).map(([roomId, codes]) => ({
        roomId,
        codes: Array.from(codes)
      }))
    };
    
    res.json({
      database: dbRooms,
      memory: memoryRooms,
      roomCodes: roomCodeStats,
      enhancedConnections: connections.size
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Debug endpoint for room code testing (keep SQLite version)
app.get('/debug/test-code/:roomId', (req, res) => {
  try {
    const roomId = req.params.roomId;
    const generatedCode = generateRoomCodeOnServer(roomId);
    
    res.json({
      roomId,
      generatedCode,
      isRegistered: roomCodes.has(generatedCode?.toLowerCase()),
      hasRoomMapping: roomCodesByRoomId.has(roomId)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ** ENHANCED SOCKET.IO CONNECTION HANDLING **
// Enhanced connection throttling with better tracking
function connectionThrottleMiddleware(socket, next) {
  const clientIP = socket.handshake.headers['x-forwarded-for'] || 
                   socket.handshake.headers['x-real-ip'] || 
                   socket.handshake.address || 
                   'unknown';
  
  const now = Date.now();
  const attempts = connectionAttempts.get(clientIP) || { count: 0, lastAttempt: 0, blocked: false };
  
  // Reset counter if window expired
  if (now - attempts.lastAttempt > CONNECTION_WINDOW) {
    attempts.count = 0;
    attempts.blocked = false;
  }
  
  // Check if currently throttled
  if (attempts.blocked && (now - attempts.lastAttempt) < THROTTLE_DURATION) {
    console.log(`🚫 Enhanced connection throttled for IP: ${clientIP} (${attempts.count} attempts)`);
    return next(new Error('Connection rate limit exceeded'));
  }
  
  // Increment counter
  attempts.count++;
  attempts.lastAttempt = now;
  
  // Block if limit exceeded
  if (attempts.count > CONNECTION_LIMIT) {
    attempts.blocked = true;
    console.log(`⚠️ Enhanced IP ${clientIP} exceeded connection limit (${attempts.count}/${CONNECTION_LIMIT})`);
    connectionAttempts.set(clientIP, attempts);
    return next(new Error('Connection rate limit exceeded'));
  }
  
  connectionAttempts.set(clientIP, attempts);
  next(); // Allow connection
}

// Apply enhanced connection throttling
io.use(connectionThrottleMiddleware);

io.on('connection', (socket) => {
  // ** ENHANCED CONNECTION TRACKING **
  const connectionInfo = {
    connectedAt: Date.now(),
    lastActivity: Date.now(),
    reconnectCount: 0,
    transportUpgrades: 0,
    roomId: null,
    userData: null,
    healthChecks: 0
  };
  
  connections.set(socket.id, connectionInfo);
  
  // Update enhanced stats
  connectionStats.currentConnections++;
  connectionStats.totalConnections++;
  connectionStats.peakConnections = Math.max(
    connectionStats.peakConnections, 
    connectionStats.currentConnections
  );

  console.log(`🔗 Client connected: ${socket.id} (${connectionStats.currentConnections} active)`);

  // ** ENHANCED TRANSPORT MONITORING **
  socket.conn.on('upgrade', () => {
    connectionInfo.transportUpgrades++;
    // Transport upgrade logged for diagnostics
  });

  socket.conn.on('upgradeError', (error) => {
    console.log(`❌ Transport upgrade failed for ${socket.id}:`, error.message);
  });

  // ** ENHANCED HEALTH MONITORING **
  socket.on('health-ping', (data) => {
    healthMonitor.recordActivity(socket.id);
    connectionInfo.healthChecks++;
    socket.emit('health-pong', { 
      timestamp: Date.now(), 
      originalTimestamp: data.timestamp,
      healthChecks: connectionInfo.healthChecks
    });
  });

  // Enhanced ping handler with activity tracking
  socket.on('ping', (data) => {
    healthMonitor.recordActivity(socket.id);
    socket.emit('pong', { 
      timestamp: Date.now(), 
      ...data,
      serverUptime: process.uptime()
    });
  });

  // ** RECONNECTION HANDLING **
  socket.on('reconnect-attempt', (data) => {
    connectionStats.reconnections++;
    connectionInfo.reconnectCount++;
    console.log(`🔄 Enhanced reconnection attempt from ${socket.id}: attempt ${connectionInfo.reconnectCount}`);
  });

  // Add enhanced error handling for socket
  socket.on('error', (error) => {
    console.error('Enhanced socket error:', error);
  });

  // ** ENHANCED DISCONNECT HANDLING **
  socket.on('disconnect', (reason) => {
    connectionStats.currentConnections--;
    
    // Track disconnect reasons for analytics
    if (reason === 'transport close') {
      connectionStats.transportCloses++;
    } else if (reason.includes('timeout')) {
      connectionStats.timeouts++;
    }
    
    console.log(`🔌 Client disconnected: ${socket.id} (${connectionStats.currentConnections} active, reason: ${reason})`);
    
    // Clean up enhanced connection tracking
    connections.delete(socket.id);
    
    // Clean up notification subscriptions
    cleanupNotificationSubscriptions(socket.id);
    
    if (socket.userData) {
      const { roomId, peerId, displayName } = socket.userData;
      
      // Remove from room with enhanced cleanup
      if (rooms.has(roomId)) {
        const room = rooms.get(roomId);
        room.peers.delete(socket.id);
        
        // Update participant count in database (with error handling)
        persistence.updateParticipantCount(roomId, room.peers.size)
          .catch(err => console.error('Error updating participant count on disconnect:', err));
        
        // Simplified peer left notification
        socket.to(roomId).emit('peer-left', {
          peerId,
          displayName
        });
        console.log(`👥 ${displayName} left room ${roomId}`);
        
        console.log(`📊 Enhanced room ${roomId} now has ${room.peers.size} peers`);
      }
    }
  });

  // Enhanced join room with both database persistence AND connection recovery
  socket.on('join-room', async ({ roomId, peerId, displayName }) => {
    console.log(`👥 ${displayName} joining room: ${roomId}`);
    
    // Record activity for health monitoring
    healthMonitor.recordActivity(socket.id);
    
    // Check if this is a reconnection to the same room
    const isReconnection = connectionInfo.roomId === roomId;
    if (isReconnection) {
      console.log(`🔄 ${displayName} reconnecting to room ${roomId}`);
    }
    
    // Auto-register deterministic room code if not already registered
    if (roomId && !roomCodesByRoomId.has(roomId)) {
      try {
        const autoCode = generateRoomCodeOnServer(roomId);
        if (autoCode) {
          const autoCodeData = {
            roomId,
            timestamp: Date.now(),
            hits: 0,
            auto: true // Auto-generated on join
          };
          
          roomCodes.set(autoCode.toLowerCase(), autoCodeData);
          roomCodesByRoomId.set(roomId, new Set([autoCode.toLowerCase()]));
          
          console.log(`🤖 Auto-registered room code: ${autoCode}`);
        }
      } catch (error) {
        console.warn('Failed to auto-register room code for', roomId, error);
      }
    }
    
    try {
      // Enhanced room cleanup - leave previous rooms
      socket.rooms.forEach(room => {
        if (room !== socket.id && rooms.has(room)) {
          const oldRoom = rooms.get(room);
          if (oldRoom && oldRoom.peers.has(socket.id)) {
            const oldPeer = oldRoom.peers.get(socket.id);
            oldRoom.peers.delete(socket.id);
            socket.leave(room);
            socket.to(room).emit('peer-left', {
              peerId: oldPeer.peerId,
              displayName: oldPeer.displayName,
              socketId: socket.id
            });
            
            // Update participant count in database
            persistence.updateParticipantCount(room, oldRoom.peers.size).catch(console.error);
            console.log(`🚪 Enhanced cleanup: ${oldPeer.displayName} left room ${room}`);
          }
        }
      });
      
      // Join the new room
      socket.join(roomId);
      
      // Update enhanced connection info
      connectionInfo.roomId = roomId;
      connectionInfo.userData = { 
        roomId, 
        peerId, 
        displayName, 
        joinedAt: Date.now(),
        lastSeen: Date.now(),
        isReconnection
      };
      
      // Store enhanced user info
      socket.userData = connectionInfo.userData;
      
      // Initialize room if it doesn't exist
      if (!rooms.has(roomId)) {
        rooms.set(roomId, {
          peers: new Map(),
          created: Date.now()
        });
      }
      
      const room = rooms.get(roomId);
      
      // Remove any existing connections for this peer ID (enhanced deduplication)
      let removedOldConnections = 0;
      for (const [socketId, peer] of room.peers.entries()) {
        if (peer.peerId === peerId && socketId !== socket.id) {
          console.log(`🔄 Enhanced: Removing duplicate connection for peer ${peerId}: ${socketId}`);
          room.peers.delete(socketId);
          const oldSocket = io.sockets.sockets.get(socketId);
          if (oldSocket) {
            oldSocket.disconnect(true);
          }
          removedOldConnections++;
        }
      }
      
      // Add this connection with enhanced metadata
      room.peers.set(socket.id, { 
        peerId, 
        displayName, 
        joinedAt: Date.now(),
        socketId: socket.id,
        reconnectCount: connectionInfo.reconnectCount
      });
      
      // Update participant count in database
      await persistence.updateParticipantCount(roomId, room.peers.size);
      
      // Load and send message history from database (SQLite feature)
      try {
        const messageHistory = await persistence.getRoomMessages(roomId, 100);
        if (messageHistory.length > 0) {
          socket.emit('message-history', messageHistory);
        }
      } catch (err) {
        console.error('Error loading message history:', err);
      }
      
      // Simplified peer notifications - less verbose
      if (removedOldConnections === 0 && !isReconnection) {
        socket.to(roomId).emit('peer-joined', {
          peerId,
          displayName
        });
        console.log(`👥 ${displayName} joined room ${roomId}`);
      }
      
      // Send current peers to new/reconnecting user
      const uniquePeers = Array.from(room.peers.values())
        .filter(peer => peer.peerId !== peerId)
        .reduce((acc, peer) => {
          const existing = acc.find(p => p.peerId === peer.peerId);
          if (!existing) acc.push(peer);
          return acc;
        }, []);
      
      // Fix: Send the peers array directly, not wrapped in an object
      socket.emit('room-peers', uniquePeers);
      
      const totalUniquePeers = new Set(Array.from(room.peers.values()).map(p => p.peerId)).size;
      console.log(`📊 Enhanced room ${roomId}: ${room.peers.size} connections, ${totalUniquePeers} unique peers (${isReconnection ? 'reconnection' : 'new join'})`);
      
    } catch (err) {
      console.error('Enhanced error in join-room:', err);
      socket.emit('error', { 
        message: 'Failed to join room', 
        code: 'JOIN_ROOM_ERROR',
        retryable: true
      });
    }
  });

  // Enhanced chat messages with database persistence
  socket.on('chat-message', async ({ roomId, message }) => {
    healthMonitor.recordActivity(socket.id);
    
    if (!socket.userData || socket.userData.roomId !== roomId) {
      console.warn('Enhanced: Unauthorized message attempt');
      return;
    }

    const room = rooms.get(roomId);
    if (!room) {
      console.warn('Enhanced: Message to non-existent room:', roomId);
      return;
    }

    try {
      // Create message with server timestamp and ID (SQLite feature)
      const chatMessage = {
        id: message.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content: message.content,
        sender: socket.userData.displayName,
        timestamp: Date.now(),
        type: 'chat'
      };

      // Save message to database (SQLite feature)
      await persistence.saveMessage(roomId, chatMessage);

      // Broadcast to all users in room (including sender for confirmation)
      io.to(roomId).emit('chat-message', chatMessage);
      
      // Send notifications to background subscribers (excluding current room members)
      sendNotificationToSubscribers(roomId, chatMessage, socket.id);

      console.log(`💾 Enhanced: Message saved to DB and broadcast in ${roomId} from ${socket.userData.displayName}`);
      
      // Send delivery confirmation (enhanced feature)
      socket.emit('message-delivered', {
        messageId: chatMessage.id,
        timestamp: Date.now()
      });
      
    } catch (err) {
      console.error('Enhanced error handling chat message:', err);
      socket.emit('error', { 
        message: 'Failed to save message',
        code: 'MESSAGE_SEND_ERROR',
        retryable: true
      });
    }
  });
  
  // Background notification subscription handlers
  socket.on('subscribe-notifications', ({ roomId, displayName }) => {
    try {
      if (!roomId || !displayName) {
        console.warn('Invalid notification subscription request:', { roomId, displayName });
        return;
      }
      
      addNotificationSubscription(socket.id, roomId);
      console.log(`🔔 ${displayName} subscribed to notifications for room: ${roomId}`);
      
      socket.emit('subscription-confirmed', {
        roomId,
        success: true,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error subscribing to notifications:', error);
      socket.emit('subscription-error', {
        roomId,
        error: 'Failed to subscribe to notifications'
      });
    }
  });
  
  socket.on('unsubscribe-notifications', ({ roomId }) => {
    try {
      if (!roomId) {
        console.warn('Invalid notification unsubscription request:', { roomId });
        return;
      }
      
      removeNotificationSubscription(socket.id, roomId);
      console.log(`🔔 Socket ${socket.id} unsubscribed from notifications for room: ${roomId}`);
      
      socket.emit('unsubscription-confirmed', {
        roomId,
        success: true,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error unsubscribing from notifications:', error);
      socket.emit('unsubscription-error', {
        roomId,
        error: 'Failed to unsubscribe from notifications'
      });
    }
  });

  // Enhanced peer connection requests
  socket.on('request-connection', ({ targetSocketId, fromPeerId, timeout = 30000 }) => {
    try {
      healthMonitor.recordActivity(socket.id);
      
      const targetSocket = io.sockets.sockets.get(targetSocketId);
      if (!targetSocket) {
        socket.emit('connection-error', {
          targetSocketId,
          error: 'Target peer not found',
          code: 'PEER_NOT_FOUND',
          retryable: false
        });
        return;
      }
      
      socket.to(targetSocketId).emit('connection-request', {
        fromPeerId,
        fromSocketId: socket.id,
        timestamp: Date.now(),
        timeout
      });
      
      // Enhanced timeout handling
      setTimeout(() => {
        socket.emit('connection-timeout', { 
          targetSocketId, 
          fromPeerId,
          reason: 'Request timeout',
          retryable: true
        });
      }, timeout);
      
    } catch (error) {
      console.error('Enhanced error in request-connection:', error);
      socket.emit('error', { 
        message: 'Failed to send connection request', 
        code: 'CONNECTION_REQUEST_ERROR',
        retryable: true
      });
    }
  });

  // Enhanced connection responses
  socket.on('connection-response', ({ targetSocketId, accepted, toPeerId, reason }) => {
    try {
      healthMonitor.recordActivity(socket.id);
      
      socket.to(targetSocketId).emit('connection-response', {
        accepted,
        toPeerId,
        fromSocketId: socket.id,
        reason,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Enhanced error in connection-response:', error);
    }
  });

  // Enhanced room messages
  socket.on('room-message', ({ roomId, message, type = 'announcement' }) => {
    try {
      healthMonitor.recordActivity(socket.id);
      
      if (socket.userData && socket.userData.roomId === roomId) {
        const enhancedMessage = {
          ...message,
          type,
          timestamp: Date.now(),
          fromSocket: socket.id,
          deliveryId: generateDeliveryId()
        };
        
        socket.to(roomId).emit('room-message', enhancedMessage);
        
        // Send delivery confirmation
        socket.emit('message-delivered', {
          deliveryId: enhancedMessage.deliveryId,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('Enhanced error in room-message:', error);
      socket.emit('error', {
        message: 'Failed to send message',
        code: 'MESSAGE_SEND_ERROR',
        retryable: true
      });
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

function generateDeliveryId() {
  return Math.random().toString(36).substring(2, 15);
}

// ** ENHANCED CLEANUP AND MONITORING **
// More aggressive cleanup for mobile connections (enhanced from 10min to 5min)
setInterval(() => {
  const now = Date.now();
  const staleThreshold = 15 * 60 * 1000; // 15 minutes (reduced from 30)
  let cleanedRooms = 0;
  let cleanedPeers = 0;
  
  for (const [roomId, room] of rooms.entries()) {
    // Remove stale peers more aggressively
    for (const [socketId, peer] of room.peers.entries()) {
      const socket = io.sockets.sockets.get(socketId);
      
      // Clean if socket doesn't exist or peer is stale
      if (!socket || (now - peer.joinedAt > staleThreshold)) {
        room.peers.delete(socketId);
        cleanedPeers++;
        console.log(`🧹 Enhanced cleanup: ${socket ? 'stale' : 'orphaned'} peer ${peer.peerId} from room ${roomId}`);
      }
    }
    
    // Remove empty rooms
    if (room.peers.size === 0) {
      rooms.delete(roomId);
      cleanedRooms++;
      console.log(`🧹 Enhanced cleanup: empty room ${roomId}`);
    }
  }
  
  // Clean up enhanced connection tracking
  for (const [socketId, connInfo] of connections.entries()) {
    const socket = io.sockets.sockets.get(socketId);
    if (!socket) {
      connections.delete(socketId);
      console.log(`🧹 Enhanced cleanup: orphaned connection tracking for ${socketId}`);
    }
  }
  
  if (cleanedRooms > 0 || cleanedPeers > 0) {
    console.log(`🧹 Enhanced cleanup completed: ${cleanedPeers} peers, ${cleanedRooms} rooms`);
  }
}, 5 * 60 * 1000); // Every 5 minutes (more frequent)

// Enhanced performance monitoring
setInterval(() => {
  const memUsage = process.memoryUsage();
  const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  
  if (heapUsedMB > 100) { // Alert if using more than 100MB
    console.log(`⚠️ Enhanced: High memory usage: ${heapUsedMB}MB heap, ${connectionStats.currentConnections} connections`);
  }
  
  // Log enhanced connection stats every 10 minutes
  console.log(`📊 Enhanced stats: ${connectionStats.currentConnections} active, ${connectionStats.transportCloses} transport closes, ${connectionStats.reconnections} reconnections`);
}, 10 * 60 * 1000);

// Start enhanced server with port conflict handling
const PORT = process.env.PORT || 3001;

async function startServer() {
  // Initialize database first
  await initializeDatabase();
  
  try {
    await new Promise((resolve, reject) => {
      const serverInstance = server.listen(PORT, '0.0.0.0', () => {
        console.log(`🎵 Enhanced Festival Chat Server v2.2.0 running on port ${PORT}`);
        console.log(`🔍 Health check: http://localhost:${PORT}/health`);
        console.log(`📊 Stability metrics: http://localhost:${PORT}/stability`);
        console.log(`💾 SQLite persistence enabled!`);
        console.log(`🏥 Enhanced health monitoring active - checking every 30 seconds`);
        console.log(`🐛 Debug rooms: http://localhost:${PORT}/debug/rooms`);
        
        // Only show local IPs in development
        if (process.env.NODE_ENV !== 'production') {
          console.log('📱 Mobile-accessible URLs:');
          const interfaces = os.networkInterfaces();
          for (const name of Object.keys(interfaces)) {
            for (const iface of interfaces[name]) {
              if (iface.family === 'IPv4' && !iface.internal) {
                console.log(`  http://${iface.address}:${PORT}`);
              }
            }
          }
        }
        console.log('');
        
        resolve(serverInstance);
      });
      
      serverInstance.on('error', (err) => {
        console.error(`❌ Enhanced server failed to start on port ${PORT}:`, err.message);
        reject(err);
      });
    });
  } catch (err) {
    console.error(`💥 Enhanced server startup failed:`, err.message);
    process.exit(1);
  }
}

// Enhanced graceful shutdown with timeout
let isShuttingDown = false;

async function gracefulShutdown(signal) {
  if (isShuttingDown) {
    console.log('🔄 Enhanced shutdown already in progress...');
    return;
  }
  
  isShuttingDown = true;
  console.log(`📴 Enhanced ${signal} received, shutting down gracefully...`);
  
  // Enhanced shutdown notification
  io.emit('server-shutdown', { 
    message: 'Enhanced server is shutting down for maintenance',
    timestamp: Date.now(),
    reconnectDelay: 5000, // Suggest 5s delay before reconnecting
    version: '2.2.0-enhanced'
  });
  
  // Force exit after 3 seconds if shutdown hangs
  const forceExitTimer = setTimeout(() => {
    console.log('⏰ Enhanced force shutdown - timeout reached');
    process.exit(1);
  }, 3000);
  
  try {
    // Close socket.io first
    console.log('🔌 Enhanced: Closing socket connections...');
    io.close();
    
    // Close database
    console.log('💾 Enhanced: Closing database...');
    await persistence.close();
    
    // Close HTTP server
    console.log('🌐 Enhanced: Closing HTTP server...');
    server.close(() => {
      console.log('✅ Enhanced server shutdown complete');
      clearTimeout(forceExitTimer);
      process.exit(0);
    });
    
    // If server.close() callback doesn't fire, force exit
    setTimeout(() => {
      console.log('⚠️ Enhanced server close timeout, forcing exit');
      clearTimeout(forceExitTimer);
      process.exit(0);
    }, 1000);
    
  } catch (error) {
    console.error('❌ Enhanced shutdown error:', error);
    clearTimeout(forceExitTimer);
    process.exit(1);
  }
}

// Handle various shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGHUP', () => gracefulShutdown('SIGHUP'));

// Handle uncaught exits
process.on('beforeExit', (code) => {
  console.log('👋 Enhanced process about to exit with code:', code);
});

process.on('exit', (code) => {
  console.log('👋 Enhanced process exited with code:', code);
});

// ** CLOUD RUN COLD START PREVENTION **
// Keep server warm with periodic health checks
if (process.env.NODE_ENV === 'production') {
  const keepWarmInterval = 4 * 60 * 1000; // Every 4 minutes
  
  setInterval(async () => {
    try {
      // Self-ping to prevent cold starts
      const response = await fetch(process.env.KEEP_WARM_URL || 'https://peddlenet-websocket-server-padyxgyv5a-uc.a.run.app/health');
      if (response.ok) {
        console.log('🔥 Keep-warm ping successful - preventing cold start');
      } else {
        console.warn('⚠️ Keep-warm ping failed with status:', response.status);
      }
    } catch (error) {
      console.warn('⚠️ Keep-warm ping failed:', error.message);
    }
  }, keepWarmInterval);
  
  console.log('🔥 Cloud Run keep-warm enabled - pinging every 4 minutes');
} else {
  console.log('🔥 Cold start prevention disabled in development');
}

startServer();

// Enhanced error handling to prevent crashes
process.on('uncaughtException', (error) => {
  console.error('Enhanced uncaught Exception:', error);
  console.error('Stack:', error.stack);
  console.error('Enhanced server will continue running...');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Enhanced unhandled Rejection at:', promise, 'reason:', reason);
  console.error('Enhanced server will continue running...');
});

// Handle socket.io errors gracefully
io.engine.on('connection_error', (err) => {
  console.error('Enhanced socket.io connection error:', err.req);
  console.error('Error details:', err.code, err.message, err.context);
});

module.exports = { app, server, io, persistence };
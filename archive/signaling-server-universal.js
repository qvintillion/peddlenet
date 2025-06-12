// signaling-server-universal.js - One Server for All Environments (Dev > Staging > Production)
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const os = require('os');

const app = express();
const server = createServer(app);

// Environment detection
const NODE_ENV = process.env.NODE_ENV || 'development';
const PLATFORM = process.env.PLATFORM || 'local'; // local, firebase, github, cloudrun
const PORT = process.env.PORT || 3001;

console.log('🎪 Festival Chat Universal Server Starting...');
console.log(`📍 Environment: ${NODE_ENV}`);
console.log(`🏗️ Platform: ${PLATFORM}`);
console.log(`🚀 Port: ${PORT}`);

// Environment-specific configuration
const isDev = NODE_ENV === 'development' || PLATFORM === 'local';
const isStaging = PLATFORM === 'firebase' || NODE_ENV === 'staging';
const isProduction = PLATFORM === 'github' || PLATFORM === 'cloudrun' || NODE_ENV === 'production';

console.log(`🎯 Mode: ${isDev ? 'DEVELOPMENT' : isStaging ? 'STAGING' : 'PRODUCTION'}`);

// Get local IPs for development CORS
function getLocalIPs() {
  const interfaces = os.networkInterfaces();
  const ips = ['http://localhost:3000', 'https://localhost:3000'];
  
  if (isDev) {
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          ips.push(`http://${iface.address}:3000`);
          ips.push(`https://${iface.address}:3000`);
          console.log(`📱 DEV: Mobile access available at http://${iface.address}:3000`);
        }
      }
    }
  }
  
  return ips;
}

const localIPs = getLocalIPs();

// Universal CORS origins based on environment
function getCorsOrigins() {
  const baseOrigins = [
    "http://localhost:3000",
    "https://localhost:3000",
    "https://peddlenet.app",
    "https://*.vercel.app",
    "https://*.firebaseapp.com", 
    "https://*.web.app",
    "https://*.ngrok.io",
    "https://*.ngrok-free.app",
    /^https:\/\/[a-zA-Z0-9-]+\.ngrok(-free)?\.app$/,
    /^https:\/\/[a-zA-Z0-9-]+\.ngrok\.io$/,
    /^https:\/\/[a-zA-Z0-9-]+\.vercel\.app$/,
    /^https:\/\/[a-zA-Z0-9-]+\.firebaseapp\.com$/,
    /^https:\/\/.*\.web\.app$/
  ];

  if (isDev) {
    // Development: Add local network IPs
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

// Environment-aware Socket.IO configuration
const io = new Server(server, {
  cors: {
    origin: getCorsOrigins(),
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: isDev ? ["*"] : ["Content-Type", "Authorization"]
  },
  
  // Environment-optimized transport configuration
  transports: ['polling', 'websocket'], // Polling first for mobile reliability
  
  // Environment-specific timeouts
  pingTimeout: isDev ? 30000 : 60000,           // Dev: 30s, Prod: 60s
  pingInterval: isDev ? 15000 : 25000,          // Dev: 15s, Prod: 25s  
  upgradeTimeout: isDev ? 20000 : 30000,        // Dev: 20s, Prod: 30s
  
  allowUpgrades: true,
  rememberUpgrade: !isDev,                      // Don't remember in dev (mobile networks change)
  perMessageDeflate: true,
  httpCompression: true,
  
  // Connection state recovery - more aggressive in production
  connectionStateRecovery: {
    maxDisconnectionDuration: isDev ? 2 * 60 * 1000 : 3 * 60 * 1000, // Dev: 2min, Prod: 3min
    skipMiddlewares: true,
  },
  
  maxHttpBufferSize: 1e6,                       // 1MB buffer
  connectTimeout: isDev ? 15000 : 20000,        // Dev: 15s, Prod: 20s
});

// Store room and connection information
const rooms = new Map();
const notificationSubscribers = new Map(); // Background notification subscribers
const connectionStats = {
  totalConnections: 0,
  currentConnections: 0,
  peakConnections: 0,
  startTime: Date.now()
};

// Enhanced connection tracking (more detailed in dev)
const connections = new Map(); // socketId -> connection info

// Environment-aware health monitoring
const healthMonitor = {
  checkInterval: isDev ? 30000 : 60000, // Dev: 30s, Prod: 60s
  
  startMonitoring() {
    setInterval(() => {
      this.performHealthChecks();
    }, this.checkInterval);
    
    if (isDev) {
      console.log('🏥 DEV: Health monitoring started (30s intervals)');
    }
  },
  
  performHealthChecks() {
    const now = Date.now();
    let staleConnections = 0;
    
    for (const [socketId, connInfo] of connections.entries()) {
      const socket = io.sockets.sockets.get(socketId);
      
      if (!socket) {
        connections.delete(socketId);
        continue;
      }
      
      // Check for stale connections
      const timeSinceActivity = now - connInfo.lastActivity;
      const staleThreshold = isDev ? 120000 : 180000; // Dev: 2min, Prod: 3min
      
      if (timeSinceActivity > staleThreshold) {
        staleConnections++;
        if (isDev) {
          console.log(`🔍 Stale connection: ${socketId} (${Math.round(timeSinceActivity/1000)}s)`);
        }
        socket.emit('health-ping', { timestamp: now });
        connInfo.lastHealthCheck = now;
      }
    }
    
    if (staleConnections > 0 && isDev) {
      console.log(`🏥 Health check: ${staleConnections} stale connections`);
    }
  },
  
  recordActivity(socketId) {
    const connInfo = connections.get(socketId);
    if (connInfo) {
      connInfo.lastActivity = Date.now();
    }
  }
};

// Start health monitoring
healthMonitor.startMonitoring();

// Room code mapping for QR code functionality
const roomCodes = new Map(); // roomCode -> roomId mapping
const roomCodesByRoomId = new Map(); // roomId -> Set of codes

// Room code generation (works in all environments)
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

// Helper for room code resolution
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

// Middleware
app.use(cors({
  origin: getCorsOrigins(),
  methods: ["GET", "POST", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

// Root endpoint with environment info
app.get('/', (req, res) => {
  res.json({
    service: 'PeddleNet Universal Signaling Server',
    version: '3.0.0-universal',
    environment: NODE_ENV,
    platform: PLATFORM,
    status: 'running',
    description: 'Universal WebRTC signaling server for all environments',
    features: [
      'Environment-aware configuration',
      'Universal CORS handling',
      'QR code generation', 
      isDev && 'Local IP detection',
      'Enhanced connection tracking',
      'Real-time health monitoring'
    ].filter(Boolean),
    endpoints: {
      health: '/health',
      registerCode: '/register-room-code',
      resolveCode: '/resolve-room-code/:code',
      roomStats: '/room-stats/:roomId',
      ...(isDev && { debugRooms: '/debug/rooms' })
    },
    ...(isDev && { 
      mobileAccess: localIPs.filter(ip => !ip.includes('localhost')),
      developmentMode: true
    }),
    timestamp: Date.now()
  });
});

// Universal health check
app.get('/health', (req, res) => {
  const memUsage = process.memoryUsage();
  const uptime = process.uptime();
  
  res.json({ 
    status: 'ok',
    timestamp: Date.now(),
    uptime: Math.round(uptime),
    uptimeHuman: formatUptime(uptime),
    version: '3.0.0-universal',
    environment: NODE_ENV,
    platform: PLATFORM,
    
    connections: {
      current: connectionStats.currentConnections,
      peak: connectionStats.peakConnections,
      total: connectionStats.totalConnections,
      rooms: rooms.size,
      totalUsers: Array.from(rooms.values()).reduce((sum, room) => sum + room.size, 0),
      socketIOConnections: io.engine.clientsCount || 0
    },
    
    memory: {
      used: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
      total: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
      rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB'
    },
    
    configuration: {
      corsOrigins: getCorsOrigins().length,
      pingInterval: isDev ? '15s' : '25s',
      pingTimeout: isDev ? '30s' : '60s',
      connectionRecovery: isDev ? '2min' : '3min',
      healthCheckInterval: isDev ? '30s' : '60s'
    },
    
    ...(isDev && {
      development: {
        localIPs: localIPs,
        roomCodes: roomCodes.size,
        detailedLogging: true
      }
    })
  });
});

// Room code registration
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
  
  // Update reverse mapping
  if (!roomCodesByRoomId.has(roomId)) {
    roomCodesByRoomId.set(roomId, new Set());
  }
  roomCodesByRoomId.get(roomId).add(normalizedCode);
  
  if (isDev) {
    console.log(`📋 Registered room code: ${normalizedCode} -> ${roomId}`);
  }
  
  res.json({ success: true, roomId, roomCode: normalizedCode });
});

// Room code resolution
app.get('/resolve-room-code/:code', (req, res) => {
  const code = req.params.code.toLowerCase();
  const roomId = roomCodes.get(code);
  
  if (roomId) {
    if (isDev) {
      console.log(`🔍 Room code resolved: ${code} -> ${roomId}`);
    }
    res.json({ success: true, roomId, code });
  } else {
    // Try auto-resolving with deterministic generation
    const possibleRoomIds = generatePossibleRoomIds(code);
    
    for (const possibleRoomId of possibleRoomIds) {
      try {
        const testCode = generateRoomCodeOnServer(possibleRoomId);
        if (testCode && testCode.toLowerCase() === code) {
          if (isDev) {
            console.log(`✨ Auto-resolved room code: ${code} -> ${possibleRoomId}`);
          }
          
          // Auto-register this mapping
          roomCodes.set(code, possibleRoomId);
          if (!roomCodesByRoomId.has(possibleRoomId)) {
            roomCodesByRoomId.set(possibleRoomId, new Set());
          }
          roomCodesByRoomId.get(possibleRoomId).add(code);
          
          res.json({ success: true, roomId: possibleRoomId, code, autoResolved: true });
          return;
        }
      } catch (error) {
        continue;
      }
    }
    
    if (isDev) {
      console.log(`❌ Room code not found: ${code}`);
    }
    res.json({ success: false, error: 'Room code not found' });
  }
});

// Room statistics
app.get('/room-stats/:roomId', (req, res) => {
  const { roomId } = req.params;
  
  const roomPeers = rooms.get(roomId);
  const activeUsers = roomPeers ? roomPeers.size : 0;
  
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

// Debug endpoint (development only)
if (isDev) {
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
      connections: connections.size,
      stats: connectionStats,
      environment: { NODE_ENV, PLATFORM, isDev, isStaging, isProduction }
    });
  });
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  // Enhanced connection tracking
  const connectionInfo = {
    connectedAt: Date.now(),
    lastActivity: Date.now(),
    reconnectCount: 0,
    roomId: null,
    userData: null
  };
  
  connections.set(socket.id, connectionInfo);
  
  connectionStats.currentConnections++;
  connectionStats.totalConnections++;
  connectionStats.peakConnections = Math.max(
    connectionStats.peakConnections, 
    connectionStats.currentConnections
  );

  if (isDev) {
    console.log(`🔗 Client connected: ${socket.id} (${connectionStats.currentConnections} active)`);
  }

  // Store user data
  socket.userData = null;

  // Health ping handler
  socket.on('health-ping', (data) => {
    healthMonitor.recordActivity(socket.id);
    socket.emit('health-pong', { 
      timestamp: Date.now(), 
      originalTimestamp: data.timestamp
    });
  });

  // Join room with auto room code generation
  socket.on('join-room', ({ roomId, peerId, displayName }) => {
    if (isDev) {
      console.log(`👥 ${displayName} (${peerId}) joining room: ${roomId}`);
    }
    
    healthMonitor.recordActivity(socket.id);
    
    // Auto-register deterministic room code if not already registered
    if (roomId && !roomCodesByRoomId.has(roomId)) {
      try {
        const autoCode = generateRoomCodeOnServer(roomId);
        if (autoCode) {
          roomCodes.set(autoCode.toLowerCase(), roomId);
          roomCodesByRoomId.set(roomId, new Set([autoCode.toLowerCase()]));
          if (isDev) {
            console.log(`🤖 Auto-registered room code: ${autoCode} -> ${roomId}`);
          }
        }
      } catch (error) {
        if (isDev) {
          console.warn('Failed to auto-register room code:', error);
        }
      }
    }
    
    socket.join(roomId);
    socket.userData = { roomId, peerId, displayName };
    connectionInfo.roomId = roomId;
    connectionInfo.userData = socket.userData;
    
    // Initialize room if it doesn't exist
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Map());
    }
    
    const roomPeers = rooms.get(roomId);
    
    // Remove any existing connections for this peer ID (deduplication)
    for (const [socketId, peer] of roomPeers.entries()) {
      if (peer.peerId === peerId && socketId !== socket.id) {
        if (isDev) {
          console.log(`🔄 Removing duplicate connection for peer ${peerId}: ${socketId}`);
        }
        roomPeers.delete(socketId);
        const oldSocket = io.sockets.sockets.get(socketId);
        if (oldSocket) {
          oldSocket.disconnect(true);
        }
      }
    }
    
    roomPeers.set(socket.id, { peerId, displayName });
    
    // Notify others in the room
    socket.to(roomId).emit('peer-joined', { peerId, displayName });
    
    // Send current peers to new user
    const currentPeers = Array.from(roomPeers.values()).filter(peer => peer.peerId !== peerId);
    socket.emit('room-peers', currentPeers);
    
    if (isDev) {
      console.log(`📊 Room ${roomId} now has ${roomPeers.size} peers`);
    }
  });

  // Handle connection requests
  socket.on('request-connection', ({ targetSocketId, fromPeerId }) => {
    healthMonitor.recordActivity(socket.id);
    socket.to(targetSocketId).emit('connection-request', {
      fromPeerId,
      fromSocketId: socket.id
    });
  });

  // Handle connection responses
  socket.on('connection-response', ({ targetSocketId, accepted, toPeerId }) => {
    healthMonitor.recordActivity(socket.id);
    socket.to(targetSocketId).emit('connection-response', {
      accepted,
      toPeerId,
      fromSocketId: socket.id
    });
  });

  // FIXED: Chat messages with proper sender inclusion
  socket.on('chat-message', ({ roomId, message, type = 'chat' }) => {
    healthMonitor.recordActivity(socket.id);
    
    if (isDev) {
      console.log(`💬 Chat message from ${socket.id} in room ${roomId}:`, message);
    }
    
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
      
      // CRITICAL FIX: Use io.to() to include sender
      io.to(roomId).emit('chat-message', enhancedMessage);
      
      // Send delivery confirmation
      socket.emit('message-delivered', {
        messageId: enhancedMessage.id,
        timestamp: Date.now()
      });
      
      // Also send to background notification subscribers
      const subscribers = notificationSubscribers.get(roomId);
      if (subscribers && subscribers.size > 0) {
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
      
      if (isDev) {
        console.log(`✅ Message delivered to room ${roomId} INCLUDING SENDER`);
      }
    } else {
      if (isDev) {
        console.warn(`⚠️ User ${socket.id} tried to send message to room ${roomId} but is not in that room`);
      }
      socket.emit('error', {
        message: 'You are not in the specified room',
        code: 'NOT_IN_ROOM'
      });
    }
  });

  // Background notification subscriptions
  socket.on('subscribe-notifications', ({ roomId, displayName }) => {
    if (isDev) {
      console.log(`🔔 ${displayName} subscribing to notifications for room: ${roomId}`);
    }
    
    if (!notificationSubscribers.has(roomId)) {
      notificationSubscribers.set(roomId, new Set());
    }
    
    const subscribers = notificationSubscribers.get(roomId);
    subscribers.add(socket.id);
    
    if (!socket.notificationSubscriptions) {
      socket.notificationSubscriptions = new Set();
    }
    socket.notificationSubscriptions.add(roomId);
    
    socket.emit('subscription-confirmed', {
      roomId,
      success: true,
      timestamp: Date.now()
    });
  });

  socket.on('unsubscribe-notifications', ({ roomId }) => {
    if (isDev) {
      console.log(`🔕 Unsubscribing from notifications for room: ${roomId}`);
    }
    
    const subscribers = notificationSubscribers.get(roomId);
    if (subscribers) {
      subscribers.delete(socket.id);
      if (subscribers.size === 0) {
        notificationSubscribers.delete(roomId);
      }
    }
    
    if (socket.notificationSubscriptions) {
      socket.notificationSubscriptions.delete(roomId);
    }
    
    socket.emit('unsubscription-confirmed', {
      roomId,
      success: true,
      timestamp: Date.now()
    });
  });

  // Handle disconnect
  socket.on('disconnect', (reason) => {
    connectionStats.currentConnections--;
    
    if (isDev) {
      console.log(`🔌 Client disconnected: ${socket.id} (${connectionStats.currentConnections} active, reason: ${reason})`);
    }
    
    // Clean up connection tracking
    connections.delete(socket.id);
    
    // Clean up notification subscriptions
    if (socket.notificationSubscriptions) {
      socket.notificationSubscriptions.forEach(roomId => {
        const subscribers = notificationSubscribers.get(roomId);
        if (subscribers) {
          subscribers.delete(socket.id);
          if (subscribers.size === 0) {
            notificationSubscribers.delete(roomId);
          }
        }
      });
    }
    
    if (socket.userData) {
      const { roomId, peerId, displayName } = socket.userData;
      
      // Remove from room
      if (rooms.has(roomId)) {
        const roomPeers = rooms.get(roomId);
        roomPeers.delete(socket.id);
        
        // Notify others
        socket.to(roomId).emit('peer-left', { peerId, displayName });
        
        // Clean up empty rooms
        if (roomPeers.size === 0) {
          rooms.delete(roomId);
          if (isDev) {
            console.log(`🗑️ Room ${roomId} deleted (empty)`);
          }
        }
      }
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

// Environment-aware cleanup intervals
setInterval(() => {
  let cleanedRooms = 0;
  let cleanedConnections = 0;
  
  // Clean up empty rooms
  for (const [roomId, peers] of rooms.entries()) {
    if (peers.size === 0) {
      rooms.delete(roomId);
      cleanedRooms++;
    }
  }
  
  // Clean up orphaned connections
  for (const [socketId, connInfo] of connections.entries()) {
    const socket = io.sockets.sockets.get(socketId);
    if (!socket) {
      connections.delete(socketId);
      cleanedConnections++;
    }
  }
  
  if ((cleanedRooms > 0 || cleanedConnections > 0) && isDev) {
    console.log(`🧹 Cleaned ${cleanedRooms} rooms, ${cleanedConnections} connections`);
  }
}, isDev ? 5 * 60 * 1000 : 10 * 60 * 1000); // Dev: 5min, Prod: 10min

// Cloud Run keep-warm (production only)
if (isProduction && PLATFORM === 'cloudrun') {
  const keepWarmInterval = 4 * 60 * 1000; // Every 4 minutes
  
  setInterval(async () => {
    try {
      const response = await fetch(process.env.KEEP_WARM_URL || 'https://peddlenet-websocket-server-padyxgyv5a-uc.a.run.app/health');
      if (response.ok) {
        console.log('🔥 Keep-warm ping successful');
      }
    } catch (error) {
      console.warn('⚠️ Keep-warm ping failed:', error.message);
    }
  }, keepWarmInterval);
  
  console.log('🔥 Cloud Run keep-warm enabled');
}

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🎵 PeddleNet Universal Server v3.0.0 running on port ${PORT}`);
  console.log(`🔍 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 Features: ${isDev ? 'IP Detection + ' : ''}QR Codes + Chat + ${isDev ? 'Debug + ' : ''}Health Monitoring`);
  
  if (isDev) {
    console.log(`🐛 Debug endpoint: http://localhost:${PORT}/debug/rooms`);
    
    // Show mobile access URLs in development
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          console.log(`📱 Mobile: http://${iface.address}:3000 → http://${iface.address}:${PORT}`);
        }
      }
    }
  }
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Universal server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Universal server closed');
    process.exit(0);
  });
});

module.exports = { app, server, io };

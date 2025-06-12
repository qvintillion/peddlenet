// signaling-server.js - Universal server with CRITICAL CORS & Cold Start Fixes
// Auto-detects environment and adapts configuration accordingly
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const os = require('os');

const app = express();
const server = createServer(app);

// Universal environment detection
const NODE_ENV = process.env.NODE_ENV || 'development';
const PLATFORM = process.env.PLATFORM || 'local'; // local, firebase, github, cloudrun
const isDevelopment = NODE_ENV === 'development' || PLATFORM === 'local';
const isStaging = PLATFORM === 'firebase' || NODE_ENV === 'staging';
const isProduction = PLATFORM === 'github' || PLATFORM === 'cloudrun' || NODE_ENV === 'production';

console.log(`🎪 PeddleNet Universal Server Starting... (CORS FIXED)`);
console.log(`📍 Environment: ${NODE_ENV}`);
console.log(`🏗️ Platform: ${PLATFORM}`);
console.log(`🎯 Mode: ${isDevelopment ? 'DEVELOPMENT' : isStaging ? 'STAGING' : 'PRODUCTION'}`);

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
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"]
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
  res.header('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,Authorization');
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
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"]
}));

app.use(express.json());

// Store room and connection information
const rooms = new Map();
const notificationSubscribers = new Map(); // Track background notification subscribers
const connectionStats = {
  totalConnections: 0,
  currentConnections: 0,
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

// Enhanced health check endpoint with CORS debugging
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
    version: '2.0.1-cors-fixed',
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
    version: '2.0.1-cors-fixed',
    features: ['peer-discovery', 'connection-assistance', 'room-management', 'messaging-fix', 'cors-fix', 'cold-start-fix'],
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
      environment: 'development',
      stats: connectionStats,
      cors: {
        allowedOrigins: getCorsOrigins(),
        rejections: connectionStats.corsRejections
      }
    });
  });
}

// 🚀 FUTURE FEATURES FOUNDATION - Add new features here
// Environment-aware endpoints for upcoming features

// Analytics Dashboard (for future implementation)
if (isDevelopment) {
  // Mock analytics data for development
  app.get('/analytics/dashboard', (req, res) => {
    res.json({
      mockData: true,
      totalUsers: Math.floor(Math.random() * 100) + 50,
      activeRooms: rooms.size,
      totalMessages: Math.floor(Math.random() * 1000) + 500,
      peakConcurrent: connectionStats.peakConnections,
      avgRoomSize: rooms.size > 0 ? Array.from(rooms.values()).reduce((sum, room) => sum + room.size, 0) / rooms.size : 0,
      timestamp: Date.now(),
      environment: 'development'
    });
  });
} else {
  // Production analytics (placeholder for real implementation)
  app.get('/analytics/dashboard', (req, res) => {
    // TODO: Implement real analytics collection
    res.json({
      totalUsers: connectionStats.totalConnections,
      activeRooms: rooms.size,
      currentConnections: connectionStats.currentConnections,
      peakConnections: connectionStats.peakConnections,
      coldStarts: connectionStats.coldStarts,
      timestamp: Date.now(),
      environment: 'production'
    });
  });
}

// Mesh Network Configuration (for future implementation)
if (isDevelopment) {
  // Simplified mesh for development testing
  app.get('/mesh/config', (req, res) => {
    res.json({
      mockMesh: true,
      maxPeers: 4, // Simplified for dev testing
      stunServers: ['stun:stun.l.google.com:19302'], // Basic STUN
      enableMesh: process.env.ENABLE_MESH === 'true',
      environment: 'development'
    });
  });
} else {
  // Production mesh configuration
  app.get('/mesh/config', (req, res) => {
    res.json({
      maxPeers: 8, // Full mesh capacity
      stunServers: [
        'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302'
      ],
      // TODO: Add TURN servers for production
      enableMesh: process.env.ENABLE_MESH === 'true',
      environment: 'production'
    });
  });
}

app.get('/', (req, res) => {
  res.json({
    service: 'PeddleNet Universal Signaling Server',
    version: '2.0.1-cors-fixed',
    status: 'running',
    environment: NODE_ENV,
    platform: PLATFORM,
    mode: isDevelopment ? 'development' : isStaging ? 'staging' : 'production',
    description: 'Universal WebRTC signaling server with CORS and cold start fixes',
    fixes: ['cors-headers', 'cloud-run-optimization', 'polling-first-transport', 'keep-alive-strategy'],
    endpoints: {
      health: '/health',
      cloudRunHealth: '/_ah/health',
      signaling: '/socket.io/',
      ...(isDevelopment && { 
        debug: '/debug/rooms',
        analytics: '/analytics/dashboard',
        meshConfig: '/mesh/config'
      })
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

// Socket.IO connection handling
io.on('connection', (socket) => {
  connectionStats.currentConnections++;
  connectionStats.totalConnections++;
  connectionStats.peakConnections = Math.max(
    connectionStats.peakConnections, 
    connectionStats.currentConnections
  );

  devLog(`🔗 Client connected: ${socket.id} (${connectionStats.currentConnections} active)`);
  devLog(`🔗 Connection transport: ${socket.conn?.transport?.name || 'unknown'}`);

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

  // Join room with auto room code generation
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
    socket.userData = { roomId, peerId, displayName };
    
    // Initialize room if it doesn't exist
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Map());
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
    
    roomPeers.set(socket.id, { peerId, displayName });
    
    // Notify others in the room
    socket.to(roomId).emit('peer-joined', { peerId, displayName });
    
    // Send current peers to new user
    const currentPeers = Array.from(roomPeers.values()).filter(peer => peer.peerId !== peerId);
    socket.emit('room-peers', currentPeers);
    
    devLog(`📊 Room ${roomId} now has ${roomPeers.size} peers`);
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

  // 🚨 CRITICAL FIX: Handle chat messages with sender confirmation
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
      
      // 🎯 CRITICAL FIX: Use io.to() instead of socket.to() to include sender
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

  // Handle disconnect
  socket.on('disconnect', (reason) => {
    connectionStats.currentConnections--;
    devLog(`🔌 Client disconnected: ${socket.id} (${connectionStats.currentConnections} active, reason: ${reason})`);
    
    // Track cold start disconnections
    if (reason === 'transport close' || reason === 'ping timeout') {
      connectionStats.coldStarts++;
      devLog(`❄️ Cold start disconnect detected (${connectionStats.coldStarts} total)`);
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
          devLog(`🗑️ Room ${roomId} deleted (empty)`);
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

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  devLog(`🎵 PeddleNet Universal Server v2.0.1-cors-fixed running on port ${PORT}`);
  devLog(`🔍 Health check: http://localhost:${PORT}/health`);
  devLog(`🔧 Cloud Run health: http://localhost:${PORT}/_ah/health`);
  devLog(`🔔 Features: CORS Fix + Cold Start Prevention + Enhanced Error Tracking`);
  devLog(`🎯 CRITICAL FIXES: CORS headers + polling-first transport + keep-alive`);
  
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

// 🚨 FIXED: Graceful shutdown handling - prevent multiple listeners
let isShuttingDown = false;

function gracefulShutdown(signal) {
  if (isShuttingDown) {
    console.log(`${signal} already in progress, ignoring...`);
    return;
  }
  
  isShuttingDown = true;
  console.log(`${signal} received, shutting down gracefully`);
  
  // Close Socket.IO connections first
  io.close(() => {
    console.log('Socket.IO connections closed');
    
    // Then close HTTP server
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
  
  // Force exit after 5 seconds if graceful shutdown fails
  setTimeout(() => {
    console.log('Force shutdown after timeout');
    process.exit(1);
  }, 5000);
}

// Only register signal handlers once to prevent MaxListenersExceededWarning
process.once('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.once('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = { app, server, io };

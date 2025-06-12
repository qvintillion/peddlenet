// signaling-server-dev-FIXED.js - Development Server with Enhanced Features + Push Notification Fix
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const os = require('os');

const app = express();
const server = createServer(app);

// Get all local IP addresses for development CORS
function getLocalIPs() {
  const interfaces = os.networkInterfaces();
  const ips = ['http://localhost:3000', 'https://localhost:3000'];
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push(`http://${iface.address}:3000`);
        ips.push(`https://${iface.address}:3000`);
        console.log(`📱 Mobile access: http://${iface.address}:3000`);
      }
    }
  }
  
  return ips;
}

const localIPs = getLocalIPs();

console.log('🎪 Festival Chat DEV Server Starting...');
console.log('🔧 Enhanced Development Features: IP Detection + QR Codes + In-Memory Storage');
console.log('🌐 CORS allowed for:', localIPs);

// Enhanced Socket.IO configuration for development
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
      "https://*.firebaseapp.com",
      "https://*.web.app"
    ],
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["*"]
  },
  
  // Development-optimized transport configuration
  transports: ['polling', 'websocket'], // Polling first for mobile reliability
  pingTimeout: 30000,           // 30s timeout for mobile
  pingInterval: 15000,          // 15s ping interval
  upgradeTimeout: 20000,        // 20s upgrade timeout
  allowUpgrades: true,          
  rememberUpgrade: false,       // Don't remember for mobile networks
  perMessageDeflate: true,      
  httpCompression: true,        
  
  // Connection state recovery for mobile
  connectionStateRecovery: {
    maxDisconnectionDuration: 3 * 60 * 1000, // 3 minutes
    skipMiddlewares: true,
  },
  
  maxHttpBufferSize: 1e6,       // 1MB buffer
  connectTimeout: 20000,        // 20s connection timeout
});

// Store room and connection information
const rooms = new Map();
const notificationSubscribers = new Map(); // Track background notification subscribers
const connectionStats = {
  totalConnections: 0,
  currentConnections: 0,
  peakConnections: 0,
  startTime: Date.now()
};

// Enhanced connection tracking for development
const connections = new Map(); // socketId -> connection info

// Enhanced health monitoring for development
const healthMonitor = {
  checkInterval: 30000, // 30 seconds
  
  startMonitoring() {
    setInterval(() => {
      this.performHealthChecks();
    }, this.checkInterval);
    console.log('🏥 Development health monitoring started');
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
      if (timeSinceActivity > 120000) { // 2 minutes
        staleConnections++;
        console.log(`🔍 DEV: Stale connection: ${socketId} (${Math.round(timeSinceActivity/1000)}s)`);
        socket.emit('health-ping', { timestamp: now });
        connInfo.lastHealthCheck = now;
      }
    }
    
    if (staleConnections > 0) {
      console.log(`🏥 DEV Health check: ${staleConnections} stale connections`);
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

// Enhanced room code generation (matching client-side)
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

// Middleware
app.use(cors({
  origin: localIPs.concat([
    "https://peddlenet.app",
    "https://*.vercel.app", 
    "https://*.firebaseapp.com",
    "https://*.web.app"
  ]),
  methods: ["GET", "POST", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'PeddleNet Development Signaling Server',
    version: '2.3.0-dev-fixed',
    status: 'running',
    description: 'Enhanced WebRTC signaling server for development with mobile support',
    features: [
      'Local IP detection',
      'QR code generation', 
      'Mobile device support',
      'Enhanced connection tracking',
      'Push notification fix',
      'Real-time health monitoring'
    ],
    endpoints: {
      health: '/health',
      registerCode: '/register-room-code',
      resolveCode: '/resolve-room-code/:code',
      roomStats: '/room-stats/:roomId',
      debugRooms: '/debug/rooms'
    },
    mobileAccess: localIPs.filter(ip => !ip.includes('localhost')),
    timestamp: Date.now()
  });
});

// Enhanced health check for development
app.get('/health', (req, res) => {
  const memUsage = process.memoryUsage();
  const uptime = process.uptime();
  
  res.json({ 
    status: 'ok',
    timestamp: Date.now(),
    uptime: Math.round(uptime),
    uptimeHuman: formatUptime(uptime),
    version: '2.3.0-dev-fixed',
    environment: 'development',
    
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
    
    development: {
      localIPs: localIPs,
      roomCodes: roomCodes.size,
      healthMonitoring: 'active',
      corsOrigins: localIPs.length
    },
    
    transport: {
      transports: ['polling', 'websocket'],
      upgradeTimeout: '20s',
      pingInterval: '15s',
      pingTimeout: '30s',
      compression: true,
      connectionStateRecovery: '3min'
    }
  });
});

// Room code registration endpoint
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
  
  console.log(`📋 DEV: Registered room code: ${normalizedCode} -> ${roomId}`);
  
  res.json({ success: true, roomId, roomCode: normalizedCode });
});

// Room code resolution endpoint
app.get('/resolve-room-code/:code', (req, res) => {
  const code = req.params.code.toLowerCase();
  const roomId = roomCodes.get(code);
  
  if (roomId) {
    console.log(`🔍 DEV: Room code resolved: ${code} -> ${roomId}`);
    res.json({ success: true, roomId, code });
  } else {
    // Try auto-resolving with deterministic generation
    const possibleRoomIds = generatePossibleRoomIds(code);
    
    for (const possibleRoomId of possibleRoomIds) {
      try {
        const testCode = generateRoomCodeOnServer(possibleRoomId);
        if (testCode && testCode.toLowerCase() === code) {
          console.log(`✨ DEV: Auto-resolved room code: ${code} -> ${possibleRoomId}`);
          
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
    
    console.log(`❌ DEV: Room code not found: ${code}`);
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
    `${adjective} ${noun}`,
    noun,
    `${adjective}-${noun}-room`,
    `${noun}-${numberStr}`
  ].filter(id => id && id.length > 0);
}

// Room statistics endpoint
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

// Debug endpoint for development
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
    stats: connectionStats
  });
});

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

  console.log(`🔗 DEV: Client connected: ${socket.id} (${connectionStats.currentConnections} active)`);

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

  // Enhanced join room with auto room code generation
  socket.on('join-room', ({ roomId, peerId, displayName }) => {
    console.log(`👥 DEV: ${displayName} (${peerId}) joining room: ${roomId}`);
    
    healthMonitor.recordActivity(socket.id);
    
    // Auto-register deterministic room code if not already registered
    if (roomId && !roomCodesByRoomId.has(roomId)) {
      try {
        const autoCode = generateRoomCodeOnServer(roomId);
        if (autoCode) {
          roomCodes.set(autoCode.toLowerCase(), roomId);
          roomCodesByRoomId.set(roomId, new Set([autoCode.toLowerCase()]));
          console.log(`🤖 DEV: Auto-registered room code: ${autoCode} -> ${roomId}`);
        }
      } catch (error) {
        console.warn('DEV: Failed to auto-register room code:', error);
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
        console.log(`🔄 DEV: Removing duplicate connection for peer ${peerId}: ${socketId}`);
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
    
    console.log(`📊 DEV: Room ${roomId} now has ${roomPeers.size} peers`);
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

  // 🚨 FIXED: Chat messages with proper sender inclusion
  socket.on('chat-message', ({ roomId, message, type = 'chat' }) => {
    healthMonitor.recordActivity(socket.id);
    console.log(`💬 DEV: Chat message from ${socket.id} in room ${roomId}:`, message);
    
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
      
      // 🎯 CRITICAL FIX: Use io.to() to include sender
      console.log(`🔥 DEV: Broadcasting message to ALL users in room ${roomId} (including sender)`);
      io.to(roomId).emit('chat-message', enhancedMessage);
      
      // Send delivery confirmation
      socket.emit('message-delivered', {
        messageId: enhancedMessage.id,
        timestamp: Date.now()
      });
      
      // Also send to background notification subscribers
      const subscribers = notificationSubscribers.get(roomId);
      if (subscribers && subscribers.size > 0) {
        console.log(`🔔 DEV: Broadcasting to ${subscribers.size} notification subscribers`);
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
      
      console.log(`✅ DEV: Message delivered to room ${roomId} INCLUDING SENDER`);
    } else {
      console.warn(`⚠️ DEV: User ${socket.id} tried to send message to room ${roomId} but is not in that room`);
      socket.emit('error', {
        message: 'You are not in the specified room',
        code: 'NOT_IN_ROOM'
      });
    }
  });

  // 🚨 FIXED: Background notification subscriptions
  socket.on('subscribe-notifications', ({ roomId, displayName }) => {
    console.log(`🔔 DEV: ${displayName} subscribing to notifications for room: ${roomId}`);
    
    if (!notificationSubscribers.has(roomId)) {
      notificationSubscribers.set(roomId, new Set());
    }
    
    const subscribers = notificationSubscribers.get(roomId);
    subscribers.add(socket.id);
    
    if (!socket.notificationSubscriptions) {
      socket.notificationSubscriptions = new Set();
    }
    socket.notificationSubscriptions.add(roomId);
    
    console.log(`🔔 DEV: Socket ${socket.id} subscribed to notifications for ${roomId}`);
    
    socket.emit('subscription-confirmed', {
      roomId,
      success: true,
      timestamp: Date.now()
    });
  });

  socket.on('unsubscribe-notifications', ({ roomId }) => {
    console.log(`🔕 DEV: Unsubscribing from notifications for room: ${roomId}`);
    
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
    console.log(`🔌 DEV: Client disconnected: ${socket.id} (${connectionStats.currentConnections} active, reason: ${reason})`);
    
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
          console.log(`🗑️ DEV: Room ${roomId} deleted (empty)`);
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

// Enhanced cleanup for development
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
  
  if (cleanedRooms > 0 || cleanedConnections > 0) {
    console.log(`🧹 DEV: Cleaned ${cleanedRooms} rooms, ${cleanedConnections} connections`);
  }
}, 5 * 60 * 1000); // Every 5 minutes

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🎵 PeddleNet Development Server v2.3.0-dev-fixed running on port ${PORT}`);
  console.log(`🔍 Health check: http://localhost:${PORT}/health`);
  console.log(`🐛 Debug rooms: http://localhost:${PORT}/debug/rooms`);
  console.log(`💾 Storage: In-memory (no persistence for development)`);
  console.log(`🏥 Health monitoring: Active (30s intervals)`);
  console.log(`🚨 FIXES: Push notifications + Message sender inclusion`);
  
  // Show mobile access URLs
  console.log('\n📱 Mobile Access URLs:');
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        console.log(`  App: http://${iface.address}:3000`);
        console.log(`  Server: http://${iface.address}:${PORT}`);
        console.log(`  Health: http://${iface.address}:${PORT}/health`);
      }
    }
  }
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('DEV Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('DEV Server closed');
    process.exit(0);
  });
});

module.exports = { app, server, io };

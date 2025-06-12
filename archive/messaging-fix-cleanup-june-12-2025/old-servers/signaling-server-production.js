// signaling-server-production.js - Production-ready signaling server
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = createServer(app);

// Production-optimized Socket.IO configuration
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://peddlenet.app",
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
    ],
    methods: ["GET", "POST"],
    credentials: true
  },
  // Production optimizations for reliability
  pingTimeout: 60000,           // 60 seconds before considering connection dead
  pingInterval: 25000,          // Ping every 25 seconds
  upgradeTimeout: 30000,        // 30 seconds to upgrade connection
  allowUpgrades: true,          // Allow WebSocket upgrades
  maxHttpBufferSize: 1e6,       // 1MB buffer for messages
  allowEIO3: true,              // Backward compatibility
  transports: ['websocket', 'polling'], // Fallback transport methods
  // Connection state recovery for mobile devices
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
    skipMiddlewares: true,
  }
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

// Middleware - Configure CORS for all routes
app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://peddlenet.app",
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
  ],
  methods: ["GET", "POST", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

// Room code mapping for server-side lookup
const roomCodes = new Map(); // roomCode -> roomId mapping

// Room code resolution endpoint
app.get('/resolve-room-code/:code', (req, res) => {
  const code = req.params.code.toLowerCase();
  const roomId = roomCodes.get(code);
  
  if (roomId) {
    res.json({ success: true, roomId, code });
  } else {
    res.json({ success: false, error: 'Room code not found' });
  }
});

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
  console.log(`📋 Registered room code: ${normalizedCode} -> ${roomId}`);
  
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

// Enhanced health check endpoint
app.get('/health', (req, res) => {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  
  res.json({ 
    status: 'ok',
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
    memory: {
      used: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
      total: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB'
    },
    timestamp: Date.now(),
    version: '1.1.1-room-stats-added'
  });
});

// Basic signaling endpoint
app.get('/signaling-proxy', (req, res) => {
  res.json({
    signalingAvailable: true,
    endpoint: '/socket.io/',
    version: '1.1.1-room-stats-added',
    features: ['peer-discovery', 'connection-assistance', 'room-management'],
    timestamp: Date.now()
  });
});

app.get('/', (req, res) => {
  res.json({
    service: 'PeddleNet Signaling Server',
    version: '1.1.1-room-stats-added',
    status: 'running',
    description: 'WebRTC signaling server for peer-to-peer connections',
    endpoints: {
      health: '/health',
      signaling: '/socket.io/'
    },
    timestamp: Date.now()
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

  console.log(`Client connected: ${socket.id} (${connectionStats.currentConnections} active)`);

  // Store user data
  socket.userData = null;

  // Join room
  socket.on('join-room', ({ roomId, peerId, displayName }) => {
    console.log(`${displayName} (${peerId}) joining room: ${roomId}`);
    
    socket.join(roomId);
    socket.userData = { roomId, peerId, displayName };
    
    // Initialize room if it doesn't exist
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Map());
    }
    
    const roomPeers = rooms.get(roomId);
    roomPeers.set(socket.id, { peerId, displayName });
    
    // Notify others in the room
    socket.to(roomId).emit('peer-joined', { peerId, displayName });
    
    // Send current peers to new user
    const currentPeers = Array.from(roomPeers.values()).filter(peer => peer.peerId !== peerId);
    socket.emit('room-peers', currentPeers);
    
    console.log(`Room ${roomId} now has ${roomPeers.size} peers`);
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

  // Handle chat messages
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
      
      // Broadcast to all users in the room (including sender for confirmation)
      io.to(roomId).emit('chat-message', enhancedMessage);
      
      // ALSO broadcast to background notification subscribers for this room
      const subscribers = notificationSubscribers.get(roomId);
      if (subscribers && subscribers.size > 0) {
        console.log(`🔔 Broadcasting to ${subscribers.size} notification subscribers for room ${roomId}`);
        subscribers.forEach(subscriberSocketId => {
          const subscriberSocket = io.sockets.sockets.get(subscriberSocketId);
          if (subscriberSocket && subscriberSocket.id !== socket.id) {
            subscriberSocket.emit('chat-message', enhancedMessage);
          }
        });
      }
      
      // Send delivery confirmation back to sender
      socket.emit('message-delivered', {
        messageId: enhancedMessage.id,
        timestamp: Date.now()
      });
      
      console.log(`✅ Message delivered to room ${roomId}`);
    } else {
      console.warn(`⚠️ User ${socket.id} tried to send message to room ${roomId} but is not in that room`);
      socket.emit('error', {
        message: 'You are not in the specified room',
        code: 'NOT_IN_ROOM'
      });
    }
  });

  // Handle background notification subscriptions
  socket.on('subscribe-notifications', ({ roomId, displayName }) => {
    console.log(`🔔 ${displayName} subscribing to notifications for room: ${roomId}`);
    
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
    
    console.log(`🔔 Socket ${socket.id} now subscribed to notifications for ${roomId}`);
  });

  // Handle background notification unsubscriptions
  socket.on('unsubscribe-notifications', ({ roomId }) => {
    console.log(`🔕 Unsubscribing from notifications for room: ${roomId}`);
    
    // Remove from notification subscribers
    const subscribers = notificationSubscribers.get(roomId);
    if (subscribers) {
      subscribers.delete(socket.id);
      
      // Clean up empty subscriber sets
      if (subscribers.size === 0) {
        notificationSubscribers.delete(roomId);
        console.log(`🗑️ Removed empty notification subscriber set for room ${roomId}`);
      }
    }
    
    // Remove from socket's subscription list
    if (socket.notificationSubscriptions) {
      socket.notificationSubscriptions.delete(roomId);
    }
    
    console.log(`🔕 Socket ${socket.id} unsubscribed from notifications for ${roomId}`);
  });

  // Handle disconnect
  socket.on('disconnect', (reason) => {
    connectionStats.currentConnections--;
    console.log(`Client disconnected: ${socket.id} (${connectionStats.currentConnections} active)`);
    
    // Clean up notification subscriptions for this socket
    if (socket.notificationSubscriptions) {
      socket.notificationSubscriptions.forEach(roomId => {
        const subscribers = notificationSubscribers.get(roomId);
        if (subscribers) {
          subscribers.delete(socket.id);
          if (subscribers.size === 0) {
            notificationSubscribers.delete(roomId);
            console.log(`🗑️ Cleaned up empty notification subscribers for room ${roomId}`);
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
          console.log(`Room ${roomId} deleted (empty)`);
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
    console.log(`Cleaned up ${cleanedRooms} empty rooms`);
  }
}, 30 * 60 * 1000); // Every 30 minutes

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🎵 PeddleNet Signaling Server v1.1.1-room-stats-added running on port ${PORT}`);
  console.log(`🔍 Health check: http://localhost:${PORT}/health`);
  console.log(`🔔 Features: WebSocket + Chat + Notifications + Room Codes + Room Stats`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = { app, server, io };

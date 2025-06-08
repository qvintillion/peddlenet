// Production WebSocket signaling server optimized for Google Cloud Run
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = createServer(app);

// Enhanced Socket.IO configuration for Google Cloud Run
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://peddlenet.app",
      "https://*.vercel.app",
      "https://*.firebaseapp.com",
      "https://*.web.app",
      "https://festival-chat-peddlenet.web.app",
      /^https:\/\/.*\.vercel\.app$/,
      /^https:\/\/.*\.firebaseapp\.com$/,
      /^https:\/\/.*\.web\.app$/
    ],
    methods: ["GET", "POST"],
    credentials: true
  },
  // Google Cloud Run optimizations
  pingTimeout: 60000,
  pingInterval: 25000,
  upgradeTimeout: 30000,
  allowUpgrades: true,
  maxHttpBufferSize: 1e6,
  transports: ['websocket', 'polling'],
  // Connection state recovery for reliability
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
    skipMiddlewares: true,
  }
});

// In-memory storage for rooms and messages
const rooms = new Map();
const connectionStats = {
  totalConnections: 0,
  currentConnections: 0,
  peakConnections: 0,
  startTime: Date.now(),
  platform: 'Google Cloud Run'
};

// CORS middleware
app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://peddlenet.app",
    "https://*.vercel.app",
    "https://*.firebaseapp.com",
    "https://*.web.app",
    "https://festival-chat-peddlenet.web.app",
    /^https:\/\/.*\.vercel\.app$/,
    /^https:\/\/.*\.firebaseapp\.com$/,
    /^https:\/\/.*\.web\.app$/
  ],
  methods: ["GET", "POST", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

// Health check endpoint for Google Cloud Run
app.get('/health', (req, res) => {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  
  res.json({ 
    status: 'ok',
    service: 'PeddleNet WebSocket Server',
    version: '1.0.0-cloudrun',
    environment: process.env.NODE_ENV || 'production',
    platform: 'Google Cloud Run',
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
      total: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB',
      rss: Math.round(memoryUsage.rss / 1024 / 1024) + 'MB'
    },
    timestamp: Date.now()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'PeddleNet WebSocket Server',
    version: '1.0.0-cloudrun',
    status: 'running',
    platform: 'Google Cloud Run',
    description: 'WebSocket signaling server for festival chat P2P connections',
    features: [
      'peer-discovery',
      'connection-assistance', 
      'room-management',
      'message-relay',
      'cloud-run-optimized'
    ],
    endpoints: {
      health: '/health',
      websocket: '/socket.io/'
    },
    connections: connectionStats.currentConnections,
    rooms: rooms.size,
    timestamp: Date.now()
  });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  // Update connection stats
  connectionStats.currentConnections++;
  connectionStats.totalConnections++;
  connectionStats.peakConnections = Math.max(
    connectionStats.peakConnections, 
    connectionStats.currentConnections
  );

  console.log(`🔗 Client connected: ${socket.id} (${connectionStats.currentConnections} active)`);

  // Join room handler
  socket.on('join-room', ({ roomId, peerId, displayName }) => {
    try {
      console.log(`👥 ${displayName} (${peerId}) joining room: ${roomId}`);
      
      // Leave any existing rooms first
      socket.rooms.forEach(room => {
        if (room !== socket.id && rooms.has(room)) {
          const roomPeers = rooms.get(room);
          roomPeers.delete(socket.id);
          socket.leave(room);
        }
      });
      
      // Join the new room
      socket.join(roomId);
      
      // Store user info
      socket.userData = { 
        roomId, 
        peerId, 
        displayName, 
        joinedAt: Date.now(),
        lastSeen: Date.now()
      };
      
      // Initialize room if it doesn't exist
      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Map());
      }
      
      const roomPeers = rooms.get(roomId);
      const peerData = {
        peerId,
        displayName,
        joinedAt: Date.now(),
        socketId: socket.id
      };
      
      roomPeers.set(socket.id, peerData);
      
      // Notify existing peers about new user
      socket.to(roomId).emit('peer-joined', {
        peerId,
        displayName,
        socketId: socket.id,
        timestamp: Date.now()
      });
      
      // Send current peers to new user
      const currentPeers = Array.from(roomPeers.values())
        .filter(peer => peer.peerId !== peerId);
      
      socket.emit('room-peers', currentPeers);
      
      console.log(`📊 Room ${roomId} now has ${roomPeers.size} peers`);
      
    } catch (error) {
      console.error('Error in join-room:', error);
      socket.emit('error', { message: 'Failed to join room', code: 'JOIN_ROOM_ERROR' });
    }
  });

  // Chat message handler
  socket.on('chat-message', ({ roomId, message }) => {
    try {
      if (socket.userData && socket.userData.roomId === roomId) {
        const fullMessage = {
          id: Date.now() + '-' + Math.random().toString(36).substring(2),
          content: message.content,
          sender: socket.userData.displayName,
          timestamp: Date.now(),
          type: 'chat',
          roomId: roomId,
          synced: true
        };
        
        // Broadcast to all clients in the room (including sender)
        io.to(roomId).emit('chat-message', fullMessage);
        
        console.log(`💬 Message in ${roomId} from ${socket.userData.displayName}: ${message.content}`);
      }
    } catch (error) {
      console.error('Error in chat-message:', error);
      socket.emit('message-error', { message: 'Failed to send message' });
    }
  });

  // Heartbeat mechanism
  socket.on('ping', (data) => {
    if (socket.userData) {
      socket.userData.lastSeen = Date.now();
    }
    socket.emit('pong', { timestamp: Date.now(), ...data });
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    connectionStats.currentConnections--;
    console.log(`🔌 Client disconnected: ${socket.id} (${connectionStats.currentConnections} active) - Reason: ${reason}`);
    
    if (socket.userData) {
      const { roomId, peerId, displayName } = socket.userData;
      
      // Remove from room
      if (rooms.has(roomId)) {
        const roomPeers = rooms.get(roomId);
        roomPeers.delete(socket.id);
        
        // Notify other peers
        socket.to(roomId).emit('peer-left', {
          peerId,
          displayName,
          socketId: socket.id,
          reason,
          timestamp: Date.now()
        });
        
        // Clean up empty rooms
        if (roomPeers.size === 0) {
          rooms.delete(roomId);
          console.log(`🗑️ Room ${roomId} deleted (empty)`);
        } else {
          console.log(`📊 Room ${roomId} now has ${roomPeers.size} peers`);
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

// Cleanup stale rooms periodically
setInterval(() => {
  const now = Date.now();
  const staleThreshold = 30 * 60 * 1000; // 30 minutes
  
  for (const [roomId, peers] of rooms.entries()) {
    for (const [socketId, peer] of peers.entries()) {
      if (now - peer.joinedAt > staleThreshold) {
        peers.delete(socketId);
        console.log(`🧹 Cleaned up stale peer ${peer.peerId} from room ${roomId}`);
      }
    }
    
    if (peers.size === 0) {
      rooms.delete(roomId);
      console.log(`🧹 Cleaned up empty room ${roomId}`);
    }
  }
}, 10 * 60 * 1000); // Run every 10 minutes

// Start server
const PORT = process.env.PORT || 8080; // Cloud Run uses PORT env variable
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🎵 PeddleNet WebSocket Server running on port ${PORT}`);
  console.log(`🔍 Health check: http://localhost:${PORT}/health`);
  console.log(`☁️  Platform: Google Cloud Run`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'production'}`);
});

// Graceful shutdown for Cloud Run
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  
  io.emit('server-shutdown', { 
    message: 'Server is shutting down for maintenance',
    timestamp: Date.now()
  });
  
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

// Enhanced error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

module.exports = { app, server, io };

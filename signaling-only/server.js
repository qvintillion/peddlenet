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
      /^https:\/\/[a-zA-Z0-9-]+\.ngrok(-free)?\.app$/,
      /^https:\/\/[a-zA-Z0-9-]+\.ngrok\.io$/,
      /^https:\/\/[a-zA-Z0-9-]+\.vercel\.app$/
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
const rooms = new Map(); // roomId -> { peers: Map, messages: Array, created: timestamp }
const MESSAGE_HISTORY_LIMIT = 100; // Keep last 100 messages per room
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
    /^https:\/\/[a-zA-Z0-9-]+\.ngrok(-free)?\.app$/,
    /^https:\/\/[a-zA-Z0-9-]+\.ngrok\.io$/,
    /^https:\/\/[a-zA-Z0-9-]+\.vercel\.app$/
  ],
  methods: ["GET", "POST", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

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
      totalPeers: Array.from(rooms.values()).reduce((sum, room) => sum + room.peers.size, 0)
    },
    memory: {
      used: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
      total: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB',
      rss: Math.round(memoryUsage.rss / 1024 / 1024) + 'MB'
    },
    timestamp: Date.now(),
    version: '1.2.0'
  });
});

// Metrics endpoint for monitoring
app.get('/metrics', (req, res) => {
  res.json({
    connections: connectionStats,
    rooms: {
      count: rooms.size,
      details: Array.from(rooms.entries()).map(([roomId, room]) => ({
        roomId: roomId.substring(0, 8) + '...', // Privacy: only show partial room ID
        peerCount: room.peers.size,
        messageCount: room.messages.length,
        createdAt: Math.min(...Array.from(room.peers.values()).map(p => p.joinedAt))
      }))
    },
    uptime: process.uptime(),
    timestamp: Date.now()
  });
});

// Basic endpoint to check if signaling is available
app.get('/signaling-proxy', (req, res) => {
  res.json({
    signalingAvailable: true,
    endpoint: '/socket.io/',
    version: '1.2.0',
    features: ['peer-discovery', 'connection-assistance', 'room-management'],
    timestamp: Date.now()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'PeddleNet Signaling Server',
    version: '1.2.0',
    status: 'running',
    description: 'WebRTC signaling server for P2P festival chat',
    endpoints: {
      health: '/health',
      metrics: '/metrics',
      signaling: '/socket.io/'
    },
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

  // Enhanced join room with better error handling
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
      
      // Store enhanced user info
      socket.userData = { 
        roomId, 
        peerId, 
        displayName, 
        joinedAt: Date.now(),
        lastSeen: Date.now()
      };
      
      // Initialize room if it doesn't exist
      if (!rooms.has(roomId)) {
        rooms.set(roomId, {
          peers: new Map(),
          messages: [],
          created: Date.now()
        });
      }
      
      const room = rooms.get(roomId);
      const roomPeers = room.peers;
      roomPeers.set(socket.id, {
        peerId,
        displayName,
        joinedAt: Date.now(),
        socketId: socket.id
      });
      
      // Send recent message history to new user
      if (room.messages.length > 0) {
        socket.emit('message-history', room.messages);
      }
      
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
      
      socket.emit('room-peers', currentPeers); // Send array directly, not wrapped in object
      
      console.log(`📊 Room ${roomId} now has ${roomPeers.size} peers`);
      
    } catch (error) {
      console.error('Error in join-room:', error);
      socket.emit('error', { message: 'Failed to join room', code: 'JOIN_ROOM_ERROR' });
    }
  });

  // Enhanced peer connection requests with timeout handling
  socket.on('request-connection', ({ targetSocketId, fromPeerId, timeout = 30000 }) => {
    try {
      socket.to(targetSocketId).emit('connection-request', {
        fromPeerId,
        fromSocketId: socket.id,
        timestamp: Date.now(),
        timeout
      });
      
      // Set timeout for connection request
      setTimeout(() => {
        socket.emit('connection-timeout', { targetSocketId, fromPeerId });
      }, timeout);
      
    } catch (error) {
      console.error('Error in request-connection:', error);
      socket.emit('error', { message: 'Failed to send connection request', code: 'CONNECTION_REQUEST_ERROR' });
    }
  });

  // Enhanced connection responses
  socket.on('connection-response', ({ targetSocketId, accepted, toPeerId, reason }) => {
    try {
      socket.to(targetSocketId).emit('connection-response', {
        accepted,
        toPeerId,
        fromSocketId: socket.id,
        reason,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error in connection-response:', error);
    }
  });

  // Handle chat messages (persistent messaging)
  socket.on('chat-message', ({ roomId, message }) => {
    try {
      if (!socket.userData || socket.userData.roomId !== roomId) {
        console.warn('Unauthorized message attempt');
        return;
      }

      const room = rooms.get(roomId);
      if (!room) {
        console.warn('Message to non-existent room:', roomId);
        return;
      }

      // Create message with server timestamp and ID
      const chatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content: message.content,
        sender: socket.userData.displayName,
        timestamp: Date.now(),
        type: 'chat'
      };

      // Store message in room history
      room.messages.push(chatMessage);
      
      // Keep only recent messages
      if (room.messages.length > MESSAGE_HISTORY_LIMIT) {
        room.messages = room.messages.slice(-MESSAGE_HISTORY_LIMIT);
      }

      // Broadcast to all users in room (including sender for confirmation)
      io.to(roomId).emit('chat-message', chatMessage);

      console.log(`Message in ${roomId} from ${socket.userData.displayName}: ${message.content}`);
      
    } catch (error) {
      console.error('Error in chat-message:', error);
      socket.emit('error', { message: 'Failed to send chat message', code: 'CHAT_MESSAGE_ERROR' });
    }
  });

  // Room announcements (not P2P chat messages)
  socket.on('room-message', ({ roomId, message, type = 'announcement' }) => {
    try {
      if (socket.userData && socket.userData.roomId === roomId) {
        socket.to(roomId).emit('room-message', {
          ...message,
          type,
          timestamp: Date.now(),
          fromSocket: socket.id
        });
      }
    } catch (error) {
      console.error('Error in room-message:', error);
    }
  });

  // Heartbeat mechanism for connection monitoring
  socket.on('ping', (data) => {
    if (socket.userData) {
      socket.userData.lastSeen = Date.now();
    }
    socket.emit('pong', { timestamp: Date.now(), ...data });
  });

  // Handle disconnection with cleanup
  socket.on('disconnect', (reason) => {
    connectionStats.currentConnections--;
    console.log(`🔌 Client disconnected: ${socket.id} (${connectionStats.currentConnections} active) - Reason: ${reason}`);
    
    if (socket.userData) {
      const { roomId, peerId, displayName } = socket.userData;
      
      // Remove from room
      if (rooms.has(roomId)) {
        const room = rooms.get(roomId);
        const roomPeers = room.peers;
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

  // Connection error handling
  socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
  });
});

// Utility function to format uptime
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

// Periodic cleanup of stale rooms (every 10 minutes)
setInterval(() => {
  const now = Date.now();
  const staleThreshold = 30 * 60 * 1000; // 30 minutes
  
  for (const [roomId, room] of rooms.entries()) {
    const peers = room.peers;
    // Remove stale peers
    for (const [socketId, peer] of peers.entries()) {
      if (now - peer.joinedAt > staleThreshold) {
        peers.delete(socketId);
        console.log(`🧹 Cleaned up stale peer ${peer.peerId} from room ${roomId}`);
      }
    }
    
    // Remove empty rooms
    if (peers.size === 0) {
      rooms.delete(roomId);
      console.log(`🧹 Cleaned up empty room ${roomId}`);
    }
  }
}, 10 * 60 * 1000);

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🎵 PeddleNet Signaling Server v1.2.0 running on port ${PORT}`);
  console.log(`🔍 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 Metrics: http://localhost:${PORT}/metrics`);
  console.log(`🌐 Production ready with enhanced monitoring and reliability`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  
  // Notify all connected clients
  io.emit('server-shutdown', { 
    message: 'Server is shutting down for maintenance',
    timestamp: Date.now()
  });
  
  // Close server
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

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

module.exports = { app, server, io };

// signaling-server.js - Simple Node.js signaling server
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://*.ngrok.io",
      "https://*.ngrok-free.app", // New ngrok domain format
      /^https:\/\/[a-zA-Z0-9-]+\.ngrok(-free)?\.app$/,
      /^https:\/\/[a-zA-Z0-9-]+\.ngrok\.io$/
    ],
    methods: ["GET", "POST"],
    credentials: true
  },
  // Enhanced settings for better mobile/cross-device connectivity
  pingTimeout: 60000,
  pingInterval: 25000,
  upgradeTimeout: 30000,
  allowUpgrades: true
});

// Store room information
const rooms = new Map();

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    rooms: rooms.size,
    timestamp: Date.now()
  });
});

// Proxy endpoint for ngrok environments
app.get('/signaling-proxy', (req, res) => {
  // This endpoint can be used to check if signaling should be enabled
  res.json({
    signalingAvailable: true,
    endpoint: '/socket.io/',
    timestamp: Date.now()
  });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Join room for peer discovery
  socket.on('join-room', ({ roomId, peerId, displayName }) => {
    console.log(`${displayName} (${peerId}) joining room: ${roomId}`);
    
    // Leave any existing rooms
    socket.rooms.forEach(room => {
      if (room !== socket.id) {
        socket.leave(room);
      }
    });
    
    // Join the new room
    socket.join(roomId);
    
    // Store user info
    socket.userData = { roomId, peerId, displayName };
    
    // Initialize room if it doesn't exist
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Map());
    }
    
    const roomPeers = rooms.get(roomId);
    roomPeers.set(socket.id, { peerId, displayName, joinedAt: Date.now() });
    
    // Notify existing peers about new user
    socket.to(roomId).emit('peer-joined', {
      peerId,
      displayName,
      socketId: socket.id
    });
    
    // Send current peers to new user
    const currentPeers = Array.from(roomPeers.values())
      .filter(peer => peer.peerId !== peerId);
    
    socket.emit('room-peers', currentPeers);
    
    console.log(`Room ${roomId} now has ${roomPeers.size} peers`);
  });

  // Handle peer connection requests
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

  // Handle room messages (for announcements, not P2P chat)
  socket.on('room-message', ({ roomId, message, type = 'announcement' }) => {
    socket.to(roomId).emit('room-message', {
      ...message,
      type,
      timestamp: Date.now(),
      fromSocket: socket.id
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
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
          socketId: socket.id
        });
        
        // Clean up empty rooms
        if (roomPeers.size === 0) {
          rooms.delete(roomId);
          console.log(`Room ${roomId} deleted (empty)`);
        } else {
          console.log(`Room ${roomId} now has ${roomPeers.size} peers`);
        }
      }
    }
  });

  // Heartbeat for connection monitoring
  socket.on('ping', () => {
    socket.emit('pong');
  });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🎵 Festival Chat Signaling Server running on port ${PORT}`);
  console.log(`🔍 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = { app, server, io };

// signaling-server.js - Enhanced for persistent messaging
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const os = require('os');

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

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://localhost:3000",
      ...localIPs, // Include all local network IPs
      "https://*.ngrok.io",
      "https://*.ngrok-free.app",
      /^https:\/\/[a-zA-Z0-9-]+\.ngrok(-free)?\.app$/,
      /^https:\/\/[a-zA-Z0-9-]+\.ngrok\.io$/,
      /^http:\/\/192\.168\.[0-9]+\.[0-9]+:3000$/, // Local network pattern
      /^http:\/\/10\.[0-9]+\.[0-9]+\.[0-9]+:3000$/, // Another local pattern
      /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.[0-9]+\.[0-9]+:3000$/, // Private network
      "https://peddlenet.app",
      "https://*.vercel.app"
    ],
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["*"]
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  upgradeTimeout: 30000,
  allowUpgrades: true,
  // Enhanced for mobile connections
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

// Store room information AND messages
const rooms = new Map(); // roomId -> { peers: Map, messages: Array, created: timestamp }
const roomCodes = new Map(); // roomCode -> roomId mapping for server-side lookup
const MESSAGE_HISTORY_LIMIT = 100; // Keep last 100 messages per room

// Helper function to clean old rooms (optional)
function cleanupOldRooms() {
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  rooms.forEach((room, roomId) => {
    if (room.created < oneDayAgo && room.peers.size === 0) {
      rooms.delete(roomId);
      // Also clean up associated room codes
      for (const [code, mappedRoomId] of roomCodes.entries()) {
        if (mappedRoomId === roomId) {
          roomCodes.delete(code);
          console.log(`Cleaned up room code: ${code}`);
        }
      }
      console.log(`Cleaned up old room: ${roomId}`);
    }
  });
}

// Clean up old rooms every hour
setInterval(cleanupOldRooms, 60 * 60 * 1000);

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    rooms: rooms.size,
    roomCodes: roomCodes.size,
    totalUsers: Array.from(rooms.values()).reduce((sum, room) => sum + room.peers.size, 0),
    timestamp: Date.now()
  });
});

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

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Join room for both peer discovery AND messaging
  socket.on('join-room', ({ roomId, peerId, displayName }) => {
    console.log(`${displayName} (${peerId}) joining room: ${roomId}`);
    
    // Leave any existing rooms first
    socket.rooms.forEach(room => {
      if (room !== socket.id) {
        socket.leave(room);
        // Also remove from our room tracking
        const oldRoom = rooms.get(room);
        if (oldRoom && oldRoom.peers.has(socket.id)) {
          const oldPeer = oldRoom.peers.get(socket.id);
          oldRoom.peers.delete(socket.id);
          socket.to(room).emit('peer-left', {
            peerId: oldPeer.peerId,
            displayName: oldPeer.displayName,
            socketId: socket.id
          });
          console.log(`Cleaned up old connection for ${oldPeer.displayName} from room ${room}`);
        }
      }
    });
    
    // Join the new room
    socket.join(roomId);
    
    // Store user info
    socket.userData = { roomId, peerId, displayName };
    
    // Initialize room if it doesn't exist
    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        peers: new Map(),
        messages: [],
        created: Date.now()
      });
    }
    
    const room = rooms.get(roomId);
    
    // Remove any existing connections for this peer ID across all sockets
    let removedOldConnections = 0;
    for (const [socketId, peer] of room.peers.entries()) {
      if (peer.peerId === peerId && socketId !== socket.id) {
        console.log(`Removing duplicate connection for peer ${peerId}: ${socketId}`);
        room.peers.delete(socketId);
        // Try to disconnect the old socket if still connected
        const oldSocket = io.sockets.sockets.get(socketId);
        if (oldSocket) {
          oldSocket.disconnect(true);
        }
        removedOldConnections++;
      }
    }
    
    if (removedOldConnections > 0) {
      console.log(`Cleaned up ${removedOldConnections} duplicate connections for peer ${peerId}`);
    }
    
    // Add this connection
    room.peers.set(socket.id, { 
      peerId, 
      displayName, 
      joinedAt: Date.now(),
      socketId: socket.id
    });
    
    // Send recent message history to new user
    if (room.messages.length > 0) {
      socket.emit('message-history', room.messages);
    }
    
    // Notify existing peers about new user (only if it's a truly new peer)
    if (removedOldConnections === 0) {
      socket.to(roomId).emit('peer-joined', {
        peerId,
        displayName,
        socketId: socket.id
      });
    }
    
    // Send current peers to new user (deduplicated by peerId)
    const uniquePeers = Array.from(room.peers.values())
      .filter(peer => peer.peerId !== peerId)
      .reduce((acc, peer) => {
        const existing = acc.find(p => p.peerId === peer.peerId);
        if (!existing) acc.push(peer);
        return acc;
      }, []);
    
    socket.emit('room-peers', uniquePeers);
    
    const totalUniquePeers = new Set(Array.from(room.peers.values()).map(p => p.peerId)).size;
    console.log(`Room ${roomId}: ${room.peers.size} connections, ${totalUniquePeers} unique peers`);
  });

  // Handle chat messages (NEW - persistent messaging)
  socket.on('chat-message', ({ roomId, message }) => {
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
  });

  // Handle peer connection requests (for P2P optimization)
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

  // Handle room announcements
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
        const room = rooms.get(roomId);
        room.peers.delete(socket.id);
        
        // Notify other peers
        socket.to(roomId).emit('peer-left', {
          peerId,
          displayName,
          socketId: socket.id
        });
        
        console.log(`Room ${roomId} now has ${room.peers.size} peers`);
        
        // Note: Don't delete empty rooms immediately
        // They might be rejoined soon
      }
    }
  });

  // Heartbeat for connection monitoring
  socket.on('ping', () => {
    socket.emit('pong');
  });
});

// Start server with port conflict handling
const PORT = process.env.PORT || 3001;
const FALLBACK_PORTS = [3001, 3002, 3003, 3004, 3005];

async function startServer(ports = FALLBACK_PORTS) {
  for (const port of ports) {
    try {
      await new Promise((resolve, reject) => {
        const serverInstance = server.listen(port, '0.0.0.0', () => { // Listen on all interfaces
          console.log(`🎵 Festival Chat Server running on port ${port}`);
          console.log(`🔍 Health check: http://localhost:${port}/health`);
          console.log(`💬 Now supports persistent messaging!`);
          
          // Show all accessible URLs
          console.log('📱 Mobile-accessible URLs:');
          const interfaces = os.networkInterfaces();
          for (const name of Object.keys(interfaces)) {
            for (const iface of interfaces[name]) {
              if (iface.family === 'IPv4' && !iface.internal) {
                console.log(`  http://${iface.address}:${port}`);
              }
            }
          }
          console.log('');
          
          resolve(serverInstance);
        });
        
        serverInstance.on('error', (err) => {
          if (err.code === 'EADDRINUSE') {
            console.log(`Port ${port} is busy, trying next port...`);
            reject(err);
          } else {
            reject(err);
          }
        });
      });
      break; // Successfully started
    } catch (err) {
      if (err.code === 'EADDRINUSE' && port !== ports[ports.length - 1]) {
        continue; // Try next port
      } else {
        console.error(`Failed to start server: ${err.message}`);
        process.exit(1);
      }
    }
  }
}

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = { app, server, io };

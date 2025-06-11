// signaling-server-firebase.js - Firebase-enhanced signaling server
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

// Firebase Admin SDK (optional - for room persistence)
let admin = null;
let db = null;

try {
  admin = require('firebase-admin');
  
  // Initialize Firebase Admin
  if (!admin.apps.length) {
    admin.initializeApp({
      // Uses Application Default Credentials in Cloud Run
      // or set GOOGLE_APPLICATION_CREDENTIALS locally
    });
  }
  
  db = admin.firestore();
  console.log('✅ Firebase initialized - Room persistence enabled');
} catch (error) {
  console.log('📝 Firebase not configured - Using memory-only storage');
  console.log('💡 To enable room persistence, install firebase-admin');
}

const app = express();
const server = createServer(app);

// Enhanced Socket.IO configuration for Google Cloud
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
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
      /^https:\/\/[a-zA-Z0-9-]+\.web\.app$/
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
  allowEIO3: true,
  transports: ['websocket', 'polling'],
  // Connection state recovery
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
    skipMiddlewares: true,
  }
});

// In-memory storage (fallback when Firebase not available)
const rooms = new Map();
const connectionStats = {
  totalConnections: 0,
  currentConnections: 0,
  peakConnections: 0,
  startTime: Date.now(),
  cloudProvider: 'Google Cloud Run',
  firebaseEnabled: !!db
};

// Middleware - Configure CORS for all routes
app.use(cors({
  origin: [
    "http://localhost:3000",
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
    /^https:\/\/[a-zA-Z0-9-]+\.web\.app$/
  ],
  methods: ["GET", "POST", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

// Enhanced health check for Google Cloud
app.get('/health', async (req, res) => {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  
  // Test Firebase connection if enabled
  let firebaseStatus = 'disabled';
  if (db) {
    try {
      await db.collection('_health').doc('test').set({ timestamp: Date.now() });
      firebaseStatus = 'connected';
    } catch (error) {
      firebaseStatus = 'error';
    }
  }
  
  res.json({ 
    status: 'ok',
    service: 'PeddleNet Signaling Server',
    version: '2.0.0-firebase',
    environment: process.env.NODE_ENV || 'development',
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
    firebase: {
      status: firebaseStatus,
      roomPersistence: firebaseStatus === 'connected'
    },
    memory: {
      used: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
      total: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB',
      rss: Math.round(memoryUsage.rss / 1024 / 1024) + 'MB'
    },
    timestamp: Date.now()
  });
});

// Google Cloud monitoring endpoint
app.get('/metrics', async (req, res) => {
  let firebaseRooms = 0;
  
  if (db) {
    try {
      const roomsSnapshot = await db.collection('rooms').get();
      firebaseRooms = roomsSnapshot.size;
    } catch (error) {
      console.error('Error fetching Firebase rooms:', error);
    }
  }
  
  res.json({
    service: 'peddlenet-signaling',
    version: '2.0.0-firebase',
    connections: connectionStats,
    rooms: {
      memory: rooms.size,
      firebase: firebaseRooms,
      total: rooms.size + firebaseRooms
    },
    uptime: process.uptime(),
    platform: 'Google Cloud Run',
    timestamp: Date.now()
  });
});

// Firebase room persistence helpers
async function persistRoom(roomId, roomData) {
  if (!db) return;
  
  try {
    await db.collection('rooms').doc(roomId).set({
      ...roomData,
      createdAt: admin.firestore.Timestamp.now(),
      lastActivity: admin.firestore.Timestamp.now(),
      platform: 'Google Cloud Run'
    });
  } catch (error) {
    console.error('Error persisting room:', error);
  }
}

async function persistPeer(roomId, peerId, peerData) {
  if (!db) return;
  
  try {
    await db.collection('rooms').doc(roomId).collection('peers').doc(peerId).set({
      ...peerData,
      joinedAt: admin.firestore.Timestamp.now(),
      lastSeen: admin.firestore.Timestamp.now(),
      status: 'online'
    });
  } catch (error) {
    console.error('Error persisting peer:', error);
  }
}

async function removePeer(roomId, peerId) {
  if (!db) return;
  
  try {
    await db.collection('rooms').doc(roomId).collection('peers').doc(peerId).delete();
    
    // Check if room is empty and clean up
    const peersSnapshot = await db.collection('rooms').doc(roomId).collection('peers').get();
    if (peersSnapshot.empty) {
      await db.collection('rooms').doc(roomId).delete();
      console.log(`🧹 Firebase: Cleaned up empty room ${roomId}`);
    }
  } catch (error) {
    console.error('Error removing peer:', error);
  }
}

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'PeddleNet Signaling Server',
    version: '2.0.0-firebase',
    status: 'running',
    platform: 'Google Cloud Run',
    description: 'Firebase-enhanced WebRTC signaling server for P2P festival chat',
    features: [
      'peer-discovery',
      'connection-assistance', 
      'room-management',
      db ? 'firebase-persistence' : 'memory-storage',
      'google-cloud-optimized'
    ],
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

  // Enhanced join room with Firebase persistence
  socket.on('join-room', async ({ roomId, peerId, displayName }) => {
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
        rooms.set(roomId, new Map());
        
        // Persist room to Firebase
        await persistRoom(roomId, {
          roomId,
          createdBy: peerId,
          createdByName: displayName
        });
      }
      
      const roomPeers = rooms.get(roomId);
      const peerData = {
        peerId,
        displayName,
        joinedAt: Date.now(),
        socketId: socket.id
      };
      
      roomPeers.set(socket.id, peerData);
      
      // Persist peer to Firebase
      await persistPeer(roomId, peerId, {
        displayName,
        socketId: socket.id
      });
      
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
      
      socket.emit('room-peers', {
        peers: currentPeers,
        roomId,
        timestamp: Date.now()
      });
      
      console.log(`📊 Room ${roomId} now has ${roomPeers.size} peers`);
      
    } catch (error) {
      console.error('Error in join-room:', error);
      socket.emit('error', { message: 'Failed to join room', code: 'JOIN_ROOM_ERROR' });
    }
  });

  // Enhanced peer connection requests
  socket.on('request-connection', ({ targetSocketId, fromPeerId, timeout = 30000 }) => {
    try {
      socket.to(targetSocketId).emit('connection-request', {
        fromPeerId,
        fromSocketId: socket.id,
        timestamp: Date.now(),
        timeout
      });
      
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

  // Room announcements
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

  // Heartbeat mechanism
  socket.on('ping', (data) => {
    if (socket.userData) {
      socket.userData.lastSeen = Date.now();
    }
    socket.emit('pong', { timestamp: Date.now(), ...data });
  });

  // Handle disconnection with Firebase cleanup
  socket.on('disconnect', async (reason) => {
    connectionStats.currentConnections--;
    console.log(`🔌 Client disconnected: ${socket.id} (${connectionStats.currentConnections} active) - Reason: ${reason}`);
    
    if (socket.userData) {
      const { roomId, peerId, displayName } = socket.userData;
      
      // Remove from memory storage
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
        
        // Clean up empty rooms from memory
        if (roomPeers.size === 0) {
          rooms.delete(roomId);
          console.log(`🗑️ Memory: Room ${roomId} deleted (empty)`);
        } else {
          console.log(`📊 Room ${roomId} now has ${roomPeers.size} peers`);
        }
      }
      
      // Remove from Firebase
      await removePeer(roomId, peerId);
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

// Enhanced cleanup with Firebase
setInterval(async () => {
  const now = Date.now();
  const staleThreshold = 30 * 60 * 1000; // 30 minutes
  
  // Clean up memory storage
  for (const [roomId, peers] of rooms.entries()) {
    for (const [socketId, peer] of peers.entries()) {
      if (now - peer.joinedAt > staleThreshold) {
        peers.delete(socketId);
        console.log(`🧹 Memory: Cleaned up stale peer ${peer.peerId} from room ${roomId}`);
      }
    }
    
    if (peers.size === 0) {
      rooms.delete(roomId);
      console.log(`🧹 Memory: Cleaned up empty room ${roomId}`);
    }
  }
  
  // Clean up Firebase storage
  if (db) {
    try {
      const staleRoomsQuery = db.collection('rooms')
        .where('lastActivity', '<', admin.firestore.Timestamp.fromMillis(now - staleThreshold));
      
      const staleRooms = await staleRoomsQuery.get();
      
      for (const doc of staleRooms.docs) {
        await doc.ref.delete();
        console.log(`🧹 Firebase: Cleaned up stale room ${doc.id}`);
      }
    } catch (error) {
      console.error('Error cleaning up Firebase:', error);
    }
  }
}, 10 * 60 * 1000);

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🎵 PeddleNet Signaling Server v2.0.0-firebase running on port ${PORT}`);
  console.log(`🔍 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 Metrics: http://localhost:${PORT}/metrics`);
  console.log(`🔥 Firebase persistence: ${db ? 'enabled' : 'disabled'}`);
  console.log(`☁️  Platform: Google Cloud Run optimized`);
});

// Graceful shutdown
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

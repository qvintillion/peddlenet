// signaling-server-sqlite-backup.js - Backup of original SQLite server v2.1.0
// Created: June 10, 2025 - Before adding enhanced connection stability features
// This was the working production version with SQLite persistence and room codes

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
console.log('🔧 Phase 2 Optimizations: Transport tuning + Connection throttling enabled');

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
  
  // Phase 2: Optimized transport configuration for better reliability
  transports: ['polling', 'websocket'], // Polling first for reliability
  upgradeTimeout: 5000,     // Reduced from 30s - faster failure detection
  pingTimeout: 30000,       // Reduced from 60s - quicker disconnect detection 
  pingInterval: 10000,      // Reduced from 25s - more frequent health checks
  
  // Enhanced connection handling
  allowUpgrades: true,      // Allow transport upgrades
  perMessageDeflate: false, // Disable compression for lower latency
  httpCompression: false,   // Disable HTTP compression for speed
  
  // Connection quality improvements  
  maxHttpBufferSize: 1e6,   // 1MB buffer for message bursts
  connectTimeout: 10000,    // 10s connection timeout
  
  // Enhanced polling configuration for mobile reliability
  polling: {
    maxHttpBufferSize: 1e6  // 1MB polling buffer
  },
  
  // WebSocket-specific optimizations
  websocket: {
    compression: false,     // Disable compression for speed
    perMessageDeflate: false
  }
});

// Store room information (peers only, messages in database)
const rooms = new Map(); // roomId -> { peers: Map, created: timestamp }

// Phase 2: Connection throttling to prevent rapid attempts (Mobile-optimized)
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
app.use(express.json());

// Root endpoint for service info
app.get('/', (req, res) => {
  res.json({
    service: 'Festival Chat WebSocket Server',
    version: '2.0.0',
    status: 'running',
    timestamp: Date.now(),
    endpoints: {
      health: '/health',
      registerCode: '/register-room-code',
      resolveCode: '/resolve-room-code/:code',
      debugRooms: '/debug/rooms'
    },
    websocket: {
      available: true,
      transports: ['websocket', 'polling']
    }
  });
});

// Enhanced health check endpoint with database stats and Phase 2 metrics
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
    version: '2.1.0', // Updated for Phase 2
    
    // Connection and room metrics
    connections: {
      rooms: rooms.size,
      totalUsers: Array.from(rooms.values()).reduce((sum, room) => sum + room.peers.size, 0),
      socketIOConnections: io.engine.clientsCount || 0
    },
    
    // Phase 2: Connection throttling metrics
    throttling: {
      activeIPs: connectionAttempts.size,
      blockedIPs: Array.from(connectionAttempts.values()).filter(a => a.blocked).length,
      totalAttempts: Array.from(connectionAttempts.values()).reduce((sum, a) => sum + a.count, 0)
    },
    
    // Memory and performance
    memory: {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
      rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB'
    },
    
    // Phase 2: Transport configuration info
    transport: {
      transports: ['polling', 'websocket'],
      upgradeTimeout: '5s',
      pingInterval: '10s',
      pingTimeout: '30s',
      compression: false
    },
    
    database: dbStats || { error: 'Database unavailable' }
  });
});

// Enhanced room code storage with better persistence and automatic registration
const roomCodes = new Map(); // code -> { roomId, timestamp, hits }
const roomCodesByRoomId = new Map(); // roomId -> Set of codes for faster lookup

// Enhanced room code registration with better tracking
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

// Enhanced room code resolution with automatic registration and smart fallback
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

// Helper function to generate room codes on server (simplified version)
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

// Helper function to generate possible room IDs (simplified version)
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

// Enhanced debug endpoint to view rooms and room codes
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
      roomCodes: roomCodeStats
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Debug endpoint to test room code generation
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

// Socket.io connection handling with Phase 2 throttling
io.use((socket, next) => {
  // Phase 2: Apply connection throttling at Socket.IO level
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
    console.log(`🚫 Socket.IO connection throttled for IP: ${clientIP} (${attempts.count} attempts)`);
    return next(new Error('Connection rate limit exceeded'));
  }
  
  // Increment counter
  attempts.count++;
  attempts.lastAttempt = now;
  
  // Block if limit exceeded
  if (attempts.count > CONNECTION_LIMIT) {
    attempts.blocked = true;
    console.log(`⚠️ Socket.IO IP ${clientIP} exceeded connection limit (${attempts.count}/${CONNECTION_LIMIT})`);
    connectionAttempts.set(clientIP, attempts);
    return next(new Error('Connection rate limit exceeded'));
  }
  
  connectionAttempts.set(clientIP, attempts);
  next(); // Allow connection
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Add error handling for socket
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  socket.on('disconnect', (reason) => {
    console.log('Client disconnected:', socket.id, 'reason:', reason);
    
    if (socket.userData) {
      const { roomId, peerId, displayName } = socket.userData;
      
      // Remove from room
      if (rooms.has(roomId)) {
        const room = rooms.get(roomId);
        room.peers.delete(socket.id);
        
        // Update participant count in database (with error handling)
        persistence.updateParticipantCount(roomId, room.peers.size)
          .catch(err => console.error('Error updating participant count on disconnect:', err));
        
        // Notify other peers
        socket.to(roomId).emit('peer-left', {
          peerId,
          displayName,
          socketId: socket.id
        });
        
        console.log(`Room ${roomId} now has ${room.peers.size} peers`);
      }
    }
  });

  // Join room for both peer discovery AND messaging
  socket.on('join-room', async ({ roomId, peerId, displayName }) => {
    console.log(`${displayName} (${peerId}) joining room: ${roomId}`);
    
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
          
          console.log(`🤖 Auto-registered room code on join: ${autoCode} -> ${roomId}`);
        }
      } catch (error) {
        console.warn('Failed to auto-register room code for', roomId, error);
      }
    }
    
    try {
      // Leave any existing rooms first
      socket.rooms.forEach(room => {
        if (room !== socket.id) {
          socket.leave(room);
          const oldRoom = rooms.get(room);
          if (oldRoom && oldRoom.peers.has(socket.id)) {
            const oldPeer = oldRoom.peers.get(socket.id);
            oldRoom.peers.delete(socket.id);
            socket.to(room).emit('peer-left', {
              peerId: oldPeer.peerId,
              displayName: oldPeer.displayName,
              socketId: socket.id
            });
            
            // Update participant count in database
            persistence.updateParticipantCount(room, oldRoom.peers.size).catch(console.error);
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
          created: Date.now()
        });
      }
      
      const room = rooms.get(roomId);
      
      // Remove any existing connections for this peer ID
      let removedOldConnections = 0;
      for (const [socketId, peer] of room.peers.entries()) {
        if (peer.peerId === peerId && socketId !== socket.id) {
          console.log(`Removing duplicate connection for peer ${peerId}: ${socketId}`);
          room.peers.delete(socketId);
          const oldSocket = io.sockets.sockets.get(socketId);
          if (oldSocket) {
            oldSocket.disconnect(true);
          }
          removedOldConnections++;
        }
      }
      
      // Add this connection
      room.peers.set(socket.id, { 
        peerId, 
        displayName, 
        joinedAt: Date.now(),
        socketId: socket.id
      });
      
      // Update participant count in database
      await persistence.updateParticipantCount(roomId, room.peers.size);
      
      // Load and send message history from database
      try {
        const messageHistory = await persistence.getRoomMessages(roomId, 100);
        if (messageHistory.length > 0) {
          socket.emit('message-history', messageHistory);
        }
      } catch (err) {
        console.error('Error loading message history:', err);
      }
      
      // Notify existing peers about new user
      if (removedOldConnections === 0) {
        socket.to(roomId).emit('peer-joined', {
          peerId,
          displayName,
          socketId: socket.id
        });
      }
      
      // Send current peers to new user
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
      
    } catch (err) {
      console.error('Error in join-room:', err);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  // Handle chat messages with database persistence
  socket.on('chat-message', async ({ roomId, message }) => {
    if (!socket.userData || socket.userData.roomId !== roomId) {
      console.warn('Unauthorized message attempt');
      return;
    }

    const room = rooms.get(roomId);
    if (!room) {
      console.warn('Message to non-existent room:', roomId);
      return;
    }

    try {
      // Create message with server timestamp and ID
      const chatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content: message.content,
        sender: socket.userData.displayName,
        timestamp: Date.now(),
        type: 'chat'
      };

      // Save message to database
      await persistence.saveMessage(roomId, chatMessage);

      // Broadcast to all users in room (including sender for confirmation)
      io.to(roomId).emit('chat-message', chatMessage);

      console.log(`💾 Message saved to DB and broadcast in ${roomId} from ${socket.userData.displayName}`);
      
    } catch (err) {
      console.error('Error handling chat message:', err);
      socket.emit('error', { message: 'Failed to save message' });
    }
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

  // Heartbeat for connection monitoring
  socket.on('ping', () => {
    socket.emit('pong');
  });
});

// Start server with port conflict handling
const PORT = process.env.PORT || 3001;

async function startServer() {
  // Initialize database first
  await initializeDatabase();
  
  try {
    await new Promise((resolve, reject) => {
      const serverInstance = server.listen(PORT, '0.0.0.0', () => {
        console.log(`🎵 Festival Chat Server running on port ${PORT}`);
        console.log(`🔍 Health check: http://localhost:${PORT}/health`);
        console.log(`💾 SQLite persistence enabled!`);
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
        console.error(`❌ Failed to start server on port ${PORT}:`, err.message);
        reject(err);
      });
    });
  } catch (err) {
    console.error(`💥 Server startup failed:`, err.message);
    process.exit(1);
  }
}

// Enhanced graceful shutdown with timeout
let isShuttingDown = false;

async function gracefulShutdown(signal) {
  if (isShuttingDown) {
    console.log('🔄 Shutdown already in progress...');
    return;
  }
  
  isShuttingDown = true;
  console.log(`📴 ${signal} received, shutting down gracefully...`);
  
  // Force exit after 3 seconds if shutdown hangs
  const forceExitTimer = setTimeout(() => {
    console.log('⏰ Force shutdown - timeout reached');
    process.exit(1);
  }, 3000);
  
  try {
    // Close socket.io first
    console.log('🔌 Closing socket connections...');
    io.close();
    
    // Close database
    console.log('💾 Closing database...');
    await persistence.close();
    
    // Close HTTP server
    console.log('🌐 Closing HTTP server...');
    server.close(() => {
      console.log('✅ Server shutdown complete');
      clearTimeout(forceExitTimer);
      process.exit(0);
    });
    
    // If server.close() callback doesn't fire, force exit
    setTimeout(() => {
      console.log('⚠️ Server close timeout, forcing exit');
      clearTimeout(forceExitTimer);
      process.exit(0);
    }, 1000);
    
  } catch (error) {
    console.error('❌ Shutdown error:', error);
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
  console.log('👋 Process about to exit with code:', code);
});

process.on('exit', (code) => {
  console.log('👋 Process exited with code:', code);
});

startServer();

// Enhanced error handling to prevent crashes
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  console.error('Stack:', error.stack);
  console.error('Server will continue running...');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  console.error('Server will continue running...');
});

// Handle socket.io errors gracefully
io.engine.on('connection_error', (err) => {
  console.error('Socket.io connection error:', err.req);
  console.error('Error details:', err.code, err.message, err.context);
});

module.exports = { app, server, io, persistence };
// signaling-server-production.js - Enhanced stability and mobile optimization
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = createServer(app);

// Enhanced Socket.IO configuration for maximum stability
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
  
  // ** PHASE 1: ENHANCED CONNECTION STABILITY **
  
  // Aggressive ping/pong for mobile stability
  pingTimeout: 30000,           // 30s before considering connection dead (reduced from 60s)
  pingInterval: 15000,          // Ping every 15s (increased frequency)
  upgradeTimeout: 20000,        // 20s to upgrade (reduced from 30s)
  
  // Mobile-optimized transports
  transports: ['polling', 'websocket'], // Polling first for reliability
  allowUpgrades: true,          // Allow WebSocket upgrades
  rememberUpgrade: false,       // Don't remember upgrades (mobile networks change)
  
  // Enhanced buffering and timeouts
  maxHttpBufferSize: 1e6,       // 1MB buffer
  httpCompression: true,        // Enable compression
  perMessageDeflate: true,      // WebSocket compression
  
  // ** CONNECTION STATE RECOVERY - Key for mobile **
  connectionStateRecovery: {
    maxDisconnectionDuration: 3 * 60 * 1000, // 3 minutes (increased)
    skipMiddlewares: true,
  },
  
  // Enhanced error handling
  allowEIO3: true,              // Backward compatibility
  destroyUpgrade: false,        // Don't destroy upgrades on timeout
  destroyUpgradeTimeout: 1000,  // Quick cleanup
  
  // ** ADAPTIVE TIMEOUTS based on client type **
  connectTimeout: 20000,        // 20s connection timeout
  serveClient: false,          // Don't serve socket.io client (we bundle it)
});

// Enhanced connection tracking with health monitoring
const rooms = new Map();
const connections = new Map(); // Track individual connections
const connectionStats = {
  totalConnections: 0,
  currentConnections: 0,
  peakConnections: 0,
  reconnections: 0,
  timeouts: 0,
  transportCloses: 0,
  startTime: Date.now()
};

// ** HEALTH MONITORING SYSTEM **
const healthMonitor = {
  checkInterval: 30000, // 30 seconds
  connectionChecks: new Map(),
  
  startMonitoring() {
    setInterval(() => {
      this.performHealthChecks();
    }, this.checkInterval);
    
    console.log('🏥 Health monitoring started - checking every 30s');
  },
  
  performHealthChecks() {
    const now = Date.now();
    let staleConnections = 0;
    let unhealthyConnections = 0;
    
    // Check all tracked connections
    for (const [socketId, connInfo] of connections.entries()) {
      const socket = io.sockets.sockets.get(socketId);
      
      if (!socket) {
        // Socket doesn't exist anymore, clean up
        connections.delete(socketId);
        continue;
      }
      
      // Check if connection is stale (no activity for 2 minutes)
      const timeSinceActivity = now - connInfo.lastActivity;
      if (timeSinceActivity > 120000) { // 2 minutes
        staleConnections++;
        console.log(`🔍 Stale connection detected: ${socketId} (${Math.round(timeSinceActivity/1000)}s inactive)`);
        
        // Send ping to check if connection is alive
        socket.emit('health-ping', { timestamp: now });
        connInfo.lastHealthCheck = now;
      }
      
      // Check if connection missed multiple health checks
      if (connInfo.lastHealthCheck && (now - connInfo.lastHealthCheck) > 90000) { // 90s
        unhealthyConnections++;
        console.log(`⚠️ Unhealthy connection: ${socketId} - forcing reconnection`);
        socket.disconnect(true);
      }
    }
    
    if (staleConnections > 0 || unhealthyConnections > 0) {
      console.log(`🏥 Health check: ${staleConnections} stale, ${unhealthyConnections} unhealthy connections`);
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

// Middleware - Enhanced CORS
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
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400 // Cache preflight for 24 hours
}));

app.use(express.json({ limit: '10mb' }));

// Enhanced health check with connection details
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
      total: connectionStats.totalConnections,
      reconnections: connectionStats.reconnections,
      timeouts: connectionStats.timeouts,
      transportCloses: connectionStats.transportCloses
    },
    rooms: {
      active: rooms.size,
      totalPeers: Array.from(rooms.values()).reduce((sum, room) => sum + room.size, 0)
    },
    memory: {
      used: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
      total: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB',
      rss: Math.round(memoryUsage.rss / 1024 / 1024) + 'MB',
      external: Math.round(memoryUsage.external / 1024 / 1024) + 'MB'
    },
    performance: {
      eventLoopUtilization: require('perf_hooks').performance.eventLoopUtilization?.() || 'N/A',
      gcCount: global.gc ? 'Available' : 'Not Available'
    },
    timestamp: Date.now(),
    version: '1.2.0-enhanced'
  });
});

// Connection stability metrics endpoint
app.get('/stability', (req, res) => {
  const connectionDetails = Array.from(connections.entries()).map(([socketId, info]) => ({
    id: socketId.substring(0, 8) + '...',
    connectedAt: info.connectedAt,
    lastActivity: info.lastActivity,
    reconnectCount: info.reconnectCount,
    transportUpgrades: info.transportUpgrades,
    roomId: info.roomId ? info.roomId.substring(0, 12) + '...' : null
  }));
  
  res.json({
    totalConnections: connections.size,
    connectionDetails,
    stats: connectionStats,
    healthChecks: {
      lastCheck: Date.now() - 30000,
      intervalMs: healthMonitor.checkInterval
    }
  });
});

// Basic endpoints
app.get('/signaling-proxy', (req, res) => {
  res.json({
    signalingAvailable: true,
    endpoint: '/socket.io/',
    version: '1.2.0-enhanced',
    features: [
      'peer-discovery', 
      'connection-assistance', 
      'room-management',
      'connection-recovery',
      'health-monitoring',
      'mobile-optimization'
    ],
    stability: {
      connectionRecovery: true,
      healthMonitoring: true,
      adaptiveTimeouts: true
    },
    timestamp: Date.now()
  });
});

app.get('/', (req, res) => {
  res.json({
    service: 'PeddleNet Signaling Server',
    version: '1.2.0-enhanced',
    status: 'running',
    description: 'Enhanced WebRTC signaling server with mobile optimization',
    enhancements: [
      'Connection state recovery',
      'Adaptive ping/pong timing',
      'Health monitoring system',
      'Transport optimization',
      'Reconnection intelligence'
    ],
    endpoints: {
      health: '/health',
      stability: '/stability',
      signaling: '/socket.io/'
    },
    timestamp: Date.now()
  });
});

// ** ENHANCED SOCKET.IO CONNECTION HANDLING **
io.on('connection', (socket) => {
  // Track connection with enhanced metadata
  const connectionInfo = {
    connectedAt: Date.now(),
    lastActivity: Date.now(),
    reconnectCount: 0,
    transportUpgrades: 0,
    roomId: null,
    userData: null,
    healthChecks: 0
  };
  
  connections.set(socket.id, connectionInfo);
  
  // Update stats
  connectionStats.currentConnections++;
  connectionStats.totalConnections++;
  connectionStats.peakConnections = Math.max(
    connectionStats.peakConnections, 
    connectionStats.currentConnections
  );

  console.log(`🔗 Client connected: ${socket.id} (${connectionStats.currentConnections} active)`);
  console.log(`   Transport: ${socket.conn.transport.name}, Upgraded: ${socket.conn.upgraded}`);

  // ** TRANSPORT MONITORING **
  socket.conn.on('upgrade', () => {
    connectionInfo.transportUpgrades++;
    console.log(`⬆️ Transport upgraded for ${socket.id}: ${socket.conn.transport.name}`);
  });

  socket.conn.on('upgradeError', (error) => {
    console.log(`❌ Transport upgrade failed for ${socket.id}:`, error.message);
  });

  // ** ENHANCED HEALTH MONITORING **
  socket.on('health-ping', (data) => {
    healthMonitor.recordActivity(socket.id);
    connectionInfo.healthChecks++;
    socket.emit('health-pong', { 
      timestamp: Date.now(), 
      originalTimestamp: data.timestamp,
      healthChecks: connectionInfo.healthChecks
    });
  });

  // Enhanced ping handler with activity tracking
  socket.on('ping', (data) => {
    healthMonitor.recordActivity(socket.id);
    socket.emit('pong', { 
      timestamp: Date.now(), 
      ...data,
      serverUptime: process.uptime()
    });
  });

  // ** RECONNECTION HANDLING **
  socket.on('reconnect-attempt', (data) => {
    connectionStats.reconnections++;
    connectionInfo.reconnectCount++;
    console.log(`🔄 Reconnection attempt from ${socket.id}: attempt ${connectionInfo.reconnectCount}`);
  });

  // Enhanced join room with connection recovery
  socket.on('join-room', ({ roomId, peerId, displayName }) => {
    try {
      healthMonitor.recordActivity(socket.id);
      console.log(`👥 ${displayName} (${peerId}) joining room: ${roomId}`);
      
      // Check if this is a reconnection to the same room
      const isReconnection = connectionInfo.roomId === roomId;
      if (isReconnection) {
        console.log(`🔄 Reconnection detected for ${displayName} to room ${roomId}`);
      }
      
      // Enhanced room cleanup - leave previous rooms
      socket.rooms.forEach(room => {
        if (room !== socket.id && rooms.has(room)) {
          const roomPeers = rooms.get(room);
          roomPeers.delete(socket.id);
          socket.leave(room);
          console.log(`🚪 Left previous room: ${room}`);
        }
      });
      
      // Join the new room
      socket.join(roomId);
      
      // Update connection info
      connectionInfo.roomId = roomId;
      connectionInfo.userData = { 
        roomId, 
        peerId, 
        displayName, 
        joinedAt: Date.now(),
        lastSeen: Date.now(),
        isReconnection
      };
      
      // Store enhanced user info
      socket.userData = connectionInfo.userData;
      
      // Initialize room if it doesn't exist
      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Map());
      }
      
      const roomPeers = rooms.get(roomId);
      roomPeers.set(socket.id, {
        peerId,
        displayName,
        joinedAt: Date.now(),
        socketId: socket.id,
        reconnectCount: connectionInfo.reconnectCount
      });
      
      // Enhanced peer notifications
      socket.to(roomId).emit('peer-joined', {
        peerId,
        displayName,
        socketId: socket.id,
        timestamp: Date.now(),
        isReconnection
      });
      
      // Send current peers to new/reconnecting user
      const currentPeers = Array.from(roomPeers.values())
        .filter(peer => peer.peerId !== peerId);
      
      socket.emit('room-peers', {
        peers: currentPeers,
        roomId,
        timestamp: Date.now(),
        isReconnection
      });
      
      console.log(`📊 Room ${roomId} now has ${roomPeers.size} peers (${isReconnection ? 'reconnection' : 'new join'})`);
      
    } catch (error) {
      console.error('Error in join-room:', error);
      socket.emit('error', { 
        message: 'Failed to join room', 
        code: 'JOIN_ROOM_ERROR',
        retryable: true
      });
    }
  });

  // Enhanced connection requests with retry logic
  socket.on('request-connection', ({ targetSocketId, fromPeerId, timeout = 30000 }) => {
    try {
      healthMonitor.recordActivity(socket.id);
      
      const targetSocket = io.sockets.sockets.get(targetSocketId);
      if (!targetSocket) {
        socket.emit('connection-error', {
          targetSocketId,
          error: 'Target peer not found',
          code: 'PEER_NOT_FOUND',
          retryable: false
        });
        return;
      }
      
      socket.to(targetSocketId).emit('connection-request', {
        fromPeerId,
        fromSocketId: socket.id,
        timestamp: Date.now(),
        timeout
      });
      
      // Enhanced timeout handling
      setTimeout(() => {
        socket.emit('connection-timeout', { 
          targetSocketId, 
          fromPeerId,
          reason: 'Request timeout',
          retryable: true
        });
      }, timeout);
      
    } catch (error) {
      console.error('Error in request-connection:', error);
      socket.emit('error', { 
        message: 'Failed to send connection request', 
        code: 'CONNECTION_REQUEST_ERROR',
        retryable: true
      });
    }
  });

  // Enhanced connection responses
  socket.on('connection-response', ({ targetSocketId, accepted, toPeerId, reason }) => {
    try {
      healthMonitor.recordActivity(socket.id);
      
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

  // Room messages with enhanced delivery
  socket.on('room-message', ({ roomId, message, type = 'announcement' }) => {
    try {
      healthMonitor.recordActivity(socket.id);
      
      if (socket.userData && socket.userData.roomId === roomId) {
        const enhancedMessage = {
          ...message,
          type,
          timestamp: Date.now(),
          fromSocket: socket.id,
          deliveryId: generateDeliveryId()
        };
        
        socket.to(roomId).emit('room-message', enhancedMessage);
        
        // Send delivery confirmation
        socket.emit('message-delivered', {
          deliveryId: enhancedMessage.deliveryId,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('Error in room-message:', error);
      socket.emit('error', {
        message: 'Failed to send message',
        code: 'MESSAGE_SEND_ERROR',
        retryable: true
      });
    }
  });

  // ** ENHANCED DISCONNECTION HANDLING **
  socket.on('disconnect', (reason) => {
    connectionStats.currentConnections--;
    
    // Track disconnect reasons for analytics
    if (reason === 'transport close') {
      connectionStats.transportCloses++;
    } else if (reason.includes('timeout')) {
      connectionStats.timeouts++;
    }
    
    console.log(`🔌 Client disconnected: ${socket.id} (${connectionStats.currentConnections} active)`);
    console.log(`   Reason: ${reason}, Reconnect count: ${connectionInfo.reconnectCount}`);
    
    // Clean up connection tracking
    connections.delete(socket.id);
    
    if (socket.userData) {
      const { roomId, peerId, displayName } = socket.userData;
      
      // Remove from room with enhanced cleanup
      if (rooms.has(roomId)) {
        const roomPeers = rooms.get(roomId);
        roomPeers.delete(socket.id);
        
        // Enhanced peer left notification
        socket.to(roomId).emit('peer-left', {
          peerId,
          displayName,
          socketId: socket.id,
          reason,
          timestamp: Date.now(),
          reconnectCount: connectionInfo.reconnectCount,
          wasUpgraded: socket.conn.upgraded
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

  // Enhanced error handling
  socket.on('connect_error', (error) => {
    console.error(`Connection error for ${socket.id}:`, error);
    connectionInfo.lastActivity = Date.now(); // Still count as activity
  });

  socket.on('error', (error) => {
    console.error(`Socket error for ${socket.id}:`, error);
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

function generateDeliveryId() {
  return Math.random().toString(36).substring(2, 15);
}

// ** ENHANCED CLEANUP AND MONITORING **
// More aggressive cleanup for mobile connections
setInterval(() => {
  const now = Date.now();
  const staleThreshold = 15 * 60 * 1000; // 15 minutes (reduced from 30)
  let cleanedRooms = 0;
  let cleanedPeers = 0;
  
  for (const [roomId, peers] of rooms.entries()) {
    // Remove stale peers more aggressively
    for (const [socketId, peer] of peers.entries()) {
      const socket = io.sockets.sockets.get(socketId);
      
      // Clean if socket doesn't exist or peer is stale
      if (!socket || (now - peer.joinedAt > staleThreshold)) {
        peers.delete(socketId);
        cleanedPeers++;
        console.log(`🧹 Cleaned up ${socket ? 'stale' : 'orphaned'} peer ${peer.peerId} from room ${roomId}`);
      }
    }
    
    // Remove empty rooms
    if (peers.size === 0) {
      rooms.delete(roomId);
      cleanedRooms++;
      console.log(`🧹 Cleaned up empty room ${roomId}`);
    }
  }
  
  // Clean up connection tracking
  for (const [socketId, connInfo] of connections.entries()) {
    const socket = io.sockets.sockets.get(socketId);
    if (!socket) {
      connections.delete(socketId);
      console.log(`🧹 Cleaned up orphaned connection tracking for ${socketId}`);
    }
  }
  
  if (cleanedRooms > 0 || cleanedPeers > 0) {
    console.log(`🧹 Cleanup completed: ${cleanedPeers} peers, ${cleanedRooms} rooms`);
  }
}, 5 * 60 * 1000); // Every 5 minutes (more frequent)

// Performance monitoring
setInterval(() => {
  const memUsage = process.memoryUsage();
  const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  
  if (heapUsedMB > 100) { // Alert if using more than 100MB
    console.log(`⚠️ High memory usage: ${heapUsedMB}MB heap, ${connectionStats.currentConnections} connections`);
  }
  
  // Log connection stats every 10 minutes
  console.log(`📊 Stats: ${connectionStats.currentConnections} active, ${connectionStats.transportCloses} transport closes, ${connectionStats.reconnections} reconnections`);
}, 10 * 60 * 1000);

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🎵 PeddleNet Enhanced Signaling Server v1.2.0 running on port ${PORT}`);
  console.log(`🔍 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 Stability metrics: http://localhost:${PORT}/stability`);
  console.log(`🌐 Enhanced with connection recovery and mobile optimization`);
  console.log(`🏥 Health monitoring active - checking every 30 seconds`);
});

// Enhanced graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  
  // Notify all connected clients with enhanced info
  io.emit('server-shutdown', { 
    message: 'Server is shutting down for maintenance',
    timestamp: Date.now(),
    reconnectDelay: 5000, // Suggest 5s delay before reconnecting
    version: '1.2.0-enhanced'
  });
  
  // Give clients time to handle shutdown notification
  setTimeout(() => {
    server.close(() => {
      console.log('Server closed gracefully');
      process.exit(0);
    });
  }, 2000);
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
  // Don't exit immediately - try to handle gracefully
  setTimeout(() => process.exit(1), 1000);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
  // Don't exit immediately - try to handle gracefully
  setTimeout(() => process.exit(1), 1000);
});

module.exports = { app, server, io };
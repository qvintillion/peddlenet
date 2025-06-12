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
const rooms = new Map();
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
      totalPeers: Array.from(rooms.values()).reduce((sum, room) => sum + room.size, 0)
    },
    memory: {
      use
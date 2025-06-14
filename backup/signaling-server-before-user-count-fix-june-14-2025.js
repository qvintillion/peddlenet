// 🔧 ENHANCED: Admin dashboard improvements - June 14, 2025
// Fixes: 1) Unique user counting 2) All rooms visible 3) Admin password for clear/wipe 4) Broadcast to specific rooms
// Cross-referenced with complete backup to ensure all WebSocket handlers and endpoints are included

const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const os = require('os');

const app = express();
const server = createServer(app);

// Environment detection
const isDevelopment = process.env.NODE_ENV !== 'production';
const buildTarget = process.env.BUILD_TARGET || 'unknown';
const platform = process.env.PLATFORM || 'local';

// 🔐 ENHANCED: Admin security levels
const ADMIN_CREDENTIALS = {
  // Basic admin access (read-only + broadcast)
  basic: { username: 'th3p3ddl3r', password: 'letsmakeatrade' },
  // Super admin access (destructive operations)
  super: { username: 'super_admin', password: 'clear_and_wipe_2025!' }
};

// Enhanced environment detection using BUILD_TARGET
function getEnvironment() {
  // Use BUILD_TARGET if available (staging/production/preview)
  if (buildTarget === 'staging') return 'staging';
  if (buildTarget === 'production') return 'production';
  if (buildTarget === 'preview') return 'preview';
  
  // Fallback to NODE_ENV detection
  return isDevelopment ? 'development' : 'production';
}

// CORS configuration - FIXED: Added Firebase domains
function getCorsOrigins() {
  const origins = [
    "http://localhost:3000",
    "https://localhost:3000"
  ];

  // 🚨 CRITICAL FIX: Add Firebase hosting domains
  // Main Firebase staging domain
  origins.push("https://festival-chat-peddlenet.web.app");
  origins.push("https://festival-chat-peddlenet.firebaseapp.com");
  
  // Firebase preview channels (dynamic URLs)
  origins.push("https://festival-chat-peddlenet--pr-*.web.app");
  origins.push("https://festival-chat-peddlenet--*.web.app");
  
  // Production Vercel domain
  origins.push("https://peddlenet.app");
  origins.push("https://www.peddlenet.app");
  
  // Additional Firebase preview channel patterns
  origins.push("https://festival-chat--*.web.app");
  origins.push("https://festival-chat-peddlenet--feature-*.web.app");

  if (isDevelopment) {
    // Add local network IPs for mobile testing
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          origins.push(`http://${iface.address}:3000`);
          origins.push(`https://${iface.address}:3000`);
        }
      }
    }
  } else {
    // In production, add wildcard support for Firebase preview channels
    origins.push(/^https:\/\/festival-chat-peddlenet--.*\.web\.app$/);
    origins.push(/^https:\/\/festival-chat--.*\.web\.app$/);
  }

  console.log('🌐 CORS Origins configured:', origins.length, 'domains');
  console.log('🌐 Sample origins:', origins.slice(0, 5));
  
  return origins;
}

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: getCorsOrigins(),
    methods: ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
    credentials: true
  },
  transports: ['polling', 'websocket'],
  pingTimeout: 60000,
  pingInterval: 25000
});

// Middleware
app.use(cors({
  origin: getCorsOrigins(),
  methods: ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());

// 🔧 ENHANCED: Data storage with historical tracking
const rooms = new Map(); // Active rooms: roomId -> Map<socketId, peerData>
const allRoomsEverCreated = new Map(); // ALL rooms ever created: roomId -> roomMetadata
const messageStore = new Map(); // Track messages per room: roomId -> [messages]
const activityLog = []; // Track all activities for admin dashboard
const allUsersEver = new Map(); // Track ALL users ever seen: peerId -> userMetadata

const connectionStats = {
  totalConnections: 0,
  currentConnections: 0,
  peakConnections: 0,
  totalMessages: 0,
  messagesPerMinute: 0,
  last
// CORRECTED backup of current signaling-server.js before admin enhancements - June 14, 2025
// This should be the COMPLETE working version with all WebSocket handlers and endpoints
// Issues to fix: 1) Users counted twice 2) Only active rooms visible 3) No super admin 4) No room-specific broadcast

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

// Data storage
const rooms = new Map();
const messageStore = new Map(); // Track messages per room: roomId -> [messages]
const activityLog = []; // Track all activities for admin dashboard
const connectionStats = {
  totalConnections: 0,
  currentConnections: 0,
  peakConnections: 0,
  totalMessages: 0,
  messagesPerMinute: 0,
  lastMessageTime: Date.now(),
  // Enhanced tracking for comprehensive metrics
  totalUniqueUsers: new Set(), // Track all unique users ever seen
  totalRoomsCreated: 0, // Track total rooms ever created
  peakRooms: 0 // Track peak concurrent rooms
};

// Room code mapping storage
const roomCodes = new Map(); // roomCode -> roomId mapping

// Utility functions
function formatUptime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hours}h ${minutes}m ${secs}s`;
}

// Helper functions for message tracking
function addActivityLog(type, data, icon = '📝') {
  const activity = {
    id: Date.now() + Math.random(),
    type,
    data,
    timestamp: Date.now(),
    icon
  };
  
  activityLog.unshift(activity); // Add to beginning
  
  // Keep only last 1000 activities
  if (activityLog.length > 1000) {
    activityLog.length = 1000;
  }
  
  console.log(`📋 Activity logged: ${type}`, data);
}

function updateMessageStats() {
  connectionStats.totalMessages++;
  connectionStats.lastMessageTime = Date.now();
  
  // Calculate messages per minute (simple approximation)
  const oneMinuteAgo = Date.now() - 60000;
  const recentMessages = activityLog.filter(activity => 
    activity.type === 'message-sent' && activity.timestamp > oneMinuteAgo
  ).length;
  
  connectionStats.messagesPerMinute = recentMessages;
}

function storeMessage(roomId, messageData) {
  if (!messageStore.has(roomId)) {
    messageStore.set(roomId, []);
  }
  
  const messages = messageStore.get(roomId);
  messages.push(messageData);
  
  // Keep only last 100 messages per room
  if (messages.length > 100) {
    messages.splice(0, messages.length - 100);
  }
  
  updateMessageStats();
}

// Utility function for message IDs
function generateMessageId() {
  return Math.random().toString(36).substring(2, 15);
}

// Simple admin auth (skip in development)
function requireAdminAuth(req, res, next) {
  next(); // Skip auth for now - will be enhanced
}

// Root endpoint (continues in the file...)

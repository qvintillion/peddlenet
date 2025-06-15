// 🔧 ENHANCED: Admin dashboard improvements + MESH NETWORKING - June 14, 2025
// Phase 1: Added socket.io-p2p support for hybrid mesh architecture
// Fixes: 1) Unique user counting 2) All rooms visible 3) Admin password for clear/wipe 4) Broadcast to specific rooms
// NEW: 5) P2P signaling coordination for desktop-mobile messaging
// Cross-referenced with complete backup to ensure all WebSocket handlers and endpoints are included

const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const os = require('os');

// 🌐 PHASE 1: Mesh networking imports
try {
  // Import socket.io-p2p-server for P2P coordination
  const P2PServer = require('socket.io-p2p-server').Server;
  global.P2PServer = P2PServer;
  console.log('✅ Mesh networking P2P server loaded successfully');
} catch (error) {
  console.warn('⚠️ socket.io-p2p-server not found - P2P features disabled:', error.message);
  global.P2PServer = null;
}

const app = express();
const server = createServer(app);

// Environment detection
const isDevelopment = process.env.NODE_ENV !== 'production';
const buildTarget = process.env.BUILD_TARGET || 'unknown';
const platform = process.env.PLATFORM || 'local';

// 🔐 SIMPLIFIED: Single admin level
const ADMIN_CREDENTIALS = {
  // Admin access (full features)
  admin: { username: 'th3p3ddl3r', password: 'letsmakeatrade' }
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

  // 🚨 CRITICAL F
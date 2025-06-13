// BACKUP of signaling-server.js - Made before fixing production deployment issues
// Date: 2025-06-12 22:54:23
// Reason: Fixing critical production deployment port and Cloud Build configuration issues

// signaling-server.js - Universal server with COMPREHENSIVE ANALYTICS & SQLite Integration
// Auto-detects environment and adapts configuration accordingly
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const os = require('os');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const server = createServer(app);

// Universal environment detection
const NODE_ENV = process.env.NODE_ENV || 'development';
const PLATFORM = process.env.PLATFORM || 'local'; // local, firebase, github, cloudrun
const BUILD_TARGET = process.env.BUILD_TARGET || 'development'; // development, staging, production

const isDevelopment = NODE_ENV === 'development' || PLATFORM === 'local';
const isStaging = BUILD_TARGET === 'staging' || PLATFORM === 'firebase';
const isProduction = NODE_ENV === 'production' && (PLATFORM === 'github' || PLATFORM === 'cloudrun');

// ... rest of server code ... (truncated for backup)
// peerjs-server.js - Local PeerJS signaling server
const { PeerServer } = require('peer');
const express = require('express');
const cors = require('cors');

const app = express();

// Enable CORS for all routes
app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://*.ngrok.io",
    "https://*.ngrok-free.app",
    /^https:\/\/[a-zA-Z0-9-]+\.ngrok(-free)?\.app$/,
    /^https:\/\/[a-zA-Z0-9-]+\.ngrok\.io$/
  ],
  credentials: true
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    service: 'PeerJS Server',
    timestamp: Date.now()
  });
});

// Create PeerJS server
const peerServer = PeerServer({
  port: 9000,
  path: '/peerjs',
  
  // Enhanced configuration for better reliability
  allow_discovery: true,
  
  // Cleanup settings
  cleanup_out_msgs: 1000,
  
  // CORS settings
  cors: {
    origin: [
      "http://localhost:3000",
      "https://*.ngrok.io", 
      "https://*.ngrok-free.app",
      /^https:\/\/[a-zA-Z0-9-]+\.ngrok(-free)?\.app$/,
      /^https:\/\/[a-zA-Z0-9-]+\.ngrok\.io$/
    ],
    credentials: true
  },
  
  // Logging
  debug: true
});

// PeerJS server event handlers
peerServer.on('connection', (client) => {
  console.log(`✅ Client connected: ${client.getId()}`);
});

peerServer.on('disconnect', (client) => {
  console.log(`❌ Client disconnected: ${client.getId()}`);
});

peerServer.on('error', (error) => {
  console.error('🚨 PeerJS Server error:', error);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down PeerJS server gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down PeerJS server gracefully');
  process.exit(0);
});

console.log('🎵 PeerJS Server running on port 9000');
console.log('🔗 PeerJS endpoint: http://localhost:9000/peerjs');
console.log('🏥 Health check: http://localhost:9000/health');

module.exports = peerServer;
// peerjs-server.js - Local PeerJS signaling server (CommonJS compatible)
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

try {
  // Create PeerJS server with improved compatibility
  const peerServer = PeerServer({
    port: 9000,
    path: '/peerjs',
    
    // Enhanced configuration for better reliability
    allow_discovery: true,
    
    // Cleanup settings
    cleanup_out_msgs: 1000,
    
    // Timeout settings
    alive_timeout: 60000,
    expire_timeout: 5000,
    
    // CORS settings
    corsOptions: {
      origin: [
        "http://localhost:3000",
        "https://*.ngrok.io", 
        "https://*.ngrok-free.app",
        /^https:\/\/[a-zA-Z0-9-]+\.ngrok(-free)?\.app$/,
        /^https:\/\/[a-zA-Z0-9-]+\.ngrok\.io$/
      ],
      credentials: true
    },
    
    // Connection limits
    concurrent_limit: 5000,
    
    // Key for authentication  
    key: 'peerjs'
  });

  // PeerJS server event handlers
  peerServer.on('connection', (client) => {
    console.log(`✅ PeerJS Client connected: ${client.getId()}`);
  });

  peerServer.on('disconnect', (client) => {
    console.log(`❌ PeerJS Client disconnected: ${client.getId()}`);
  });

  peerServer.on('error', (error) => {
    console.error('🚨 PeerJS Server error:', error);
  });

  console.log('🎵 PeerJS Server running on port 9000');
  console.log('🔗 PeerJS endpoint: http://localhost:9000/peerjs');
  console.log('🏥 Health check: http://localhost:9000/health');
  console.log('🔑 Using key: peerjs');
  
} catch (error) {
  console.error('❌ Failed to start PeerJS server:', error.message);
  console.log('💡 Trying alternative port...');
  
  // Fallback: try a different port
  try {
    const fallbackServer = PeerServer({
      port: 9001,
      path: '/peerjs',
      allow_discovery: true,
      key: 'peerjs'
    });
    
    console.log('🎵 PeerJS Server running on FALLBACK port 9001');
    console.log('🔗 PeerJS endpoint: http://localhost:9001/peerjs');
    
  } catch (fallbackError) {
    console.error('❌ Both primary and fallback PeerJS servers failed:', fallbackError.message);
    console.log('🌐 Application will use cloud PeerJS service instead');
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down PeerJS server gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down PeerJS server gracefully');
  process.exit(0);
});

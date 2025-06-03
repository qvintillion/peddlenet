// Simplified integrated server without extra dependencies
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { spawn } = require('child_process');

// Store room information for signaling
const rooms = new Map();

async function startServer() {
  const app = express();
  const server = createServer(app);
  
  // Set up Socket.io for signaling
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    upgradeTimeout: 30000,
    allowUpgrades: true
  });

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Health check for signaling
  app.get('/signaling-health', (req, res) => {
    res.json({ 
      status: 'ok', 
      rooms: rooms.size,
      timestamp: Date.now(),
      type: 'integrated'
    });
  });

  // Proxy all other requests to Next.js dev server on port 3000
  app.use('*', (req, res) => {
    // Simple proxy to Next.js
    const url = `http://localhost:3000${req.originalUrl}`;
    
    // Use fetch to proxy the request
    import('node-fetch').then(({ default: fetch }) => {
      fetch(url, {
        method: req.method,
        headers: req.headers,
        body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined
      })
      .then(response => {
        // Copy status and headers
        res.status(response.status);
        response.headers.forEach((value, key) => {
          res.set(key, value);
        });
        
        // Stream the response
        response.body.pipe(res);
      })
      .catch(err => {
        console.error('Proxy error:', err);
        res.status(500).send('Proxy error');
      });
    });
  });

  // Socket.io signaling logic
  io.on('connection', (socket) => {
    console.log('✅ Client connected to integrated signaling:', socket.id);

    socket.on('join-room', ({ roomId, peerId, displayName }) => {
      console.log(`👥 ${displayName} (${peerId}) joining room: ${roomId}`);
      
      // Leave existing rooms
      socket.rooms.forEach(room => {
        if (room !== socket.id) {
          socket.leave(room);
        }
      });
      
      socket.join(roomId);
      socket.userData = { roomId, peerId, displayName };
      
      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Map());
      }
      
      const roomPeers = rooms.get(roomId);
      roomPeers.set(socket.id, { peerId, displayName, joinedAt: Date.now() });
      
      // Notify existing peers
      socket.to(roomId).emit('peer-joined', {
        peerId,
        displayName,
        socketId: socket.id
      });
      
      // Send current peers to new user
      const currentPeers = Array.from(roomPeers.values())
        .filter(peer => peer.peerId !== peerId);
      
      socket.emit('room-peers', currentPeers);
      console.log(`📊 Room ${roomId} now has ${roomPeers.size} peers`);
    });

    socket.on('disconnect', () => {
      console.log('❌ Client disconnected from integrated signaling:', socket.id);
      
      if (socket.userData) {
        const { roomId, peerId, displayName } = socket.userData;
        
        if (rooms.has(roomId)) {
          const roomPeers = rooms.get(roomId);
          roomPeers.delete(socket.id);
          
          socket.to(roomId).emit('peer-left', {
            peerId,
            displayName,
            socketId: socket.id
          });
          
          if (roomPeers.size === 0) {
            rooms.delete(roomId);
            console.log(`🗑️ Room ${roomId} deleted (empty)`);
          } else {
            console.log(`📊 Room ${roomId} now has ${roomPeers.size} peers`);
          }
        }
      }
    });

    socket.on('ping', () => {
      socket.emit('pong');
    });
  });

  const PORT = process.env.PORT || 3002;
  
  // Start Next.js dev server first
  console.log('🚀 Starting Next.js dev server...');
  const nextProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true
  });

  // Wait a bit for Next.js to start, then start our integrated server
  setTimeout(() => {
    server.listen(PORT, () => {
      console.log(`🎵 Festival Chat (integrated signaling) running on port ${PORT}`);
      console.log(`📡 Signaling integrated at /socket.io/`);
      console.log(`🔍 Health check: http://localhost:${PORT}/signaling-health`);
      console.log(`📱 Use this URL with ngrok: http://localhost:${PORT}`);
    });
  }, 5000);

  // Cleanup on exit
  process.on('SIGTERM', () => {
    nextProcess.kill();
    server.close();
  });
  
  process.on('SIGINT', () => {
    nextProcess.kill();
    server.close();
    process.exit(0);
  });
}

startServer().catch((err) => {
  console.error('Failed to start integrated server:', err);
  process.exit(1);
});

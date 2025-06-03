// Simple integrated server that combines Next.js app and signaling server
// This allows both to run on the same ngrok tunnel without extra dependencies
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

// Store room information for signaling
const rooms = new Map();

async function startServer() {
  await nextApp.prepare();
  
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
      timestamp: Date.now()
    });
  });

  // Socket.io signaling logic (same as signaling-server.js)
  io.on('connection', (socket) => {
    console.log('Client connected to integrated signaling:', socket.id);

    socket.on('join-room', ({ roomId, peerId, displayName }) => {
      console.log(`${displayName} (${peerId}) joining room: ${roomId}`);
      
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
      
      socket.to(roomId).emit('peer-joined', {
        peerId,
        displayName,
        socketId: socket.id
      });
      
      const currentPeers = Array.from(roomPeers.values())
        .filter(peer => peer.peerId !== peerId);
      
      socket.emit('room-peers', currentPeers);
      console.log(`Room ${roomId} now has ${roomPeers.size} peers`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected from integrated signaling:', socket.id);
      
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
            console.log(`Room ${roomId} deleted (empty)`);
          }
        }
      }
    });

    socket.on('ping', () => {
      socket.emit('pong');
    });
  });

  // Handle all other requests with Next.js
  app.all('*', (req, res) => {
    return handle(req, res);
  });

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`🎵 Festival Chat (integrated) running on port ${PORT}`);
    console.log(`📡 Signaling integrated at /socket.io/`);
    console.log(`🔍 Health check: http://localhost:${PORT}/signaling-health`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start integrated server:', err);
  process.exit(1);
});

app.get('/admin/analytics', requireAdminAuth, async (req, res) => {
  try {
    // FIX 1: Count UNIQUE users instead of connections
    const uniqueActiveUsers = new Set();
    for (const [roomId, roomPeers] of rooms.entries()) {
      for (const [socketId, peerData] of roomPeers.entries()) {
        uniqueActiveUsers.add(peerData.peerId);
      }
    }
    const actualActiveUsers = uniqueActiveUsers.size;
    
    // FIXED: Improved database query with proper error handling and null checks
    const getTotalStats = () => {
      return new Promise((resolve) => {
        if (!dbReady || !db) {
          console.log('📊 Database not ready, returning fallback totals');
          resolve({ totalUsers: 0, totalRooms: 0 });
          return;
        }
        
        // Get total unique users from user_sessions table
        safeDbGet('SELECT COUNT(DISTINCT user_id) as total_users FROM user_sessions', [], (err, userResult) => {
          if (err) {
            console.warn('⚠️ User count query failed:', err.message);
            resolve({ totalUsers: 0, totalRooms: 0 });
            return;
          }
          
          const totalUsers = userResult?.total_users || 0;
          console.log('📊 Total users from DB:', totalUsers);
          
          // Get total unique rooms from user_sessions table
          safeDbGet('SELECT COUNT(DISTINCT room_id) as total_rooms FROM user_sessions', [], (err, roomResult) => {
            if (err) {
              console.warn('⚠️ Room count query failed:', err.message);
              resolve({ totalUsers, totalRooms: 0 });
              return;
            }
            
            const totalRooms = roomResult?.total_rooms || 0;
            console.log('📊 Total rooms from DB:', totalRooms);
            
            resolve({ totalUsers, totalRooms });
          });
        });
      });
    };
    
    const { totalUsers, totalRooms } = await getTotalStats();
    
    const dashboardData = {
      realTimeStats: {
        activeUsers: actualActiveUsers, // FIX: Use unique users, not connections
        totalUsers: totalUsers,
        activeRooms: rooms.size,
        totalRooms: totalRooms,
        messagesPerMinute: analyticsData.messagesPerMinute,
        totalMessages: analyticsData.totalMessages,
        peakConnections: connectionStats.peakConnections,
        storageUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        userTrend: '',
        roomTrend: '',
        environment: NODE_ENV
      },
      serverHealth: {
        status: 'healthy',
        uptime: formatUptime(process.uptime()),
        memoryUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        memoryTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        cpuUsage: `${cpuUsage.percent}%`,
        cpuUser: `${cpuUsage.user}%`,
        cpuSystem: `${cpuUsage.system}%`,
        coldStarts: 0
      },
      networkStatus: {
        quality: 100,
        avgLatency: 0,
        deliveryRate: 100
      },
      messageFlow: {
        messagesPerMinute: analyticsData.messagesPerMinute,
        trend: '',
        history: analyticsData.messageHistory
      },
      dbStats: {
        totalMessages: analyticsData.totalMessages,
        totalRooms: rooms.size,
        totalSessions: 0,
        recentActivity: 0,
        dbSize: '1MB',
        oldestMessage: Date.now() - (24 * 60 * 60 * 1000)
      },
      timestamp: Date.now(),
      databaseReady: dbReady
    };
    
    console.log('📊 Sending analytics data:', {
      activeUsers: actualActiveUsers,
      totalUsers,
      activeRooms: rooms.size,
      totalRooms,
      dbReady
    });
    
    res.json(dashboardData);
  } catch (error) {
    console.error('❌ Analytics dashboard error:', error);
    res.status(500).json({ error: 'Failed to generate analytics data' });
  }
});: 100,
        avgLatency: 0,
        deliveryRate: 100
      },
      messageFlow: {
        messagesPerMinute: analyticsData.messagesPerMinute,
        trend: '',
        history: analyticsData.messageHistory
      },
      dbStats: {
        totalMessages: analyticsData.totalMessages,
        totalRooms: rooms.size,
        totalSessions: 0,
        recentActivity: 0,
        dbSize: '1MB',
        oldestMessage: Date.now() - (24 * 60 * 60 * 1000)
      },
      timestamp: Date.now(),
      databaseReady: dbReady
    };
    
    res.json(dashboardData);
  } catch (error) {
    console.error('❌ Analytics dashboard error:', error);
    res.status(500).json({ error: 'Failed to generate analytics data' });
  }
});

// FIX 3: Activity endpoint shows activities from ALL rooms
app.get('/admin/activity', requireAdminAuth, (req, res) => {
  const { limit = 50 } = req.query; // Increased default limit
  res.json({
    activities: activityLog.slice(0, parseInt(limit)),
    total: activityLog.length,
    timestamp: Date.now()
  });
});

// FIXED: Detailed users endpoint with unique user counting
app.get('/admin/users/detailed', requireAdminAuth, async (req, res) => {
  try {
    const activeUsers = [];
    const uniqueUsers = new Set();
    
    for (const [roomId, roomPeers] of rooms.entries()) {
      for (const [socketId, peerData] of roomPeers.entries()) {
        activeUsers.push({
          socketId,
          peerId: peerData.peerId,
          displayName: peerData.displayName,
          roomId,
          joinedAt: peerData.joinedAt,
          duration: Date.now() - peerData.joinedAt,
          isActive: true
        });
        uniqueUsers.add(peerData.peerId);
      }
    }
    
    res.json({
      activeUsers,
      recentSessions: [],
      summary: {
        totalActive: activeUsers.length, // Total connections
        uniqueUsers: uniqueUsers.size,   // FIX: Actual unique users
        totalRooms: rooms.size,
        timestamp: Date.now()
      }
    });
  } catch (error) {
    console.error('❌ Detailed users error:', error);
    res.status(500).json({ error: 'Failed to get detailed user data' });
  }
});

app.get('/admin/rooms/detailed', requireAdminAuth, async (req, res) => {
  try {
    const detailedRooms = [];
    
    for (const [roomId, roomPeers] of rooms.entries()) {
      const roomStats = analyticsData.roomActivity.get(roomId);
      const roomCode = Array.from(roomCodes.entries()).find(([code, id]) => id === roomId)?.[0];
      
      detailedRooms.push({
        roomId,
        roomCode: roomCode || 'N/A',
        activeUsers: roomPeers.size,
        userList: Array.from(roomPeers.values()),
        created: roomStats?.created || Date.now(),
        lastActivity: roomStats?.lastActivity || Date.now(),
        totalMessages: roomStats?.messages || 0,
        uniqueUsers: roomPeers.size
      });
    }
    
    detailedRooms.sort((a, b) => b.lastActivity - a.lastActivity);
    
    res.json({
      activeRooms: detailedRooms,
      summary: {
        totalRooms: detailedRooms.length,
        totalActiveUsers: detailedRooms.reduce((sum, room) => sum + room.activeUsers, 0),
        totalMessages: detailedRooms.reduce((sum, room) => sum + room.totalMessages, 0),
        timestamp: Date.now()
      }
    });
  } catch (error) {
    console.error('❌ Detailed rooms error:', error);
    res.status(500).json({ error: 'Failed to get detailed room data' });
  }
});

app.post('/admin/users/:peerId/remove', requireAdminAuth, (req, res) => {
  const { peerId } = req.params;
  const { roomId, reason = 'Removed by admin' } = req.body;
  
  let removedUser = null;
  let socketToDisconnect = null;
  
  if (rooms.has(roomId)) {
    const roomPeers = rooms.get(roomId);
    for (const [socketId, peerData] of roomPeers.entries()) {
      if (peerData.peerId === peerId) {
        removedUser = peerData;
        socketToDisconnect = socketId;
        roomPeers.delete(socketId);
        break;
      }
    }
  }
  
  if (removedUser && socketToDisconnect) {
    const socket = io.sockets.sockets.get(socketToDisconnect);
    if (socket) {
      socket.emit('admin-removed', {
        reason,
        message: 'You have been removed from the room by an administrator.',
        timestamp: Date.now()
      });
      socket.disconnect(true);
    }
    
    io.to(roomId).emit('peer-left', {
      peerId,
      displayName: removedUser.displayName,
      reason: 'admin-removed'
    });
    
    logActivity('admin-action', {
      action: 'remove-user',
      peerId,
      displayName: removedUser.displayName,
      roomId,
      reason
    });
    
    res.json({
      success: true,
      removedUser: {
        peerId,
        displayName: removedUser.displayName,
        roomId
      },
      reason,
      timestamp: Date.now()
    });
  } else {
    res.status(404).json({
      success: false,
      error: 'User not found in specified room'
    });
  }
});

app.post('/admin/broadcast', requireAdminAuth, (req, res) => {
  const { message, targetRooms = 'all', priority = 'normal' } = req.body;
  
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message content required' });
  }
  
  const adminMessage = {
    id: generateMessageId(),
    content: message.trim(),
    sender: '🛡️ Festival Staff',
    timestamp: Date.now(),
    type: 'admin-broadcast',
    priority
  };

  let targetCount = 0;
  
  if (targetRooms === 'all') {
    io.emit('admin-message', adminMessage);
    targetCount = connectionStats.currentConnections;
  } else if (Array.isArray(targetRooms)) {
    targetRooms.forEach(roomId => {
      io.to(roomId).emit('admin-message', adminMessage);
      const room = rooms.get(roomId);
      if (room) {
        targetCount += room.size;
      }
    });
  }

  logActivity('admin-action', {
    action: 'broadcast-message',
    message: message.substring(0, 100),
    targetRooms,
    targetCount
  });

  res.json({ 
    success: true, 
    messagesSent: targetCount,
    targetRooms,
    timestamp: Date.now()
  });
});

app.delete('/admin/room/:roomId/messages', requireAdminAuth, (req, res) => {
  const { roomId } = req.params;
  
  safeDbRun('DELETE FROM messages WHERE room_id = ?', [roomId], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      const messagesDeleted = this.changes || 0;
      
      if (messageStore.has(roomId)) {
        messageStore.delete(roomId);
      }
      
      io.to(roomId).emit('room-messages-cleared', {
        roomId,
        message: `All messages in this room have been cleared by an administrator.`,
        messagesDeleted,
        clearLocalCache: true,
        timestamp: Date.now()
      });
      
      logActivity('admin-action', {
        action: 'clear-room-messages',
        roomId,
        messagesDeleted,
        usersNotified: rooms.has(roomId) ? rooms.get(roomId).size : 0
      });
      
      console.log(`🗑️ Room ${roomId} messages cleared: ${messagesDeleted} messages deleted`);
      
      res.json({ 
        success: true, 
        roomId, 
        messagesDeleted,
        usersNotified: rooms.has(roomId) ? rooms.get(roomId).size : 0,
        timestamp: Date.now()
      });
    }
  });
});

app.delete('/admin/database', requireAdminAuth, (req, res) => {
  const { confirm } = req.body;
  
  if (confirm !== 'WIPE_EVERYTHING') {
    return res.status(400).json({ error: 'Confirmation required: send "WIPE_EVERYTHING"' });
  }
  
  if (!dbReady || !db) {
    return res.status(503).json({ error: 'Database not ready' });
  }
  
  console.log('🗑️ Starting database wipe...');
  
  const wipeOperations = ['DELETE FROM messages', 'DELETE FROM user_sessions'];
  let completedOperations = 0;
  const results = [];
  
  const handleWipeComplete = () => {
    completedOperations++;
    
    if (completedOperations === wipeOperations.length) {
      messageStore.clear();
      analyticsData.roomActivity.clear();
      rooms.clear();
      roomCodes.clear();
      activityLog.length = 0;
      
      analyticsData.totalMessages = 0;
      analyticsData.messagesPerMinute = 0;
      analyticsData.messageHistory = [];
      
      io.emit('database-wiped', { 
        message: 'Database has been wiped. Please refresh the page.', 
        forceReload: true 
      });
      
      io.disconnectSockets(true);
      
      console.log('✅ Database wipe completed successfully');
      
      res.json({ 
        success: true, 
        message: 'Database completely wiped - all data cleared',
        operations: results,
        timestamp: Date.now()
      });
    }
  };
  
  wipeOperations.forEach((query, index) => {
    db.run(query, function(err) {
      if (err) {
        console.error(`❌ Wipe operation ${index + 1} failed:`, err.message);
        results.push({ query, success: false, error: err.message });
      } else {
        console.log(`✅ Wipe operation ${index + 1} completed: ${this.changes || 0} rows affected`);
        results.push({ query, success: true, rowsAffected: this.changes || 0 });
      }
      handleWipeComplete();
    });
  });
});

// Room endpoints
app.get('/resolve-room-code/:code', (req, res) => {
  const code = req.params.code.toLowerCase();
  const roomId = roomCodes.get(code);
  
  if (roomId) {
    res.json({ success: true, roomId, code });
  } else {
    res.json({ success: false, error: 'Room code not found' });
  }
});

app.post('/register-room-code', (req, res) => {
  const { roomId, roomCode } = req.body;
  
  if (!roomId || !roomCode) {
    return res.status(400).json({ error: 'roomId and roomCode are required' });
  }
  
  const normalizedCode = roomCode.toLowerCase();
  roomCodes.set(normalizedCode, roomId);
  devLog(`📋 Registered room code: ${normalizedCode} -> ${roomId}`);
  
  res.json({ success: true, roomId, roomCode: normalizedCode });
});

app.get('/room-stats/:roomId', (req, res) => {
  const { roomId } = req.params;
  const roomPeers = rooms.get(roomId);
  const activeUsers = roomPeers ? roomPeers.size : 0;
  
  res.json({
    roomId,
    activeUsers,
    totalConnections: activeUsers,
    lastActivity: Date.now(),
    timestamp: Date.now()
  });
});

app.get('/signaling-proxy', (req, res) => {
  res.json({
    signalingAvailable: true,
    endpoint: '/socket.io/',
    version: '3.3.1-admin-dashboard-fixed',
    features: ['peer-discovery', 'connection-assistance', 'room-management', 'messaging', 'cpu-optimized'],
    timestamp: Date.now()
  });
});

// Debug endpoint
if (isDevelopment) {
  app.get('/debug/rooms', (req, res) => {
    const roomData = Array.from(rooms.entries()).map(([id, peers]) => ({
      id,
      peers: peers.size,
      peerList: Array.from(peers.values())
    }));
    
    res.json({
      rooms: roomData,
      analytics: analyticsData,
      recentActivity: activityLog.slice(0, 5),
      environment: 'development',
      stats: connectionStats,
      performance: {
        memoryUsage: process.memoryUsage(),
        cpuUsage: cpuUsage,
        realTimeCpuPercent: cpuUsage.percent + '%',
        uptime: process.uptime()
      },
      database: {
        ready: dbReady,
        path: dbPath
      }
    });
  });
}

app.get('/', (req, res) => {
  res.json({
    service: 'PeddleNet Universal Signaling Server',
    version: '3.3.0-cpu-optimized',
    status: 'running',
    environment: NODE_ENV,
    platform: PLATFORM,
    mode: isDevelopment ? 'development' : isStaging ? 'staging' : 'production',
    description: 'Fixed admin dashboard issues: unique users, total counts, activity feed from all rooms',
    features: ['cors-headers', 'admin-dashboard-fixed', 'unique-user-counting', 'fixed-database-queries'],
    fixes: [
      'Fixed active users to count unique users instead of connections',
      'Fixed total counts to properly query database',
      'Fixed activity feed to show activities from all rooms',
      'Fixed message activities appearing in activity feed'
    ],
    endpoints: {
      health: '/health',
      cloudRunHealth: '/_ah/health',
      signaling: '/socket.io/',
      analytics: '/admin/analytics',
      activity: '/admin/activity',
      usersDetailed: '/admin/users/detailed',
      roomsDetailed: '/admin/rooms/detailed',
      broadcast: '/admin/broadcast',
      clearRoom: '/admin/room/:roomId/messages',
      wipeDatabase: '/admin/database',
      ...(isDevelopment && { 
        debug: '/debug/rooms',
        cpu: '/cpu'
      })
    },
    database: {
      ready: dbReady,
      path: dbPath
    },
    timestamp: Date.now()
  });
});

// Socket.IO connection handling - OPTIMIZED
io.on('connection', (socket) => {
  connectionStats.currentConnections++;
  connectionStats.totalConnections++;
  connectionStats.peakConnections = Math.max(
    connectionStats.peakConnections, 
    connectionStats.currentConnections
  );

  devLog(`🔗 Client connected: ${socket.id} (${connectionStats.currentConnections} active)`);
  socket.userData = null;

  socket.on('health-ping', (data) => {
    socket.emit('health-pong', {
      timestamp: Date.now(),
      serverTime: Date.now(),
      received: data.timestamp
    });
  });

  socket.on('join-admin', () => {
    socket.join('admin-channel');
    adminConnections.add(socket.id);
    socket.isAdmin = true;
    
    devLog(`🛡️ Admin client connected: ${socket.id}`);
    
    logActivity('admin-action', {
      action: 'admin-connected',
      socketId: socket.id
    });
  });

  socket.on('join-room', ({ roomId, peerId, displayName }) => {
    devLog(`👥 ${displayName} (${peerId}) joining room: ${roomId}`);
    
    socket.join(roomId);
    socket.userData = { roomId, peerId, displayName, joinedAt: Date.now() };
    
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Map());
      logActivity('room-created', { roomId, creator: displayName });
    }
    
    const roomPeers = rooms.get(roomId);
    
    // Remove duplicates
    for (const [socketId, peer] of roomPeers.entries()) {
      if (peer.peerId === peerId && socketId !== socket.id) {
        devLog(`🔄 Removing duplicate connection for peer ${peerId}: ${socketId}`);
        roomPeers.delete(socketId);
        const oldSocket = io.sockets.sockets.get(socketId);
        if (oldSocket) {
          oldSocket.disconnect(true);
        }
      }
    }
    
    roomPeers.set(socket.id, { peerId, displayName, joinedAt: Date.now() });
    
    if (!analyticsData.roomActivity.has(roomId)) {
      analyticsData.roomActivity.set(roomId, {
        messages: 0,
        lastActivity: Date.now()
      });
    }
    
    const roomStats = analyticsData.roomActivity.get(roomId);
    roomStats.lastActivity = Date.now();
    
    // DIRECT database operation - NO BATCHING
    const sessionId = `${peerId}-${Date.now()}`;
    safeDbRun(
      'INSERT INTO user_sessions (id, room_id, user_id, display_name, joined_at) VALUES (?, ?, ?, ?, datetime("now"))',
      [sessionId, roomId, peerId, displayName]
    );
    
    socket.to(roomId).emit('peer-joined', { peerId, displayName });
    
    const currentPeers = Array.from(roomPeers.values()).filter(peer => peer.peerId !== peerId);
    socket.emit('room-peers', currentPeers);
    
    logActivity('user-joined', { roomId, peerId, displayName });
  });

  socket.on('request-connection', ({ targetSocketId, fromPeerId }) => {
    socket.to(targetSocketId).emit('connection-request', {
      fromPeerId,
      fromSocketId: socket.id
    });
  });

  socket.on('connection-response', ({ targetSocketId, accepted, toPeerId }) => {
    socket.to(targetSocketId).emit('connection-response', {
      accepted,
      toPeerId,
      fromSocketId: socket.id
    });
  });

  socket.on('chat-message', ({ roomId, message, type = 'chat' }) => {
    devLog(`💬 Chat message from ${socket.id} in room ${roomId}`);
    
    if (socket.userData && socket.userData.roomId === roomId) {
      const enhancedMessage = {
        id: message.id || generateMessageId(),
        content: message.content,
        sender: socket.userData.displayName,
        timestamp: Date.now(),
        type,
        roomId
      };
      
      // DIRECT database operation - NO BATCHING
      safeDbRun(
        'INSERT INTO messages (id, room_id, sender, content, timestamp) VALUES (?, ?, ?, ?, ?)',
        [enhancedMessage.id, roomId, enhancedMessage.sender, enhancedMessage.content, enhancedMessage.timestamp]
      );
      
      if (!messageStore.has(roomId)) {
        messageStore.set(roomId, []);
      }
      const roomMessages = messageStore.get(roomId);
      roomMessages.push(enhancedMessage);
      
      if (roomMessages.length > MAX_ROOM_MESSAGES) {
        roomMessages.splice(0, roomMessages.length - MAX_ROOM_MESSAGES);
      }
      
      updateMessageAnalytics(roomId);
      
      io.to(roomId).emit('chat-message', enhancedMessage);
      
      socket.emit('message-delivered', {
        messageId: enhancedMessage.id,
        timestamp: Date.now()
      });
      
      // FIX: Log message activity to show in activity feed
      logActivity('message-sent', { 
        roomId, 
        sender: socket.userData.displayName,
        content: enhancedMessage.content.substring(0, 50) + (enhancedMessage.content.length > 50 ? '...' : ''),
        messageId: enhancedMessage.id
      });
      
      devLog(`✅ Message delivered to room ${roomId}`);
    } else {
      devLog(`⚠️ User ${socket.id} tried to send message to unauthorized room ${roomId}`);
      socket.emit('error', {
        message: 'You are not in the specified room',
        code: 'NOT_IN_ROOM'
      });
    }
  });

  socket.on('disconnect', (reason) => {
    connectionStats.currentConnections--;
    devLog(`🔌 Client disconnected: ${socket.id} (${connectionStats.currentConnections} active, reason: ${reason})`);
    
    if (socket.isAdmin && adminConnections.has(socket.id)) {
      adminConnections.delete(socket.id);
      devLog(`🛡️ Admin client disconnected: ${socket.id}`);
    }
    
    if (socket.userData) {
      const { roomId, peerId, displayName, joinedAt } = socket.userData;
      
      // DIRECT database operation - NO BATCHING
      const sessionDuration = Date.now() - joinedAt;
      safeDbRun(
        'UPDATE user_sessions SET left_at = datetime("now"), duration = ? WHERE user_id = ? AND room_id = ? AND left_at IS NULL',
        [sessionDuration, peerId, roomId]
      );
      
      if (rooms.has(roomId)) {
        const roomPeers = rooms.get(roomId);
        roomPeers.delete(socket.id);
        
        socket.to(roomId).emit('peer-left', { peerId, displayName });
        
        if (roomPeers.size === 0) {
          rooms.delete(roomId);
          devLog(`🗑️ Room ${roomId} deleted (empty)`);
        }
      }
      
      logActivity('user-left', { roomId, peerId, displayName });
    }
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

function generateMessageId() {
  return Math.random().toString(36).substring(2, 15);
}

// REDUCED frequency cleanup
setInterval(() => {
  let cleanedRooms = 0;
  for (const [roomId, peers] of rooms.entries()) {
    if (peers.size === 0) {
      rooms.delete(roomId);
      cleanedRooms++;
    }
  }
  if (cleanedRooms > 0) {
    devLog(`🧹 Cleaned up ${cleanedRooms} empty rooms`);
  }
}, 15 * 60 * 1000); // Every 15 minutes

// REDUCED frequency database cleanup
async function setupDatabaseCleanup() {
  if (!dbReady) return;
  
  setInterval(() => {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000);
    safeDbRun('DELETE FROM messages WHERE timestamp < ?', [cutoff], function(err) {
      if (err) {
        console.error('❌ Message cleanup failed:', err.message);
      } else if (this.changes > 0) {
        console.log(`🧹 Cleaned up ${this.changes} old messages`);
      }
    });
  }, 24 * 60 * 60 * 1000); // Every 24 hours
}

// Initialize and start server
async function startServer() {
  try {
    await initializeDatabase();
    await setupDatabaseCleanup();
    
    logActivity('server-start', {
      environment: NODE_ENV,
      platform: PLATFORM,
      timestamp: Date.now()
    });

    const PORT = process.env.PORT || 3001;
    server.listen(PORT, '0.0.0.0', () => {
      devLog(`🎵 PeddleNet Universal Server v3.3.1-admin-dashboard-fixed running on port ${PORT}`);
      devLog(`🔍 Health check: http://localhost:${PORT}/health`);
      devLog(`📊 Analytics dashboard: http://localhost:${PORT}/admin/analytics`);
      devLog(`🚀 ADMIN DASHBOARD FIXES:`);
      devLog(`   ✅ Fixed active users counting (unique users instead of connections)`);
      devLog(`   ✅ Fixed total counts from database queries`);
      devLog(`   ✅ Fixed activity feed to show activities from all rooms`);
      devLog(`   ✅ Fixed message activities appearing in activity feed`);
      devLog(`✅ ALL ADMIN ENDPOINTS: analytics, activity, users/detailed, rooms/detailed, broadcast, clear room, wipe database`);
      
      if (isDevelopment) {
        devLog(`🐛 Debug endpoint: http://localhost:${PORT}/debug/rooms`);
        
        const interfaces = os.networkInterfaces();
        for (const name of Object.keys(interfaces)) {
          for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
              devLog(`📱 Mobile: http://${iface.address}:3000 → http://${iface.address}:${PORT}`);
            }
          }
        }
      }
    });

  } catch (error) {
    console.error('❌ Failed to initialize server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
let isShuttingDown = false;

function gracefulShutdown(signal) {
  if (isShuttingDown) {
    console.log(`${signal} already in progress, ignoring...`);
    return;
  }
  
  isShuttingDown = true;
  console.log(`${signal} received, shutting down gracefully`);
  
  if (db) {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
      } else {
        console.log('Database connection closed');
      }
    });
  }
  
  if (io) {
    io.close(() => {
      console.log('Socket.IO connections closed');
      
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });
  } else {
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  }
  
  setTimeout(() => {
    console.log('Force shutdown after timeout');
    process.exit(1);
  }, 5000);
}

process.once('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.once('SIGINT', () => gracefulShutdown('SIGINT'));

startServer();

module.exports = { app, server, io, db };

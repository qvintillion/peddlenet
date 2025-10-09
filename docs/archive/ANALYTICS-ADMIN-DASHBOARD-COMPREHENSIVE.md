# 📊 Comprehensive Analytics & Admin Dashboard Design

## 🎯 **Current State Analysis**

### **✅ Message Storage Status**
- **Client-side**: localStorage with 24-hour expiry (500 messages/room, 10 rooms max)
- **Server-side**: In-memory only (ephemeral, lost on restart)
- **SQLite**: Available but not currently integrated in production server

### **🎯 Key Requirements**
1. **Active Users & Rooms**: Real-time monitoring
2. **Message Analytics**: Messages being sent, flow patterns
3. **Server Health**: Network, connections, performance metrics
4. **Admin Controls**: Clear messages, room management, database operations
5. **Message Persistence**: 24-hour history for scenarios like "lost and found"
6. **Network Monitoring**: Essential for future mesh network

---

## 🏗️ **Hybrid Message Storage Strategy**

### **Problem**: Lost & Found Use Case
- **Scenario**: New user joins "lost-and-found" room
- **Need**: See messages from last 24 hours 
- **Current Issue**: Only localStorage (client-side) stores history

### **✅ SOLUTION: Hybrid Storage Architecture**

```javascript
// Enhanced Server Storage Strategy
class MessageStorage {
  constructor() {
    // In-memory for real-time (current)
    this.activeMessages = new Map(); // roomId -> Message[]
    
    // SQLite for persistence (24h history)
    this.persistentStorage = new SQLiteStorage();
    
    // Admin analytics
    this.analyticsStore = new AnalyticsStorage();
  }

  async saveMessage(roomId, message) {
    // 1. Store in memory for real-time
    this.addToActiveMessages(roomId, message);
    
    // 2. Persist to SQLite for 24h history
    await this.persistentStorage.saveMessage(roomId, message);
    
    // 3. Update analytics
    this.analyticsStore.recordMessage(roomId, message);
  }

  async getRoomHistory(roomId, maxAge = 24 * 60 * 60 * 1000) {
    // Get recent messages from SQLite
    return await this.persistentStorage.getRecentMessages(roomId, maxAge);
  }
}
```

---

## 📊 **Comprehensive Dashboard Features**

### **🎪 1. Real-Time Overview Panel**

```typescript
// Admin Dashboard Main View
export function AdminDashboard() {
  const {
    realTimeStats,
    serverHealth,
    networkStatus,
    activeRooms,
    messageFlow
  } = useRealTimeAnalytics();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
      {/* Live Stats Cards */}
      <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4">
        <MetricCard
          title="Active Users"
          value={realTimeStats.activeUsers}
          trend={realTimeStats.userTrend}
          icon="👥"
          color="green"
        />
        <MetricCard
          title="Active Rooms"
          value={realTimeStats.activeRooms}
          trend={realTimeStats.roomTrend}
          icon="🏠"
          color="blue"
        />
        <MetricCard
          title="Messages/Min"
          value={messageFlow.messagesPerMinute}
          trend={messageFlow.trend}
          icon="💬"
          color="purple"
        />
        <MetricCard
          title="Server Health"
          value={serverHealth.status}
          subvalue={`${serverHealth.uptime} uptime`}
          icon="🖥️"
          color={serverHealth.status === 'healthy' ? 'green' : 'red'}
        />
        <MetricCard
          title="Network Quality"
          value={`${networkStatus.quality}%`}
          subvalue={`${networkStatus.avgLatency}ms`}
          icon="🌐"
          color={networkStatus.quality > 90 ? 'green' : networkStatus.quality > 70 ? 'yellow' : 'red'}
        />
        <MetricCard
          title="Storage Used"
          value={`${realTimeStats.storageUsed}MB`}
          subvalue={`${realTimeStats.messageCount} messages`}
          icon="💾"
          color="gray"
        />
      </div>

      {/* Live Activity Feed */}
      <div className="lg:col-span-2">
        <LiveActivityFeed />
      </div>

      {/* Quick Admin Controls */}
      <div>
        <QuickAdminControls />
      </div>
    </div>
  );
}
```

### **🔍 2. Live Activity Monitoring**

```typescript
// Real-time activity feed
export function LiveActivityFeed() {
  const { activities } = useActivityStream();

  return (
    <div className="bg-gray-800 rounded-lg p-6 h-96 overflow-y-auto">
      <h3 className="text-xl font-semibold mb-4">🔴 Live Activity</h3>
      
      <div className="space-y-2">
        {activities.map(activity => (
          <div key={activity.id} className="flex items-center space-x-3 p-2 bg-gray-700 rounded">
            <div className="text-lg">{activity.icon}</div>
            <div className="flex-1">
              <div className="text-sm">{activity.description}</div>
              <div className="text-xs text-gray-400">{activity.timestamp}</div>
            </div>
            {activity.roomId && (
              <button 
                onClick={() => navigateToRoom(activity.roomId)}
                className="text-xs px-2 py-1 bg-purple-600 rounded"
              >
                View Room
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### **🎛️ 3. Advanced Admin Controls**

```typescript
// Comprehensive admin control panel
export function AdvancedAdminControls() {
  const {
    broadcastMessage,
    clearRoomMessages,
    wipeDatabaseCompletely,
    restartServer,
    exportAnalytics,
    manageRooms
  } = useAdminActions();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Message Management */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">💬 Message Management</h3>
        
        <div className="space-y-4">
          {/* Broadcast Message */}
          <div>
            <label className="block text-sm font-medium mb-2">Broadcast to All Rooms</label>
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Emergency announcement..."
                className="flex-1 px-3 py-2 bg-gray-700 rounded border border-gray-600"
              />
              <button 
                onClick={() => broadcastMessage(message)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded"
              >
                📢 Send
              </button>
            </div>
          </div>

          {/* Clear Room Messages */}
          <div>
            <label className="block text-sm font-medium mb-2">Clear Room Messages</label>
            <div className="flex space-x-2">
              <select className="flex-1 px-3 py-2 bg-gray-700 rounded border border-gray-600">
                <option value="">Select room...</option>
                {activeRooms.map(room => (
                  <option key={room.id} value={room.id}>
                    {room.code} ({room.activeUsers} users)
                  </option>
                ))}
              </select>
              <button 
                onClick={() => clearRoomMessages(selectedRoom)}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded"
              >
                🗑️ Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Database Management */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">🗄️ Database Management</h3>
        
        <div className="space-y-4">
          {/* Database Stats */}
          <div className="bg-gray-700 p-3 rounded">
            <div className="text-sm">
              <div>Messages: {dbStats.totalMessages}</div>
              <div>Rooms: {dbStats.totalRooms}</div>
              <div>Size: {dbStats.dbSize}</div>
              <div>Oldest: {formatDate(dbStats.oldestMessage)}</div>
            </div>
          </div>

          {/* Export Data */}
          <button 
            onClick={() => exportAnalytics()}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
          >
            📊 Export Analytics
          </button>

          {/* DANGER: Wipe Database */}
          <button 
            onClick={() => wipeDatabaseCompletely()}
            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded border-2 border-red-400"
          >
            ⚠️ WIPE DATABASE
          </button>
        </div>
      </div>

      {/* Server Management */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">🖥️ Server Management</h3>
        
        <div className="space-y-4">
          {/* Server Health */}
          <div className="bg-gray-700 p-3 rounded">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Server Status</span>
              <span className={`px-2 py-1 rounded text-xs ${
                serverHealth.status === 'healthy' ? 'bg-green-600' : 'bg-red-600'
              }`}>
                {serverHealth.status}
              </span>
            </div>
            <div className="text-xs text-gray-400">
              <div>Uptime: {serverHealth.uptime}</div>
              <div>Memory: {serverHealth.memoryUsed}/{serverHealth.memoryTotal}</div>
              <div>CPU: {serverHealth.cpuUsage}%</div>
            </div>
          </div>

          {/* Server Actions */}
          <button 
            onClick={() => restartServer()}
            className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded"
          >
            🔄 Restart Server
          </button>

          <button 
            onClick={() => viewServerLogs()}
            className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded"
          >
            📋 View Logs
          </button>
        </div>
      </div>
    </div>
  );
}
```

### **🌐 4. Network & Mesh Monitoring**

```typescript
// Network monitoring for current & future mesh network
export function NetworkMonitoring() {
  const { 
    connectionStats,
    meshTopology,
    networkQuality,
    connectionHistory 
  } = useNetworkAnalytics();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Connection Overview */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">🔗 Connection Status</h3>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400">
              {connectionStats.active}
            </div>
            <div className="text-sm text-gray-400">Active</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-400">
              {connectionStats.reconnecting}
            </div>
            <div className="text-sm text-gray-400">Reconnecting</div>
          </div>
        </div>

        {/* Connection Quality Metrics */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm">Average Latency</span>
            <span className={`px-2 py-1 rounded text-xs ${
              networkQuality.avgLatency < 100 ? 'bg-green-600' : 
              networkQuality.avgLatency < 300 ? 'bg-yellow-600' : 'bg-red-600'
            }`}>
              {networkQuality.avgLatency}ms
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Connection Success Rate</span>
            <span className={`px-2 py-1 rounded text-xs ${
              networkQuality.successRate > 95 ? 'bg-green-600' : 
              networkQuality.successRate > 85 ? 'bg-yellow-600' : 'bg-red-600'
            }`}>
              {networkQuality.successRate}%
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Message Delivery Rate</span>
            <span className={`px-2 py-1 rounded text-xs ${
              networkQuality.deliveryRate > 98 ? 'bg-green-600' : 
              networkQuality.deliveryRate > 90 ? 'bg-yellow-600' : 'bg-red-600'
            }`}>
              {networkQuality.deliveryRate}%
            </span>
          </div>
        </div>
      </div>

      {/* Future: Mesh Network Topology */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">🕸️ Network Topology</h3>
        
        {meshTopology.enabled ? (
          <MeshNetworkVisualization topology={meshTopology} />
        ) : (
          <div className="text-center py-8 text-gray-400">
            <div className="text-4xl mb-4">🌐</div>
            <div className="text-lg mb-2">Mesh Network: Disabled</div>
            <div className="text-sm">Currently using WebSocket server</div>
            <button 
              onClick={() => enableMeshNetwork()}
              className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded"
            >
              🚀 Enable Mesh Network
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## 🛠️ **Enhanced Server Implementation**

### **📊 Server Analytics Endpoints**

```javascript
// Enhanced server with SQLite integration
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const { Server } = require('socket.io');

class EnhancedServer {
  constructor() {
    this.app = express();
    this.db = new sqlite3.Database('./festival-chat.db');
    this.initializeDatabase();
    this.setupAnalyticsEndpoints();
    this.setupAdminEndpoints();
  }

  initializeDatabase() {
    // Create tables for message persistence
    this.db.run(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        room_id TEXT NOT NULL,
        sender TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS room_analytics (
        room_id TEXT PRIMARY KEY,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
        total_messages INTEGER DEFAULT 0,
        unique_users INTEGER DEFAULT 0,
        peak_concurrent INTEGER DEFAULT 0
      )
    `);

    // Auto-cleanup old messages (24 hours)
    setInterval(() => {
      const cutoff = Date.now() - (24 * 60 * 60 * 1000);
      this.db.run('DELETE FROM messages WHERE timestamp < ?', [cutoff]);
    }, 60 * 60 * 1000); // Run every hour
  }

  setupAnalyticsEndpoints() {
    // Real-time analytics dashboard data
    this.app.get('/admin/analytics', async (req, res) => {
      const analytics = await this.generateAnalytics();
      res.json(analytics);
    });

    // Individual room analytics
    this.app.get('/admin/room/:roomId/analytics', async (req, res) => {
      const { roomId } = req.params;
      const roomAnalytics = await this.getRoomAnalytics(roomId);
      res.json(roomAnalytics);
    });

    // Message history for admin (last 24h)
    this.app.get('/admin/room/:roomId/messages', async (req, res) => {
      const { roomId } = req.params;
      const { limit = 100 } = req.query;
      
      this.db.all(
        'SELECT * FROM messages WHERE room_id = ? ORDER BY timestamp DESC LIMIT ?',
        [roomId, limit],
        (err, rows) => {
          if (err) {
            res.status(500).json({ error: err.message });
          } else {
            res.json({ messages: rows.reverse() });
          }
        }
      );
    });

    // Network health and performance
    this.app.get('/admin/network-health', (req, res) => {
      res.json({
        serverHealth: this.getServerHealth(),
        connectionStats: this.getConnectionStats(),
        networkQuality: this.getNetworkQuality(),
        timestamp: Date.now()
      });
    });
  }

  setupAdminEndpoints() {
    // Clear room messages
    this.app.delete('/admin/room/:roomId/messages', (req, res) => {
      const { roomId } = req.params;
      
      this.db.run('DELETE FROM messages WHERE room_id = ?', [roomId], (err) => {
        if (err) {
          res.status(500).json({ error: err.message });
        } else {
          // Also clear from memory
          if (this.rooms.has(roomId)) {
            this.rooms.get(roomId).messages = [];
          }
          
          // Broadcast to admin clients
          this.io.to('admin-channel').emit('room-cleared', { roomId });
          
          res.json({ success: true, roomId });
        }
      });
    });

    // DANGER: Wipe entire database
    this.app.delete('/admin/database', (req, res) => {
      const { confirm } = req.body;
      
      if (confirm !== 'WIPE_EVERYTHING') {
        return res.status(400).json({ error: 'Confirmation required' });
      }
      
      this.db.run('DELETE FROM messages', (err) => {
        if (err) {
          res.status(500).json({ error: err.message });
        } else {
          this.db.run('DELETE FROM room_analytics', (err2) => {
            if (err2) {
              res.status(500).json({ error: err2.message });
            } else {
              // Clear all in-memory data
              this.rooms.clear();
              this.connections.clear();
              
              res.json({ success: true, message: 'Database wiped' });
            }
          });
        }
      });
    });

    // Broadcast admin message
    this.app.post('/admin/broadcast', (req, res) => {
      const { message, targetRooms = 'all' } = req.body;
      
      const adminMessage = {
        id: this.generateId(),
        content: message,
        sender: '🛡️ Festival Staff',
        timestamp: Date.now(),
        type: 'admin-broadcast'
      };

      if (targetRooms === 'all') {
        this.io.emit('admin-message', adminMessage);
      } else {
        targetRooms.forEach(roomId => {
          this.io.to(roomId).emit('admin-message', adminMessage);
        });
      }

      res.json({ 
        success: true, 
        messagesSent: targetRooms === 'all' ? this.rooms.size : targetRooms.length 
      });
    });

    // Export analytics data
    this.app.get('/admin/export', async (req, res) => {
      const { format = 'json' } = req.query;
      
      try {
        const exportData = await this.generateExportData();
        
        if (format === 'csv') {
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', 'attachment; filename=festival-chat-analytics.csv');
          res.send(this.convertToCSV(exportData));
        } else {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Content-Disposition', 'attachment; filename=festival-chat-analytics.json');
          res.json(exportData);
        }
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  }

  // Enhanced message handling with persistence
  async handleChatMessage(socket, data) {
    const message = {
      id: this.generateId(),
      ...data,
      timestamp: Date.now()
    };

    // 1. Store in database for persistence
    this.db.run(
      'INSERT INTO messages (id, room_id, sender, content, timestamp) VALUES (?, ?, ?, ?, ?)',
      [message.id, message.roomId, message.sender, message.content, message.timestamp]
    );

    // 2. Store in memory for real-time
    this.addToRoomMessages(message.roomId, message);

    // 3. Broadcast to room
    this.io.to(message.roomId).emit('chat-message', message);

    // 4. Update analytics
    this.updateRoomAnalytics(message.roomId);

    // 5. Send to admin dashboard
    this.io.to('admin-channel').emit('admin-activity', {
      type: 'message-sent',
      roomId: message.roomId,
      sender: message.sender,
      timestamp: message.timestamp
    });
  }

  // When user joins room, send recent history
  async handleJoinRoom(socket, { roomId, peerId, displayName }) {
    // Existing join logic...
    
    // Send recent message history (for lost & found scenario)
    this.db.all(
      'SELECT * FROM messages WHERE room_id = ? AND timestamp > ? ORDER BY timestamp ASC',
      [roomId, Date.now() - (24 * 60 * 60 * 1000)],
      (err, rows) => {
        if (!err && rows.length > 0) {
          socket.emit('room-history', {
            roomId,
            messages: rows,
            historyCount: rows.length
          });
        }
      }
    );
  }
}
```

---

## 🚀 **Implementation Timeline**

### **Week 1: Server Enhancement & Storage**
```bash
# 1. Add SQLite integration to server
# 2. Implement message persistence
# 3. Create analytics data collection
# 4. Set up admin endpoints

# Server changes:
touch signaling-server-enhanced-analytics.js
npm install sqlite3 # already available
```

### **Week 2: Dashboard Frontend**
```bash
# 1. Create admin dashboard structure
mkdir -p src/app/admin
touch src/app/admin/page.tsx
touch src/hooks/use-admin-analytics.ts

# 2. Implement real-time components
touch src/components/admin/LiveActivityFeed.tsx
touch src/components/admin/NetworkMonitoring.tsx
```

### **Week 3: Admin Controls & Testing**
```bash
# 1. Implement admin actions
touch src/components/admin/AdvancedAdminControls.tsx
touch src/hooks/use-admin-actions.ts

# 2. Test message persistence
# 3. Validate lost & found scenario
npm run preview:deploy admin-dashboard-test
```

### **Week 4: Polish & Production**
```bash
# 1. Performance optimization
# 2. Security review for admin endpoints
# 3. Mobile responsive testing
./deploy.sh  # Deploy with analytics dashboard
```

---

## 🎯 **Key Benefits of This Approach**

### **✅ Addresses All Requirements**
1. **✅ Active Users & Rooms**: Real-time monitoring with WebSocket updates
2. **✅ Message Analytics**: Flow tracking, rate monitoring, history analysis
3. **✅ Server Health**: Comprehensive network, memory, connection metrics
4. **✅ Admin Controls**: Clear messages, wipe database, broadcast, room management
5. **✅ Message Persistence**: SQLite backend for 24-hour history (lost & found)
6. **✅ Network Monitoring**: Foundation for mesh network, connection quality tracking

### **✅ Strategic Advantages**
1. **Hybrid Storage**: Best of both worlds (performance + persistence)
2. **Festival-Ready**: Lost & found, admin announcements, real-time management
3. **Scalable**: SQLite for now, can migrate to PostgreSQL later
4. **Mesh-Prepared**: Network monitoring foundation for future P2P features
5. **Professional Platform**: Positions Festival Chat as enterprise-grade solution

### **✅ Technical Benefits**
1. **Minimal Breaking Changes**: Enhances existing server, doesn't replace
2. **Performance**: In-memory for real-time, SQLite for persistence
3. **Admin Safety**: Confirmation dialogs, export before wipe, granular controls
4. **Mobile Responsive**: Dashboard works on tablets for on-site management

This comprehensive approach transforms Festival Chat from a messaging app into a **professional festival communication platform** with enterprise-grade monitoring and management capabilities! 🎪

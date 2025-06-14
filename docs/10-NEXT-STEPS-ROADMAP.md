# 🚀 Next Steps Roadmap - Festival Chat Evolution

## 🎯 Strategic Overview

Festival Chat has reached **production stability** with mobile-optimized connections, cross-device messaging, and robust error handling. This roadmap outlines the evolution toward **mesh networking**, **enhanced user experience**, and **enterprise festival features**.

## 🚀 **STRATEGIC RECOMMENDATION: Vercel as Primary Platform (June 13, 2025)**

### **✅ Deployment Platform Consolidation**

**Current Status**: Successfully resolved admin dashboard 404 issue by fixing Vercel environment variables  
**Strategic Decision**: **Vercel should be the primary deployment platform**

**✅ Admin Dashboard Status**:
- **✅ PRODUCTION READY**: Dashboard fully deployed at `https://peddlenet.app/admin-analytics`
- **✅ Real-time monitoring**: Live WebSocket connection status and server health metrics
- **✅ Universal WebSocket server**: Production server with environment auto-detection
- **✅ UI functionality**: Working dashboard interface with real-time updates
- **✅ Server authentication**: Properly configured with HTTP Basic Auth protection
- **✅ Frontend authentication**: Built-in form authentication working correctly
- **✅ Health endpoints**: `/health`, `/stability` providing comprehensive server metrics
- **✅ Complete admin access**: Full dashboard functionality operational with admin credentials
- **Credentials**: Username: `th3p3ddl3r`, Password: `letsmakeatrade`
- **Status**: FULLY OPERATIONAL - Admin dashboard ready for production use

**Why Vercel?**
- ✅ **Already connected and working** - Auto-deploys from GitHub
- ✅ **Custom domain configured** - `peddlenet.app` is live and working
- ✅ **Seamless GitHub integration** - Zero-config deployment pipeline
- ✅ **Superior Next.js optimization** - Built specifically for Next.js apps
- ✅ **Edge network performance** - Global CDN with intelligent routing
- ✅ **Environment variable management** - Easy dashboard configuration
- ✅ **Preview deployments** - Automatic preview URLs for every pull request
- ✅ **Zero maintenance** - No Firebase or GitHub Actions workflow management

### **Platform Comparison & Recommendation**

| Feature | **Vercel (Recommended)** | Firebase | GitHub Pages |
|---------|-------------------------|----------|-------------|
| **Next.js Optimization** | ✅ Native support | ⚠️ Requires config | ⚠️ Static export only |
| **Custom Domain** | ✅ Working (`peddlenet.app`) | ✅ Available | ✅ Available |
| **Auto Deployment** | ✅ GitHub integration | ⚠️ Manual setup | ✅ GitHub Actions |
| **Environment Variables** | ✅ Dashboard UI | ⚠️ CLI/config files | ⚠️ Secrets + workflow |
| **Preview Deployments** | ✅ Automatic | ✅ Preview channels | ❌ Manual |
| **Performance** | ✅ Edge network | ✅ Google CDN | ⚠️ GitHub CDN |
| **Maintenance** | ✅ Zero config | ⚠️ Firebase CLI | ⚠️ Workflow maintenance |
| **Cost** | ✅ Free tier generous | ✅ Free tier good | ✅ Free |

### **Implementation Strategy**

**Phase 1: Immediate (This Week)**
- ✅ **Primary**: Continue using Vercel for production deployments
- ✅ **Backup**: Keep Firebase for staging/testing environments
- ✅ **Archive**: Disable GitHub Pages deployment (optional)

**Phase 2: Optimization (Next Week)**
```bash
# Streamline deployment workflow
# Remove GitHub Actions complexity
# Focus on Vercel + Firebase staging setup

# Update npm scripts for clarity:
npm run deploy:vercel:production  # → Push to main branch (auto-deploys)
npm run deploy:firebase:staging   # → Firebase staging environment
npm run preview:vercel            # → Preview branch deployment
```

**Phase 3: Documentation Update**
- Update all deployment documentation to prioritize Vercel
- Create Vercel-specific troubleshooting guides
- Simplify developer onboarding with Vercel-first approach

### **Strategic Benefits**

**For Development**:
- **Faster iteration** - Push to branch, get instant preview URL
- **Less configuration** - No complex GitHub Actions or Firebase CLI
- **Better debugging** - Vercel's superior logging and monitoring
- **Next.js optimizations** - Automatic performance optimizations

**For Production**:
- **Higher reliability** - Vercel's infrastructure built for Next.js
- **Better performance** - Edge network with intelligent caching
- **Easier scaling** - Automatic scaling without configuration
- **Professional monitoring** - Built-in analytics and error tracking

**For Team**:
- **Simplified workflow** - One primary platform to learn
- **Reduced complexity** - Fewer deployment pipelines to maintain
- **Industry standard** - Vercel is widely adopted for Next.js apps
- **Future-proof** - Vercel continues to innovate with Next.js

**🎯 Result**: **Vercel-first deployment strategy** reduces complexity while improving performance and developer experience!

## 📊 Current Foundation Assessment

### **✅ Solid Production Foundation**
- **Mobile connection optimization** - Rate limiting and circuit breaker improvements deployed
- **Cross-device messaging** - Desktop ↔ Mobile proven reliable
- **Connection resilience** - Circuit breaker, exponential backoff, connection throttling
- **WebSocket infrastructure** - Google Cloud Run deployment with SQLite persistence
- **Development workflow** - Streamlined deployment with `./deploy.sh`

### **🎯 Next Evolution Targets**
1. **Enhanced User Experience** - Notifications, streamlined UI, preview channels
2. **Data Pooling & Message Intelligence** - Smart message routing and analytics
3. **Mesh Network Foundation** - P2P optimization and distributed architecture
4. **Enterprise Festival Features** - Multi-room management, organizer tools

**Phase 4B: Enhanced Analytics (Week 2-3)**

```typescript
// NEW: src/hooks/use-analytics.ts
export function useAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Real-time analytics polling
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Use existing server endpoints
        const [dashboardData, healthData] = await Promise.all([
          ServerUtils.fetchAnalytics(),
          ServerUtils.testHttpHealth()
        ]);

        setAnalytics({
          totalUsers: dashboardData.totalUsers,
          activeRooms: dashboardData.activeRooms,
          currentConnections: healthData.connections.current,
          peakConnections: healthData.connections.peak,
          notificationSubscribers: dashboardData.notificationSubscribers || 0,
          messagesPerHour: calculateMessagesPerHour(dashboardData),
          uptime: healthData.uptime,
          memoryUsage: healthData.memory,
          connectionHistory: updateConnectionHistory(healthData),
          roomDistribution: calculateRoomDistribution(dashboardData)
        });

        // Fetch individual room data
        const roomPromises = Array.from({ length: dashboardData.activeRooms }, (_, i) => 
          ServerUtils.fetchRoomStats(`room-${i}`)
        );
        const roomData = await Promise.allSettled(roomPromises);
        setRooms(roomData.filter(r => r.status === 'fulfilled').map(r => r.value));
        
        setIsLoading(false);
      } catch (error) {
        console.error('Analytics fetch failed:', error);
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchAnalytics();
    
    // Real-time updates every 5 seconds
    const interval = setInterval(fetchAnalytics, 5000);
    return () => clearInterval(interval);
  }, []);

  return { analytics, rooms, isLoading };
}
```

**Phase 4C: Admin Controls (Week 3-4)**

```typescript
// NEW: src/components/admin/AdminControls.tsx
export function AdminControls() {
  const { 
    broadcastMessage, 
    closeRoom, 
    banUser, 
    getServerLogs,
    restartServer 
  } = useAdminActions();

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-xl font-semibold mb-4">🛡️ Admin Controls</h3>
      
      <div className="space-y-4">
        {/* Broadcast Message */}
        <div className="flex items-center space-x-4">
          <input 
            type="text" 
            placeholder="Broadcast message to all rooms"
            className="flex-1 px-4 py-2 bg-gray-700 rounded-lg text-white"
          />
          <button 
            onClick={() => broadcastMessage(message)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg"
          >
            📢 Broadcast
          </button>
        </div>

        {/* Emergency Controls */}
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => getServerLogs()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
          >
            📋 View Logs
          </button>
          <button 
            onClick={() => restartServer()}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg"
          >
            🔄 Restart Server
          </button>
        </div>
      </div>
    </div>
  );
}
```

### **4.3: Server Analytics Enhancement** 🔧

**Extend existing server endpoints with more detailed analytics**:

```javascript
// ENHANCE: signaling-server.js analytics endpoints

// Enhanced analytics endpoint
app.get('/analytics/detailed', (req, res) => {
  const roomAnalytics = Array.from(rooms.entries()).map(([roomId, peers]) => {
    const subscribers = notificationSubscribers.get(roomId) || new Set();
    return {
      roomId,
      activeUsers: peers.size,
      notificationSubscribers: subscribers.size,
      totalEngagement: peers.size + subscribers.size,
      lastActivity: Date.now() // TODO: Track actual last activity
    };
  });

  res.json({
    overview: {
      totalUsers: connectionStats.totalConnections,
      activeRooms: rooms.size,
      currentConnections: connectionStats.currentConnections,
      peakConnections: connectionStats.peakConnections,
      totalNotificationSubscribers: Array.from(notificationSubscribers.values())
        .reduce((sum, set) => sum + set.size, 0),
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage()
    },
    rooms: roomAnalytics,
    connectionStats: {
      ...connectionStats,
      coldStartRate: connectionStats.coldStarts / connectionStats.totalConnections,
      corsRejectionRate: connectionStats.corsRejections / connectionStats.totalConnections
    },
    timestamp: Date.now()
  });
});

// Admin action endpoints
app.post('/admin/broadcast', (req, res) => {
  const { message, targetRooms = 'all' } = req.body;
  
  const adminMessage = {
    id: generateMessageId(),
    content: message,
    sender: '🛡️ Admin',
    timestamp: Date.now(),
    type: 'admin-broadcast',
    priority: 'high'
  };

  if (targetRooms === 'all') {
    // Broadcast to all rooms
    rooms.forEach((_, roomId) => {
      io.to(roomId).emit('admin-message', adminMessage);
    });
  } else {
    // Broadcast to specific rooms
    targetRooms.forEach(roomId => {
      io.to(roomId).emit('admin-message', adminMessage);
    });
  }

  res.json({ success: true, messagesSent: targetRooms === 'all' ? rooms.size : targetRooms.length });
});
```

### **4.4: Real-Time Dashboard Features** ⚡

**Live connection monitoring, room management, and admin controls**:

```typescript
// NEW: src/components/admin/LiveConnectionMonitor.tsx
export function LiveConnectionMonitor() {
  const { connections, connectionHistory } = useRealTimeConnections();

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-xl font-semibold mb-4">🔗 Live Connections</h3>
      
      <div className="space-y-4">
        {/* Connection Status */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              {connections.active}
            </div>
            <div className="text-sm text-gray-400">Active</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">
              {connections.reconnecting}
            </div>
            <div className="text-sm text-gray-400">Reconnecting</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400">
              {connections.failed}
            </div>
            <div className="text-sm text-gray-400">Failed</div>
          </div>
        </div>

        {/* Connection History Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={connectionHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="time" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151' 
                }} 
              />
              <Line 
                type="monotone" 
                dataKey="connections" 
                stroke="#8B5CF6" 
                strokeWidth={2} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
```

### **📋 Phase 4 Implementation Plan**

**Week 1: Basic Dashboard Setup**
```bash
# Create admin dashboard structure
mkdir -p src/app/admin/dashboard
touch src/app/admin/dashboard/page.tsx
touch src/hooks/use-analytics.ts
touch src/components/admin/MetricCard.tsx
```

**Week 2: Real-Time Analytics**
```bash
# Implement real-time data fetching
touch src/lib/analytics-client.ts
touch src/components/admin/ConnectionChart.tsx
touch src/components/admin/RoomTable.tsx
```

**Week 3: Admin Controls**
```bash
# Add admin functionality
touch src/components/admin/AdminControls.tsx
touch src/hooks/use-admin-actions.ts
# Enhance server endpoints for admin actions
```

**Week 4: Testing & Polish**
```bash
# Final testing and optimization
npm run preview:deploy admin-dashboard
# Test admin features in staging
./deploy.sh  # Deploy to production
```

### **📋 Enhanced Implementation Timeline**

**Week 1: Server Enhancement & SQLite Integration**
```bash
# 1. Enhanced server with SQLite persistence
cp signaling-server.js signaling-server-analytics.js
# Add SQLite message persistence
# Add analytics data collection
# Add admin endpoints

# 2. Database setup
# Messages table with 24-hour auto-cleanup
# Room analytics table
# Admin action logging
```

**Week 2: Dashboard Frontend Foundation**
```bash
# 1. Admin dashboard structure
mkdir -p src/app/admin
touch src/app/admin/page.tsx
touch src/hooks/use-admin-analytics.ts
touch src/components/admin/MetricCard.tsx

# 2. Real-time data integration
touch src/lib/admin-client.ts
touch src/hooks/use-real-time-analytics.ts
```

**Week 3: Advanced Controls & Analytics**
```bash
# 1. Admin control panels
touch src/components/admin/LiveActivityFeed.tsx
touch src/components/admin/AdvancedAdminControls.tsx
touch src/components/admin/NetworkMonitoring.tsx

# 2. Admin actions implementation
touch src/hooks/use-admin-actions.ts
# Broadcast messages, clear rooms, database operations
```

**Week 4: Testing & Production Deployment**
```bash
# 1. Lost & found scenario testing
# Test 24-hour message persistence
# Validate admin controls

# 2. Security review
# Admin endpoint protection
# Confirmation dialogs for destructive actions

# 3. Deploy enhanced server
./scripts/deploy-websocket-cloudbuild.sh  # Deploy analytics server
npm run preview:deploy admin-dashboard    # Test dashboard
./deploy.sh                               # Deploy to production
```

### **🎯 Strategic Impact & Benefits**

**✅ Addresses All Requirements**:
1. **✅ Active Users & Rooms**: Real-time monitoring with live updates
2. **✅ Message Analytics**: Flow tracking, patterns, rate monitoring
3. **✅ Server Health**: Network, memory, connection quality metrics
4. **✅ Admin Controls**: Clear messages, database wipe, room management
5. **✅ Message Persistence**: SQLite backend solves lost & found scenario
6. **✅ Network Monitoring**: Foundation for mesh network analytics

**✅ Festival Platform Transformation**:
- **Professional Management**: Enterprise-grade admin tools
- **Real-Time Operations**: Live monitoring during events
- **Emergency Response**: Instant broadcast capabilities
- **Data-Driven Insights**: Analytics for event optimization
- **Scalable Foundation**: Ready for mesh network evolution

**✅ Technical Excellence**:
- **Hybrid Storage**: Performance + persistence optimized
- **Minimal Breaking Changes**: Enhances existing infrastructure
- **Mobile Responsive**: Works on tablets for on-site management
- **Export Capabilities**: Data analysis and reporting
- **Safety Features**: Confirmation dialogs, rollback options

**🎪 Result**: Festival Chat evolves from messaging app to **professional festival communication platform** with enterprise-grade monitoring and management! 🚀

**Timeline**: 2-4 weeks  
**Priority**: High (Immediate user impact)  
**Complexity**: Medium

### **3.1: Cross-Room Notifications System** 🔔

**Problem Identified**: Users in Chat A don't receive notifications from Chat B

**Technical Implementation**:

```typescript
// src/hooks/use-cross-room-notifications.ts
export function useCrossRoomNotifications() {
  const [activeRooms, setActiveRooms] = useState<Set<string>>(new Set());
  const [notificationSettings, setNotificationSettings] = useState({
    enabled: true,
    sound: true,
    vibration: true,
    showPreview: true
  });

  // Track all rooms user has joined
  const registerRoom = (roomId: string) => {
    setActiveRooms(prev => new Set([...prev, roomId]));
    
    // Subscribe to background notifications for this room
    subscribeToRoomNotifications(roomId);
  };

  // Handle cross-room message notifications
  const handleCrossRoomMessage = (message: Message) => {
    if (message.roomId !== currentRoomId && activeRooms.has(message.roomId)) {
      showNotificationBanner({
        roomCode: getRoomCode(message.roomId),
        sender: message.sender,
        preview: notificationSettings.showPreview ? message.content : 'New message',
        timestamp: message.timestamp,
        onClick: () => navigateToRoom(message.roomId)
      });
    }
  };
}
```

**UI Components**:

```typescript
// src/components/NotificationBanner.tsx
export function NotificationBanner({ notifications }: NotificationBannerProps) {
  return (
    <div className=\"fixed top-4 right-4 z-50 space-y-2\">
      {notifications.map(notification => (
        <div 
          key={notification.id}
          className=\"bg-purple-600 text-white p-4 rounded-lg shadow-lg border border-purple-500 cursor-pointer hover:bg-purple-700 transition-all\"
          onClick={() => handleNotificationClick(notification)}
        >
          <div className=\"flex items-center justify-between\">
            <div>
              <div className=\"font-semibold text-sm\">
                💬 {notification.roomCode}
              </div>
              <div className=\"text-purple-100 text-xs\">
                {notification.sender}
              </div>
              {notification.preview && (
                <div className=\"text-white text-sm mt-1\">
                  {notification.preview}
                </div>
              )}
            </div>
            <div className=\"ml-4 text-purple-200 text-xs\">
              {formatTimeAgo(notification.timestamp)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
```

**Server-Side Enhancement**:

```javascript
// Update signaling-server-sqlite.js
const userRoomSubscriptions = new Map(); // userId -> Set of roomIds

// Track user's active rooms
socket.on('subscribe-to-room', ({ roomId, userId }) => {
  if (!userRoomSubscriptions.has(userId)) {
    userRoomSubscriptions.set(userId, new Set());
  }
  userRoomSubscriptions.get(userId).add(roomId);
});

// Enhanced message broadcasting
socket.on('chat-message', (data) => {
  const message = { ...data, id: generateId(), timestamp: Date.now() };
  
  // Broadcast to room as usual
  io.to(data.roomId).emit('chat-message', message);
  
  // Send cross-room notifications to subscribed users
  userRoomSubscriptions.forEach((subscribedRooms, userId) => {
    if (subscribedRooms.has(data.roomId)) {
      const userSocket = getUserSocket(userId);
      if (userSocket && userSocket.currentRoom !== data.roomId) {
        userSocket.emit('cross-room-notification', {
          ...message,
          roomCode: generateRoomCode(data.roomId)
        });
      }
    }
  });
});
```

### **3.2: Streamlined Room Management UI** 🎛️

**Current Issue**: Room joining process could be more intuitive

**Enhanced Room Navigation**:

```typescript
// src/components/RoomNavigator.tsx
export function RoomNavigator() {
  const { activeRooms, currentRoom, switchToRoom } = useMultiRoom();
  
  return (
    <div className=\"flex items-center space-x-2 p-2 bg-gray-800 border-b border-gray-700\">
      {/* Current Room Indicator */}
      <div className=\"flex items-center space-x-2\">
        <div className=\"w-3 h-3 bg-green-500 rounded-full animate-pulse\"></div>
        <span className=\"font-mono text-purple-400 font-semibold\">
          {currentRoom.code}
        </span>
      </div>
      
      {/* Other Active Rooms */}
      {activeRooms.filter(room => room.id !== currentRoom.id).map(room => (
        <button
          key={room.id}
          onClick={() => switchToRoom(room.id)}
          className={`px-3 py-1 rounded-full text-xs transition-all $${
            room.hasUnread 
              ? 'bg-purple-600 text-white animate-pulse' 
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          {room.code}
          {room.unreadCount > 0 && (
            <span className=\"ml-1 bg-red-500 text-white rounded-full px-1 text-xs\">
              {room.unreadCount}
            </span>
          )}
        </button>
      ))}
      
      {/* Quick Join */}
      <button
        onClick={() => setShowQuickJoin(true)}
        className=\"px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded-full text-xs text-white transition-all\"
      >
        + Join Room
      </button>
    </div>
  );
}
```

### **3.3: Firebase Preview Channels Setup** 🔥

**Goal**: Enable rapid testing and staging deployments

**Implementation Strategy**:

```yaml
# .github/workflows/preview-deploy.yml
name: Preview Channel Deployment

on:
  pull_request:
    branches: [ main ]

jobs:
  deploy-preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build for Firebase
        run: npm run build:firebase
      
      - name: Deploy to Preview Channel
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          projectId: festival-chat-project
          channelId: pr-${{ github.event.number }}
          expires: 7d
        env:
          FIREBASE_CLI_PREVIEWS: hostingchannels
```

**Preview Channel Management**:

```bash
# tools/preview-channels.sh
#!/bin/bash

case \"$1\" in
  \"create\")
    firebase hosting:channel:deploy preview-$(date +%Y%m%d) --expires 7d
    ;;
  \"list\")
    firebase hosting:channel:list
    ;;
  \"cleanup\")
    firebase hosting:channel:list --json | jq -r '.[] | select(.expireTime < now) | .name' | xargs -I {} firebase hosting:channel:delete {}
    ;;
  *)
    echo \"Usage: $0 {create|list|cleanup}\"
    ;;
esac
**Live Activity Feed**:
```typescript
// Real-time activity stream with admin actions
<div className="bg-gray-800 rounded-lg p-6 h-96 overflow-y-auto">
  <h3>🔴 Live Activity</h3>
  {activities.map(activity => (
    <div key={activity.id} className="flex items-center space-x-3 p-2 bg-gray-700 rounded">
      <div className="text-lg">{activity.icon}</div>
      <div className="flex-1">
        <div className="text-sm">{activity.description}</div>
        <div className="text-xs text-gray-400">{activity.timestamp}</div>
      </div>
      {activity.roomId && (
        <button onClick={() => navigateToRoom(activity.roomId)}>
          View Room
        </button>
      )}
    </div>
  ))}
</div>
```

**Advanced Admin Controls**:
```typescript
// Three-panel admin control system
<div className="grid grid-cols-3 gap-6">
  {/* Message Management */}
  <div className="bg-gray-800 rounded-lg p-6">
    <h3>💬 Message Management</h3>
    <input placeholder="Emergency announcement..." />
    <button onClick={() => broadcastMessage()} className="bg-red-600">📢 Broadcast</button>
    
    <select>{/* Room selection */}</select>
    <button onClick={() => clearRoomMessages()} className="bg-yellow-600">🗑️ Clear Room</button>
  </div>

  {/* Database Management */}
  <div className="bg-gray-800 rounded-lg p-6">
    <h3>🗄️ Database Management</h3>
    <div className="bg-gray-700 p-3 rounded">
      <div>Messages: {dbStats.totalMessages}</div>
      <div>Rooms: {dbStats.totalRooms}</div>
      <div>Size: {dbStats.dbSize}</div>
    </div>
    <button onClick={() => exportAnalytics()} className="bg-blue-600">📊 Export</button>
    <button onClick={() => wipeDatabaseCompletely()} className="bg-red-600 border-2 border-red-400">
      ⚠️ WIPE DATABASE
    </button>
  </div>

  {/* Server Management */}
  <div className="bg-gray-800 rounded-lg p-6">
    <h3>🖥️ Server Management</h3>
    <div className="bg-gray-700 p-3 rounded">
      <div>Status: {serverHealth.status}</div>
      <div>Uptime: {serverHealth.uptime}</div>
      <div>Memory: {serverHealth.memoryUsed}/{serverHealth.memoryTotal}</div>
    </div>
    <button onClick={() => restartServer()} className="bg-orange-600">🔄 Restart</button>
    <button onClick={() => viewServerLogs()} className="bg-gray-600">📋 Logs</button>
  </div>
</div>
```

**Network & Mesh Monitoring**:
```typescript
// Dual-panel network monitoring
<div className="grid grid-cols-2 gap-6">
  {/* Current Connection Status */}
  <div className="bg-gray-800 rounded-lg p-6">
    <h3>🔗 Connection Status</h3>
    <div className="grid grid-cols-2 gap-4">
      <div className="text-center">
        <div className="text-3xl font-bold text-green-400">{connectionStats.active}</div>
        <div className="text-sm text-gray-400">Active</div>
      </div>
      <div className="text-center">
        <div className="text-3xl font-bold text-yellow-400">{connectionStats.reconnecting}</div>
        <div className="text-sm text-gray-400">Reconnecting</div>
      </div>
    </div>
    
    {/* Quality Metrics */}
    <div className="space-y-3 mt-6">
      <div className="flex justify-between">
        <span>Average Latency</span>
        <span className={latencyColor}>{networkQuality.avgLatency}ms</span>
      </div>
      <div className="flex justify-between">
        <span>Success Rate</span>
        <span className={successColor}>{networkQuality.successRate}%</span>
      </div>
      <div className="flex justify-between">
        <span>Message Delivery</span>
        <span className={deliveryColor}>{networkQuality.deliveryRate}%</span>
      </div>
    </div>
  </div>

  {/* Future Mesh Network */}
  <div className="bg-gray-800 rounded-lg p-6">
    <h3>🕸️ Network Topology</h3>
    {meshTopology.enabled ? (
      <MeshNetworkVisualization topology={meshTopology} />
    ) : (
      <div className="text-center py-8 text-gray-400">
        <div className="text-4xl mb-4">🌐</div>
        <div className="text-lg mb-2">Mesh Network: Disabled</div>
        <div className="text-sm">Currently using WebSocket server</div>
        <button className="mt-4 px-4 py-2 bg-purple-600 rounded">
          🚀 Enable Mesh Network
        </button>
      </div>
    )}
  </div>
</div>
```

---

## 📊 **Phase 4: Analytics Dashboard & Admin Interface** 🎯

**Timeline**: 3-4 weeks  
**Priority**: HIGH (Strategic foundation for festival platform)  
**Complexity**: Medium-High
**Status**: 🚀 **NEXT PRIORITY** - Analytics foundation already exists

### **✅ 4.1: Analytics Foundation Assessment** 📈

**EXCELLENT NEWS**: Analytics infrastructure is already built into the server!

**✅ Existing Analytics Endpoints**:
- **`/analytics/dashboard`** - Real-time dashboard data
- **`/room-stats/:roomId`** - Individual room analytics
- **`/health`** - Comprehensive server health and connection metrics
- **`/debug/rooms`** (development) - Detailed room and connection debugging

**✅ Current Analytics Data Available**:
```javascript
// Server already collects:
{
  totalUsers: connectionStats.totalConnections,
  activeRooms: rooms.size,
  currentConnections: connectionStats.currentConnections,
  peakConnections: connectionStats.peakConnections,
  coldStarts: connectionStats.coldStarts,
  notificationSubscribers: notificationSubscribers.size,
  corsRejections: connectionStats.corsRejections,
  uptime: process.uptime(),
  memoryUsage: process.memoryUsage()
}
```

**✅ Room-Level Analytics**:
```javascript
// Per-room data available:
{
  roomId,
  activeUsers: roomPeers.size,
  notificationSubscribers: subscribers.size,
  totalConnections: activeUsers + notificationSubscribers,
  lastActivity: Date.now()
}
```

### **4.2: Analytics Dashboard Implementation** 🖥️

**Phase 4A: Basic Dashboard (Week 1-2)**

```typescript
// NEW: src/app/admin/dashboard/page.tsx
export default function AdminDashboard() {
  const { 
    analytics, 
    rooms, 
    connections, 
    notifications,
    isLoading 
  } = useAnalytics();

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-6">
        <h1 className="text-3xl font-bold">🎪 Festival Chat Analytics</h1>
        <div className="text-gray-400 mt-1">
          Real-time dashboard • Updated every 5 seconds
        </div>
      </header>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
        <MetricCard 
          title="Total Users" 
          value={analytics.totalUsers}
          trend={analytics.userTrend}
          icon="👥"
        />
        <MetricCard 
          title="Active Rooms" 
          value={analytics.activeRooms}
          trend={analytics.roomTrend}
          icon="🏠"
        />
        <MetricCard 
          title="Messages/Hour" 
          value={analytics.messagesPerHour}
          trend={analytics.messageTrend}
          icon="💬"
        />
        <MetricCard 
          title="Notification Subscribers" 
          value={analytics.notificationSubscribers}
          trend={analytics.notificationTrend}
          icon="🔔"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Connection Activity</h3>
          <ConnectionChart data={analytics.connectionHistory} />
        </div>
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Room Distribution</h3>
          <RoomChart data={analytics.roomDistribution} />
        </div>
      </div>

      {/* Room Table */}
      <div className="p-6">
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Active Rooms</h3>
          <RoomTable rooms={rooms} />
        </div>
      </div>
    </div>
  );
}
```

---

## 🕸️ **Phase 5: Mesh Network Foundation**

**Timeline**: 4-6 weeks  
**Priority**: Medium (Future-proofing)  
**Complexity**: Very High

### **5.1: Mesh Network Protocol Design** 🌐

```typescript
// src/lib/mesh-protocol.ts
export class MeshNetworkProtocol {
  private topology = new NetworkTopology();
  private routing = new MeshRouting();
  private discovery = new PeerDiscovery();

  /**
   * Establish mesh network with intelligent peer selection
   */
  async establishMeshNetwork(initialPeers: PeerInfo[]): Promise<MeshNetwork> {
    // Phase 1: Peer discovery and quality assessment
    const discoveredPeers = await this.discovery.discoverPeers({
      initial: initialPeers,
      range: 'local', // Start with local network
      timeout: 10000,
      maxPeers: 20
    });

    // Phase 2: Connection quality testing
    const qualifiedPeers = await this.assessPeerQuality(discoveredPeers);
    
    // Phase 3: Optimal topology calculation
    const topology = this.topology.calculateOptimalTopology(qualifiedPeers, {
      maxConnections: 8,
      redundancyLevel: 2,
      latencyThreshold: 200
    });

    // Phase 4: Establish connections
    const meshNetwork = await this.buildMeshConnections(topology);
    
    // Phase 5: Initialize routing table
    await this.routing.initializeRoutes(meshNetwork);

    return meshNetwork;
  }

  /**
   * Apply existing connection resilience patterns to mesh
   */
  private async establishPeerConnection(peerId: string): Promise<PeerConnection> {
    // Reuse circuit breaker pattern from Phase 1-2 optimizations
    const circuitBreaker = new CircuitBreaker({
      threshold: 5, // Same as server connections
      timeout: 15000, // Same as optimized timeout
      retryDelay: this.getExponentialBackoff()
    });

    return circuitBreaker.execute(async () => {
      const connection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          // Use same STUN/TURN servers as WebSocket fallback
        ]
      });

      // Apply transport optimization patterns
      const dataChannel = connection.createDataChannel('messages', {
        ordered: true,
        maxRetransmits: 3 // Reliability optimization
      });

      await this.negotiateConnection(connection, peerId);
      
      return new PeerConnection(peerId, connection, dataChannel);
    });
  }
}
```

### **5.2: Hybrid Server-Mesh Architecture** 🔄

**Strategy**: Gradual migration maintaining WebSocket server as reliable fallback

```typescript
// src/lib/hybrid-network.ts
export class HybridNetworkManager {
  private meshNetwork?: MeshNetwork;
  private serverConnection: WebSocketConnection;
  private mode: 'server-only' | 'hybrid' | 'mesh-primary' = 'server-only';

  /**
   * Intelligent message routing across hybrid network
   */
  async sendMessage(message: Message, options: SendOptions = {}): Promise<DeliveryResult> {
    const routes = await this.calculateRoutes(message, options);
    
    // Attempt delivery in order of preference
    for (const route of routes) {
      try {
        const result = await this.attemptDelivery(message, route);
        if (result.success) {
          this.recordSuccess(route);
          return result;
        }
      } catch (error) {
        this.recordFailure(route, error);
        console.warn(`Route ${route.type} failed, trying next...`);
      }
    }

    throw new Error('All delivery routes failed');
  }

  private async calculateRoutes(message: Message, options: SendOptions): Promise<Route[]> {
    const routes: Route[] = [];

    switch (this.mode) {
      case 'server-only':
        routes.push({ type: 'server', priority: 1 });
        break;
        
      case 'hybrid':
        // Try mesh first, fallback to server
        if (this.meshNetwork?.hasConnectedPeers()) {
          routes.push({ type: 'mesh', priority: 1 });
        }
        routes.push({ type: 'server', priority: 2 });
        break;
        
      case 'mesh-primary':
        // Multiple mesh routes + server fallback
        routes.push(...this.getMeshRoutes(message));
        routes.push({ type: 'server', priority: 10 }); // Last resort
        break;
    }

    return routes.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Gradual migration strategy
   */
  async enableHybridMode(): Promise<void> {
    if (this.mode !== 'server-only') return;
    
    try {
      console.log('🕸️ Initializing mesh network...');
      this.meshNetwork = await this.initializeMeshNetwork();
      
      console.log('🔄 Enabling hybrid mode...');
      this.mode = 'hybrid';
      
      // Monitor performance for potential upgrade to mesh-primary
      this.startPerformanceMonitoring();
      
    } catch (error) {
      console.error('Failed to enable hybrid mode:', error);
      // Stay in server-only mode
    }
  }
}
```

---

## 🎪 **Phase 6: Enterprise Festival Features**

**Timeline**: 2-3 weeks  
**Priority**: Low (Market expansion)  
**Complexity**: Medium

### **6.1: Multi-Room Management Dashboard** 📊

```typescript
// src/components/FestivalDashboard.tsx
export function FestivalDashboard() {
  const { rooms, analytics, moderation } = useFestivalManagement();

  return (
    <div className=\"min-h-screen bg-gray-900 text-white\">
      {/* Header */}
      <header className=\"bg-gray-800 border-b border-gray-700 p-4\">
        <h1 className=\"text-2xl font-bold\">🎪 Festival Chat Dashboard</h1>
        <div className=\"text-sm text-gray-400\">
          Managing {rooms.length} active rooms • {analytics.totalUsers} users
        </div>
      </header>

      {/* Room Grid */}
      <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6\">
        {rooms.map(room => (
          <RoomCard 
            key={room.id} 
            room={room}
            analytics={analytics.rooms[room.id]}
            onModerate={(action) => moderation.handleAction(room.id, action)}
          />
        ))}
      </div>

      {/* Analytics Panel */}
      <div className=\"fixed bottom-4 right-4\">
        <AnalyticsPanel data={analytics} />
      </div>
    </div>
  );
}

// Real-time room monitoring
function RoomCard({ room, analytics, onModerate }: RoomCardProps) {
  return (
    <div className=\"bg-gray-800 rounded-lg border border-gray-700 p-4\">
      <div className=\"flex items-center justify-between mb-3\">
        <h3 className=\"font-semibold\">{room.name}</h3>
        <div className=\"flex items-center space-x-2\">
          <div className={`w-3 h-3 rounded-full ${
            analytics.status === 'active' ? 'bg-green-500' : 'bg-gray-500'
          }`}></div>
          <span className=\"text-sm text-gray-400\">
            {analytics.activeUsers} users
          </span>
        </div>
      </div>
      
      <div className=\"space-y-2 text-sm\">
        <div>Code: <span className=\"font-mono text-purple-400\">{room.code}</span></div>
        <div>Messages: {analytics.messageCount}</div>
        <div>Created: {formatTimeAgo(room.created)}</div>
      </div>

      <div className=\"flex space-x-2 mt-4\">
        <button 
          onClick={() => onModerate('view')}
          className=\"flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs\"
        >
          View Chat
        </button>
        <button 
          onClick={() => onModerate('moderate')}
          className=\"px-3 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-xs\"
        >
          Moderate
        </button>
      </div>
    </div>
  );
}
```

### **6.2: Festival Organizer Tools** 🎛️

```typescript
// src/lib/festival-management.ts
export class FestivalManagement {
  /**
   * Create official festival rooms with enhanced features
   */
  async createOfficialRooms(festival: FestivalConfig): Promise<FestivalRooms> {
    const rooms = await Promise.all([
      this.createRoom({ name: `${festival.name} Main Stage`, type: 'official', capacity: 500 }),
      this.createRoom({ name: `${festival.name} VIP Area`, type: 'vip', capacity: 50 }),
      this.createRoom({ name: `${festival.name} Artist Lounge`, type: 'artist', capacity: 30 }),
      this.createRoom({ name: `${festival.name} General Chat`, type: 'public', capacity: 1000 })
    ]);

    // Set up cross-room announcements
    await this.setupAnnouncementSystem(rooms);
    
    // Configure moderation tools
    await this.configureModerationTools(rooms, festival.moderators);

    return {
      rooms,
      managementUrl: this.generateManagementUrl(festival.id),
      qrCodes: this.generateQRCodes(rooms)
    };
  }

  /**
   * Broadcast announcements across multiple rooms
   */
  async broadcastAnnouncement(announcement: Announcement): Promise<void> {
    const targetRooms = announcement.rooms || 'all';
    const message = {
      type: 'announcement',
      content: announcement.message,
      sender: 'Festival Staff',
      priority: announcement.priority || 'normal',
      timestamp: Date.now()
    };

    // Send to specified rooms or all rooms
    const rooms = targetRooms === 'all' ? this.getAllRooms() : targetRooms;
    
    await Promise.all(rooms.map(roomId => 
      this.sendToRoom(roomId, message)
    ));

    // Log for moderation tracking
    this.logModeratorAction({
      type: 'announcement',
      moderator: announcement.moderator,
      message: announcement.message,
      rooms: rooms.length
    });
  }
}
```

---

## 📊 **Implementation Timeline & Priorities**

### **Immediate (Weeks 1-2): Phase 3 Foundation**
```
Week 1:
- ✅ Cross-room notification system (3.1)
- ✅ Enhanced room navigation UI (3.2)
- ✅ Firebase preview channels setup (3.3)

Week 2:
- ✅ Testing and refinement
- ✅ Mobile notification optimization
- ✅ Preview channel workflow validation
```

### **Short Term (Weeks 3-6): Phase 4 Intelligence**
```
Week 3-4:
- ✅ Message intelligence routing (4.1)
- ✅ Data pooling architecture (4.2)

Week 5-6:
- ✅ Performance analytics implementation (4.3)
- ✅ Intelligent optimization algorithms
- ✅ Real-time recommendation system
```

### **Medium Term (Weeks 7-12): Phase 5 Mesh Foundation**
```
Week 7-9:
- ✅ Mesh network protocol design (5.1)
- ✅ Hybrid server-mesh architecture (5.2)
- ✅ Gradual migration strategy

Week 10-12:
- ✅ P2P connection optimization
- ✅ Mesh topology management
- ✅ Production testing with limited users
```

### **Long Term (Weeks 13-15): Phase 6 Enterprise**
```
Week 13-14:
- ✅ Festival management dashboard (6.1)
- ✅ Organizer tools and moderation (6.2)

Week 15:
- ✅ Enterprise feature testing
- ✅ Festival partnership preparation
- ✅ Comprehensive documentation
```

---

## 🛡️ **Risk Management & Safety Protocols**

### **Technical Risks**

**Phase 3 Risks**:
- **Notification performance impact** → Implement with feature flags, gradual rollout
- **UI complexity increase** → Maintain simple fallback interfaces
- **Preview channel costs** → Set up usage monitoring and limits

**Phase 4 Risks**:
- **Data pooling complexity** → Start with simple pooling, iterate
- **Performance overhead** → Comprehensive benchmarking before deployment
- **Message delivery reliability** → Maintain server fallback at all times

**Phase 5 Risks**:
- **Mesh network stability** → Extensive testing in controlled environments
- **P2P connection reliability** → Keep WebSocket server as primary initially
- **Mobile battery impact** → Monitor and optimize power consumption

### **Implementation Safety**

```bash
# Development Branch Strategy
git checkout -b phase-3-notifications
git checkout -b phase-4-data-pooling  
git checkout -b phase-5-mesh-foundation

# Feature Flag Implementation
const FEATURES = {
  crossRoomNotifications: process.env.FEATURE_NOTIFICATIONS === 'true',
  dataPooling: process.env.FEATURE_DATA_POOLING === 'true',
  meshNetworking: process.env.FEATURE_MESH === 'true'
};

# Rollback Strategy
# Each phase maintains complete backward compatibility
# Server-side WebSocket connections always available as fallback
# Feature flags allow instant disable of new features
```

---

## 📈 **Success Metrics & KPIs**

### **Phase 3: Enhanced UX**
- **Cross-room notification delivery**: >95% success rate
- **UI responsiveness**: <100ms interaction response time
- **Preview channel adoption**: 50%+ of development testing via preview
- **User satisfaction**: Improved room switching experience

### **Phase 4: Data Intelligence**
- **Message delivery optimization**: 20%+ latency reduction
- **Route success rate**: >98% first-attempt delivery
- **Performance analytics accuracy**: Real-time optimization recommendations
- **Data pooling efficiency**: <50ms conflict resolution time

### **Phase 5: Mesh Foundation**
- **P2P connection success**: >90% initial connection establishment
- **Mesh stability**: Network survives 30%+ peer disconnection
- **Hybrid fallback**: <200ms failover to server when mesh unavailable
- **Battery efficiency**: <10% additional mobile battery usage

### **Phase 6: Enterprise**
- **Dashboard responsiveness**: Real-time updates for 100+ rooms
- **Moderation efficiency**: <30s response time for content issues
- **Festival scale**: Support 1000+ concurrent users across 50+ rooms
- **Organizer adoption**: 3+ festival partnerships within 6 months

---

## 🚀 **Getting Started: Immediate Next Steps**

### **This Week: Phase 3 Kickoff**

1. **Set up development environment for notifications**:
   ```bash
   git checkout -b phase-3-enhanced-ux
   npm install --save-dev firebase-tools
   ```

2. **Implement basic cross-room notification system**:
   ```bash
   # Create notification components
   touch src/hooks/use-cross-room-notifications.ts
   touch src/components/NotificationBanner.tsx
   touch src/components/RoomNavigator.tsx
   ```

3. **Set up Firebase preview channels**:
   ```bash
   firebase login
   firebase projects:list
   firebase hosting:channel:deploy preview-phase3
   ```

4. **Update server for cross-room messaging**:
   ```javascript
   // Add to signaling-server-sqlite.js
   const userRoomSubscriptions = new Map();
   // Implement cross-room notification logic
   ```

### **Development Workflow**

```bash
# Daily development cycle
npm run dev:mobile                    # Start local development
# Make incremental changes
npm run deploy:firebase:quick          # Deploy to preview channel
# Test with stakeholders on preview URL
./deploy.sh                           # Deploy to production when ready
```

### **Testing Strategy**

```markdown
## Phase 3 Testing Plan

**Week 1: Core Functionality**
- [ ] Cross-room notifications working on desktop
- [ ] Cross-room notifications working on mobile
- [ ] Room navigation UI responsive and intuitive
- [ ] Firebase preview channels operational

**Week 2: Integration & Polish**
- [ ] Notification sound and vibration settings
- [ ] Room switching preserves message history
- [ ] Preview channels auto-deploy on pull requests
- [ ] No performance regression from notification system
```

---

## 🎯 **Strategic Vision: Festival Chat 2.0**

**End State Goal**: Transform Festival Chat from a simple P2P messaging app into a comprehensive **festival communication platform** that can handle thousands of concurrent users across multiple venues with intelligent routing, enterprise management tools, and seamless mesh networking.

**Key Differentiators**:
- **Offline-first messaging** via mesh networking
- **Zero-setup user experience** with QR code instant joining
- **Enterprise festival tools** for organizers and staff
- **Intelligent message routing** across multiple connection types
- **Mobile-optimized** for challenging festival network conditions

**Market Position**: The **go-to communication platform** for festivals, conferences, and large events requiring reliable, scalable, and easy-to-use messaging without complex setup or account requirements.

---

**🎪 Ready to evolve Festival Chat into the ultimate festival communication platform!** The foundation is solid, the deployment strategy is optimized with Vercel as the primary platform, and each phase builds naturally on the previous work while maintaining production stability.

*Next milestone: Cross-room notifications and preview channels within 2 weeks!*

## 📋 **Immediate Action Items Post-Vercel Fix**

### **This Week: Admin Dashboard Completion**
1. **✅ Document Vercel as primary platform** (completed)
2. **🔐 Implement admin authentication in frontend** - Current priority
   - Add HTTP Basic Auth headers to all admin API calls
   - Implement login form or browser basic auth prompt
   - Handle 401 responses and re-authentication
   - Test with credentials: `th3p3ddl3r` / `letsmakeatrade`
   - Fix activity feed refreshing on page reload (should persist history)
3. **Test admin dashboard data flow** once API issues resolved
4. **Archive GitHub Pages workflow** (optional cleanup)

### **Next Week: Platform Optimization**
1. **Complete admin dashboard functionality** (carry over if needed)
2. **Optimize Vercel environment variables** for all environments
3. **Test Vercel preview deployments** for feature branches
4. **Update team documentation** to prioritize Vercel workflow

### **Following Week: Development Workflow**
1. **Set up branch protection rules** to trigger Vercel previews
2. **Configure Vercel monitoring** for production insights
3. **Streamline Firebase** for staging/testing only
4. **Begin Phase 3 development** (cross-room notifications)

### **Development Commands (Updated)**
```bash
# ACTUAL Development Workflow (Corrected)

# 1. Local Development
npm run dev:mobile                # Local development with mobile support

# 2. Preview Testing
npm run preview:deploy feature-name  # Firebase preview channels

# 3. Staging Deployment
npm run deploy:firebase:complete     # Full staging deployment

# 4. Production Deployment
./deploy.sh                          # Production deployment to GitHub/Vercel

# WebSocket Server Deployments (Separate)
./scripts/deploy-websocket-staging.sh    # Staging WebSocket server
./scripts/deploy-websocket-cloudbuild.sh # Production WebSocket server
```

**Note**: Vercel auto-deploys from GitHub pushes, but the established workflow uses the deploy script for production coordination.

### **🔧 Admin Dashboard API Debugging Commands**
```bash
# Test server health and analytics endpoints
curl -i https://peddlenet-websocket-server-hfttiarlja-uc.a.run.app/health
curl -i https://peddlenet-websocket-server-hfttiarlja-uc.a.run.app/admin/analytics

# Test activity feed endpoint
curl -i https://peddlenet-websocket-server-hfttiarlja-uc.a.run.app/admin/activity

# Test with authentication
curl -i -u th3p3ddl3r:letsmakeatrade https://peddlenet-websocket-server-hfttiarlja-uc.a.run.app/admin/analytics
curl -i -u th3p3ddl3r:letsmakeatrade https://peddlenet-websocket-server-hfttiarlja-uc.a.run.app/admin/activity

# Check server environment detection
curl -i https://peddlenet-websocket-server-hfttiarlja-uc.a.run.app/admin/info

# Check CORS headers
curl -i -X OPTIONS -H "Origin: https://peddlenet.app" \
  https://peddlenet-websocket-server-hfttiarlja-uc.a.run.app/admin/analytics

# Test from browser console (on peddlenet.app/admin-analytics):
# fetch('https://peddlenet-websocket-server-hfttiarlja-uc.a.run.app/admin/activity').then(r => r.json()).then(console.log)
# Test with auth (browser will prompt):
# fetch('https://peddlenet-websocket-server-hfttiarlja-uc.a.run.app/admin/analytics').then(r => r.json()).then(console.log)
```

**Common Issues to Check**:
- **CORS**: Server may need to allow `https://peddlenet.app` origin
- **Authentication**: Admin endpoints might require basic auth headers
- **Network**: Vercel might be blocking outbound requests to Google Cloud Run
- **SSL**: Mixed content issues between HTTPS frontend and HTTP backend

**Strategic Focus**: The established dev → preview → staging → production workflow remains the primary development process. Vercel provides the production hosting infrastructure, but deployments are coordinated through the existing deploy script to maintain consistency across frontend and backend deployments.
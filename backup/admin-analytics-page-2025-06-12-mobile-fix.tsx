'use client';

import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

// Force dynamic rendering (no static generation)
export const dynamic = 'force-dynamic';

interface RealTimeStats {
  activeUsers: number;
  activeRooms: number;
  messagesPerMinute: number;
  totalMessages: number;
  peakConnections: number;
  storageUsed: number;
  userTrend: string;
  roomTrend: string;
  environment: string;
}

interface ServerHealth {
  status: string;
  uptime: string;
  memoryUsed: number;
  memoryTotal: number;
  cpuUsage: string;
  coldStarts: number;
}

interface NetworkStatus {
  quality: number;
  avgLatency: number;
  deliveryRate: number;
}

interface Activity {
  id: number;
  type: string;
  data: any;
  timestamp: number;
  icon: string;
}

interface DashboardData {
  realTimeStats: RealTimeStats;
  serverHealth: ServerHealth;
  networkStatus: NetworkStatus;
  messageFlow: {
    messagesPerMinute: number;
    trend: string;
    history: Array<{ minute: number; count: number }>;
  };
  dbStats: {
    totalMessages: number;
    totalRooms: number;
    totalSessions: number;
    recentActivity: number;
    dbSize: string;
    oldestMessage: number;
  };
  timestamp: number;
  databaseReady: boolean;
}

function MetricCard({ 
  title, 
  value, 
  subvalue, 
  trend, 
  icon, 
  color = 'blue' 
}: {
  title: string;
  value: string | number;
  subvalue?: string;
  trend?: string;
  icon: string;
  color?: 'green' | 'blue' | 'purple' | 'red' | 'yellow' | 'gray';
}) {
  const colorClasses = {
    green: 'bg-green-600/20 border-green-500/30',
    blue: 'bg-blue-600/20 border-blue-500/30',
    purple: 'bg-purple-600/20 border-purple-500/30',
    red: 'bg-red-600/20 border-red-500/30',
    yellow: 'bg-yellow-600/20 border-yellow-500/30',
    gray: 'bg-gray-600/20 border-gray-500/30'
  };

  return (
    <div className={`${colorClasses[color]} p-4 rounded-lg border backdrop-blur-sm`}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-2xl">{icon}</div>
        {trend && (
          <div className={`text-xs px-2 py-1 rounded ${
            trend.startsWith('+') ? 'bg-green-600/30 text-green-300' : 'bg-red-600/30 text-red-300'
          }`}>
            {trend}
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-gray-300">{title}</div>
      {subvalue && <div className="text-xs text-gray-400 mt-1">{subvalue}</div>}
    </div>
  );
}

function ActivityFeed({ activities }: { activities: Activity[] }) {
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getActivityDescription = (activity: Activity) => {
    switch (activity.type) {
      case 'server-start':
        return `Server started in ${activity.data.environment} mode`;
      case 'user-joined':
        return `${activity.data.displayName} joined room ${activity.data.roomId}`;
      case 'user-left':
        return `${activity.data.displayName} left room ${activity.data.roomId}`;
      case 'message-sent':
        return `${activity.data.sender} sent message in ${activity.data.roomId}`;
      case 'room-created':
        return `Room ${activity.data.roomId} created by ${activity.data.creator}`;
      case 'room-deleted':
        return `Room ${activity.data.roomId} deleted (empty)`;
      case 'admin-action':
        return `Admin: ${activity.data.action}`;
      default:
        return `${activity.type}: ${JSON.stringify(activity.data)}`;
    }
  };

  return (
    <div className="bg-gray-800/80 rounded-lg p-6 h-96 overflow-y-auto backdrop-blur-sm border border-gray-700/50">
      <h3 className="text-xl font-semibold mb-4 flex items-center">
        <span className="text-2xl mr-2">🔴</span>
        Live Activity Feed
      </h3>
      
      <div className="space-y-2">
        {activities.length === 0 ? (
          <div className="text-gray-400 text-center py-8">
            <div className="text-4xl mb-2">📡</div>
            <div>Waiting for activity...</div>
          </div>
        ) : (
          activities.map(activity => (
            <div key={activity.id} className="flex items-center space-x-3 p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700/70 transition-colors">
              <div className="text-lg flex-shrink-0">{activity.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white truncate">{getActivityDescription(activity)}</div>
                <div className="text-xs text-gray-400">{formatTime(activity.timestamp)}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function AdminControls({ onBroadcast, onClearRoom, onWipeDatabase }: {
  onBroadcast: (message: string) => void;
  onClearRoom: (roomId: string) => void;
  onWipeDatabase: () => void;
}) {
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');

  return (
    <div className="bg-gray-800/80 rounded-lg p-6 backdrop-blur-sm border border-gray-700/50">
      <h3 className="text-xl font-semibold mb-4 flex items-center">
        <span className="text-2xl mr-2">🛡️</span>
        Admin Controls
      </h3>
      
      <div className="space-y-4">
        {/* Broadcast Message */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-300">
            📢 Broadcast to All Rooms
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              placeholder="Emergency announcement..."
              className="flex-1 px-3 py-2 bg-gray-700 rounded border border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
            />
            <button 
              onClick={() => {
                if (broadcastMessage.trim()) {
                  onBroadcast(broadcastMessage);
                  setBroadcastMessage('');
                }
              }}
              disabled={!broadcastMessage.trim()}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded font-medium transition-colors"
            >
              📢 Send
            </button>
          </div>
        </div>

        {/* Clear Room Messages */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-300">
            🗑️ Clear Room Messages
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              placeholder="Enter room ID..."
              className="flex-1 px-3 py-2 bg-gray-700 rounded border border-gray-600 text-white placeholder-gray-400 focus:border-yellow-500 focus:outline-none"
            />
            <button 
              onClick={() => {
                if (selectedRoom.trim()) {
                  onClearRoom(selectedRoom);
                  setSelectedRoom('');
                }
              }}
              disabled={!selectedRoom.trim()}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded font-medium transition-colors"
            >
              🗑️ Clear
            </button>
          </div>
        </div>

        {/* DANGER: Wipe Database */}
        <div className="border border-red-500/30 rounded-lg p-4 bg-red-600/10">
          <label className="block text-sm font-medium mb-2 text-red-300">
            ⚠️ DANGER ZONE
          </label>
          <button 
            onClick={() => {
              if (confirm('Are you absolutely sure you want to wipe the ENTIRE database? This action cannot be undone!')) {
                onWipeDatabase();
              }
            }}
            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded border-2 border-red-400 font-bold transition-colors"
          >
            ⚠️ WIPE ENTIRE DATABASE
          </button>
          <div className="text-xs text-red-300 mt-2">
            This will delete all messages, rooms, sessions, and analytics data permanently!
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminAnalyticsDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get server URL based on environment
  const getServerUrl = () => {
    if (typeof window === 'undefined') return '';
    
    const hostname = window.location.hostname;
    const isLocal = hostname === 'localhost' || hostname.startsWith('192.168.') || hostname.startsWith('10.') || hostname.startsWith('172.');
    
    if (isLocal) {
      // Use detected IP for local development
      return `http://${hostname}:3001`;
    } else {
      // Production WebSocket server URL
      return 'wss://peddlenet-websocket-server-[hash]-uc.a.run.app';
    }
  };

  const serverUrl = getServerUrl();

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`${serverUrl}/admin/analytics`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      setDashboardData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
      console.error('Dashboard fetch error:', err);
    }
  };

  // Fetch activity feed
  const fetchActivity = async () => {
    try {
      const response = await fetch(`${serverUrl}/admin/activity?limit=50`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      setActivities(data.activities || []);
    } catch (err) {
      console.error('Activity fetch error:', err);
    }
  };

  // Admin actions
  const handleBroadcast = async (message: string) => {
    try {
      const response = await fetch(`${serverUrl}/admin/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, targetRooms: 'all' })
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const result = await response.json();
      alert(`✅ Broadcast sent to ${result.messagesSent} connections`);
    } catch (err) {
      alert(`❌ Broadcast failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleClearRoom = async (roomId: string) => {
    try {
      const response = await fetch(`${serverUrl}/admin/room/${roomId}/messages`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const result = await response.json();
      alert(`✅ Cleared ${result.messagesDeleted} messages from room ${roomId}`);
    } catch (err) {
      alert(`❌ Clear room failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleWipeDatabase = async () => {
    try {
      const response = await fetch(`${serverUrl}/admin/database`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: 'WIPE_EVERYTHING' })
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      alert('✅ Database completely wiped!');
      // Refresh data after wipe
      fetchDashboardData();
      fetchActivity();
    } catch (err) {
      alert(`❌ Database wipe failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Initialize dashboard
  useEffect(() => {
    if (!serverUrl) return;

    // Initial data fetch
    fetchDashboardData();
    fetchActivity();

    // Set up real-time updates every 5 seconds
    const dataInterval = setInterval(fetchDashboardData, 5000);
    const activityInterval = setInterval(fetchActivity, 3000);

    return () => {
      clearInterval(dataInterval);
      clearInterval(activityInterval);
    };
  }, [serverUrl]);

  // Set up Socket.IO connection for real-time updates
  useEffect(() => {
    if (!serverUrl) return;

    const socketConnection = io(serverUrl, {
      transports: ['polling', 'websocket'],
      timeout: 8000
    });

    socketConnection.on('connect', () => {
      setIsConnected(true);
      setError(null);
      socketConnection.emit('join-admin');
    });

    socketConnection.on('disconnect', () => {
      setIsConnected(false);
    });

    socketConnection.on('connect_error', (err) => {
      setError(`Socket connection failed: ${err.message}`);
      setIsConnected(false);
    });

    socketConnection.on('dashboard-data', (data: DashboardData) => {
      setDashboardData(data);
    });

    socketConnection.on('live-activity', (activity: Activity) => {
      setActivities(prev => [activity, ...prev.slice(0, 49)]);
    });

    setSocket(socketConnection);

    return () => {
      socketConnection.disconnect();
    };
  }, [serverUrl]);

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-blue-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📊</div>
          <h1 className="text-2xl font-bold mb-2">Loading Admin Dashboard...</h1>
          {error && (
            <div className="text-red-400 mb-4">
              <div className="text-4xl mb-2">⚠️</div>
              <div>Error: {error}</div>
              <div className="text-sm mt-2">Server URL: {serverUrl}</div>
            </div>
          )}
          <div className="animate-pulse text-purple-200">Connecting to analytics server...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-blue-900 text-white">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-yellow-400">
                🎪 Festival Chat Analytics
              </h1>
              <p className="text-purple-200 mt-2">
                Real-time monitoring and admin controls • Environment: {dashboardData.realTimeStats.environment}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                isConnected ? 'bg-green-600/20 border border-green-500/30' : 'bg-red-600/20 border border-red-500/30'
              }`}>
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span className="text-sm">{isConnected ? 'Connected' : 'Disconnected'}</span>
              </div>
              <div className="text-sm text-gray-400">
                DB: {dashboardData.databaseReady ? '✅ Ready' : '⚠️ Not Ready'}
              </div>
            </div>
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <MetricCard
            title="Active Users"
            value={dashboardData.realTimeStats.activeUsers}
            trend={dashboardData.realTimeStats.userTrend}
            icon="👥"
            color="green"
          />
          <MetricCard
            title="Active Rooms"
            value={dashboardData.realTimeStats.activeRooms}
            trend={dashboardData.realTimeStats.roomTrend}
            icon="🏠"
            color="blue"
          />
          <MetricCard
            title="Messages/Min"
            value={dashboardData.messageFlow.messagesPerMinute}
            trend={dashboardData.messageFlow.trend}
            icon="💬"
            color="purple"
          />
          <MetricCard
            title="Server Health"
            value={dashboardData.serverHealth.status}
            subvalue={dashboardData.serverHealth.uptime}
            icon="🖥️"
            color={dashboardData.serverHealth.status === 'healthy' ? 'green' : 'red'}
          />
          <MetricCard
            title="Network Quality"
            value={`${dashboardData.networkStatus.quality}%`}
            subvalue={`${dashboardData.networkStatus.avgLatency}ms`}
            icon="🌐"
            color={dashboardData.networkStatus.quality > 90 ? 'green' : dashboardData.networkStatus.quality > 70 ? 'yellow' : 'red'}
          />
          <MetricCard
            title="Storage Used"
            value={`${dashboardData.realTimeStats.storageUsed}MB`}
            subvalue={`${dashboardData.dbStats.totalMessages} messages`}
            icon="💾"
            color="gray"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Live Activity Feed - Takes up 2 columns */}
          <div className="lg:col-span-2">
            <ActivityFeed activities={activities} />
          </div>

          {/* Admin Controls */}
          <div>
            <AdminControls
              onBroadcast={handleBroadcast}
              onClearRoom={handleClearRoom}
              onWipeDatabase={handleWipeDatabase}
            />
          </div>
        </div>

        {/* Additional Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {/* Database Stats */}
          <div className="bg-gray-800/80 rounded-lg p-6 backdrop-blur-sm border border-gray-700/50">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <span className="text-2xl mr-2">🗄️</span>
              Database Stats
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-300">Total Messages:</span>
                <span className="font-bold">{dashboardData.dbStats.totalMessages}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Total Rooms:</span>
                <span className="font-bold">{dashboardData.dbStats.totalRooms}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Total Sessions:</span>
                <span className="font-bold">{dashboardData.dbStats.totalSessions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Recent Activity:</span>
                <span className="font-bold">{dashboardData.dbStats.recentActivity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Database Size:</span>
                <span className="font-bold">{dashboardData.dbStats.dbSize}</span>
              </div>
            </div>
          </div>

          {/* Server Performance */}
          <div className="bg-gray-800/80 rounded-lg p-6 backdrop-blur-sm border border-gray-700/50">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <span className="text-2xl mr-2">⚡</span>
              Server Performance
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-300">Memory Used:</span>
                <span className="font-bold">{dashboardData.serverHealth.memoryUsed}MB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Memory Total:</span>
                <span className="font-bold">{dashboardData.serverHealth.memoryTotal}MB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">CPU Usage:</span>
                <span className="font-bold">{dashboardData.serverHealth.cpuUsage}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Cold Starts:</span>
                <span className="font-bold">{dashboardData.serverHealth.coldStarts}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Peak Connections:</span>
                <span className="font-bold">{dashboardData.realTimeStats.peakConnections}</span>
              </div>
            </div>
          </div>

          {/* Network Monitoring */}
          <div className="bg-gray-800/80 rounded-lg p-6 backdrop-blur-sm border border-gray-700/50">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <span className="text-2xl mr-2">📡</span>
              Network Monitoring
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-300">Quality Score:</span>
                <span className={`font-bold ${
                  dashboardData.networkStatus.quality > 90 ? 'text-green-400' : 
                  dashboardData.networkStatus.quality > 70 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {dashboardData.networkStatus.quality}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Avg Latency:</span>
                <span className="font-bold">{dashboardData.networkStatus.avgLatency}ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Delivery Rate:</span>
                <span className="font-bold text-green-400">{dashboardData.networkStatus.deliveryRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Server URL:</span>
                <span className="font-mono text-xs text-gray-400 truncate">{serverUrl}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-400 text-sm">
          <div>Last updated: {new Date(dashboardData.timestamp).toLocaleTimeString()}</div>
          <div className="mt-1">
            PeddleNet Universal Server v3.0.0-analytics-enhanced • 
            {isConnected ? ' Real-time updates active' : ' Using polling updates'}
          </div>
        </div>
      </div>
    </div>
  );
}
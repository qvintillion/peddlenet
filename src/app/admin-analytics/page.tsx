'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Force dynamic rendering (no static generation)
export const dynamic = 'force-dynamic';

// Session duration constant
const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes

// Default dashboard data structure
const defaultDashboardData = {
  timestamp: Date.now(),
  realTimeStats: {
    currentConnections: 0,
    activeRooms: 0,
    messagesPerMinute: 0,
    peakConnections: 0,
    storageUsed: 0
  },
  dbStats: {
    totalMessages: 0,
    totalRooms: 0,
    totalSessions: 0,
    recentActivity: '0 min ago',
    dbSize: '0 KB'
  },
  serverHealth: {
    memoryUsed: 0,
    memoryTotal: 512,
    cpuUsage: '0%',
    coldStarts: 0
  },
  networkStatus: {
    quality: 100,
    avgLatency: 0,
    deliveryRate: 100
  }
};

// Simple metric card component
interface MetricCardProps {
  title: string;
  value: string;
  subvalue?: string;
  icon: string;
  color: 'green' | 'yellow' | 'red' | 'gray';
}

function MetricCard({ title, value, subvalue, icon, color }: MetricCardProps) {
  const colorClasses = {
    green: 'border-green-500/50 bg-green-500/10',
    yellow: 'border-yellow-500/50 bg-yellow-500/10',
    red: 'border-red-500/50 bg-red-500/10',
    gray: 'border-gray-500/50 bg-gray-500/10'
  };

  return (
    <div className={`bg-gray-800/80 rounded-lg p-6 backdrop-blur-sm border ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-300 text-sm">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {subvalue && (
            <p className="text-gray-400 text-xs mt-1">{subvalue}</p>
          )}
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState(defaultDashboardData);
  const [isConnected, setIsConnected] = useState(false);
  const [credentials, setCredentials] = useState<{ username: string; password: string } | null>(null);
  const [serverUrl, setServerUrl] = useState('');
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showRoomDetails, setShowRoomDetails] = useState(false);

  // Get server URL from environment
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080';
    setServerUrl(url.replace('ws://', 'http://').replace('wss://', 'https://'));
  }, []);

  // Check for existing session
  useEffect(() => {
    const stored = localStorage.getItem('adminCredentials');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Date.now() - parsed.timestamp < SESSION_DURATION) {
          setCredentials(parsed.credentials);
        } else {
          localStorage.removeItem('adminCredentials');
        }
      } catch (e) {
        localStorage.removeItem('adminCredentials');
      }
    }
  }, []);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    if (!credentials || !serverUrl) return;

    try {
      const response = await fetch(`${serverUrl}/admin/dashboard`, {
        headers: {
          'Authorization': `Basic ${btoa(`${credentials.username}:${credentials.password}`)}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
        setIsConnected(true);
      } else {
        setIsConnected(false);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setIsConnected(false);
    }
  };

  // Polling for updates
  useEffect(() => {
    if (credentials) {
      fetchDashboardData();
      const interval = setInterval(fetchDashboardData, 5000);
      return () => clearInterval(interval);
    }
  }, [credentials, serverUrl]);

  // Admin action handlers
  const handleBroadcast = async (message: string) => {
    if (!credentials || !serverUrl) return;

    try {
      await fetch(`${serverUrl}/admin/broadcast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(`${credentials.username}:${credentials.password}`)}`
        },
        body: JSON.stringify({ message })
      });
      alert('Broadcast sent successfully!');
    } catch (error) {
      alert('Failed to send broadcast');
    }
  };

  const handleClearRoom = async (roomCode: string) => {
    if (!credentials || !serverUrl) return;

    try {
      await fetch(`${serverUrl}/admin/clear-room`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(`${credentials.username}:${credentials.password}`)}`
        },
        body: JSON.stringify({ roomCode })
      });
      alert('Room cleared successfully!');
      fetchDashboardData();
    } catch (error) {
      alert('Failed to clear room');
    }
  };

  const handleWipeDatabase = async () => {
    if (!credentials || !serverUrl) return;
    
    if (!confirm('Are you sure you want to wipe the entire database? This cannot be undone!')) return;

    try {
      await fetch(`${serverUrl}/admin/wipe-database`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${credentials.username}:${credentials.password}`)}`
        }
      });
      alert('Database wiped successfully!');
      fetchDashboardData();
    } catch (error) {
      alert('Failed to wipe database');
    }
  };

  // If no credentials, redirect to main page
  if (!credentials) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-purple-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-purple-200 mb-6">You need admin credentials to access this page</p>
          <button
            onClick={() => router.push('/')}
            className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-lg transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-purple-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">🎵 PeddleNet Admin Analytics</h1>
          <p className="text-purple-200">
            Real-time monitoring and administration dashboard
          </p>
        </div>

        {/* Connection Status */}
        <div className="mb-6">
          <div className={`inline-flex items-center px-4 py-2 rounded-lg ${
            isConnected ? 'bg-green-500/20 border border-green-500/50' : 'bg-red-500/20 border border-red-500/50'
          }`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span className="text-sm">
              {isConnected ? 'Connected to server' : 'Disconnected - using cached data'}
            </span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Active Connections"
            value={dashboardData.realTimeStats.currentConnections.toString()}
            subvalue={`Peak: ${dashboardData.realTimeStats.peakConnections}`}
            icon="👥"
            color={dashboardData.realTimeStats.currentConnections > 10 ? 'green' : dashboardData.realTimeStats.currentConnections > 5 ? 'yellow' : 'gray'}
          />
          <MetricCard
            title="Active Rooms"
            value={dashboardData.realTimeStats.activeRooms.toString()}
            subvalue={`${dashboardData.realTimeStats.messagesPerMinute} msg/min`}
            icon="🏠"
            color={dashboardData.realTimeStats.activeRooms > 5 ? 'green' : dashboardData.realTimeStats.activeRooms > 2 ? 'yellow' : 'gray'}
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

        {/* Admin Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800/80 rounded-lg p-6 backdrop-blur-sm border border-gray-700/50">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <span className="text-2xl mr-2">📢</span>
              Broadcast Message
            </h3>
            <div className="space-y-4">
              <textarea
                placeholder="Enter broadcast message..."
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg p-3 text-white resize-none"
                rows={3}
                id="broadcast-message"
              />
              <button
                onClick={() => {
                  const message = (document.getElementById('broadcast-message') as HTMLTextAreaElement).value;
                  if (message.trim()) {
                    handleBroadcast(message);
                    (document.getElementById('broadcast-message') as HTMLTextAreaElement).value = '';
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
              >
                Send Broadcast
              </button>
            </div>
          </div>

          <div className="bg-gray-800/80 rounded-lg p-6 backdrop-blur-sm border border-gray-700/50">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <span className="text-2xl mr-2">🗑️</span>
              Admin Actions
            </h3>
            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Room code to clear..."
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-lg p-3 text-white mb-2"
                  id="room-code-input"
                />
                <button
                  onClick={() => {
                    const roomCode = (document.getElementById('room-code-input') as HTMLInputElement).value;
                    if (roomCode.trim()) {
                      handleClearRoom(roomCode);
                      (document.getElementById('room-code-input') as HTMLInputElement).value = '';
                    }
                  }}
                  className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-lg transition-colors w-full"
                >
                  Clear Room
                </button>
              </div>
              <button
                onClick={handleWipeDatabase}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors w-full"
              >
                Wipe Database
              </button>
            </div>
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
            PeddleNet Admin Dashboard v4.0.0-session-persistence • 
            {isConnected ? ' Real-time updates active' : ' Using polling updates'} • 
            Session expires: {credentials ? new Date(Date.now() + SESSION_DURATION).toLocaleString() : 'N/A'}
          </div>
        </div>
      </div>
    </div>
  );
}
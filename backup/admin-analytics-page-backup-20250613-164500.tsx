'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ActivityFeed } from '@/components/admin/ActivityFeed';
import { AdminControls } from '@/components/admin/AdminControls';
import { DetailedUserView } from '@/components/admin/DetailedUserView';
import { DetailedRoomView } from '@/components/admin/DetailedRoomView';

// Force dynamic rendering (no static generation)
export const dynamic = 'force-dynamic';

// Default dashboard data structure
const defaultDashboardData = {
  timestamp: Date.now(),
  realTimeStats: {
    activeUsers: 0,
    activeRooms: 0,
    messagesPerMinute: 0,
    totalMessages: 0,
    peakConnections: 0,
    storageUsed: 0,
    userTrend: '',
    roomTrend: '',
    environment: 'production'
  },
  serverHealth: {
    status: 'healthy',
    uptime: '0m 0s',
    memoryUsed: 0,
    memoryTotal: 0,
    cpuUsage: '0%',
    coldStarts: 0
  },
  networkStatus: {
    quality: 100,
    avgLatency: 0,
    deliveryRate: 100
  },
  dbStats: {
    totalMessages: 0,
    totalRooms: 0,
    totalSessions: 0,
    recentActivity: 0,
    dbSize: '0 KB',
    oldestMessage: Date.now()
  }
};

// Activity interface that matches the server structure
interface Activity {
  id: number;
  type: string;
  data: any;
  timestamp: number;
  icon: string;
}

// Session storage keys
const ADMIN_SESSION_KEY = 'peddlenet_admin_session';
const ADMIN_ACTIVITY_KEY = 'peddlenet_admin_activity';

// Session interface
interface AdminSession {
  username: string;
  password: string;
  loginTime: number;
  expiresAt: number;
}

// Clickable metric card component
interface MetricCardProps {
  title: string;
  value: string;
  subvalue?: string;
  icon: string;
  color: 'green' | 'yellow' | 'red' | 'gray';
  onClick?: () => void;
  isClickable?: boolean;
}

function MetricCard({ title, value, subvalue, icon, color, onClick, isClickable }: MetricCardProps) {
  const colorClasses = {
    green: 'border-green-500/50 bg-green-500/10',
    yellow: 'border-yellow-500/50 bg-yellow-500/10',
    red: 'border-red-500/50 bg-red-500/10',
    gray: 'border-gray-500/50 bg-gray-500/10'
  };

  return (
    <div 
      className={`bg-gray-800/80 rounded-lg p-6 backdrop-blur-sm border ${colorClasses[color]} ${
        isClickable ? 'cursor-pointer hover:bg-gray-700/80 transition-all hover:scale-105' : ''
      }`}
      onClick={onClick}
    >
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
      {isClickable && (
        <div className="mt-2 text-center">
          <span className="text-xs text-gray-400">Click for details</span>
        </div>
      )}
    </div>
  );
}

// Login Form Component
function LoginForm({ onLogin, error, isLoading }: {
  onLogin: (username: string, password: string) => Promise<void>;
  error: string;
  isLoading: boolean;
}) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onLogin(username, password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-purple-900 text-white flex items-center justify-center p-4">
      <div className="bg-gray-800/80 rounded-lg p-8 backdrop-blur-sm border border-gray-700/50 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🎵</div>
          <h1 className="text-3xl font-bold mb-2">PeddleNet Admin</h1>
          <p className="text-gray-300">Festival Chat Administration</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-gray-700/50 border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter username"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-700/50 border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter password"
              required
            />
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-200 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:opacity-50 px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-400">
          <p>Default credentials: th3p3ddl3r / letsmakeatrade</p>
        </div>
      </div>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState(defaultDashboardData);
  const [isConnected, setIsConnected] = useState(false);
  const [credentials, setCredentials] = useState<{ username: string; password: string } | null>(null);
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showRoomDetails, setShowRoomDetails] = useState(false);

  // Session management functions
  const saveSession = (username: string, password: string) => {
    const session: AdminSession = {
      username,
      password,
      loginTime: Date.now(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    };
    
    try {
      localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
      console.log('🔒 Admin session saved with 24-hour expiry');
    } catch (error) {
      console.warn('Failed to save admin session:', error);
    }
  };

  const loadSession = (): AdminSession | null => {
    try {
      const sessionData = localStorage.getItem(ADMIN_SESSION_KEY);
      if (!sessionData) return null;

      const session: AdminSession = JSON.parse(sessionData);
      
      // Check if session is expired
      if (Date.now() > session.expiresAt) {
        console.log('🔒 Admin session expired, clearing...');
        localStorage.removeItem(ADMIN_SESSION_KEY);
        return null;
      }

      console.log('🔒 Admin session loaded, expires in:', Math.round((session.expiresAt - Date.now()) / (60 * 60 * 1000)), 'hours');
      return session;
    } catch (error) {
      console.warn('Failed to load admin session:', error);
      localStorage.removeItem(ADMIN_SESSION_KEY);
      return null;
    }
  };

  const clearSession = () => {
    try {
      localStorage.removeItem(ADMIN_SESSION_KEY);
      localStorage.removeItem(ADMIN_ACTIVITY_KEY);
      console.log('🔒 Admin session cleared');
    } catch (error) {
      console.warn('Failed to clear admin session:', error);
    }
  };

  const saveActivities = (activities: Activity[]) => {
    try {
      // Keep last 100 activities
      const activitiesToSave = activities.slice(0, 100);
      localStorage.setItem(ADMIN_ACTIVITY_KEY, JSON.stringify({
        activities: activitiesToSave,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('Failed to save activities:', error);
    }
  };

  const loadActivities = (): Activity[] => {
    try {
      const activityData = localStorage.getItem(ADMIN_ACTIVITY_KEY);
      if (!activityData) return [];

      const parsed = JSON.parse(activityData);
      return parsed.activities || [];
    } catch (error) {
      console.warn('Failed to load activities:', error);
      return [];
    }
  };

  // Load session and activities on component mount
  useEffect(() => {
    const savedSession = loadSession();
    if (savedSession) {
      setCredentials({
        username: savedSession.username,
        password: savedSession.password
      });
      setIsConnected(true);
      console.log('🔒 Restored admin session for:', savedSession.username);
    }

    const savedActivities = loadActivities();
    if (savedActivities.length > 0) {
      setActivities(savedActivities);
      console.log('📊 Restored', savedActivities.length, 'activities from localStorage');
    }
  }, []);

  // Save activities when they change
  useEffect(() => {
    if (activities.length > 0) {
      saveActivities(activities);
    }
  }, [activities]);

  // Authenticate user
  const handleLogin = async (username: string, password: string) => {
    setIsLoading(true);
    setLoginError('');

    try {
      // Try to authenticate using the local API
      const response = await fetch('/api/admin/analytics', {
        headers: {
          'Authorization': `Basic ${btoa(`${username}:${password}`)}`
        }
      });

      if (response.ok) {
        setCredentials({ username, password });
        setIsConnected(true);
        saveSession(username, password);
        console.log('🔒 Admin login successful, session saved');
      } else {
        setLoginError('Invalid credentials. Please try again.');
      }
    } catch (error) {
      setLoginError('Connection error. Please check your network and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const handleLogout = () => {
    setCredentials(null);
    setIsConnected(false);
    setDashboardData(defaultDashboardData);
    setActivities([]);
    clearSession();
    console.log('🔒 Admin logout, session cleared');
  };

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    if (!credentials) return;

    try {
      const response = await fetch('/api/admin/analytics', {
        headers: {
          'Authorization': `Basic ${btoa(`${credentials.username}:${credentials.password}`)}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
        setIsConnected(true);
      } else if (response.status === 401) {
        // Authentication failed - logout
        console.log('🔒 Admin session invalid, logging out...');
        handleLogout();
      } else {
        setIsConnected(false);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setIsConnected(false);
    }
  };

  // Fetch activity data
  const fetchActivityData = async () => {
    if (!credentials) return;

    try {
      const response = await fetch('/api/admin/activity', {
        headers: {
          'Authorization': `Basic ${btoa(`${credentials.username}:${credentials.password}`)}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const newActivities = data.activities || [];
        setActivities(newActivities);
      }
    } catch (error) {
      console.error('Failed to fetch activity data:', error);
    }
  };

  // Polling for updates
  useEffect(() => {
    if (credentials) {
      fetchDashboardData();
      fetchActivityData();
      const interval = setInterval(() => {
        fetchDashboardData();
        fetchActivityData();
      }, 5000); // Every 5 seconds
      return () => clearInterval(interval);
    }
  }, [credentials]);

  // Admin action handlers
  const handleBroadcast = async (message: string) => {
    if (!credentials) return;

    const response = await fetch('/api/admin/broadcast', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(`${credentials.username}:${credentials.password}`)}`
      },
      body: JSON.stringify({ message })
    });

    if (response.ok) {
      // Activity will be updated via the real activity endpoint
      fetchActivityData();
    } else {
      throw new Error('Failed to send broadcast');
    }
  };

  const handleClearRoom = async (roomCode: string) => {
    if (!credentials) return;

    const response = await fetch('/api/admin/room', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(`${credentials.username}:${credentials.password}`)}`
      },
      body: JSON.stringify({ roomCode })
    });

    if (response.ok) {
      // Activity will be updated via the real activity endpoint
      fetchActivityData();
      fetchDashboardData();
    } else {
      throw new Error('Failed to clear room');
    }
  };

  const handleWipeDatabase = async () => {
    if (!credentials) return;

    const response = await fetch('/api/admin/database', {
      method: 'DELETE',
      headers: {
        'Authorization': `Basic ${btoa(`${credentials.username}:${credentials.password}`)}`
      }
    });

    if (response.ok) {
      // After database wipe, activities will be empty
      setActivities([]);
      fetchDashboardData();
    } else {
      throw new Error('Failed to wipe database');
    }
  };

  const handleClearActivity = () => {
    setActivities([]);
    try {
      localStorage.removeItem(ADMIN_ACTIVITY_KEY);
      console.log('📊 Activity feed cleared from localStorage');
    } catch (error) {
      console.warn('Failed to clear activities from localStorage:', error);
    }
  };

  // If no credentials, show login form
  if (!credentials) {
    return <LoginForm onLogin={handleLogin} error={loginError} isLoading={isLoading} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-purple-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header with Logout */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2">🎵 PeddleNet Admin Analytics</h1>
            <p className="text-purple-200">
              Real-time monitoring and administration dashboard
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors flex items-center"
          >
            <span className="mr-2">🚪</span>
            Logout
          </button>
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
            title="Active Users"
            value={dashboardData.realTimeStats.activeUsers.toString()}
            subvalue={`Peak: ${dashboardData.realTimeStats.peakConnections}`}
            icon="👥"
            color={dashboardData.realTimeStats.activeUsers > 10 ? 'green' : dashboardData.realTimeStats.activeUsers > 5 ? 'yellow' : 'gray'}
            onClick={() => setShowUserDetails(true)}
            isClickable={true}
          />
          <MetricCard
            title="Active Rooms"
            value={dashboardData.realTimeStats.activeRooms.toString()}
            subvalue={dashboardData.realTimeStats.userTrend || `${dashboardData.realTimeStats.activeUsers} users`}
            icon="🏠"
            color={dashboardData.realTimeStats.activeRooms > 5 ? 'green' : dashboardData.realTimeStats.activeRooms > 2 ? 'yellow' : 'gray'}
            onClick={() => setShowRoomDetails(true)}
            isClickable={true}
          />
          <MetricCard
            title="Messages/Min"
            value={dashboardData.realTimeStats.messagesPerMinute.toString()}
            subvalue={`Total: ${dashboardData.realTimeStats.totalMessages}`}
            icon="💬"
            color={dashboardData.realTimeStats.messagesPerMinute > 20 ? 'green' : dashboardData.realTimeStats.messagesPerMinute > 10 ? 'yellow' : 'gray'}
          />
          <MetricCard
            title="Network Quality"
            value={`${dashboardData.networkStatus.quality}%`}
            subvalue={`${dashboardData.networkStatus.avgLatency}ms`}
            icon="🌐"
            color={dashboardData.networkStatus.quality > 90 ? 'green' : dashboardData.networkStatus.quality > 70 ? 'yellow' : 'red'}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Live Activity Feed - Takes up 2 columns */}
          <div className="lg:col-span-2">
            <ActivityFeed 
              activities={activities} 
              onClearActivity={handleClearActivity}
            />
          </div>

          {/* Admin Controls - Ensure it doesn't clip on mobile */}
          <div className="w-full min-w-0">
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
                <span className="text-gray-300">Status:</span>
                <span className="font-bold text-green-400">{dashboardData.serverHealth.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Uptime:</span>
                <span className="font-bold">{dashboardData.serverHealth.uptime}</span>
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
                <span className="text-gray-300">Environment:</span>
                <span className="font-bold text-blue-400">{dashboardData.realTimeStats.environment}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-400 text-sm">
          <div>Last updated: {new Date(dashboardData.timestamp).toLocaleTimeString()}</div>
          <div className="mt-1">
            PeddleNet Admin Dashboard v4.0.0-session-persistence • 
            {isConnected ? ' Real-time updates active' : ' Using cached data'} • 
            User: {credentials.username}
          </div>
        </div>
      </div>

      {/* Detailed Modals */}
      <DetailedUserView
        isOpen={showUserDetails}
        onClose={() => setShowUserDetails(false)}
        serverUrl=""
        credentials={credentials}
      />
      
      <DetailedRoomView
        isOpen={showRoomDetails}
        onClose={() => setShowRoomDetails(false)}
        serverUrl=""
        credentials={credentials}
      />
    </div>
  );
}
import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { ServerUtils } from '../utils/server-utils';

export interface RealTimeStats {
  activeUsers: number;
  totalUsers: number;
  activeRooms: number;
  totalRooms: number;
  messagesPerMinute: number;
  totalMessages: number;
  peakConnections: number;
  storageUsed: number;
  userTrend: string;
  roomTrend: string;
  environment: string;
}

export interface ServerHealth {
  status: string;
  uptime: string;
  memoryUsed: number;
  memoryTotal: number;
  cpuUsage: string;
  coldStarts: number;
}

export interface NetworkStatus {
  quality: number;
  avgLatency: number;
  deliveryRate: number;
}

export interface Activity {
  id: number;
  type: string;
  data: any;
  timestamp: number;
  icon: string;
}

export interface DashboardData {
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

export function useAdminAnalytics() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get server URLs using ServerUtils with proper admin API path detection
  const getAdminApiUrl = useCallback(() => {
    const httpUrl = ServerUtils.getHttpServerUrl();
    const adminPath = ServerUtils.getAdminApiPath();
    const fullUrl = `${httpUrl}${adminPath}`;
    console.log('🛠️ Admin API URL:', fullUrl);
    return fullUrl;
  }, []);

  const getWebSocketUrl = useCallback(() => {
    return ServerUtils.getWebSocketServerUrl();
  }, []);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      const adminUrl = getAdminApiUrl();
      console.log('📊 Fetching admin dashboard data from:', `${adminUrl}/analytics`);
      
      // Add authentication headers for admin endpoints
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add basic auth if needed (using environment or default credentials)
      const username = 'th3p3ddl3r';
      const password = 'letsmakeatrade';
      const credentials = btoa(`${username}:${password}`);
      headers['Authorization'] = `Basic ${credentials}`;

      const response = await fetch(`${adminUrl}/analytics`, {
        headers,
        credentials: 'include'
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required for admin access');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setDashboardData(data);
      setError(null);
      console.log('✅ Admin dashboard data fetched successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch dashboard data';
      setError(errorMessage);
      console.error('❌ Dashboard fetch error:', errorMessage);
    }
  }, [getAdminApiUrl]);

  // Fetch activity feed
  const fetchActivity = useCallback(async () => {
    try {
      const adminUrl = getAdminApiUrl();
      console.log('📋 Fetching admin activity from:', `${adminUrl}/activity`);
      
      // Add authentication headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const username = 'th3p3ddl3r';
      const password = 'letsmakeatrade';
      const credentials = btoa(`${username}:${password}`);
      headers['Authorization'] = `Basic ${credentials}`;
      
      const response = await fetch(`${adminUrl}/activity?limit=50`, {
        headers,
        credentials: 'include'
      });
      
      if (!response.ok) {
        console.warn(`Activity fetch failed: HTTP ${response.status}`);
        return;
      }
      
      const data = await response.json();
      setActivities(data.activities || []);
      console.log('✅ Admin activity fetched successfully');
    } catch (err) {
      console.error('❌ Activity fetch error:', err);
    }
  }, [getAdminApiUrl]);

  // Admin actions with authentication
  const getAuthHeaders = useCallback(() => {
    const username = 'th3p3ddl3r';
    const password = 'letsmakeatrade';
    const credentials = btoa(`${username}:${password}`);
    return {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${credentials}`
    };
  }, []);

  const handleBroadcast = useCallback(async (message: string) => {
    try {
      const adminUrl = getAdminApiUrl();
      console.log('📢 Broadcasting message via:', `${adminUrl}/broadcast`);
      
      const response = await fetch(`${adminUrl}/broadcast`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ message, targetRooms: 'all' })
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('✅ Broadcast successful:', result);
      return { success: true, messagesSent: result.messagesSent };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Broadcast error:', errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [getAdminApiUrl, getAuthHeaders]);

  const handleClearRoom = useCallback(async (roomId: string) => {
    try {
      const adminUrl = getAdminApiUrl();
      console.log('🗑️ Clearing room messages via:', `${adminUrl}/room/${roomId}/messages`);
      
      const response = await fetch(`${adminUrl}/room/${roomId}/messages`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('✅ Room cleared successfully:', result);
      return { success: true, messagesDeleted: result.messagesDeleted };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Clear room error:', errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [getAdminApiUrl, getAuthHeaders]);

  const handleWipeDatabase = useCallback(async () => {
    try {
      const adminUrl = getAdminApiUrl();
      console.log('💥 Wiping database via:', `${adminUrl}/database`);
      
      const response = await fetch(`${adminUrl}/database`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ confirm: 'WIPE_EVERYTHING' })
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('✅ Database wipe successful:', result);
      
      // Refresh data after wipe
      setTimeout(() => {
        fetchDashboardData();
        fetchActivity();
      }, 1000);
      
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Database wipe error:', errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [getAdminApiUrl, getAuthHeaders, fetchDashboardData, fetchActivity]);

  // Fetch detailed user data
  const fetchDetailedUsers = useCallback(async () => {
    try {
      const adminUrl = getAdminApiUrl();
      console.log('👥 Fetching detailed users from:', `${adminUrl}/users/detailed`);
      
      const response = await fetch(`${adminUrl}/users/detailed`, {
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Detailed users fetched successfully');
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Fetch detailed users error:', errorMessage);
      throw err;
    }
  }, [getAdminApiUrl, getAuthHeaders]);

  // Fetch detailed room data
  const fetchDetailedRooms = useCallback(async () => {
    try {
      const adminUrl = getAdminApiUrl();
      console.log('🏠 Fetching detailed rooms from:', `${adminUrl}/rooms/detailed`);
      
      const response = await fetch(`${adminUrl}/rooms/detailed`, {
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Detailed rooms fetched successfully');
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Fetch detailed rooms error:', errorMessage);
      throw err;
    }
  }, [getAdminApiUrl, getAuthHeaders]);

  // Remove user from room
  const handleRemoveUser = useCallback(async (peerId: string, roomId: string, reason: string) => {
    try {
      const adminUrl = getAdminApiUrl();
      console.log('🗑️ Removing user via:', `${adminUrl}/users/${peerId}/remove`);
      
      const response = await fetch(`${adminUrl}/users/${peerId}/remove`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ roomId, reason: reason || 'Removed by admin' })
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('✅ User removed successfully:', result);
      return { success: true, removedUser: result.removedUser };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Remove user error:', errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [getAdminApiUrl, getAuthHeaders]);

  // Initialize dashboard
  useEffect(() => {
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
  }, [fetchDashboardData, fetchActivity]);

  // Set up Socket.IO connection for real-time updates (WebSocket server)
  useEffect(() => {
    const webSocketUrl = getWebSocketUrl();
    console.log('🔌 Connecting admin socket to:', webSocketUrl);

    // Only connect to WebSocket if it's available (not on Vercel-only deployments)
    const environmentInfo = ServerUtils.getEnvironmentInfo();
    
    if (environmentInfo.platform === 'vercel' && !webSocketUrl.includes('run.app')) {
      console.log('🚀 Vercel-only deployment detected, skipping WebSocket admin connection');
      setIsConnected(false);
      return;
    }

    const socketConnection = io(webSocketUrl, {
      transports: ['polling', 'websocket'],
      timeout: 8000
    });

    socketConnection.on('connect', () => {
      console.log('✅ Admin socket connected');
      setIsConnected(true);
      setError(null);
      socketConnection.emit('join-admin');
    });

    socketConnection.on('disconnect', () => {
      console.log('❌ Admin socket disconnected');
      setIsConnected(false);
    });

    socketConnection.on('connect_error', (err) => {
      console.error('❌ Admin socket connection error:', err);
      // Don't set error for socket connection issues in Vercel deployments
      if (environmentInfo.platform !== 'vercel') {
        setError(`Socket connection failed: ${err.message}`);
      }
      setIsConnected(false);
    });

    socketConnection.on('dashboard-data', (data: DashboardData) => {
      console.log('📊 Received real-time dashboard data via WebSocket');
      setDashboardData(data);
    });

    socketConnection.on('live-activity', (activity: Activity) => {
      console.log('📋 Received live activity:', activity.type);
      setActivities(prev => [activity, ...prev.slice(0, 49)]);
    });

    setSocket(socketConnection);

    return () => {
      console.log('🔌 Disconnecting admin socket');
      socketConnection.disconnect();
    };
  }, [getWebSocketUrl]);

  return {
    dashboardData,
    activities,
    isConnected,
    error,
    serverUrl: getAdminApiUrl(),
    actions: {
      broadcast: handleBroadcast,
      clearRoom: handleClearRoom,
      wipeDatabase: handleWipeDatabase,
      fetchDetailedUsers,
      fetchDetailedRooms,
      removeUser: handleRemoveUser,
      refresh: () => {
        fetchDashboardData();
        fetchActivity();
      }
    }
  };
}
import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export interface RealTimeStats {
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

  // Get server URL based on environment
  const getServerUrl = useCallback(() => {
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
  }, []);

  const serverUrl = getServerUrl();

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
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
  }, [serverUrl]);

  // Fetch activity feed
  const fetchActivity = useCallback(async () => {
    try {
      const response = await fetch(`${serverUrl}/admin/activity?limit=50`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      setActivities(data.activities || []);
    } catch (err) {
      console.error('Activity fetch error:', err);
    }
  }, [serverUrl]);

  // Admin actions
  const handleBroadcast = useCallback(async (message: string) => {
    try {
      const response = await fetch(`${serverUrl}/admin/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, targetRooms: 'all' })
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const result = await response.json();
      return { success: true, messagesSent: result.messagesSent };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }, [serverUrl]);

  const handleClearRoom = useCallback(async (roomId: string) => {
    try {
      const response = await fetch(`${serverUrl}/admin/room/${roomId}/messages`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const result = await response.json();
      return { success: true, messagesDeleted: result.messagesDeleted };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }, [serverUrl]);

  const handleWipeDatabase = useCallback(async () => {
    try {
      const response = await fetch(`${serverUrl}/admin/database`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: 'WIPE_EVERYTHING' })
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      // Refresh data after wipe
      setTimeout(() => {
        fetchDashboardData();
        fetchActivity();
      }, 1000);
      
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }, [serverUrl, fetchDashboardData, fetchActivity]);

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
  }, [serverUrl, fetchDashboardData, fetchActivity]);

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

  return {
    dashboardData,
    activities,
    isConnected,
    error,
    serverUrl,
    actions: {
      broadcast: handleBroadcast,
      clearRoom: handleClearRoom,
      wipeDatabase: handleWipeDatabase,
      refresh: () => {
        fetchDashboardData();
        fetchActivity();
      }
    }
  };
}
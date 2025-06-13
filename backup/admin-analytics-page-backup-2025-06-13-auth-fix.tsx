'use client';

import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { ServerUtils } from '@/utils/server-utils';

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

// New interfaces for detailed data
interface DetailedUser {
  socketId: string;
  peerId: string;
  displayName: string;
  roomId: string;
  joinedAt: number;
  duration: number;
  isActive: boolean;
}

interface UserSession {
  id: string;
  room_id: string;
  user_id: string;
  display_name: string;
  joined_at: string;
  left_at: string | null;
  duration: number;
  messages_sent: number;
}

interface DetailedUsersData {
  activeUsers: DetailedUser[];
  recentSessions: UserSession[];
  summary: {
    totalActive: number;
    uniqueUsers: number;
    totalRooms: number;
    timestamp: number;
  };
}

interface DetailedRoom {
  roomId: string;
  roomCode: string;
  activeUsers: number;
  userList: Array<{
    peerId: string;
    displayName: string;
    joinedAt: number;
  }>;
  created: number;
  lastActivity: number;
  totalMessages: number;
  uniqueUsers: number;
}

interface DetailedRoomsData {
  activeRooms: DetailedRoom[];
  summary: {
    totalRooms: number;
    totalActiveUsers: number;
    totalMessages: number;
    timestamp: number;
  };
}

function MetricCard({ 
  title, 
  value, 
  subvalue, 
  trend, 
  icon, 
  color = 'blue',
  onClick
}: {
  title: string;
  value: string | number;
  subvalue?: string;
  trend?: string;
  icon: string;
  color?: 'green' | 'blue' | 'purple' | 'red' | 'yellow' | 'gray';
  onClick?: () => void;
}) {
  const colorClasses = {
    green: 'bg-green-600/20 border-green-500/30',
    blue: 'bg-blue-600/20 border-blue-500/30',
    purple: 'bg-purple-600/20 border-purple-500/30',
    red: 'bg-red-600/20 border-red-500/30',
    yellow: 'bg-yellow-600/20 border-yellow-500/30',
    gray: 'bg-gray-600/20 border-gray-500/30'
  };

  const baseClasses = `${colorClasses[color]} p-4 rounded-lg border backdrop-blur-sm`;
  const clickableClasses = onClick 
    ? 'cursor-pointer hover:scale-105 hover:shadow-lg transform transition-all duration-200 hover:bg-opacity-30' 
    : '';

  return (
    <div 
      className={`${baseClasses} ${clickableClasses}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
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
      {onClick && (
        <div className="text-xs text-blue-300 mt-2 opacity-75">Click for details →</div>
      )}
    </div>
  );
}

function DetailedUserView({ 
  isOpen, 
  onClose, 
  serverUrl 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  serverUrl: string; 
}) {
  const [userDetails, setUserDetails] = useState<DetailedUsersData | null>(null);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'joinedAt' | 'duration' | 'displayName'>('joinedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showSessions, setShowSessions] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const fetchUserDetails = async () => {
    if (!isOpen) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${serverUrl}/admin/users/detailed`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      setUserDetails(data);
    } catch (err) {
      console.error('Failed to fetch user details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveUser = async (peerId: string, roomId: string, displayName: string) => {
    if (!confirm(`Remove user "${displayName}" from room "${roomId}"?`)) return;
    
    setRemoving(peerId);
    try {
      const response = await fetch(`${serverUrl}/admin/users/${peerId}/remove`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          roomId, 
          reason: 'Removed by admin via dashboard' 
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(`✅ User "${result.removedUser.displayName}" removed successfully`);
        fetchUserDetails(); // Refresh data
      } else {
        const errorData = await response.json();
        alert(`❌ Failed to remove user: ${errorData.error}`);
      }
    } catch (err) {
      alert(`❌ Remove user failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setRemoving(null);
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatDuration = (duration: number) => {
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const sortedUsers = userDetails?.activeUsers.sort((a, b) => {
    let aVal: any = a[sortBy];
    let bVal: any = b[sortBy];
    
    if (sortBy === 'displayName') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }
    
    if (sortOrder === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  }) || [];

  useEffect(() => {
    fetchUserDetails();
    if (isOpen) {
      const interval = setInterval(fetchUserDetails, 10000); // Update every 10 seconds
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center">
              <span className="text-3xl mr-3">👥</span>
              Detailed User Management
            </h2>
            {userDetails && (
              <p className="text-gray-300 mt-1">
                {userDetails.summary.totalActive} active users • {userDetails.summary.uniqueUsers} unique • {userDetails.summary.totalRooms} rooms
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl font-bold"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {loading ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">⏳</div>
              <div className="text-gray-300">Loading user details...</div>
            </div>
          ) : !userDetails ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">⚠️</div>
              <div className="text-red-300">Failed to load user details</div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Controls */}
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSortBy('joinedAt')}
                    className={`px-3 py-1 rounded text-sm ${
                      sortBy === 'joinedAt' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
                    }`}
                  >
                    Sort by Join Time
                  </button>
                  <button
                    onClick={() => setSortBy('duration')}
                    className={`px-3 py-1 rounded text-sm ${
                      sortBy === 'duration' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
                    }`}
                  >
                    Sort by Duration
                  </button>
                  <button
                    onClick={() => setSortBy('displayName')}
                    className={`px-3 py-1 rounded text-sm ${
                      sortBy === 'displayName' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
                    }`}
                  >
                    Sort by Name
                  </button>
                  <button
                    onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                    className="px-3 py-1 rounded text-sm bg-gray-700 text-gray-300 hover:bg-gray-600"
                  >
                    {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
                  </button>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowSessions(!showSessions)}
                    className={`px-3 py-1 rounded text-sm ${
                      showSessions ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'
                    }`}
                  >
                    {showSessions ? 'Hide Sessions' : 'Show Recent Sessions'}
                  </button>
                  <button
                    onClick={fetchUserDetails}
                    className="px-3 py-1 rounded text-sm bg-green-600 text-white hover:bg-green-700"
                  >
                    🔄 Refresh
                  </button>
                </div>
              </div>

              {/* Active Users Table */}
              <div className="bg-gray-700/50 rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-gray-700 border-b border-gray-600">
                  <h3 className="text-lg font-semibold text-white">
                    Active Users ({sortedUsers.length})
                  </h3>
                </div>
                
                {sortedUsers.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <div className="text-4xl mb-2">👻</div>
                    <div>No active users found</div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-600">
                        <tr>
                          <th className="text-left p-3 text-gray-300">Display Name</th>
                          <th className="text-left p-3 text-gray-300">Room</th>
                          <th className="text-left p-3 text-gray-300">Joined</th>
                          <th className="text-left p-3 text-gray-300">Duration</th>
                          <th className="text-left p-3 text-gray-300">Status</th>
                          <th className="text-center p-3 text-gray-300">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedUsers.map(user => (
                          <tr key={user.peerId} className="border-b border-gray-600 hover:bg-gray-600/30">
                            <td className="p-3 text-white font-medium">{user.displayName}</td>
                            <td className="p-3 text-gray-300 font-mono text-sm">{user.roomId}</td>
                            <td className="p-3 text-gray-300 text-sm">{formatTime(user.joinedAt)}</td>
                            <td className="p-3 text-gray-300">{formatDuration(user.duration)}</td>
                            <td className="p-3">
                              <span className={`px-2 py-1 rounded text-xs ${
                                user.isActive ? 'bg-green-600/30 text-green-300' : 'bg-gray-600/30 text-gray-300'
                              }`}>
                                {user.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => handleRemoveUser(user.peerId, user.roomId, user.displayName)}
                                disabled={removing === user.peerId}
                                className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-sm text-white transition-colors"
                              >
                                {removing === user.peerId ? '⏳' : '🚫 Remove'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Recent Sessions */}
              {showSessions && userDetails.recentSessions.length > 0 && (
                <div className="bg-gray-700/50 rounded-lg overflow-hidden">
                  <div className="px-4 py-3 bg-gray-700 border-b border-gray-600">
                    <h3 className="text-lg font-semibold text-white">
                      Recent Sessions ({userDetails.recentSessions.length})
                    </h3>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-600">
                        <tr>
                          <th className="text-left p-3 text-gray-300">User</th>
                          <th className="text-left p-3 text-gray-300">Room</th>
                          <th className="text-left p-3 text-gray-300">Joined</th>
                          <th className="text-left p-3 text-gray-300">Left</th>
                          <th className="text-left p-3 text-gray-300">Duration</th>
                          <th className="text-left p-3 text-gray-300">Messages</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userDetails.recentSessions.slice(0, 20).map(session => (
                          <tr key={session.id} className="border-b border-gray-600">
                            <td className="p-3 text-white">{session.display_name}</td>
                            <td className="p-3 text-gray-300 font-mono text-sm">{session.room_id}</td>
                            <td className="p-3 text-gray-300 text-sm">{session.joined_at}</td>
                            <td className="p-3 text-gray-300 text-sm">{session.left_at || 'Still active'}</td>
                            <td className="p-3 text-gray-300">{formatDuration(session.duration)}</td>
                            <td className="p-3 text-gray-300">{session.messages_sent}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailedRoomView({ 
  isOpen, 
  onClose, 
  serverUrl 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  serverUrl: string; 
}) {
  const [roomDetails, setRoomDetails] = useState<DetailedRoomsData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchRoomDetails = async () => {
    if (!isOpen) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${serverUrl}/admin/rooms/detailed`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      setRoomDetails(data);
    } catch (err) {
      console.error('Failed to fetch room details:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getTimeSince = (timestamp: number) => {
    const minutes = Math.floor((Date.now() - timestamp) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  useEffect(() => {
    fetchRoomDetails();
    if (isOpen) {
      const interval = setInterval(fetchRoomDetails, 10000); // Update every 10 seconds
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center">
              <span className="text-3xl mr-3">🏠</span>
              Detailed Room Analytics
            </h2>
            {roomDetails && (
              <p className="text-gray-300 mt-1">
                {roomDetails.summary.totalRooms} active rooms • {roomDetails.summary.totalActiveUsers} users • {roomDetails.summary.totalMessages} messages
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl font-bold"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {loading ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">⏳</div>
              <div className="text-gray-300">Loading room details...</div>
            </div>
          ) : !roomDetails ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">⚠️</div>
              <div className="text-red-300">Failed to load room details</div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Controls */}
              <div className="flex justify-end">
                <button
                  onClick={fetchRoomDetails}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  🔄 Refresh Data
                </button>
              </div>

              {/* Rooms Grid */}
              {roomDetails.activeRooms.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <div className="text-4xl mb-2">🏠</div>
                  <div>No active rooms found</div>
                </div>
              ) : (
                <div className="grid gap-6">
                  {roomDetails.activeRooms.map(room => (
                    <div key={room.roomId} className="bg-gray-700/50 rounded-lg border border-gray-600">
                      {/* Room Header */}
                      <div className="p-4 border-b border-gray-600">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div>
                            <h3 className="text-xl font-bold text-white mb-1">
                              {room.roomId}
                            </h3>
                            <div className="flex flex-wrap gap-4 text-sm text-gray-300">
                              <span>📋 Code: <span className="font-mono bg-gray-600 px-2 py-1 rounded">{room.roomCode}</span></span>
                              <span>👥 {room.activeUsers} users</span>
                              <span>💬 {room.totalMessages} messages</span>
                              <span>🕒 {getTimeSince(room.lastActivity)}</span>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end text-sm text-gray-400">
                            <div>Created: {formatTime(room.created)}</div>
                            <div>Unique Users: {room.uniqueUsers}</div>
                          </div>
                        </div>
                      </div>

                      {/* Current Users */}
                      <div className="p-4">
                        <h4 className="text-lg font-semibold text-white mb-3">
                          Current Users ({room.userList.length})
                        </h4>
                        
                        {room.userList.length === 0 ? (
                          <div className="text-gray-400 text-center py-4">
                            <div className="text-2xl mb-1">👻</div>
                            <div>No users currently in this room</div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {room.userList.map(user => (
                              <div key={user.peerId} className="bg-gray-600/50 rounded-lg p-3">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-medium text-white">{user.displayName}</div>
                                    <div className="text-xs text-gray-400">
                                      Joined: {getTimeSince(user.joinedAt)}
                                    </div>
                                  </div>
                                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
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
    <div className="bg-gray-800/80 rounded-lg p-4 md:p-6 backdrop-blur-sm border border-gray-700/50 w-full overflow-hidden">
      <h3 className="text-lg md:text-xl font-semibold mb-4 flex items-center">
        <span className="text-2xl mr-2">🛡️</span>
        Admin Controls
      </h3>
      
      <div className="space-y-4">
        {/* Broadcast Message */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-300">
            📢 Broadcast to All Rooms
          </label>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <input
              type="text"
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              placeholder="Emergency announcement..."
              className="flex-1 px-3 py-2 bg-gray-700 rounded border border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none text-sm min-w-0"
            />
            <button 
              onClick={() => {
                if (broadcastMessage.trim()) {
                  onBroadcast(broadcastMessage);
                  setBroadcastMessage('');
                }
              }}
              disabled={!broadcastMessage.trim()}
              className="px-3 sm:px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded font-medium transition-colors text-sm whitespace-nowrap"
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
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <input
              type="text"
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              placeholder="Enter room ID..."
              className="flex-1 px-3 py-2 bg-gray-700 rounded border border-gray-600 text-white placeholder-gray-400 focus:border-yellow-500 focus:outline-none text-sm min-w-0"
            />
            <button 
              onClick={() => {
                if (selectedRoom.trim()) {
                  onClearRoom(selectedRoom);
                  setSelectedRoom('');
                }
              }}
              disabled={!selectedRoom.trim()}
              className="px-3 sm:px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded font-medium transition-colors text-sm whitespace-nowrap"
            >
              🗑️ Clear
            </button>
          </div>
        </div>

        {/* DANGER: Wipe Database */}
        <div className="border border-red-500/30 rounded-lg p-3 md:p-4 bg-red-600/10">
          <label className="block text-sm font-medium mb-2 text-red-300">
            ⚠️ DANGER ZONE
          </label>
          <button 
            onClick={() => {
              if (confirm('Are you absolutely sure you want to wipe the ENTIRE database? This action cannot be undone!')) {
                if (confirm('This will delete ALL MESSAGES, rooms, sessions, and analytics data permanently! Are you REALLY sure?')) {
                  onWipeDatabase();
                }
              }
            }}
            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded border-2 border-red-400 font-bold transition-colors text-sm md:text-base"
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
  
  // Modal states
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showRoomDetails, setShowRoomDetails] = useState(false);

  // Get server URLs using ServerUtils
  const httpServerUrl = ServerUtils.getHttpServerUrl();
  const webSocketServerUrl = ServerUtils.getWebSocketServerUrl();
  
  // Use HTTP URL for admin API calls
  const serverUrl = httpServerUrl;
  
  console.log('🔧 Admin Dashboard URLs:');
  console.log('  - HTTP URL (for API calls):', httpServerUrl);
  console.log('  - WebSocket URL (for real-time):', webSocketServerUrl);

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
      const { messagesDeleted, usersNotified } = result;
      
      alert(`✅ Room "${roomId}" cleared successfully!\n\n📊 Details:\n• ${messagesDeleted} messages deleted\n• ${usersNotified} users notified\n• Local cache cleared for all users\n\nUsers in this room will see their messages disappear immediately.`);
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
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      alert(`✅ Database completely wiped! ${result.message || ''}`);
      
      // Refresh data after wipe
      setTimeout(() => {
        fetchDashboardData();
        fetchActivity();
      }, 1000); // Give server time to clear everything
    } catch (err) {
      console.error('Database wipe error:', err);
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
    if (!webSocketServerUrl) return;

    const socketConnection = io(webSocketServerUrl, {
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
  }, [webSocketServerUrl]);

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
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-4 lg:mb-0">
              <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-yellow-400">
                🎪 PeddleNet Analytics
              </h1>
              <p className="text-purple-200 mt-2 text-sm md:text-base">
                Real-time monitoring and admin controls • Environment: {dashboardData.realTimeStats.environment}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 lg:items-center">
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

        {/* Main Stats Grid - Now with clickable cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <MetricCard
            title="Active Users"
            value={dashboardData.realTimeStats.activeUsers}
            trend={dashboardData.realTimeStats.userTrend}
            icon="👥"
            color="green"
            onClick={() => setShowUserDetails(true)}
          />
          <MetricCard
            title="Active Rooms"
            value={dashboardData.realTimeStats.activeRooms}
            trend={dashboardData.realTimeStats.roomTrend}
            icon="🏠"
            color="blue"
            onClick={() => setShowRoomDetails(true)}
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

      {/* Detailed Modals */}
      <DetailedUserView
        isOpen={showUserDetails}
        onClose={() => setShowUserDetails(false)}
        serverUrl={serverUrl}
      />
      
      <DetailedRoomView
        isOpen={showRoomDetails}
        onClose={() => setShowRoomDetails(false)}
        serverUrl={serverUrl}
      />
    </div>
  );
}
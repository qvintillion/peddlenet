'use client';

import { useState, useEffect } from 'react';

interface MeshConnection {
  peerId: string;
  displayName: string;
  socketId: string;
  roomId: string;
  p2pPeers: string[];
  connectionQuality: 'excellent' | 'good' | 'poor' | 'none';
  lastSeen: number;
  isP2PActive: boolean;
}

interface MeshMetrics {
  totalP2PAttempts: number;
  successfulP2PConnections: number;
  failedP2PConnections: number;
  activeP2PConnections: number;
  averageConnectionTime: number;
  meshUpgradeRate: number;
  p2pMessageCount: number;
  fallbackCount: number;
}

interface MeshNetworkStatusProps {
  isLoading?: boolean;
}

export function MeshNetworkStatus({ isLoading = false }: MeshNetworkStatusProps) {
  const [meshData, setMeshData] = useState<{
    metrics: MeshMetrics;
    connections: MeshConnection[];
    topology: { [roomId: string]: MeshConnection[] };
  } | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<number>(0);

  useEffect(() => {
    const fetchMeshData = async () => {
      try {
        // TEMPORARY FIX: Direct signaling server URL until API route is available
        const response = await fetch('http://localhost:3001/admin/mesh-status', {
          headers: {
            'Authorization': `Basic ${btoa('th3p3ddl3r:letsmakeatrade')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setMeshData(data);
          setLastUpdate(Date.now());
        }
      } catch (error) {
        console.error('Failed to fetch mesh data:', error);
      }
    };

    // Initial fetch
    fetchMeshData();

    // Refresh every 3 seconds for real-time monitoring
    const interval = setInterval(fetchMeshData, 3000);

    return () => clearInterval(interval);
  }, []);

  if (isLoading || !meshData) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border-2 border-purple-200 p-6 mb-6">
        <div className="animate-pulse">
          <div className="h-6 bg-purple-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-purple-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const { metrics, connections, topology } = meshData;

  // Calculate real-time stats
  const totalActiveUsers = connections.length;
  const p2pActiveUsers = connections.filter(c => c.isP2PActive).length;
  const meshUpgradeRate = metrics.totalP2PAttempts > 0 
    ? Math.round((metrics.successfulP2PConnections / metrics.totalP2PAttempts) * 100)
    : 0;
  const averageLatency = connections.reduce((acc, c) => {
    const latency = c.connectionQuality === 'excellent' ? 25 : 
                   c.connectionQuality === 'good' ? 50 : 
                   c.connectionQuality === 'poor' ? 150 : 200;
    return acc + latency;
  }, 0) / Math.max(connections.length, 1);

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'poor': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getConnectionIcon = (isP2PActive: boolean) => {
    return isP2PActive ? '🌐' : '📡';
  };

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border-2 border-purple-200 p-6 mb-6 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            🌐 Mesh Network Status
            <span className="ml-2 text-sm font-normal text-gray-600">
              (Phase 1 - Hybrid Architecture)
            </span>
          </h2>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-500">
            Last Updated: {new Date(lastUpdate).toLocaleTimeString()}
          </span>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1 bg-purple-100 hover:bg-purple-200 rounded-lg text-purple-700 text-sm font-medium transition-colors"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border border-purple-100 shadow-sm">
          <div className="text-2xl font-bold text-purple-600">{p2pActiveUsers}</div>
          <div className="text-sm text-gray-600">P2P Active Users</div>
          <div className="text-xs text-gray-500">
            {totalActiveUsers > 0 ? Math.round((p2pActiveUsers / totalActiveUsers) * 100) : 0}% of total
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-blue-100 shadow-sm">
          <div className="text-2xl font-bold text-blue-600">{metrics.activeP2PConnections}</div>
          <div className="text-sm text-gray-600">Active P2P Links</div>
          <div className="text-xs text-gray-500">
            {metrics.totalP2PAttempts} total attempts
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-green-100 shadow-sm">
          <div className="text-2xl font-bold text-green-600">{meshUpgradeRate}%</div>
          <div className="text-sm text-gray-600">Upgrade Success</div>
          <div className="text-xs text-gray-500">
            {metrics.successfulP2PConnections}/{metrics.totalP2PAttempts} successful
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-orange-100 shadow-sm">
          <div className="text-2xl font-bold text-orange-600">{Math.round(averageLatency)}ms</div>
          <div className="text-sm text-gray-600">Avg Latency</div>
          <div className="text-xs text-gray-500">
            P2P: ~25ms, WS: ~150ms
          </div>
        </div>
      </div>

      {/* Performance Indicators */}
      <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Performance Indicators</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-xl font-bold text-purple-600">{metrics.p2pMessageCount}</div>
            <div className="text-sm text-gray-600">P2P Messages</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-blue-600">{metrics.fallbackCount}</div>
            <div className="text-sm text-gray-600">WebSocket Fallbacks</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-green-600">
              {metrics.p2pMessageCount + metrics.fallbackCount > 0 
                ? Math.round((metrics.p2pMessageCount / (metrics.p2pMessageCount + metrics.fallbackCount)) * 100)
                : 0}%
            </div>
            <div className="text-sm text-gray-600">P2P Efficiency</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-orange-600">{metrics.averageConnectionTime}ms</div>
            <div className="text-sm text-gray-600">Avg Connect Time</div>
          </div>
        </div>
      </div>

      {/* Expandable Details */}
      {isExpanded && (
        <>
          {/* Room Topology */}
          <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm mb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Room Mesh Topology</h3>
            {Object.keys(topology).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🏠</div>
                <div>No active rooms with mesh connections</div>
                <div className="text-sm mt-1">Mesh activates automatically for small groups (≤5 users)</div>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(topology).map(([roomId, roomConnections]) => {
                  const p2pCount = roomConnections.filter(c => c.isP2PActive).length;
                  const roomCode = roomId.substring(0, 8);
                  
                  return (
                    <div key={roomId} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-gray-800">
                          Room: {roomCode}... 
                          <span className="ml-2 text-sm text-gray-600">
                            ({roomConnections.length} users, {p2pCount} P2P active)
                          </span>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          p2pCount > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {p2pCount > 0 ? `🌐 Mesh Active` : '📡 WebSocket Only'}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {roomConnections.map((connection) => (
                          <div key={connection.socketId} className="flex items-center space-x-2 text-sm">
                            <span className="text-lg">{getConnectionIcon(connection.isP2PActive)}</span>
                            <span className="font-medium">{connection.displayName}</span>
                            <span className={`px-2 py-1 rounded text-xs ${getQualityColor(connection.connectionQuality)}`}>
                              {connection.connectionQuality}
                            </span>
                            {connection.p2pPeers.length > 0 && (
                              <span className="text-xs text-purple-600">
                                ↔ {connection.p2pPeers.length} peers
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Detailed Connection List */}
          <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Connection Details</h3>
            {connections.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">👥</div>
                <div>No active connections</div>
                <div className="text-sm mt-1">Users will appear here when they join rooms</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2">User</th>
                      <th className="text-left py-2">Connection</th>
                      <th className="text-left py-2">Quality</th>
                      <th className="text-left py-2">P2P Peers</th>
                      <th className="text-left py-2">Room</th>
                      <th className="text-left py-2">Last Seen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {connections.map((connection) => (
                      <tr key={connection.socketId} className="border-b border-gray-100">
                        <td className="py-2 font-medium">{connection.displayName}</td>
                        <td className="py-2">
                          <span className="flex items-center space-x-1">
                            <span className="text-lg">{getConnectionIcon(connection.isP2PActive)}</span>
                            <span>{connection.isP2PActive ? 'P2P Mesh' : 'WebSocket'}</span>
                          </span>
                        </td>
                        <td className="py-2">
                          <span className={`px-2 py-1 rounded text-xs ${getQualityColor(connection.connectionQuality)}`}>
                            {connection.connectionQuality}
                          </span>
                        </td>
                        <td className="py-2">
                          {connection.p2pPeers.length > 0 ? (
                            <span className="text-purple-600 font-medium">{connection.p2pPeers.length}</span>
                          ) : (
                            <span className="text-gray-400">0</span>
                          )}
                        </td>
                        <td className="py-2 font-mono text-xs">
                          {connection.roomId.substring(0, 8)}...
                        </td>
                        <td className="py-2 text-xs text-gray-500">
                          {Math.round((Date.now() - connection.lastSeen) / 1000)}s ago
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Status Indicators */}
      <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-4">
          <span>🌐 = P2P Mesh Connection</span>
          <span>📡 = WebSocket Connection</span>
          <span className="px-2 py-1 bg-green-100 text-green-700 rounded">excellent</span>
          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">good</span>
          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded">poor</span>
        </div>
        <div>
          Phase 1: Hybrid Architecture • Auto-refresh every 3s
        </div>
      </div>
    </div>
  );
}
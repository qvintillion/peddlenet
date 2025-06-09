import React, { useState, useEffect } from 'react';
import { P2PDebugUtils } from '@/utils/p2p-debug';

interface DebugPanelProps {
  peerId: string | null;
  connectedPeers: string[];
  status: {
    isConnected: boolean;
    connectedPeers: number;
    networkReach: string;
    signalStrength: string;
  };
  roomId: string;
  p2pHook?: any; // Optional enhanced hook reference
}

export function DebugPanel({ peerId, connectedPeers, status, roomId, p2pHook }: DebugPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [presenceData, setPresenceData] = useState<any[]>([]);

  // Update stats periodically if enhanced hook is available
  useEffect(() => {
    if (!p2pHook) return;

    const updateStats = () => {
      try {
        setStats({
          queuedMessages: p2pHook.getQueuedMessages?.() || 0,
          connectionQuality: p2pHook.getConnectionQuality?.() || 0,
          connectionAttempts: p2pHook.getConnectionAttempts?.() || {},
          reconnectAttempts: p2pHook.getReconnectAttempts?.() || {},
          roomPeers: p2pHook.roomPeers || []
        });
        
        setPresenceData(P2PDebugUtils.getAllPresenceData(roomId));
      } catch (e) {
        console.error('Error updating debug stats:', e);
      }
    };

    updateStats();
    const interval = setInterval(updateStats, 2000);
    return () => clearInterval(interval);
  }, [p2pHook, roomId]);

  const handleClearPresence = () => {
    const cleared = P2PDebugUtils.clearRoomPresence(roomId);
    alert(`Cleared ${cleared} presence entries`);
    setPresenceData([]);
  };

  const handleExportDebug = () => {
    if (p2pHook) {
      P2PDebugUtils.exportDebugData(p2pHook, roomId);
    }
  };

  const handleToggleDebugLogging = () => {
    if (P2PDebugUtils.isDebugEnabled()) {
      P2PDebugUtils.disableDebugLogging();
    } else {
      P2PDebugUtils.enableDebugLogging();
    }
  };

  const handleForceReconnect = () => {
    if (p2pHook?.forceReconnect) {
      p2pHook.forceReconnect();
    }
  };

  const handleValidateEnvironment = () => {
    const result = P2PDebugUtils.validateEnvironment();
    alert(`Environment check: ${result.allPassed ? 'PASS' : 'FAIL'}\nCheck console for details`);
  };

  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white rounded-lg text-xs max-w-sm z-50 shadow-lg">
      {/* Header */}
      <div 
        className="p-3 cursor-pointer border-b border-gray-600 flex justify-between items-center"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="font-bold">🐛 Debug Panel</div>
        <div className="text-xs">{expanded ? '▼' : '▶'}</div>
      </div>

      {/* Basic Info (Always Visible) */}
      <div className="p-3 space-y-1">
        <div className="flex justify-between">
          <span>Status:</span>
          <span className={status.isConnected ? 'text-green-400' : 'text-red-400'}>
            {status.isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Peers:</span>
          <span className="text-blue-400">{status.connectedPeers}</span>
        </div>
        <div className="flex justify-between">
          <span>Signal:</span>
          <span className={
            status.signalStrength === 'strong' ? 'text-green-400' :
            status.signalStrength === 'medium' ? 'text-yellow-400' :
            status.signalStrength === 'weak' ? 'text-orange-400' : 'text-red-400'
          }>
            {status.signalStrength}
          </span>
        </div>
        {stats && (
          <div className="flex justify-between">
            <span>Quality:</span>
            <span className="text-purple-400">{Math.round(stats.connectionQuality)}%</span>
          </div>
        )}
      </div>

      {/* Expanded Info */}
      {expanded && (
        <div className="border-t border-gray-600">
          {/* Basic Details */}
          <div className="p-3 space-y-1 border-b border-gray-700">
            <div><strong>Room:</strong> {roomId}</div>
            <div><strong>My ID:</strong> {peerId ? `${peerId.substring(0, 12)}...` : 'None'}</div>
            <div><strong>Network:</strong> {status.networkReach}</div>
            
            {connectedPeers.length > 0 && (
              <div>
                <strong>Connected to:</strong>
                {connectedPeers.map((id, index) => (
                  <div key={id} className="ml-2 font-mono text-xs text-gray-300">
                    {index + 1}. {id.substring(0, 12)}...
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Enhanced Stats (if available) */}
          {stats && (
            <div className="p-3 space-y-1 border-b border-gray-700">
              <div className="font-bold text-purple-400 mb-2">Enhanced Stats</div>
              
              <div className="flex justify-between">
                <span>Queued Messages:</span>
                <span className="text-yellow-400">{stats.queuedMessages}</span>
              </div>
              
              <div className="flex justify-between">
                <span>Room Peers:</span>
                <span className="text-blue-400">{stats.roomPeers.length}</span>
              </div>

              {Object.keys(stats.connectionAttempts).length > 0 && (
                <div>
                  <strong>Connection Attempts:</strong>
                  {Object.entries(stats.connectionAttempts).map(([peerId, attempts]: [string, any]) => (
                    <div key={peerId} className="ml-2 text-xs text-gray-300">
                      {peerId.substring(0, 8)}: {attempts}
                    </div>
                  ))}
                </div>
              )}

              {Object.keys(stats.reconnectAttempts).length > 0 && (
                <div>
                  <strong>Reconnect Attempts:</strong>
                  {Object.entries(stats.reconnectAttempts).map(([peerId, attempts]: [string, any]) => (
                    <div key={peerId} className="ml-2 text-xs text-gray-300">
                      {peerId.substring(0, 8)}: {attempts}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Presence Data */}
          {presenceData.length > 0 && (
            <div className="p-3 space-y-1 border-b border-gray-700">
              <div className="font-bold text-green-400 mb-2">Presence Data ({presenceData.length})</div>
              {presenceData.slice(0, 3).map((presence, index) => (
                <div key={index} className="text-xs text-gray-300">
                  {presence.peerId?.substring(0, 8)}... 
                  <span className="ml-2 text-gray-500">
                    {presence.lastSeen ? new Date(presence.lastSeen).toLocaleTimeString() : 'Unknown'}
                  </span>
                </div>
              ))}
              {presenceData.length > 3 && (
                <div className="text-xs text-gray-500">...and {presenceData.length - 3} more</div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="p-3 space-y-2">
            <div className="font-bold text-red-400 mb-2">Actions</div>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleForceReconnect}
                className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
                disabled={!p2pHook}
              >
                Reconnect
              </button>
              
              <button
                onClick={handleClearPresence}
                className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs"
              >
                Clear Presence
              </button>
              
              <button
                onClick={handleToggleDebugLogging}
                className="px-2 py-1 bg-purple-600 hover:bg-purple-700 rounded text-xs"
              >
                {P2PDebugUtils.isDebugEnabled() ? 'Disable' : 'Enable'} Logs
              </button>
              
              <button
                onClick={handleValidateEnvironment}
                className="px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs"
              >
                Validate Env
              </button>
              
              <button
                onClick={handleExportDebug}
                className="px-2 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-xs col-span-2"
                disabled={!p2pHook}
              >
                Export Debug Data
              </button>
            </div>
          </div>

          {/* Environment Info */}
          <div className="p-3 border-t border-gray-700">
            <div className="font-bold text-orange-400 mb-2">Environment</div>
            <div className="space-y-1 text-xs text-gray-300">
              <div>HTTPS: {window.location.protocol === 'https:' ? '✅' : '❌'}</div>
              <div>WebRTC: {!!(window as any).RTCPeerConnection ? '✅' : '❌'}</div>
              <div>PeerJS: {!!(window as any).Peer ? '✅' : '❌'}</div>
              <div>Debug Logs: {P2PDebugUtils.isDebugEnabled() ? '✅' : '❌'}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
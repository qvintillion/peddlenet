'use client';

import { useState } from 'react';

interface MeshNetworkDebugProps {
  className?: string;
  meshEnabled: boolean;
  setMeshEnabled: (enabled: boolean) => void;
  attemptP2PUpgrade: () => Promise<boolean>;
  hybridStats: {
    webSocketMessages: number;
    p2pMessages: number;
    duplicatesFiltered: number;
    routingDecisions: number;
  };
  connectionQuality: {
    webSocket: { latency: number; reliability: number; available: boolean };
    p2p: { latency: number; reliability: number; available: boolean };
  };
  webSocket: {
    connected: boolean;
    peers: string[];
    status: any;
  };
  p2p: {
    connected: boolean;
    peers: string[];
    status: any;
  };
  currentRoute: 'websocket' | 'p2p';
  preferredRoute: 'websocket' | 'p2p' | 'auto';
  setPreferredRoute: (route: 'websocket' | 'p2p' | 'auto') => void;
  getConnectionDiagnostics: () => any;
}

export function MeshNetworkDebug({ 
  className, 
  meshEnabled, 
  setMeshEnabled,
  attemptP2PUpgrade,
  hybridStats,
  connectionQuality,
  webSocket,
  p2p,
  currentRoute,
  preferredRoute,
  setPreferredRoute,
  getConnectionDiagnostics
}: MeshNetworkDebugProps) {
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeResult, setUpgradeResult] = useState<string | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [diagnostics, setDiagnostics] = useState<any>(null);

  const handleP2PUpgrade = async () => {
    setIsUpgrading(true);
    setUpgradeResult(null);
    
    try {
      console.log('🌐 [DEBUG] Manual P2P upgrade triggered');
      const result = await attemptP2PUpgrade();
      setUpgradeResult(result ? '✅ P2P upgrade successful' : '❌ P2P upgrade failed');
      console.log('🌐 [DEBUG] P2P upgrade result:', result);
    } catch (error: any) {
      console.error('🌐 [DEBUG] P2P upgrade error:', error);
      setUpgradeResult('💥 P2P upgrade error: ' + error.message);
    } finally {
      setIsUpgrading(false);
    }
  };

  const updateDiagnostics = () => {
    try {
      const diag = getConnectionDiagnostics();
      setDiagnostics(diag);
      console.log('🔍 [DEBUG] Connection diagnostics:', diag);
    } catch (error: any) {
      console.error('🔍 [DEBUG] Failed to get diagnostics:', error);
      setDiagnostics({ error: error.message });
    }
  };

  const getConnectionIcon = (connected: boolean) => {
    return connected ? '🌐' : '📡';
  };

  const getConnectionStatus = (connected: boolean) => {
    return connected ? 'Connected' : 'Disconnected';
  };

  const getStatusColor = (connected: boolean) => {
    return connected ? 'text-green-400' : 'text-red-400';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Mesh Network Status */}
      <div className="p-4 bg-gray-800 rounded-lg border border-gray-600">
        <h4 className="font-semibold text-sm mb-3 text-white flex items-center gap-2">
          🌐 Mesh Network Debug
          <span className={`px-2 py-1 text-xs rounded-full ${
            meshEnabled ? 'bg-green-900 text-green-200' : 'bg-gray-700 text-gray-300'
          }`}>
            {meshEnabled ? 'Enabled' : 'Disabled'}
          </span>
        </h4>

        {/* Connection Status Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-700 p-3 rounded border border-gray-600">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{getConnectionIcon(webSocket.connected)}</span>
              <span className="text-sm font-medium text-white">WebSocket</span>
            </div>
            <div className={`text-xs ${getStatusColor(webSocket.connected)}`}>
              {getConnectionStatus(webSocket.connected)}
            </div>
            <div className="text-xs text-gray-300">
              Peers: {webSocket.peers.length}
            </div>
            <div className="text-xs text-gray-300">
              Latency: {connectionQuality.webSocket.latency}ms
            </div>
          </div>

          <div className="bg-gray-700 p-3 rounded border border-gray-600">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{getConnectionIcon(p2p.connected)}</span>
              <span className="text-sm font-medium text-white">P2P Mesh</span>
            </div>
            <div className={`text-xs ${getStatusColor(p2p.connected)}`}>
              {getConnectionStatus(p2p.connected)}
            </div>
            <div className="text-xs text-gray-300">
              Peers: {p2p.peers.length}
            </div>
            <div className="text-xs text-gray-300">
              Latency: {connectionQuality.p2p.latency}ms
            </div>
          </div>
        </div>

        {/* Current Route */}
        <div className="mb-4 p-3 bg-gray-900 rounded border border-gray-700">
          <div className="text-xs text-gray-300 mb-1">Current Route:</div>
          <div className="text-sm font-mono text-white">
            {currentRoute === 'websocket' ? '📡 WebSocket Server' : '🌐 P2P Mesh'}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Preferred: {preferredRoute}
          </div>
        </div>

        {/* Message Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-700 p-2 rounded">
            <div className="text-xs text-gray-300">WebSocket Messages</div>
            <div className="text-lg font-bold text-blue-400">{hybridStats.webSocketMessages}</div>
          </div>
          <div className="bg-gray-700 p-2 rounded">
            <div className="text-xs text-gray-300">P2P Messages</div>
            <div className="text-lg font-bold text-green-400">{hybridStats.p2pMessages}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-700 p-2 rounded">
            <div className="text-xs text-gray-300">Duplicates Filtered</div>
            <div className="text-lg font-bold text-yellow-400">{hybridStats.duplicatesFiltered}</div>
          </div>
          <div className="bg-gray-700 p-2 rounded">
            <div className="text-xs text-gray-300">Routing Decisions</div>
            <div className="text-lg font-bold text-purple-400">{hybridStats.routingDecisions}</div>
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-3">
          {/* Manual P2P Upgrade */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleP2PUpgrade}
              disabled={isUpgrading}
              className="px-3 py-2 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
            >
              {isUpgrading ? (
                <>
                  <span className="animate-spin">🔄</span>
                  Upgrading...
                </>
              ) : (
                <>
                  🚀 Manual P2P Upgrade
                </>
              )}
            </button>
            
            <button
              onClick={() => setMeshEnabled(!meshEnabled)}
              className={`px-3 py-2 text-white text-xs rounded transition ${
                meshEnabled ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {meshEnabled ? '❌ Disable Mesh' : '✅ Enable Mesh'}
            </button>
          </div>

          {upgradeResult && (
            <div className="p-2 bg-gray-900 rounded border border-gray-700 text-xs text-white">
              {upgradeResult}
            </div>
          )}

          {/* Route Preference */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-300">Route:</span>
            <select
              value={preferredRoute}
              onChange={(e) => setPreferredRoute(e.target.value as any)}
              className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-xs text-white"
            >
              <option value="auto">Auto</option>
              <option value="websocket">WebSocket Only</option>
              <option value="p2p">P2P Only</option>
            </select>
          </div>

          {/* Diagnostics */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                updateDiagnostics();
                setShowDiagnostics(!showDiagnostics);
              }}
              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition"
            >
              🔍 {showDiagnostics ? 'Hide' : 'Show'} Diagnostics
            </button>
          </div>

          {showDiagnostics && diagnostics && (
            <div className="p-3 bg-gray-900 rounded border border-gray-700 max-h-64 overflow-y-auto">
              <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">
                {JSON.stringify(diagnostics, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
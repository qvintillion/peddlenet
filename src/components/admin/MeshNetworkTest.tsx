'use client';

import { useState, useEffect } from 'react';
import { useHybridChat } from '../hooks/use-hybrid-chat';

interface MeshTestProps {
  roomId?: string;
  displayName?: string;
  onTestResult?: (result: any) => void;
}

export function MeshNetworkTest({ 
  roomId = 'mesh-test-room', 
  displayName = 'Mesh-Tester',
  onTestResult 
}: MeshTestProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  
  const {
    status,
    meshEnabled,
    connectionQuality,
    currentRoute,
    p2p,
    webSocket,
    sendMessage,
    hybridStats,
    getConnectionDiagnostics
  } = useHybridChat(roomId, displayName);

  const [lastTestTime, setLastTestTime] = useState(0);

  // Auto-run diagnostics every 5 seconds when visible
  useEffect(() => {
    if (!isVisible) return;
    
    const interval = setInterval(() => {
      const diagnostics = getConnectionDiagnostics();
      const timestamp = Date.now();
      
      const result = {
        timestamp,
        status: {
          isConnected: status.isConnected,
          connectedPeers: status.connectedPeers,
          networkReach: status.networkReach,
          signalStrength: status.signalStrength
        },
        mesh: {
          enabled: meshEnabled,
          currentRoute,
          p2pConnected: p2p.connected,
          p2pPeers: p2p.peers.length,
          webSocketConnected: webSocket.connected
        },
        quality: connectionQuality,
        stats: hybridStats,
        diagnostics: diagnostics ? {
          detector: diagnostics.detector,
          circuitBreaker: diagnostics.circuitBreaker
        } : null
      };
      
      setTestResults(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 results
      onTestResult?.(result);
      setLastTestTime(timestamp);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isVisible, status, meshEnabled, currentRoute, p2p, webSocket, connectionQuality, hybridStats, getConnectionDiagnostics, onTestResult]);

  const runManualTest = () => {
    // Send a test message through the hybrid system
    const testContent = `🧪 Mesh test message at ${new Date().toLocaleTimeString()}`;
    
    try {
      const messageId = sendMessage({
        content: testContent,
        sender: displayName,
        type: 'test',
        roomId
      });
      
      console.log('🧪 Test message sent:', { messageId, route: currentRoute });
      
      // Add test result
      const result = {
        timestamp: Date.now(),
        type: 'manual-test',
        messageId,
        route: currentRoute,
        success: true,
        content: testContent
      };
      
      setTestResults(prev => [result, ...prev.slice(0, 9)]);
    } catch (error) {
      console.error('🧪 Test message failed:', error);
      
      const result = {
        timestamp: Date.now(),
        type: 'manual-test',
        route: currentRoute,
        success: false,
        error: error.message
      };
      
      setTestResults(prev => [result, ...prev.slice(0, 9)]);
    }
  };

  const getStatusColor = (value: boolean | string) => {
    if (typeof value === 'boolean') {
      return value ? 'text-green-400' : 'text-red-400';
    }
    
    switch (value) {
      case 'excellent': return 'text-green-400';
      case 'good': return 'text-blue-400';
      case 'poor': return 'text-yellow-400';
      case 'p2p': return 'text-purple-400';
      case 'websocket': return 'text-blue-400';
      case 'server': return 'text-blue-400';
      case 'local': return 'text-green-400';
      case 'strong': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'weak': return 'text-orange-400';
      default: return 'text-gray-400';
    }
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-full shadow-lg z-50 flex items-center space-x-2 text-sm"
      >
        <span>🌐</span>
        <span>Mesh Test</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 border border-gray-700 rounded-lg p-4 shadow-xl z-50 w-96 max-h-96 overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-bold text-sm flex items-center">
          <span className="mr-2">🌐</span>
          Mesh Network Test
        </h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white text-sm"
        >
          ✕
        </button>
      </div>

      {/* Current Status */}
      <div className="bg-gray-800 rounded p-3 mb-3 text-xs">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-gray-400">Connected:</span>
            <span className={`ml-1 font-medium ${getStatusColor(status.isConnected)}`}>
              {status.isConnected ? 'Yes' : 'No'}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Peers:</span>
            <span className="ml-1 text-white font-medium">{status.connectedPeers}</span>
          </div>
          <div>
            <span className="text-gray-400">Route:</span>
            <span className={`ml-1 font-medium ${getStatusColor(currentRoute)}`}>
              {currentRoute}
            </span>
          </div>
          <div>
            <span className="text-gray-400">P2P:</span>
            <span className={`ml-1 font-medium ${getStatusColor(meshEnabled)}`}>
              {meshEnabled ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Reach:</span>
            <span className={`ml-1 font-medium ${getStatusColor(status.networkReach)}`}>
              {status.networkReach}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Signal:</span>
            <span className={`ml-1 font-medium ${getStatusColor(status.signalStrength)}`}>
              {status.signalStrength}
            </span>
          </div>
        </div>
      </div>

      {/* Connection Quality */}
      <div className="bg-gray-800 rounded p-3 mb-3 text-xs">
        <div className="text-gray-300 font-medium mb-2">Connection Quality</div>
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-400">WebSocket:</span>
            <span className="text-white">{connectionQuality.webSocket.latency}ms</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">P2P:</span>
            <span className="text-white">{connectionQuality.p2p.latency}ms</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-gray-800 rounded p-3 mb-3 text-xs">
        <div className="text-gray-300 font-medium mb-2">Hybrid Stats</div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-gray-400">WS Msgs:</span>
            <span className="ml-1 text-white">{hybridStats.webSocketMessages}</span>
          </div>
          <div>
            <span className="text-gray-400">P2P Msgs:</span>
            <span className="ml-1 text-white">{hybridStats.p2pMessages}</span>
          </div>
          <div>
            <span className="text-gray-400">Duplicates:</span>
            <span className="ml-1 text-white">{hybridStats.duplicatesFiltered}</span>
          </div>
          <div>
            <span className="text-gray-400">Decisions:</span>
            <span className="ml-1 text-white">{hybridStats.routingDecisions}</span>
          </div>
        </div>
      </div>

      {/* Test Button */}
      <button
        onClick={runManualTest}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded text-sm font-medium mb-3"
      >
        🧪 Send Test Message
      </button>

      {/* Recent Results */}
      {testResults.length > 0 && (
        <div className="bg-gray-800 rounded p-3 text-xs">
          <div className="text-gray-300 font-medium mb-2">Recent Tests</div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {testResults.slice(0, 5).map((result, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-gray-400">
                  {new Date(result.timestamp).toLocaleTimeString()}
                </span>
                <span className={getStatusColor(result.success !== false)}>
                  {result.type === 'manual-test' ? 
                    (result.success ? `✅ ${result.route}` : '❌ Failed') :
                    `🔄 ${result.mesh.currentRoute}`
                  }
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500 mt-2 text-center">
        {lastTestTime > 0 && (
          <>Updated {Math.round((Date.now() - lastTestTime) / 1000)}s ago</>
        )}
      </div>
    </div>
  );
}

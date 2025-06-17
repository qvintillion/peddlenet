'use client';

import React, { useState, useEffect } from 'react';


export function MobileWebSocketDebug({ className = '' }: MobileWebSocketDebugProps) {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof window !== 'undefined') {
        // Get WebSocket debug info from multiple sources
        const webSocketDebug = (window as any).getConnectionDiagnostics?.() || {};
        const hybridDebug = (window as any).HybridChatDebug?.getStatus?.() || {};
        const nativeWebRTC = (window as any).NativeWebRTCDebug?.getStats?.() || {};
        
        setDebugInfo({
          signaling: {
            connected: webSocketDebug.connection?.isConnected || false,
            socketId: webSocketDebug.socket?.id || 'None',
            transport: webSocketDebug.socket?.transport || 'unknown',
            isRetrying: webSocketDebug.connection?.isRetrying || false,
            retryCount: webSocketDebug.connection?.retryCount || 0,
            connectionQuality: webSocketDebug.connection?.connectionQuality || 'unknown'
          },
          reconnection: {
            attemptCount: webSocketDebug.connection?.retryCount || 0,
            maxAttempts: 5,
            isReconnecting: webSocketDebug.connection?.isRetrying || false,
            lastAttempt: webSocketDebug.connection?.lastSuccessfulConnection || null
          },
          stats: {
            totalAttempts: webSocketDebug.connection?.retryCount || 0,
            successfulConnections: webSocketDebug.connection?.isConnected ? 1 : 0,
            failedConnections: webSocketDebug.connection?.retryCount || 0,
            activeConnections: hybridDebug.connections?.length || 0
          },
          webSocketUrl: getWebSocketServerUrl(),
          environment: {
            hostname: window.location.hostname,
            port: window.location.port,
            protocol: window.location.protocol,
            detectedIP: process.env.NEXT_PUBLIC_DETECTED_IP,
            isLocalDev: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
            isPrivateIP: /^192\.168\.|^10\.|^172\.(1[6-9]|2[0-9]|3[01])\./.test(window.location.hostname)
          },
          timestamp: Date.now()
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Helper function to get WebSocket URL (matching the hook logic)
  const getWebSocketServerUrl = () => {
    if (typeof window === 'undefined') return '';
    
    const hostname = window.location.hostname;
    const port = window.location.port;
    
    const isLocalDev = hostname === 'localhost' || hostname === '127.0.0.1';
    const isPrivateIP = hostname.match(/^192\.168\.|^10\.|^172\.(1[6-9]|2[0-9]|3[01])\./); 
    
    if (isLocalDev) {
      return `ws://localhost:3001`;
    }
    
    if (isPrivateIP || port === '3000') {
      return `ws://${hostname}:3001`;
    }
    
    if (hostname.includes('firebase') || hostname.includes('web.app')) {
      return 'wss://websocket-server-956191635250.us-central1.run.app';
    }
    
    if (hostname.includes('vercel.app') || hostname === 'peddlenet.app') {
      return 'wss://websocket-server-956191635250.us-central1.run.app';
    }
    
    return 'wss://websocket-server-956191635250.us-central1.run.app';
  };

  const handleResetReconnection = () => {
    if (typeof window !== 'undefined') {
      // Reset enhanced connection resilience
      if ((window as any).EnhancedConnectionResilience?.reset) {
        (window as any).EnhancedConnectionResilience.reset();
        console.log('🔄 Enhanced connection resilience reset');
      }
      
      // Reset WebRTC if available
      if ((window as any).NativeWebRTCDebug?.resetReconnectionState) {
        (window as any).NativeWebRTCDebug.resetReconnectionState();
        console.log('🔄 WebRTC reconnection state reset');
      }
    }
  };

  const handleForceReconnect = () => {
    if (typeof window !== 'undefined') {
      // Try to force reconnect through available methods
      if ((window as any).getConnectionDiagnostics) {
        const diagnostics = (window as any).getConnectionDiagnostics();
        console.log('🔄 Forcing WebSocket reconnection...');
        // You could trigger a page reload or call a specific reconnect method
        window.location.reload();
      } else if ((window as any).NativeWebRTCDebug?.forceReconnect) {
        (window as any).NativeWebRTCDebug.forceReconnect();
      } else {
        console.log('🔄 No reconnection method available, reloading page...');
        window.location.reload();
      }
    }
  };

  return (
    <div className={`bg-gray-800 rounded-lg border border-gray-600 ${className}`}>
      <div className="p-3 border-b border-gray-600">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full text-left"
        >
          <h4 className="font-semibold text-sm text-white">📱 Mobile WebSocket Debug</h4>
          <span className="text-gray-400">{isExpanded ? '▼' : '▶'}</span>
        </button>
      </div>
      
      {isExpanded && (
        <div className="p-3 space-y-3">
          {/* Connection Status */}
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-300">Connection Status</h5>
            <div className="text-xs space-y-1 text-gray-400">
              <div className="flex items-center space-x-2">
                <span className={`w-2 h-2 rounded-full ${
                  debugInfo.signaling?.connected ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <span>WebSocket: {debugInfo.signaling?.connected ? 'Connected' : 'Disconnected'}</span>
              </div>
              <div>Socket ID: {debugInfo.signaling?.socketId || 'None'}</div>
              <div>Transport: {debugInfo.signaling?.transport || 'Unknown'}</div>
              <div>Quality: {debugInfo.signaling?.connectionQuality || 'Unknown'}</div>
              <div>Network: {navigator.onLine ? 'Online' : 'Offline'}</div>
              <div>Connection Type: {
                (navigator as any).connection?.effectiveType || 'Unknown'
              }</div>
              {debugInfo.signaling?.isRetrying && (
                <div className="text-yellow-400 font-medium">🔄 Retrying connection...</div>
              )}
            </div>
          </div>

          {/* Reconnection State */}
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-300">Reconnection State</h5>
            <div className="text-xs space-y-1 text-gray-400">
              <div>Attempts: {debugInfo.reconnection?.attemptCount || 0}/{debugInfo.reconnection?.maxAttempts || 5}</div>
              <div>Is Reconnecting: {debugInfo.reconnection?.isReconnecting ? 'Yes' : 'No'}</div>
              <div>Last Success: {
                debugInfo.reconnection?.lastAttempt 
                  ? new Date(debugInfo.reconnection.lastAttempt).toLocaleTimeString()
                  : 'Never'
              }</div>
              {debugInfo.reconnection?.attemptCount >= debugInfo.reconnection?.maxAttempts && (
                <div className="text-red-400 font-medium">⚠️ Max attempts reached! Try force reconnect.</div>
              )}
              {debugInfo.signaling?.isRetrying && (
                <div className="text-yellow-400">🔄 Currently retrying... ({debugInfo.signaling?.retryCount || 0}/5)</div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-300">Connection Stats</h5>
            <div className="text-xs space-y-1 text-gray-400">
              <div>Total Attempts: {debugInfo.stats?.totalAttempts || 0}</div>
              <div>Successful: {debugInfo.stats?.successfulConnections || 0}</div>
              <div>Failed: {debugInfo.stats?.failedConnections || 0}</div>
              <div>Active: {debugInfo.stats?.activeConnections || 0}</div>
            </div>
          </div>

          {/* Debug Actions */}
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-300">Debug Actions</h5>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleResetReconnection}
                className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition"
              >
                Reset Circuit Breaker
              </button>
              <button
                onClick={handleForceReconnect}
                className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition"
              >
                Force Reconnect
              </button>
              <button
                onClick={() => {
                  console.log('🔍 Connection diagnostics:', debugInfo);
                  if ((window as any).getConnectionDiagnostics) {
                    console.log('🔍 Full diagnostics:', (window as any).getConnectionDiagnostics());
                  }
                }}
                className="px-2 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition"
              >
                Log Debug Info
              </button>
            </div>
          </div>

          {/* WebSocket URL Info */}
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-300">WebSocket Info</h5>
            <div className="text-xs space-y-1 text-gray-400">
              <div className="font-mono text-xs break-all">
                URL: {debugInfo.webSocketUrl || 'Not detected'}
              </div>
              <div className={`inline-flex items-center space-x-1 ${
                debugInfo.environment?.isLocalDev ? 'text-blue-400' : 
                debugInfo.environment?.isPrivateIP ? 'text-yellow-400' : 'text-green-400'
              }`}>
                <span className="w-2 h-2 rounded-full bg-current" />
                <span>
                  {debugInfo.environment?.isLocalDev ? 'Local Development' :
                   debugInfo.environment?.isPrivateIP ? 'Mobile Development' : 'Production'}
                </span>
              </div>
            </div>
          </div>

          {/* Environment Details */}
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-300">Environment</h5>
            <div className="text-xs space-y-1 text-gray-400">
              <div>Host: {debugInfo.environment?.hostname || window.location.hostname}</div>
              <div>Port: {debugInfo.environment?.port || window.location.port || '80/443'}</div>
              <div>Protocol: {debugInfo.environment?.protocol || window.location.protocol}</div>
              <div>Detected IP: {debugInfo.environment?.detectedIP || 'None'}</div>
              <div>Device: {navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MobileWebSocketDebug;
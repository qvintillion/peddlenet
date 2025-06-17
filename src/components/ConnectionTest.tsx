'use client';

import { useState, useEffect } from 'react';
import { MessagePersistence } from '../utils/message-persistence';
import { ServerUtils } from '../utils/server-utils';


export function ConnectionTest({ className }: ConnectionTestProps) {
  const [testResults, setTestResults] = useState<{
    frontend: 'testing' | 'success' | 'error';
    server: 'testing' | 'success' | 'error';
    websocket: 'testing' | 'success' | 'error';
    details: string[];
  }>({ frontend: 'testing', server: 'testing', websocket: 'testing', details: [] });

  const [storageStats, setStorageStats] = useState<any>(null);
  const [showStorage, setShowStorage] = useState(false);

  useEffect(() => {
    runConnectionTests();
    updateStorageStats();
  }, []);

  const updateStorageStats = () => {
    const stats = MessagePersistence.getStorageStats();
    setStorageStats(stats);
  };

  const runConnectionTests = async () => {
    const details: string[] = [];
    
    // Reset all tests to testing state
    setTestResults({ frontend: 'testing', server: 'testing', websocket: 'testing', details: [] });
    
    // Test 1: Frontend accessibility
    try {
      details.push(`Current URL: ${window.location.href}`);
      details.push(`Hostname: ${window.location.hostname}`);
      details.push(`Protocol: ${window.location.protocol}`);
      details.push(`Signaling server env: ${process.env.NEXT_PUBLIC_SIGNALING_SERVER || 'not set'}`);
      setTestResults(prev => ({ ...prev, frontend: 'success', details: [...details] }));
    } catch (error) {
      setTestResults(prev => ({ ...prev, frontend: 'error', details: [...details, `Frontend error: ${error}`] }));
      return; // Don't continue if frontend fails
    }

    // Test 2: Server accessibility using ServerUtils
    try {
      const envInfo = ServerUtils.getEnvironmentInfo();
      details.push(`Environment: ${envInfo.environment}`);
      details.push(`HTTP URL: ${envInfo.httpUrl}`);
      details.push(`WebSocket URL: ${envInfo.webSocketUrl}`);
      
      const healthResult = await ServerUtils.testHttpHealth();
      
      if (healthResult.success) {
        details.push(`Server health: ${JSON.stringify(healthResult.data)}`);
        setTestResults(prev => ({ ...prev, server: 'success', details: [...details] }));
      } else {
        throw new Error(healthResult.error || 'Health check failed');
      }
    } catch (error) {
      setTestResults(prev => ({ ...prev, server: 'error', details: [...details, `Server error: ${error}`] }));
    }

    // Test 3: WebSocket connection
    try {
      const { io } = await import('socket.io-client');
      const serverUrl = ServerUtils.getWebSocketServerUrl();
      
      details.push(`Trying WebSocket: ${serverUrl}`);
      
      const socket = io(serverUrl, {
        timeout: 10000,
        transports: ['polling', 'websocket'], // Try polling first
        forceNew: true,
        autoConnect: true
      });
      
      // Promise-based connection test
      const connectionResult = await new Promise<{ success: boolean; error: string }>((resolve) => {
        const timeout = setTimeout(() => {
          socket.disconnect();
          resolve({ success: false, error: 'Connection timeout (10s)' });
        }, 10000);
        
        socket.on('connect', () => {
          clearTimeout(timeout);
          details.push('✅ WebSocket connected successfully');
          details.push(`Transport: ${socket.io.engine.transport.name}`);
          socket.disconnect();
          resolve({ success: true });
        });
        
        socket.on('connect_error', (error) => {
          clearTimeout(timeout);
          socket.disconnect();
          resolve({ success: false, error: error.message });
        });
      });
      
      if (connectionResult.success) {
        setTestResults(prev => ({ ...prev, websocket: 'success', details: [...details] }));
      } else {
        details.push(`WebSocket error: ${connectionResult.error}`);
        setTestResults(prev => ({ ...prev, websocket: 'error', details: [...details] }));
      }
      
    } catch (error) {
      details.push(`WebSocket setup error: ${error}`);
      setTestResults(prev => ({ ...prev, websocket: 'error', details: [...details] }));
    }
  };

  const clearBrowserCache = () => {
    try {
      // Clear message persistence
      MessagePersistence.clearAllMessages();
      
      // Clear display name and other app-specific localStorage items
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('peddlenet') || key.startsWith('festival-chat') || key === 'displayName')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      updateStorageStats();
      alert('✅ Browser cache cleared successfully!\n\nCleared:\n- Message history\n- Display name\n- Session data\n- Local storage\n- Session storage\n\n🔄 Refresh the page to see changes.');
    } catch (error) {
      alert('❌ Failed to clear cache: ' + error);
    }
  };

  const getStatusIcon = (status: 'testing' | 'success' | 'error') => {
    switch (status) {
      case 'testing': return '🔄';
      case 'success': return '✅';
      case 'error': return '❌';
    }
  };

  const getEnvironmentBadge = () => {
    try {
      const envInfo = ServerUtils.getEnvironmentInfo();
      const bgColor = envInfo.environment === 'production' ? 'bg-green-900 text-green-200' : 'bg-blue-900 text-blue-200';
      return (
        <span className={`inline-block px-2 py-1 text-xs rounded-full ${bgColor} font-medium`}>
          {envInfo.environment}
        </span>
      );
    } catch (error) {
      return (
        <span className="inline-block px-2 py-1 text-xs rounded-full bg-gray-700 text-gray-300 font-medium">
          unknown
        </span>
      );
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Environment Info */}
      <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-600">
        <span className="text-sm font-medium text-gray-200">Environment:</span>
        {getEnvironmentBadge()}
      </div>

      {/* Connection Tests */}
      <div className="p-4 bg-gray-800 rounded-lg border border-gray-600">
        <h4 className="font-semibold text-sm mb-3 text-white">🔧 Connection Test</h4>
        
        <div className="space-y-2 text-xs">
          <div className="flex items-center space-x-2">
            <span>{getStatusIcon(testResults.frontend)}</span>
            <span className="text-gray-300">Frontend Access</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <span>{getStatusIcon(testResults.server)}</span>
            <span className="text-gray-300">Server Health (HTTP)</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <span>{getStatusIcon(testResults.websocket)}</span>
            <span className="text-gray-300">WebSocket Connection</span>
          </div>
        </div>
        
        {testResults.details.length > 0 && (
          <details className="mt-3">
            <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-300">Show Technical Details</summary>
            <div className="mt-2 p-3 bg-gray-900 rounded text-xs font-mono max-h-64 overflow-y-auto border border-gray-700">
              {testResults.details.map((detail, i) => (
                <div key={i} className="text-gray-300 break-all">{detail}</div>
              ))}
            </div>
          </details>
        )}
        
        <button
          onClick={runConnectionTests}
          className="mt-3 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition"
        >
          🔄 Test Again
        </button>
      </div>

      {/* Protocol Fix Notice */}
      {testResults.server === 'error' && (
        <div className="p-4 bg-amber-900/50 border border-amber-500/30 rounded-lg">
          <h4 className="font-semibold text-sm text-amber-200 mb-2">🔧 Common Fix</h4>
          <p className="text-xs text-amber-300 mb-2">
            If you see "mixed content" or "protocol" errors, this is usually because:
          </p>
          <ul className="text-xs text-amber-300 space-y-1 ml-4">
            <li>• HTTPS site trying to connect to HTTP server</li>
            <li>• WSS URL being used for HTTP requests</li>
            <li>• CORS policy blocking requests</li>
          </ul>
          <p className="text-xs text-amber-300 mt-2">
            ✅ <strong>ServerUtils</strong> should fix these automatically by using the correct protocols.
          </p>
        </div>
      )}

      {/* Cache Management */}
      <div className="p-4 bg-gray-800 rounded-lg border border-gray-600">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-sm text-white">🗂️ Cache Management</h4>
          <button
            onClick={() => setShowStorage(!showStorage)}
            className="text-xs text-blue-400 hover:text-blue-300 transition"
          >
            {showStorage ? 'Hide' : 'Show'} Details
          </button>
        </div>
        
        <div className="flex space-x-2 mb-3">
          <button
            onClick={clearBrowserCache}
            className="px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition"
          >
            🗑️ Clear Browser Cache
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition"
          >
            🔄 Reload Page
          </button>
        </div>

        {showStorage && storageStats && (
          <div className="mt-3 space-y-2 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-700 p-2 rounded border border-gray-600">
                <div className="font-medium text-gray-200">Stored Messages</div>
                <div className="text-gray-300">Rooms: {storageStats.totalRooms}</div>
                <div className="text-gray-300">Messages: {storageStats.totalMessages}</div>
                <div className="text-gray-300">Size: {Math.round(storageStats.storageSize / 1024)}KB</div>
              </div>
              
              <div className="bg-gray-700 p-2 rounded border border-gray-600">
                <div className="font-medium text-gray-200">Recent Activity</div>
                <div className="text-gray-300">
                  Newest: {storageStats.newestRoom ? storageStats.newestRoom.substring(0, 8) + '...' : 'None'}
                </div>
                <div className="text-gray-300">
                  Oldest: {storageStats.oldestRoom ? storageStats.oldestRoom.substring(0, 8) + '...' : 'None'}
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-400 bg-gray-900/50 p-2 rounded border border-gray-700">
              <strong className="text-gray-300">Cache Test Instructions:</strong><br/>
              1. Join a chat room and send some messages<br/>
              2. Click "Clear Browser Cache" button<br/>
              3. Refresh the page or re-scan QR code<br/>
              4. Messages should be gone from browser but may persist if server is running
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

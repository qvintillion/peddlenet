'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DiagnosticPage() {
  const router = useRouter();
  const [diagnostics, setDiagnostics] = useState<any>({});
  const [testResults, setTestResults] = useState<any>({});

  useEffect(() => {
    // Gather diagnostic information
    const gatherDiagnostics = async () => {
      const diag = {
        // Basic environment
        userAgent: navigator.userAgent,
        protocol: window.location.protocol,
        host: window.location.host,
        url: window.location.href,
        
        // WebRTC support
        webrtcSupported: !!(window.RTCPeerConnection || window.webkitRTCPeerConnection),
        rtcPeerConnection: !!window.RTCPeerConnection,
        webkitRTCPeerConnection: !!window.webkitRTCPeerConnection,
        
        // Network information
        onLine: navigator.onLine,
        connection: (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection,
        
        // Permissions
        permissions: {},
        
        // Local storage
        localStorageWorks: false,
        
        // Screen info
        screen: {
          width: screen.width,
          height: screen.height,
          pixelRatio: window.devicePixelRatio
        }
      };

      // Test localStorage
      try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        diag.localStorageWorks = true;
      } catch (e) {
        console.error('localStorage test failed:', e);
      }

      // Check permissions if possible
      try {
        if (navigator.permissions) {
          const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName });
          diag.permissions.camera = cameraPermission.state;
        }
      } catch (e) {
        console.log('Could not check camera permissions:', e);
      }

      setDiagnostics(diag);
    };

    gatherDiagnostics();
  }, []);

  const testNetworkConnectivity = async () => {
    const results: any = {};
    
    // Test basic HTTPS connectivity
    try {
      const response = await fetch('https://httpbin.org/get', { 
        method: 'GET',
        mode: 'cors'
      });
      results.httpsTest = {
        success: response.ok,
        status: response.status,
        statusText: response.statusText
      };
    } catch (error: any) {
      results.httpsTest = {
        success: false,
        error: error.message
      };
    }

    // Test WebSocket connectivity (similar to PeerJS)
    try {
      const ws = new WebSocket('wss://echo.websocket.org');
      const wsPromise = new Promise<any>((resolve) => {
        const timeout = setTimeout(() => {
          ws.close();
          resolve({ success: false, error: 'timeout' });
        }, 10000);

        ws.onopen = () => {
          clearTimeout(timeout);
          ws.close();
          resolve({ success: true });
        };

        ws.onerror = (error) => {
          clearTimeout(timeout);
          resolve({ success: false, error: 'connection_failed' });
        };
      });
      
      results.websocketTest = await wsPromise;
    } catch (error: any) {
      results.websocketTest = {
        success: false,
        error: error.message
      };
    }

    // Test PeerJS server directly
    try {
      const peerResponse = await fetch('https://0.peerjs.com/peerjs/id', {
        method: 'GET',
        mode: 'cors'
      });
      results.peerJSTest = {
        success: peerResponse.ok,
        status: peerResponse.status,
        id: peerResponse.ok ? await peerResponse.text() : null
      };
    } catch (error: any) {
      results.peerJSTest = {
        success: false,
        error: error.message
      };
    }

    setTestResults(results);
  };

  const clearAllStorage = () => {
    localStorage.clear();
    sessionStorage.clear();
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }
    alert('All storage cleared! Refresh the page.');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">🔍 Network Diagnostics</h1>
          <button
            onClick={() => router.push('/')}
            className="text-purple-400 hover:text-purple-300"
          >
            ← Back to Home
          </button>
        </div>

        {/* Environment Info */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🌍 Environment Information</h2>
          <div className="space-y-2 text-sm font-mono">
            <div><strong>Protocol:</strong> {diagnostics.protocol} {diagnostics.protocol === 'https:' ? '✅' : '❌'}</div>
            <div><strong>Host:</strong> {diagnostics.host}</div>
            <div><strong>URL:</strong> {diagnostics.url}</div>
            <div><strong>Online:</strong> {diagnostics.onLine ? '✅ Yes' : '❌ No'}</div>
            <div><strong>WebRTC Support:</strong> {diagnostics.webrtcSupported ? '✅ Yes' : '❌ No'}</div>
            <div><strong>localStorage:</strong> {diagnostics.localStorageWorks ? '✅ Working' : '❌ Failed'}</div>
            {diagnostics.permissions?.camera && (
              <div><strong>Camera Permission:</strong> {diagnostics.permissions.camera}</div>
            )}
            {diagnostics.connection && (
              <div><strong>Connection Type:</strong> {diagnostics.connection.effectiveType || 'unknown'}</div>
            )}
          </div>
        </div>

        {/* Network Tests */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">🔗 Network Connectivity Tests</h2>
            <div className="space-x-2">
              <button
                onClick={testNetworkConnectivity}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
              >
                Run Tests
              </button>
              <button
                onClick={() => router.push('/network-analysis')}
                className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded"
              >
                🔬 Deep Analysis
              </button>
            </div>
          </div>
          
          {Object.keys(testResults).length > 0 && (
            <div className="space-y-3 text-sm">
              <div className="p-3 bg-gray-700 rounded">
                <strong>HTTPS Test:</strong> {' '}
                {testResults.httpsTest?.success ? (
                  <span className="text-green-400">✅ Success</span>
                ) : (
                  <span className="text-red-400">❌ Failed: {testResults.httpsTest?.error}</span>
                )}
              </div>
              
              <div className="p-3 bg-gray-700 rounded">
                <strong>WebSocket Test:</strong> {' '}
                {testResults.websocketTest?.success ? (
                  <span className="text-green-400">✅ Success</span>
                ) : (
                  <span className="text-red-400">❌ Failed: {testResults.websocketTest?.error}</span>
                )}
              </div>
              
              <div className="p-3 bg-gray-700 rounded">
                <strong>PeerJS Server Test:</strong> {' '}
                {testResults.peerJSTest?.success ? (
                  <span className="text-green-400">✅ Success (ID: {testResults.peerJSTest.id})</span>
                ) : (
                  <span className="text-red-400">❌ Failed: {testResults.peerJSTest?.error}</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Troubleshooting */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🔧 Troubleshooting</h2>
          <div className="space-y-3 text-sm">
            <div className="p-3 bg-yellow-900/30 border border-yellow-600 rounded">
              <strong>If HTTPS Test Fails:</strong> Your network may be blocking outbound HTTPS requests. Try a different network.
            </div>
            <div className="p-3 bg-yellow-900/30 border border-yellow-600 rounded">
              <strong>If WebSocket Test Fails:</strong> Corporate firewalls often block WebSockets. Try cellular data or home WiFi.
            </div>
            <div className="p-3 bg-yellow-900/30 border border-yellow-600 rounded">
              <strong>If PeerJS Test Fails:</strong> The PeerJS signaling server is blocked. This will prevent P2P connections entirely.
            </div>
            <div className="p-3 bg-red-900/30 border border-red-600 rounded">
              <strong>If Protocol is HTTP:</strong> WebRTC requires HTTPS. Use ngrok or deploy to a secure host.
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">🛠️ Actions</h2>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/peertest')}
              className="w-full bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
            >
              🧪 Run PeerJS Connection Tests
            </button>
            <button
              onClick={clearAllStorage}
              className="w-full bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
            >
              Clear All Storage & Cache
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded"
            >
              Reload Page
            </button>
            <button
              onClick={() => navigator.share?.({ 
                title: 'Festival Chat Diagnostics',
                text: JSON.stringify(diagnostics, null, 2)
              }) || alert('Copy this data:\n' + JSON.stringify(diagnostics, null, 2))}
              className="w-full bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded"
            >
              Share Diagnostic Data
            </button>
          </div>
        </div>

        {/* User Agent Details */}
        <div className="bg-gray-800 rounded-lg p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">📱 Device Information</h2>
          <div className="text-xs font-mono break-all">
            <div><strong>User Agent:</strong></div>
            <div className="bg-gray-700 p-2 rounded mt-1">{diagnostics.userAgent}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

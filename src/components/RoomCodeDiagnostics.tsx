'use client';

import React, { useState } from 'react';
import { RoomCodeManager, RoomCodeDiagnostics } from '../utils/room-codes';
import { ServerUtils } from '../utils/server-utils';

export function RoomCodeDiagnosticPanel({ p2pHook }: { p2pHook: any }) {
  const getEnvironment = () => {
    // More reliable environment detection
    const isDev = process.env.NODE_ENV === 'development' || 
                  (typeof window !== 'undefined' && (
                    window.location.hostname === 'localhost' ||
                    window.location.hostname === '127.0.0.1' ||
                    window.location.hostname.includes('.local') ||
                    window.location.port === '3000'
                  ));
    return isDev ? 'development' : 'production';
  };

  const environment = getEnvironment();
  const isLocalhost = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.port === '3000'
  );

  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [testRoomId, setTestRoomId] = useState('test-room-' + Date.now());

  const runFullDiagnostics = async () => {
    setIsRunning(true);
    setResults(null);

    try {
      const diagnosticResults = {
        timestamp: new Date().toISOString(),
        tests: []
      };

      // Test 1: Room Code Generation
      console.log('🔍 Test 1: Room Code Generation');
      try {
        const generatedCode = RoomCodeManager.generateRoomCode(testRoomId);
        diagnosticResults.tests.push({
          name: 'Room Code Generation',
          status: 'PASS',
          data: { roomId: testRoomId, generatedCode }
        });
      } catch (error) {
        diagnosticResults.tests.push({
          name: 'Room Code Generation',
          status: 'FAIL',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Test 2: Server Connectivity
      console.log('🔍 Test 2: Server Connectivity');
      try {
        const connectivity = await RoomCodeDiagnostics.testServerConnectivity();
        diagnosticResults.tests.push({
          name: 'Server Connectivity',
          status: connectivity.serverReachable ? 'PASS' : 'FAIL',
          data: connectivity
        });
      } catch (error) {
        diagnosticResults.tests.push({
          name: 'Server Connectivity',
          status: 'FAIL',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Test 3: Room Code System End-to-End
      console.log('🔍 Test 3: Room Code System End-to-End');
      try {
        const systemTest = await RoomCodeDiagnostics.testRoomCodeSystem();
        diagnosticResults.tests.push({
          name: 'Room Code System',
          status: systemTest.success ? 'PASS' : 'FAIL',
          data: systemTest
        });
      } catch (error) {
        diagnosticResults.tests.push({
          name: 'Room Code System',
          status: 'FAIL',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Test 4: Check for room ID extraction issues
      console.log('🔍 Test 4: Current URL and Room ID Analysis');
      try {
        const urlAnalysis = {
          currentPath: window.location.pathname,
          roomIdFromPath: window.location.pathname.split('/').pop(),
          searchParams: Object.fromEntries(new URLSearchParams(window.location.search)),
          currentDomain: window.location.hostname,
          isLocalhost: isLocalhost,
          actualEnvironment: environment,
          port: window.location.port,
          protocol: window.location.protocol
        };
        
        diagnosticResults.tests.push({
          name: 'URL Analysis',
          status: 'INFO',
          data: urlAnalysis
        });
      } catch (error) {
        diagnosticResults.tests.push({
          name: 'URL Analysis',
          status: 'FAIL',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Test 5: Server Debug Info
      console.log('🔍 Test 5: Server Debug Info');
      try {
        const serverUrl = ServerUtils.getHttpServerUrl();
        const debugResponse = await fetch(`${serverUrl}/debug/rooms`);
        
        if (debugResponse.ok) {
          const debugData = await debugResponse.json();
          diagnosticResults.tests.push({
            name: 'Server Debug Info',
            status: 'PASS',
            data: debugData
          });
        } else {
          diagnosticResults.tests.push({
            name: 'Server Debug Info',
            status: 'FAIL',
            error: `HTTP ${debugResponse.status}: ${debugResponse.statusText}`
          });
        }
      } catch (error) {
        diagnosticResults.tests.push({
          name: 'Server Debug Info',
          status: 'FAIL',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Test 6: Local Storage Analysis
      console.log('🔍 Test 6: Local Storage Analysis');
      try {
        const localStorageData = {
          roomCodes: RoomCodeManager.getCodeMappings(),
          recentRooms: RoomCodeManager.getRecentRoomCodes(),
          displayName: localStorage.getItem('displayName'),
          localStorageSize: JSON.stringify(localStorage).length
        };
        
        diagnosticResults.tests.push({
          name: 'Local Storage Analysis',
          status: 'INFO',
          data: localStorageData
        });
      } catch (error) {
        diagnosticResults.tests.push({
          name: 'Local Storage Analysis',
          status: 'FAIL',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Test 7: P2P Connection Analysis (from old debug panel)
      console.log('🔍 Test 7: P2P Connection Analysis');
      try {
        const p2pAnalysis = {
          webRTCSupport: !!(window as any).RTCPeerConnection,
          peerJSAvailable: !!(window as any).Peer,
          httpsEnabled: window.location.protocol === 'https:',
          connectionQuality: 'N/A', // Would need p2pHook to get this
          networkReach: 'unknown' // Would need status to get this
        };
        
        diagnosticResults.tests.push({
          name: 'P2P Connection Analysis',
          status: p2pAnalysis.webRTCSupport && p2pAnalysis.peerJSAvailable ? 'PASS' : 'FAIL',
          data: p2pAnalysis
        });
      } catch (error) {
        diagnosticResults.tests.push({
          name: 'P2P Connection Analysis',
          status: 'FAIL',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      setResults(diagnosticResults);

    } catch (error) {
      setResults({
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        tests: []
      });
    } finally {
      setIsRunning(false);
    }
  };

  const clearAllData = () => {
    if (confirm('This will clear all local room codes and recent rooms. Continue?')) {
      try {
        RoomCodeManager.clearRecentRooms();
        localStorage.removeItem('peddlenet_room_codes');
        alert('✅ All local data cleared');
      } catch (error) {
        alert('❌ Error clearing data: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PASS': return 'text-green-400';
      case 'FAIL': return 'text-red-400';
      case 'INFO': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PASS': return '✅';
      case 'FAIL': return '❌';
      case 'INFO': return 'ℹ️';
      default: return '❓';
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-600 overflow-hidden">
      <div className="p-4">
        <h3 className="text-lg font-semibold text-white mb-4">🔧 Room Code Diagnostics</h3>
        
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={testRoomId}
              onChange={(e) => setTestRoomId(e.target.value)}
              placeholder="Test Room ID"
              className="flex-1 px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            />
            <button
              onClick={runFullDiagnostics}
              disabled={isRunning}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-medium whitespace-nowrap"
            >
              {isRunning ? '🔄 Running...' : '🔍 Run Diagnostics'}
            </button>
            <button
              onClick={clearAllData}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition text-sm font-medium whitespace-nowrap"
            >
              🗑️ Clear Data
            </button>
            {p2pHook?.forceReconnect && (
              <button
                onClick={() => p2pHook.forceReconnect()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm font-medium whitespace-nowrap"
              >
                🔄 Reconnect
              </button>
            )}
          </div>

          {results && (
            <div className="space-y-3">
              <div className="text-sm text-gray-400">
                Diagnostics run at: {new Date(results.timestamp).toLocaleString()}
              </div>
              
              {results.error && (
                <div className="p-3 bg-red-900/50 border border-red-500/30 rounded text-red-200">
                  <strong>Overall Error:</strong> {results.error}
                </div>
              )}

              <div className="max-h-64 overflow-y-auto space-y-2 bg-gray-900/50 rounded p-3">
                {results.tests.map((test: any, index: number) => (
                  <div key={index} className="p-3 bg-gray-800/80 rounded border border-gray-600">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-lg">{getStatusIcon(test.status)}</span>
                      <span className={`font-medium text-sm ${getStatusColor(test.status)}`}>
                        {test.name}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded font-medium ${
                        test.status === 'PASS' ? 'bg-green-900 text-green-200' :
                        test.status === 'FAIL' ? 'bg-red-900 text-red-200' :
                        'bg-blue-900 text-blue-200'
                      }`}>
                        {test.status}
                      </span>
                    </div>
                    
                    {test.error && (
                      <div className="text-red-300 text-sm mt-2 p-2 bg-red-900/30 rounded">
                        <strong>Error:</strong> {test.error}
                      </div>
                    )}
                    
                    {test.data && (
                      <details className="mt-2">
                        <summary className="text-sm text-gray-400 cursor-pointer hover:text-gray-300 py-1">
                          View Details
                        </summary>
                        <pre className="mt-2 p-3 bg-gray-900 rounded text-xs text-gray-300 overflow-x-auto max-h-40 overflow-y-auto border border-gray-700">
                          {JSON.stringify(test.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
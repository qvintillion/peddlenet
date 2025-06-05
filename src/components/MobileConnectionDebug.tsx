'use client';

import { useState, useEffect } from 'react';
import { MobileNetworkDebug } from '@/utils/mobile-network-debug';

interface MobileConnectionDebugProps {
  serverUrl?: string;
  className?: string;
}

export function MobileConnectionDebug({ serverUrl, className = '' }: MobileConnectionDebugProps) {
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    try {
      // Extract IP from server URL if available
      const ipMatch = serverUrl?.match(/\/\/([^:]+)/);
      const targetIP = ipMatch ? ipMatch[1] : undefined;
      
      const results = await MobileNetworkDebug.runFullDiagnostics(targetIP);
      setDiagnostics(results);
    } catch (error) {
      console.error('Diagnostics failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (server: any) => {
    if (server.reachable) {
      return server.websocket?.success ? '✅' : '🟡';
    }
    return '❌';
  };

  return (
    <div className={`border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      <div className="bg-gray-50 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">📱 Mobile Debug</span>
            {diagnostics && (
              <span className="text-sm text-gray-800">
                ({diagnostics.servers?.filter((s: any) => s.reachable)?.length || 0} servers reachable)
              </span>
            )}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={runDiagnostics}
              disabled={isRunning}
              className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isRunning ? '🔍' : '🔄'} Test
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              {isExpanded ? '▼' : '▶'}
            </button>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="p-3 space-y-3">
          {/* Quick Info */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-800 font-medium">Device:</span>
              <span className="ml-1">{navigator.onLine ? '🌐 Online' : '❌ Offline'}</span>
            </div>
            <div>
              <span className="text-gray-800 font-medium">Current URL:</span>
              <span className="ml-1 font-mono text-gray-700">{window.location.hostname}</span>
            </div>
          </div>

          {/* Server Tests */}
          {diagnostics && (
            <div className="space-y-2">
              <div className="text-sm font-semibold text-gray-800">Server Connectivity:</div>
              {diagnostics.servers?.map((server: any, idx: number) => (
                <div key={idx} className="bg-gray-50 p-2 rounded text-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span>{getStatusIcon(server)}</span>
                      <span className="font-semibold text-gray-800">{server.type}</span>
                    </div>
                    {server.reachable && (
                      <span className="text-green-700 font-medium">Port {server.port}</span>
                    )}
                  </div>
                  <div className="mt-1 font-mono text-gray-700">{server.url}</div>
                  {server.error && (
                    <div className="mt-1 text-red-700 font-medium">Error: {server.error}</div>
                  )}
                  {server.websocket && (
                    <div className="mt-1 text-gray-800">
                      WebSocket: {server.websocket.success ? '✅ OK' : '❌ Failed'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Recommendations */}
          {diagnostics?.recommendations && (
            <div className="space-y-1">
              <div className="text-sm font-semibold text-gray-800">Recommendations:</div>
              {diagnostics.recommendations.map((rec: string, idx: number) => (
                <div key={idx} className="text-sm text-gray-800 bg-yellow-50 p-2 rounded border border-yellow-200">
                  {rec}
                </div>
              ))}
            </div>
          )}

          {/* Raw Network Info */}
          {diagnostics?.network && (
            <details className="text-sm">
              <summary className="cursor-pointer text-gray-700 hover:text-gray-900 font-medium">
                Raw Network Info
              </summary>
              <pre className="mt-2 bg-gray-100 p-2 rounded overflow-auto text-sm text-gray-800">
                {JSON.stringify(diagnostics.network, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

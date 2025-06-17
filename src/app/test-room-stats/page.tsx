'use client';

import React, { useState } from 'react';
import { ServerUtils } from '../../utils/server-utils';

export default function RoomStatsTestPage() {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [serverUrl, setServerUrl] = useState('');

  const testRooms = [
    'main-stage-chat',
    'food-court-meetup', 
    'lost-found',
    'nonexistent-room'
  ];

  const testRoomStats = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    const httpServerUrl = ServerUtils.getHttpServerUrl();
    setServerUrl(httpServerUrl);
    
    console.log('🧪 Testing room stats with server URL:', httpServerUrl);
    
    const results = [];
    
    // Test health endpoint first
    try {
      const healthResponse = await fetch(`${httpServerUrl}/health`);
      const healthData = await healthResponse.json();
      results.push({
        endpoint: '/health',
        status: healthResponse.status,
        success: healthResponse.ok,
        data: healthData,
        timestamp: Date.now()
      });
    } catch (error) {
      results.push({
        endpoint: '/health',
        status: 'ERROR',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      });
    }
    
    // Test room stats endpoints
    for (const roomId of testRooms) {
      try {
        const response = await fetch(`${httpServerUrl}/room-stats/${roomId}`, {
          signal: AbortSignal.timeout(10000)
        });
        const data = await response.json();
        
        results.push({
          endpoint: `/room-stats/${roomId}`,
          roomId,
          status: response.status,
          success: response.ok,
          data,
          timestamp: Date.now()
        });
      } catch (error) {
        results.push({
          endpoint: `/room-stats/${roomId}`,
          roomId,
          status: 'ERROR',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: Date.now()
        });
      }
    }
    
    setTestResults(results);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🧪 Room Stats Test Page</h1>
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Server Configuration</h2>
          <div className="bg-gray-800 p-4 rounded-lg">
            <p><strong>HTTP Server URL:</strong> {serverUrl || 'Not detected yet'}</p>
            <p><strong>Environment:</strong> {typeof window !== 'undefined' ? window.location.hostname : 'Unknown'}</p>
          </div>
        </div>
        
        <div className="mb-6">
          <button
            onClick={testRoomStats}
            disabled={isLoading}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {isLoading ? '🔄 Testing...' : '🧪 Test Room Stats Endpoints'}
          </button>
        </div>
        
        {testResults.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-3">Test Results</h2>
            <div className="space-y-4">
              {testResults.map((result, index) => (
                <div 
                  key={index}
                  className={`p-4 rounded-lg border ${
                    result.success 
                      ? 'bg-green-900 border-green-600' 
                      : 'bg-red-900 border-red-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">
                      {result.success ? '✅' : '❌'} {result.endpoint}
                    </h3>
                    <span className="text-sm text-gray-400">
                      Status: {result.status}
                    </span>
                  </div>
                  
                  {result.roomId && (
                    <p className="text-sm mb-2">
                      <strong>Room ID:</strong> {result.roomId}
                    </p>
                  )}
                  
                  {result.data && (
                    <div className="bg-gray-800 p-3 rounded text-sm">
                      <strong>Response Data:</strong>
                      <pre className="mt-1 text-xs overflow-x-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  {result.error && (
                    <div className="bg-red-800 p-3 rounded text-sm">
                      <strong>Error:</strong> {result.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="mt-8 text-sm text-gray-400">
          <p>This test page verifies:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Server URL detection and configuration</li>
            <li>Health endpoint accessibility</li>
            <li>Room stats endpoint functionality</li>
            <li>CORS and network connectivity</li>
            <li>Response data structure</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

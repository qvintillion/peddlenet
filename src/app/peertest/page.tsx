'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Peer from 'peerjs';

export default function PeerTestPage() {
  const router = useRouter();
  const [testResults, setTestResults] = useState<any[]>([]);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (message: string, success: boolean = true, data?: any) => {
    const result = {
      timestamp: new Date().toLocaleTimeString(),
      message,
      success,
      data: data ? JSON.stringify(data, null, 2) : null
    };
    setTestResults(prev => [...prev, result]);
    console.log(`${success ? '✅' : '❌'} ${message}`, data || '');
  };

  const testPeerJSConfigurations = async () => {
    setIsRunning(true);
    setTestResults([]);
    setCurrentTest('Starting PeerJS tests...');

    const configs = [
      {
        name: 'Minimal Config (No STUN) - RECOMMENDED',
        config: { debug: 2 }
      },
      {
        name: 'Default PeerJS (no config)',
        config: { debug: 2 }
      },
      {
        name: 'With STUN servers (likely to fail)',
        config: {
          debug: 2,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' }
            ]
          }
        }
      },
      {
        name: 'Explicit PeerJS cloud server',
        config: {
          debug: 2,
          host: '0.peerjs.com',
          port: 443,
          path: '/peerjs',
          secure: true
        }
      }
    ];

    for (let i = 0; i < configs.length; i++) {
      const { name, config } = configs[i];
      setCurrentTest(`Testing ${name}...`);
      
      try {
        addResult(`🧪 Testing configuration: ${name}`, true, config);
        
        const peer = new Peer(undefined, config);
        
        const result = await new Promise<any>((resolve) => {
          const timeout = setTimeout(() => {
            peer.destroy();
            resolve({ success: false, error: 'timeout', duration: 15000 });
          }, 15000);

          peer.on('open', (id) => {
            clearTimeout(timeout);
            addResult(`✅ Success! Peer ID: ${id}`, true);
            peer.destroy();
            resolve({ success: true, peerId: id, duration: Date.now() - startTime });
          });

          peer.on('error', (error) => {
            clearTimeout(timeout);
            addResult(`❌ Error: ${error.type} - ${error.message}`, false, error);
            peer.destroy();
            resolve({ success: false, error: error.type, message: error.message, duration: Date.now() - startTime });
          });

          const startTime = Date.now();
        });

        if (result.success) {
          addResult(`🎉 Configuration "${name}" WORKS! Duration: ${result.duration}ms`, true);
          break; // Stop on first success
        } else {
          addResult(`💥 Configuration "${name}" failed: ${result.error}`, false);
        }

      } catch (error: any) {
        addResult(`💥 Exception with "${name}": ${error.message}`, false, error);
      }

      // Wait between tests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    setCurrentTest('Tests complete');
    setIsRunning(false);
  };

  const testSimplePeerConnection = async () => {
    setIsRunning(true);
    setTestResults([]);
    setCurrentTest('Testing simple peer connection...');

    try {
      addResult('🚀 Creating simple peer with minimal config');
      
      const peer = new Peer();
      
      peer.on('open', (id) => {
        addResult(`✅ Peer opened with ID: ${id}`, true);
        
        // Test peer properties
        addResult(`📊 Peer details:`, true, {
          id: peer.id,
          open: peer.open,
          destroyed: peer.destroyed,
          disconnected: peer.disconnected
        });

        peer.destroy();
        setCurrentTest('Simple test complete - SUCCESS!');
        setIsRunning(false);
      });

      peer.on('error', (error) => {
        addResult(`❌ Peer error: ${error.type} - ${error.message}`, false, error);
        setCurrentTest('Simple test complete - FAILED');
        setIsRunning(false);
      });

      peer.on('disconnected', () => {
        addResult('🔌 Peer disconnected', true);
      });

      peer.on('close', () => {
        addResult('🔒 Peer closed', true);
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        if (!peer.destroyed) {
          addResult('⏰ Test timed out after 30 seconds', false);
          peer.destroy();
          setCurrentTest('Simple test timed out');
          setIsRunning(false);
        }
      }, 30000);

    } catch (error: any) {
      addResult(`💥 Exception in simple test: ${error.message}`, false, error);
      setCurrentTest('Simple test failed with exception');
      setIsRunning(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
    setCurrentTest('');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">🧪 PeerJS Connection Test</h1>
          <button
            onClick={() => router.push('/')}
            className="text-purple-400 hover:text-purple-300"
          >
            ← Back to Home
          </button>
        </div>

        {/* Test Controls */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🔬 Test Controls</h2>
          <div className="space-y-3">
            <button
              onClick={testSimplePeerConnection}
              disabled={isRunning}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-3 rounded font-semibold"
            >
              {isRunning ? 'Running...' : '🚀 Test Simple Peer Connection'}
            </button>
            
            <button
              onClick={testPeerJSConfigurations}
              disabled={isRunning}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-3 rounded font-semibold"
            >
              {isRunning ? 'Running...' : '🔧 Test All PeerJS Configurations'}
            </button>
            
            <button
              onClick={clearResults}
              disabled={isRunning}
              className="w-full bg-gray-600 hover:bg-gray-700 disabled:bg-gray-500 px-4 py-2 rounded"
            >
              Clear Results
            </button>
          </div>
        </div>

        {/* Current Test Status */}
        {currentTest && (
          <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              {isRunning && (
                <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
              )}
              <span className="font-semibold">{currentTest}</span>
            </div>
          </div>
        )}

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">📋 Test Results</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 rounded text-sm ${
                    result.success 
                      ? 'bg-green-900/30 border border-green-600' 
                      : 'bg-red-900/30 border border-red-600'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-mono">[{result.timestamp}] {result.message}</span>
                  </div>
                  {result.data && (
                    <pre className="mt-2 text-xs bg-gray-700 p-2 rounded overflow-x-auto">
                      {result.data}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-900/30 border border-blue-600 rounded-lg p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">📖 Instructions</h2>
          <div className="space-y-2 text-sm">
            <p><strong>1. Start with Simple Test:</strong> This tests basic PeerJS functionality</p>
            <p><strong>2. If Simple Test fails:</strong> There's a fundamental PeerJS issue</p>
            <p><strong>3. If Simple Test passes:</strong> Run Configuration Tests to find the best server</p>
            <p><strong>4. Run on both devices:</strong> Desktop and mobile to compare results</p>
          </div>
        </div>
      </div>
    </div>
  );
}

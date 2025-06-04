import React, { useState, useEffect } from 'react';
import { MobileConnectionDebug } from '@/utils/mobile-debug';

interface MobileDiagnosticsProps {
  peerId?: string | null;
  roomId: string;
  isSignalingConnected: boolean;
  connectedPeers: number;
}

export function MobileDiagnostics({ 
  peerId, 
  roomId, 
  isSignalingConnected, 
  connectedPeers 
}: MobileDiagnosticsProps) {
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    
    try {
      // Basic mobile diagnostics
      const basicTests = MobileConnectionDebug.testMobileWebRTC();
      
      // Network info
      const networkInfo = MobileConnectionDebug.getMobileNetworkInfo();
      
      // Connection state
      const connectionState = {
        peerId,
        roomId,
        isSignalingConnected,
        connectedPeers,
        globalPeerExists: !!(window as any).globalPeer,
        globalPeerDestroyed: (window as any).globalPeer?.destroyed,
        localStorage: {
          displayName: localStorage.getItem('displayName'),
          sessionExists: !!localStorage.getItem('peddlenet_session'),
          roomCodes: !!localStorage.getItem('peddlenet_room_codes')
        }
      };

      // WebRTC capabilities test
      const webrtcTest = await testWebRTCCapabilities();

      setDiagnostics({
        basicTests,
        networkInfo,
        connectionState,
        webrtcTest,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Diagnostics failed:', error);
      setDiagnostics({
        error: 'Failed to run diagnostics: ' + (error as Error).message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsRunning(false);
    }
  };

  const testWebRTCCapabilities = async (): Promise<any> => {
    try {
      const RTCPeerConnection = (window as any).RTCPeerConnection;
      if (!RTCPeerConnection) {
        return { supported: false, error: 'RTCPeerConnection not available' };
      }

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });

      // Test ICE gathering
      const iceGatheringPromise = new Promise((resolve) => {
        const candidates: any[] = [];
        const timeout = setTimeout(() => {
          resolve({ candidates, timeout: true });
        }, 5000);

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            candidates.push({
              type: event.candidate.type,
              protocol: event.candidate.protocol,
              address: event.candidate.address
            });
          } else {
            clearTimeout(timeout);
            resolve({ candidates, complete: true });
          }
        };

        // Create offer to start ICE gathering
        pc.createOffer().then(offer => {
          pc.setLocalDescription(offer);
        });
      });

      const iceResult = await iceGatheringPromise;
      pc.close();

      return {
        supported: true,
        iceGathering: iceResult
      };
    } catch (error) {
      return {
        supported: false,
        error: (error as Error).message
      };
    }
  };

  const copyDiagnostics = () => {
    if (diagnostics) {
      const text = JSON.stringify(diagnostics, null, 2);
      navigator.clipboard.writeText(text);
    }
  };

  useEffect(() => {
    // Auto-run diagnostics on mount
    runDiagnostics();
  }, []);

  return (
    <div className="p-4 bg-gray-50 rounded-lg border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">📱 Mobile Diagnostics</h3>
        <div className="flex space-x-2">
          <button
            onClick={runDiagnostics}
            disabled={isRunning}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isRunning ? '🔄 Running...' : '🔍 Run Test'}
          </button>
          {diagnostics && (
            <button
              onClick={copyDiagnostics}
              className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
            >
              📋 Copy
            </button>
          )}
        </div>
      </div>

      {isRunning && (
        <div className="text-center py-4">
          <div className="animate-spin text-2xl mb-2">🔄</div>
          <p className="text-sm text-gray-600">Running mobile connection tests...</p>
        </div>
      )}

      {diagnostics && !isRunning && (
        <div className="space-y-4">
          {diagnostics.error ? (
            <div className="p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-red-700 text-sm">{diagnostics.error}</p>
            </div>
          ) : (
            <>
              {/* Basic Mobile Tests */}
              <div>
                <h4 className="font-medium text-gray-800 mb-2">📱 Device Info</h4>
                <div className="bg-white p-3 rounded border text-xs space-y-1">
                  <div><strong>Mobile:</strong> {diagnostics.basicTests.isMobile ? 'Yes' : 'No'}</div>
                  <div><strong>WebRTC:</strong> {diagnostics.basicTests.webrtcSupport ? 'Supported' : 'Not Supported'}</div>
                  <div><strong>PeerJS:</strong> {diagnostics.basicTests.peerJSLoaded ? 'Loaded' : 'Not Loaded'}</div>
                  <div><strong>Protocol:</strong> {diagnostics.basicTests.protocol}</div>
                </div>
              </div>

              {/* Network Info */}
              <div>
                <h4 className="font-medium text-gray-800 mb-2">🌐 Network</h4>
                <div className="bg-white p-3 rounded border text-xs space-y-1">
                  {diagnostics.networkInfo.effectiveType && (
                    <div><strong>Type:</strong> {diagnostics.networkInfo.effectiveType}</div>
                  )}
                  {diagnostics.networkInfo.downlink && (
                    <div><strong>Speed:</strong> {diagnostics.networkInfo.downlink} Mbps</div>
                  )}
                  {diagnostics.networkInfo.rtt && (
                    <div><strong>Latency:</strong> {diagnostics.networkInfo.rtt} ms</div>
                  )}
                  <div><strong>Online:</strong> {navigator.onLine ? 'Yes' : 'No'}</div>
                </div>
              </div>

              {/* Connection State */}
              <div>
                <h4 className="font-medium text-gray-800 mb-2">🔗 Connection State</h4>
                <div className="bg-white p-3 rounded border text-xs space-y-1">
                  <div><strong>Peer ID:</strong> {diagnostics.connectionState.peerId || 'None'}</div>
                  <div><strong>Signaling:</strong> {diagnostics.connectionState.isSignalingConnected ? 'Connected' : 'Disconnected'}</div>
                  <div><strong>P2P Peers:</strong> {diagnostics.connectionState.connectedPeers}</div>
                  <div><strong>Global Peer:</strong> {diagnostics.connectionState.globalPeerExists ? 'Exists' : 'Missing'}</div>
                </div>
              </div>

              {/* WebRTC Test */}
              <div>
                <h4 className="font-medium text-gray-800 mb-2">🚀 WebRTC Test</h4>
                <div className="bg-white p-3 rounded border text-xs">
                  {diagnostics.webrtcTest.supported ? (
                    <div className="space-y-1">
                      <div className="text-green-600"><strong>✅ WebRTC Supported</strong></div>
                      {diagnostics.webrtcTest.iceGathering && (
                        <div>
                          <strong>ICE Candidates:</strong> {diagnostics.webrtcTest.iceGathering.candidates?.length || 0}
                          {diagnostics.webrtcTest.iceGathering.timeout && (
                            <span className="text-orange-600"> (timeout)</span>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-red-600">
                      <strong>❌ WebRTC Issue:</strong> {diagnostics.webrtcTest.error}
                    </div>
                  )}
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <h4 className="font-medium text-gray-800 mb-2">💡 Recommendations</h4>
                <div className="bg-blue-50 p-3 rounded border text-xs space-y-1">
                  {!diagnostics.connectionState.isSignalingConnected && (
                    <div>• Check internet connection and try refreshing</div>
                  )}
                  {diagnostics.networkInfo.effectiveType === '2g' && (
                    <div>• Network is slow - try switching to WiFi or better signal</div>
                  )}
                  {diagnostics.connectionState.connectedPeers === 0 && (
                    <div>• No P2P connections - generate QR code to invite others</div>
                  )}
                  {!diagnostics.webrtcTest.supported && (
                    <div>• WebRTC not working - try updating your browser</div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default MobileDiagnostics;

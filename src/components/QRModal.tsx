'use client';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { NetworkUtils } from '@/utils/network-utils';

interface QRModalProps {
  roomId: string;
  peerId?: string | null;
  displayName?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function QRModal({ roomId, peerId, displayName, isOpen, onClose }: QRModalProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [fullUrl, setFullUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showNetworkSetup, setShowNetworkSetup] = useState(false);
  const [selectedIP, setSelectedIP] = useState('');

  useEffect(() => {
    if (isOpen && roomId) {
      // Check if we can generate mobile-accessible QR
      const isMobileAccessible = NetworkUtils.isMobileAccessible();
      if (!isMobileAccessible && !localStorage.getItem('selected_network_ip')) {
        setShowNetworkSetup(true);
      } else {
        generateInviteQR();
      }
    }
  }, [isOpen, roomId, peerId, displayName]);

  const generateInviteQR = async () => {
    setIsGenerating(true);
    
    const baseUrl = NetworkUtils.getBaseURL();
    // Detect if we're on test page or regular chat page
    const isTestPage = typeof window !== 'undefined' && window.location.pathname === '/test-room';
    let chatUrl = isTestPage ? `${baseUrl}/test-room` : `${baseUrl}/chat/${roomId}`;
    
    // Always include peer info for direct connection when available
    if (peerId && displayName) {
      const params = new URLSearchParams({
        host: peerId,
        name: displayName,
        t: Date.now().toString() // timestamp for uniqueness
      });
      chatUrl += `?${params.toString()}`;
      console.log('📱 Generated invite QR with ACTUAL peer info:', peerId);
      console.log('🌐 QR URL for mobile access:', chatUrl);
    } else {
      console.log('📱 Generated basic room QR (no host peer info)');
    }
    
    setFullUrl(chatUrl);
    
    try {
      const qrUrl = await QRCode.toDataURL(chatUrl, {
        width: 280,
        margin: 2,
        color: {
          dark: '#1f2937',
          light: '#ffffff'
        }
      });
      setQrCodeUrl(qrUrl);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNetworkIPSelection = (ip: string) => {
    NetworkUtils.setNetworkIP(ip);
    setSelectedIP(ip);
    setShowNetworkSetup(false);
    generateInviteQR();
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    alert('Room ID copied! 📋');
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(fullUrl);
    alert('Room link copied! 🔗');
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join "${roomId}" on Festival Chat`,
          text: `Join my chat room for instant messaging!`,
          url: fullUrl
        });
      } catch (error) {
        console.log('Native sharing cancelled');
      }
    } else {
      copyUrl();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900">📱 Invite Others</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {showNetworkSetup ? (
          // Network IP Setup
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">🌐 Mobile Access Setup</h4>
              <p className="text-sm text-blue-800 mb-3">
                To let phones scan this QR code, we need your computer's network IP address.
              </p>
              
              <div className="space-y-2">
                <p className="text-xs font-medium text-blue-900">Find your IP address:</p>
                {NetworkUtils.getIPInstructions().map((instruction, idx) => (
                  <p key={idx} className="text-xs text-blue-700">• {instruction}</p>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter your computer's IP address:
              </label>
              <input
                type="text"
                placeholder="192.168.1.100"
                value={selectedIP}
                onChange={(e) => setSelectedIP(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              {NetworkUtils.getCommonLocalIPs().map((ip) => (
                <button
                  key={ip}
                  onClick={() => setSelectedIP(ip)}
                  className="py-2 px-3 text-xs border border-gray-300 rounded hover:bg-gray-50"
                >
                  {ip}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <button
                onClick={() => handleNetworkIPSelection(selectedIP)}
                disabled={!selectedIP}
                className="w-full py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition disabled:bg-gray-300"
              >
                Use This IP Address
              </button>
              
              <button
                onClick={() => {
                  setShowNetworkSetup(false);
                  generateInviteQR();
                }}
                className="w-full py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 transition"
              >
                Skip (localhost only)
              </button>
            </div>

            <div className="p-3 bg-yellow-50 rounded-lg">
              <p className="text-xs text-yellow-800">
                💡 <strong>Tip:</strong> Both devices must be on the same WiFi network for this to work.
              </p>
            </div>
          </div>
        ) : (
          // Normal QR Display
          <>
            {/* Room Status */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Room:</span>
                <span className="font-semibold text-gray-900">{roomId}</span>
              </div>
              {peerId && (
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-gray-600">Type:</span>
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                    ⚡ Instant Connect
                  </span>
                </div>
              )}
              {fullUrl && !NetworkUtils.isMobileAccessible() && (
                <div className="mt-2 p-2 bg-yellow-50 rounded text-xs text-yellow-800">
                  ⚠️ Using localhost - phones can't connect
                  <button 
                    onClick={() => setShowNetworkSetup(true)}
                    className="ml-2 underline"
                  >
                    Fix this
                  </button>
                </div>
              )}
            </div>

            {/* QR Code */}
            {isGenerating ? (
              <div className="bg-gray-100 p-8 rounded-lg mb-4 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin text-2xl mb-2">🎨</div>
                  <p className="text-sm text-gray-600">Generating QR code...</p>
                </div>
              </div>
            ) : qrCodeUrl ? (
              <div className="bg-gray-100 p-4 rounded-lg mb-4">
                <img src={qrCodeUrl} alt="Room invitation QR code" className="w-full" />
              </div>
            ) : null}

            {/* Instructions */}
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800 font-medium mb-1">
                📸 Scan with camera to join instantly!
              </p>
              <p className="text-xs text-blue-600">
                {peerId 
                  ? "QR includes your connection info for 5-10 second connections"
                  : "Others will join your room when they scan"
                }
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                onClick={shareNative}
                className="w-full py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition"
              >
                {navigator.share ? '📤 Share Room Link' : '📋 Copy Room Link'}
              </button>
              
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={copyRoomId}
                  className="py-2 bg-gray-700 hover:bg-gray-800 text-white rounded text-sm font-medium transition"
                >
                  Copy Room ID
                </button>
              </div>
            </div>

            {/* Festival Tips */}
            <div className="mt-6 p-3 bg-yellow-50 rounded-lg">
              <p className="text-xs text-yellow-800 font-medium mb-1">🎪 Festival Tips:</p>
              <ul className="text-xs text-yellow-700 space-y-1">
                <li>• Works offline once connected</li>
                <li>• Save screenshot of QR for later sharing</li>
                <li>• Room stays active as long as someone's connected</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
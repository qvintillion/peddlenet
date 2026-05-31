'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RoomCodeManager, RoomCodeDiagnostics } from '@/utils/room-codes';
import { ServerUtils } from '@/utils/server-utils';
import { prettifyRoomCode } from '@/utils/generate-room-code';

interface RoomCodeJoinProps {
  className?: string;
}

export function RoomCodeJoin({ className = '' }: RoomCodeJoinProps) {
  const [roomCode, setRoomCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode.trim()) return;

    setIsJoining(true);
    setError('');

    try {
      // Validate format
      if (!RoomCodeManager.isValidRoomCode(roomCode)) {
        setError('Invalid code format. Use format: blue-stage-42');
        setIsJoining(false);
        return;
      }

      // Set display name if not already set
      let userName = localStorage.getItem('displayName');
      if (!userName) {
        userName = prompt('Enter your display name to join:') || `Guest_${Math.floor(Math.random() * 1000)}`;
        localStorage.setItem('displayName', userName);
      }

      const normalizedCode = roomCode.toLowerCase().trim();
      console.log('🔍 Looking up room metadata for code:', normalizedCode);

      // Try to fetch room metadata from server
      try {
        const serverUrl = ServerUtils.getHttpServerUrl();
        const response = await fetch(`${serverUrl}/room/${normalizedCode}/metadata`);

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Found room metadata:', data.metadata);

          // Store display name in localStorage for quick access
          if (data.metadata.displayName) {
            localStorage.setItem(`room:${normalizedCode}:name`, data.metadata.displayName);
          }
        } else {
          // Metadata not found is NOT a fatal error. A valid-format room code maps
          // deterministically to a room ID, and metadata is only a display-name
          // nicety. Server metadata lives in an in-memory Map that Cloud Run wipes
          // on scale-to-zero cold starts, so a 404 here is expected and routine -
          // it must not block joining. We simply join without a pre-fetched name.
          console.warn('ℹ️ No server metadata for room (cold start or never stored) - joining anyway:', normalizedCode);
        }

        // Join the room regardless of metadata availability. The room code is the
        // room ID; the chat page only needs a display name (already set above).
        console.log('🎯 Joining room:', normalizedCode);
        router.push(`/chat/${normalizedCode}`);
      } catch (error) {
        // Only a genuine network/transport failure reaches here (fetch threw).
        // A 404 response does NOT throw, so this no longer blocks valid joins.
        console.error('Failed to reach metadata endpoint - joining anyway:', error);
        console.log('🎯 Joining room (metadata lookup failed):', normalizedCode);
        router.push(`/chat/${normalizedCode}`);
      }
    } catch (error) {
      console.error('Failed to join room by code:', error);
      setError('Failed to connect to server. Please check your connection and try again.');
      setIsJoining(false);
    }
  };
  
  const runDiagnostics = async () => {
    setError('Running diagnostics...');
    try {
      console.log('🔍 Starting room code diagnostics...');
      
      // Test 1: Server connectivity
      console.log('🔍 Step 1: Testing server connectivity...');
      const connectivity = await RoomCodeDiagnostics.testServerConnectivity();
      console.log('Server connectivity result:', connectivity);
      
      // Test 2: Room code system
      console.log('🔍 Step 2: Testing room code system...');
      const systemTest = await RoomCodeDiagnostics.testRoomCodeSystem();
      console.log('System test result:', systemTest);
      
      // Test 3: Manual test with current room code if available
      if (roomCode) {
        console.log('🔍 Step 3: Testing current room code:', roomCode);
        try {
          const roomId = await RoomCodeManager.getRoomIdFromCode(roomCode);
          console.log('Current room code lookup result:', roomId);
        } catch (error) {
          console.error('Current room code lookup failed:', error);
        }
      }
      
      console.log('🔍 Room Code Diagnostics Results:');
      console.log('Server Connectivity:', connectivity);
      console.log('System Test:', systemTest);
      
      if (connectivity.serverReachable && systemTest.success) {
        setError('✅ All diagnostics passed! Room codes should work.');
      } else {
        const serverStatus = connectivity.serverReachable ? 'OK' : 'OFFLINE';
        const systemStatus = systemTest.success ? 'OK' : 'FAILED';
        const endpointsStatus = connectivity.roomCodeEndpoints ? 
          `Register: ${connectivity.roomCodeEndpoints.register ? 'OK' : 'FAIL'}, Resolve: ${connectivity.roomCodeEndpoints.resolve ? 'OK' : 'FAIL'}` : 
          'UNKNOWN';
        setError(`❌ Diagnostics failed. Server: ${serverStatus}, System: ${systemStatus}, Endpoints: ${endpointsStatus}`);
      }
    } catch (error) {
      console.error('Diagnostics error:', error);
      setError('❌ Diagnostics error: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
    
    setTimeout(() => setError(''), 10000); // Show results longer
  };

  return (
    <div className={`${className}`}>
      {/* Room Code Input */}
      <form onSubmit={handleJoinByCode} className="space-y-4">
        <div>
          <label className="block text-lg font-semibold text-white mb-3">
            Enter Room Code
          </label>
          <input
            type="text"
            value={roomCode}
            onChange={(e) => {
              setRoomCode(e.target.value);
              setError('');
            }}
            placeholder="blue-stage-42"
            className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-center font-mono text-lg"
            disabled={isJoining}
          />
          {error && (
            <p className="mt-2 text-sm text-red-400">{error}</p>
          )}
          <p className="mt-2 text-sm text-purple-200">
            Format: [word]-[word]-[number] (e.g., blue-stage-42)
          </p>
        </div>

        <button
          type="submit"
          disabled={!roomCode.trim() || isJoining}
          className="w-full py-4 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-lg"
        >
          {isJoining ? (
            <>
              <span className="animate-spin mr-2">🔄</span>
              Joining...
            </>
          ) : (
            '🚪 Join Room'
          )}
        </button>
        
        {/* Debug button for development */}
        {process.env.NODE_ENV === 'development' && (
          <button
            type="button"
            onClick={runDiagnostics}
            className="w-full mt-2 py-2 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700 transition"
          >
            🔧 Test Room Code System
          </button>
        )}
      </form>
    </div>
  );
}

interface RoomCodeDisplayProps {
  roomId: string;
  className?: string;
}

export function RoomCodeDisplay({ roomId, className = '' }: RoomCodeDisplayProps) {
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  // Only run on client side to prevent static generation issues
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Generate room code only on client side
  useEffect(() => {
    if (!isClient || !roomId || roomId === 'undefined' || roomId === 'null') {
      return;
    }
    
    const code = RoomCodeManager.generateRoomCode(roomId);
    console.log('🏷️ RoomCodeDisplay: Generated code', code, 'for room', roomId);
    setRoomCode(code);
    
    // Store the mapping and add to recent rooms (async)
    const registerCode = async () => {
      console.log('📋 RoomCodeDisplay: Registering room code:', code, 'for room:', roomId);
      try {
        await RoomCodeManager.storeCodeMapping(roomId, code);
        console.log('✅ RoomCodeDisplay: Successfully registered room code');
        RoomCodeManager.addToRecentRooms(roomId, code);
        console.log('✅ RoomCodeDisplay: Added to recent rooms');
      } catch (error) {
        console.error('❌ RoomCodeDisplay: Failed to register room code:', error);
      }
    };
    registerCode();
  }, [isClient, roomId]);
  
  // Show loading state during hydration
  if (!isClient || !roomCode) {
    return (
      <div className={`p-2 bg-blue-900/30 rounded-lg border border-blue-500/30 ${className}`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-blue-200">
              🎫 Room Code
            </div>
            <div className="font-mono text-sm font-bold text-blue-300">Loading...</div>
          </div>
          <button className="p-2 text-gray-400" disabled title="Copy room code">
            📋
          </button>
        </div>
      </div>
    );
  }

  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = roomCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={`p-2 bg-blue-900/30 rounded-lg border border-blue-500/30 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-medium text-blue-200">
            🎫 Room Code
          </div>
          <div className="font-mono text-sm font-bold text-blue-300">{roomCode}</div>
        </div>
        <button 
          onClick={copyRoomCode} 
          className="p-2 text-blue-300 hover:text-blue-100 transition"
          title="Copy room code"
        >
          {copied ? '✅' : '📋'}
        </button>
      </div>
    </div>
  );
}

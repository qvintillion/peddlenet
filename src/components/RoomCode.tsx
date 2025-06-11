'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RoomCodeManager, RoomCodeDiagnostics } from '@/utils/room-codes';

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

      console.log('🔍 Looking up room code:', roomCode);
      console.log('🔍 Available cache mappings:', Object.keys(RoomCodeManager.getCodeMappings()));
      
      // Try to find room ID from code (now async with server lookup)
      const roomId = await RoomCodeManager.getRoomIdFromCode(roomCode);
      
      if (roomId) {
        // Found existing mapping, join directly
        console.log('🎯 Joining existing room via code:', roomCode, '→', roomId);
        router.push(`/chat/${roomId}`);
      } else {
        // No existing mapping found - this could mean:
        // 1. Server is offline/unreachable
        // 2. Room code doesn't exist yet
        // 3. Room code expired
        
        console.warn('❌ Room code not found on server:', roomCode);
        
        // Instead of creating a new room automatically, ask the user
        const shouldCreateNew = confirm(
          `Room code "${roomCode}" not found.\n\n` +
          'This could mean:\n' +
          '• The room doesn\'t exist yet\n' +
          '• The server is offline\n' +
          '• The code expired\n\n' +
          'Would you like to create a new room with this code?'
        );
        
        if (shouldCreateNew) {
          const slugifiedCode = roomCode.toLowerCase().replace(/[^a-z0-9-]/g, '');
          console.log('🆕 Creating new room from code:', roomCode, '→', slugifiedCode);
          router.push(`/chat/${slugifiedCode}`);
        } else {
          setError('Room code not found. Please check the code and try again.');
          setIsJoining(false);
        }
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
      <div className={`p-3 bg-blue-900/30 rounded-lg border border-blue-500/30 ${className}`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-blue-200">
              🎫 Room Code
            </div>
            <div className="font-mono text-xl font-bold text-blue-300">Loading...</div>
            <div className="text-xs text-blue-400 mt-1">
              <strong>Share this code</strong> for others to join instantly
            </div>
          </div>
          <div className="flex flex-col space-y-2">
            <button className="px-3 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium" disabled>
              📋 Copy
            </button>
          </div>
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
    <div className={`p-3 bg-blue-900/30 rounded-lg border border-blue-500/30 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-blue-200">
            🎫 Room Code
          </div>
          <div className="font-mono text-xl font-bold text-blue-300">{roomCode}</div>
          <div className="text-xs text-blue-400 mt-1">
            <strong>Share this code</strong> for others to join instantly
          </div>
        </div>
        <div className="flex flex-col space-y-2">
          <button 
            onClick={copyRoomCode} 
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
          >
            {copied ? '✅ Copied!' : '📋 Copy'}
          </button>
        </div>
      </div>
    </div>
  );
}

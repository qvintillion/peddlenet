'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RoomCodeManager } from '@/utils/room-codes';

interface RoomCodeJoinProps {
  className?: string;
}

export function RoomCodeJoin({ className = '' }: RoomCodeJoinProps) {
  const [roomCode, setRoomCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');
  const [recentRoomsKey, setRecentRoomsKey] = useState(0); // Force re-render after clearing
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

      // Try to find room ID from code (now async with server lookup)
      const roomId = await RoomCodeManager.getRoomIdFromCode(roomCode);
      
      if (roomId) {
        // Found existing mapping, join directly
        console.log('🎯 Joining existing room via code:', roomCode, '→', roomId);
        router.push(`/chat/${roomId}`);
      } else {
        // No existing mapping, treat code as new room ID
        const slugifiedCode = roomCode.toLowerCase().replace(/[^a-z0-9-]/g, '');
        console.log('🆕 Creating new room from code:', roomCode, '→', slugifiedCode);
        router.push(`/chat/${slugifiedCode}`);
      }
    } catch (error) {
      console.error('Failed to join room by code:', error);
      setError('Failed to join room. Please try again.');
      setIsJoining(false);
    }
  };

  const recentRooms = RoomCodeManager.getRecentRoomCodes();

  const clearRecentRooms = () => {
    if (confirm('Clear all recent rooms?')) {
      RoomCodeManager.clearRecentRooms();
      setRecentRoomsKey(prev => prev + 1); // Force re-render
    }
  };

  return (
    <div className={`${className}`}>
      {/* Recent Rooms - MOVED TO TOP */}
      {recentRooms.length > 0 && (
        <div className="mb-6" key={recentRoomsKey}>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-lg font-semibold text-white">Recent Rooms</h4>
            <button
              onClick={clearRecentRooms}
              className="text-sm px-3 py-1 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition"
            >
              Clear
            </button>
          </div>
          
          {/* Horizontal Scrolling Cards */}
          <div className="flex space-x-3 overflow-x-auto pb-3 scrollbar-hide">
            {recentRooms.map((room) => (
              <button
                key={room.roomId}
                onClick={() => {
                  setRoomCode(room.code);
                  setError('');
                }}
                className="flex-shrink-0 min-w-[140px] p-4 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600 hover:border-purple-500 transition-all"
              >
                <div className="text-xs text-gray-300 mb-1 truncate" title={room.roomId}>
                  {room.roomId}
                </div>
                <div className="font-mono text-sm font-medium text-purple-400 mb-1">
                  {room.code}
                </div>
                <div className="text-xs text-gray-400">
                  {RoomCodeManager.formatTimeAgo(room.timestamp)}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Room Code Input - BELOW RECENT ROOMS */}
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
      </form>
    </div>
  );
}

interface RoomCodeDisplayProps {
  roomId: string;
  className?: string;
}

export function RoomCodeDisplay({ roomId, className = '' }: RoomCodeDisplayProps) {
  const roomCode = RoomCodeManager.generateRoomCode(roomId);
  const [copied, setCopied] = useState(false);

  // Store the mapping and add to recent rooms (now async)
  React.useEffect(() => {
    const registerCode = async () => {
      await RoomCodeManager.storeCodeMapping(roomId, roomCode);
      RoomCodeManager.addToRecentRooms(roomId, roomCode);
    };
    registerCode();
  }, [roomId, roomCode]);

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
    <div className={`p-3 bg-blue-50 rounded-lg border border-blue-200 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-blue-900">
            🎫 Room Code
          </div>
          <div className="font-mono text-xl font-bold text-blue-700">{roomCode}</div>
          <div className="text-xs text-blue-600 mt-1">
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
          <div className="text-xs text-blue-500 text-center">
            Primary<br/>Join Method
          </div>
        </div>
      </div>
    </div>
  );
}

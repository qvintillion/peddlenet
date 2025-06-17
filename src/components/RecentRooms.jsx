'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RoomCodeManager } from '../utils/room-codes';

interface RecentRoomsProps {
  className?: string;
}

export function RecentRooms({ className = '' }: RecentRoomsProps) {
  const router = useRouter();
  const [recentRooms, setRecentRooms] = useState<any[]>([]);
  const [recentRoomsKey, setRecentRoomsKey] = useState(0);

  // Load recent rooms
  useEffect(() => {
    const rooms = RoomCodeManager.getRecentRoomCodes();
    setRecentRooms(rooms);
  }, [recentRoomsKey]);

  const handleQuickRejoin = (roomId: string) => {
    router.push(`/chat/${roomId}`);
  };

  const clearRecentRooms = () => {
    if (confirm('Clear all recent rooms?')) {
      RoomCodeManager.clearRecentRooms();
      setRecentRoomsKey(prev => prev + 1); // Force re-render
    }
  };

  if (recentRooms.length === 0) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-lg font-semibold text-white">Recent Rooms</h4>
        </div>
        <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-600/50 text-center">
          <div className="text-4xl mb-2">📚</div>
          <p className="text-sm text-gray-400 mb-1">No recent rooms yet</p>
          <p className="text-xs text-gray-500">
            Visit some rooms and they'll appear here for easy access
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`} key={recentRoomsKey}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-lg font-semibold text-white">Recent Rooms</h4>
        <button
          onClick={clearRecentRooms}
          className="text-sm px-3 py-1 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition"
        >
          Clear
        </button>
      </div>
      
      {/* Horizontal Scrolling Cards - Simple Design */}
      <div className="flex space-x-3 overflow-x-auto pb-3 scrollbar-hide">
        {recentRooms.map((room) => (
          <button
            key={room.roomId}
            onClick={() => handleQuickRejoin(room.roomId)}
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
  );
}

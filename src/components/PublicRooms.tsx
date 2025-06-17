'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePublicRoomStats } from '../hooks/use-public-room-stats';

interface PublicRoomsProps {
  className?: string;
}

export function PublicRooms({ className = '' }: PublicRoomsProps) {
  const router = useRouter();
  const { fetchRoomStats, getRoomActiveUsers, isLoading } = usePublicRoomStats();

  // Public room suggestions for festivals
  const publicRooms = [
    { name: 'Main Stage Chat', emoji: '🎤' },
    { name: 'Food Court Meetup', emoji: '🍕' },
    { name: 'Lost & Found', emoji: '🔍' },
    { name: 'Ride Share', emoji: '🚗' },
    { name: 'After Party Planning', emoji: '🎉' },
    { name: 'VIP Lounge', emoji: '👑' }
  ];
  
  // Generate room IDs for stats fetching
  const roomIds = publicRooms.map(room => 
    room.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 32)
  );
  
  // Fetch room stats on component mount and periodically
  useEffect(() => {
    if (roomIds.length > 0) {
      fetchRoomStats(roomIds);
      
      // Update stats every 30 seconds
      const interval = setInterval(() => {
        fetchRoomStats(roomIds);
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, []); // Empty dependency array to avoid infinite re-renders
  
  const getRoomIdFromName = (roomName: string): string => {
    return roomName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 32);
  };

  const joinPublicRoom = (roomName: string) => {
    // Set display name if not already set
    let userName = localStorage.getItem('displayName');
    if (!userName) {
      userName = prompt('Enter your display name:') || `Guest_${Math.floor(Math.random() * 1000)}`;
      localStorage.setItem('displayName', userName);
    }

    // Create room ID from name (same logic as create room)
    const roomId = roomName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 32);
    
    // Navigate to the public room
    router.push(`/chat/${roomId}`);
  };

  return (
    <div className={`${className}`}>
      <div className="mb-3">
        <h4 className="text-lg font-semibold text-white mb-2">Public Rooms</h4>
        <p className="text-sm text-gray-400">
          Join these open rooms - no code needed. Messages auto-clear every 24 hours.
        </p>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {publicRooms.map((room) => {
          const roomId = getRoomIdFromName(room.name);
          const activeUsers = getRoomActiveUsers(roomId);
          
          return (
            <button
              key={room.name}
              onClick={() => joinPublicRoom(room.name)}
              className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600 hover:border-purple-500 transition-all text-left"
            >
              <div className="flex items-center space-x-2">
                <span className="text-lg">{room.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">{room.name}</div>
                  <div className="text-xs text-gray-400">
                    {activeUsers > 0 ? (
                      <span className="text-green-400">
                        {activeUsers} {activeUsers === 1 ? 'person' : 'people'} active
                      </span>
                    ) : (
                      'Open to all'
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

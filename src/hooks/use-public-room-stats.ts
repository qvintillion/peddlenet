'use client';

import { useState, useEffect } from 'react';
import { ServerUtils } from '@/utils/server-utils';

interface RoomStats {
  roomId: string;
  activeUsers: number;
  lastUpdated: number;
}

const CACHE_DURATION = 30000; // 30 seconds
const UPDATE_INTERVAL = 15000; // Update every 15 seconds

export function usePublicRoomStats() {
  const [roomStats, setRoomStats] = useState<Record<string, RoomStats>>({});
  const [isLoading, setIsLoading] = useState(false);

  const fetchRoomStats = async (roomIds: string[]) => {
    if (roomIds.length === 0) return;
    
    setIsLoading(true);
    
    try {
      const serverUrl = ServerUtils.getHttpServerUrl();
      if (!serverUrl) {
        console.warn('No server URL available for room stats');
        return;
      }

      // Fetch stats for each room
      const statsPromises = roomIds.map(async (roomId) => {
        try {
          const response = await fetch(`${serverUrl}/room-stats/${roomId}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            return {
              roomId,
              activeUsers: data.activeUsers || 0,
              lastUpdated: Date.now(),
            };
          } else if (response.status === 404) {
            // 404 is expected for rooms that don't exist yet - handle silently
            // Don't log anything for 404s to keep console clean
            return {
              roomId,
              activeUsers: 0,
              lastUpdated: Date.now(),
            };
          } else {
            // Only log warnings for non-404 errors
            console.warn(`Failed to fetch stats for room ${roomId}: ${response.status}`);
          }
        } catch (error) {
          // Only log actual network/fetch errors, not expected 404s
          if (!error.message.includes('404')) {
            console.warn(`Failed to fetch stats for room ${roomId}:`, error.message);
          }
        }
        
        // Return zero users if endpoint fails
        return {
          roomId,
          activeUsers: 0,
          lastUpdated: Date.now(),
        };
      });

      const results = await Promise.all(statsPromises);
      
      const newStats: Record<string, RoomStats> = {};
      results.forEach(stat => {
        newStats[stat.roomId] = stat;
      });
      
      setRoomStats(prev => ({ ...prev, ...newStats }));
    } catch (error) {
      console.error('Failed to fetch room stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRoomActiveUsers = (roomId: string): number => {
    const stats = roomStats[roomId];
    if (!stats) return 0;
    
    // Check if stats are still fresh
    const isStale = Date.now() - stats.lastUpdated > CACHE_DURATION;
    return isStale ? 0 : stats.activeUsers;
  };

  return {
    fetchRoomStats,
    getRoomActiveUsers,
    isLoading,
    roomStats,
  };
}
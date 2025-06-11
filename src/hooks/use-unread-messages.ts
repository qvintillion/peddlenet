'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Message } from '@/lib/types';

// Interface for tracking unread messages per room
interface UnreadMessageCount {
  roomId: string;
  count: number;
  lastMessageTimestamp: number;
  lastSeenTimestamp: number;
}

// Singleton class to manage unread message counts
class UnreadMessageManager {
  private unreadCounts: Map<string, UnreadMessageCount> = new Map();
  private listeners: Set<(counts: Map<string, UnreadMessageCount>) => void> = new Set();
  private isInitialized = false;

  initialize() {
    if (this.isInitialized) return;
    
    console.log('📊 Initializing Unread Message Manager');
    this.isInitialized = true;
    this.loadPersistedCounts();
  }

  private loadPersistedCounts() {
    try {
      const saved = localStorage.getItem('peddlenet_unread_counts');
      if (saved) {
        const data = JSON.parse(saved);
        data.forEach((count: UnreadMessageCount) => {
          // Only restore counts from last 7 days to prevent stale data
          if (Date.now() - count.lastMessageTimestamp < 7 * 24 * 60 * 60 * 1000) {
            this.unreadCounts.set(count.roomId, count);
          }
        });
        console.log('📊 Restored unread counts for', this.unreadCounts.size, 'rooms');
      }
    } catch (error) {
      console.warn('Failed to load unread counts:', error);
    }
  }

  private savePersistedCounts() {
    try {
      const counts = Array.from(this.unreadCounts.values());
      localStorage.setItem('peddlenet_unread_counts', JSON.stringify(counts));
    } catch (error) {
      console.warn('Failed to save unread counts:', error);
    }
  }

  // Increment unread count for a room when a new message arrives
  addUnreadMessage(message: Message) {
    if (!message.roomId) return;

    const existing = this.unreadCounts.get(message.roomId) || {
      roomId: message.roomId,
      count: 0,
      lastMessageTimestamp: 0,
      lastSeenTimestamp: Date.now() // Initialize to now for new rooms
    };

    // Only increment if this message is newer than when user last saw the room
    if (message.timestamp > existing.lastSeenTimestamp) {
      existing.count++;
      existing.lastMessageTimestamp = Math.max(existing.lastMessageTimestamp, message.timestamp);
      
      this.unreadCounts.set(message.roomId, existing);
      this.savePersistedCounts();
      this.notifyListeners();
      
      console.log('📊 Incremented unread count for', message.roomId, 'to', existing.count);
    }
  }

  // Mark all messages in a room as read (when user enters/views the room)
  markRoomAsRead(roomId: string) {
    if (!roomId) return;

    const existing = this.unreadCounts.get(roomId);
    if (existing && existing.count > 0) {
      console.log('📊 Marking room as read:', roomId, '(was', existing.count, 'unread)');
      
      existing.count = 0;
      existing.lastSeenTimestamp = Date.now();
      
      this.unreadCounts.set(roomId, existing);
      this.savePersistedCounts();
      this.notifyListeners();
    }
  }

  // Get unread count for a specific room
  getUnreadCount(roomId: string): number {
    return this.unreadCounts.get(roomId)?.count || 0;
  }

  // Get all unread counts
  getAllUnreadCounts(): Map<string, UnreadMessageCount> {
    return new Map(this.unreadCounts);
  }

  // Clean up old unread counts (older than 7 days)
  cleanup() {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    let cleaned = 0;
    
    for (const [roomId, count] of this.unreadCounts.entries()) {
      if (count.lastMessageTimestamp < cutoff) {
        this.unreadCounts.delete(roomId);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log('📊 Cleaned up', cleaned, 'old unread counts');
      this.savePersistedCounts();
      this.notifyListeners();
    }
  }

  // Subscribe to unread count changes
  addListener(listener: (counts: Map<string, UnreadMessageCount>) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(new Map(this.unreadCounts));
      } catch (error) {
        console.error('Unread message listener error:', error);
      }
    });
  }
}

// Global singleton instance
const unreadMessageManager = new UnreadMessageManager();

// Hook for components to track unread messages
export function useUnreadMessages() {
  const [unreadCounts, setUnreadCounts] = useState<Map<string, UnreadMessageCount>>(new Map());

  useEffect(() => {
    // Initialize manager
    unreadMessageManager.initialize();
    
    // Get initial state
    setUnreadCounts(unreadMessageManager.getAllUnreadCounts());
    
    // Subscribe to changes
    const unsubscribe = unreadMessageManager.addListener(setUnreadCounts);
    
    // Cleanup old counts periodically
    const cleanupInterval = setInterval(() => {
      unreadMessageManager.cleanup();
    }, 60 * 60 * 1000); // Every hour
    
    return () => {
      unsubscribe();
      clearInterval(cleanupInterval);
    };
  }, []);

  const markRoomAsRead = useCallback((roomId: string) => {
    unreadMessageManager.markRoomAsRead(roomId);
  }, []);

  const getUnreadCount = useCallback((roomId: string) => {
    return unreadMessageManager.getUnreadCount(roomId);
  }, []);

  return {
    unreadCounts,
    markRoomAsRead,
    getUnreadCount
  };
}

// Hook specifically for the current room to mark messages as read
export function useRoomUnreadTracker(roomId: string, isActive: boolean = true) {
  const { markRoomAsRead } = useUnreadMessages();

  useEffect(() => {
    if (roomId && isActive) {
      // Mark room as read when user enters or when component mounts
      markRoomAsRead(roomId);
      
      // Also mark as read when the page becomes visible (user returns to tab)
      const handleVisibilityChange = () => {
        if (!document.hidden && isActive) {
          markRoomAsRead(roomId);
        }
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [roomId, isActive, markRoomAsRead]);
}

// Export the manager for integration with background notifications
export { unreadMessageManager };

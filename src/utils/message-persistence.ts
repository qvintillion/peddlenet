/**
 * Message persistence utilities for PeddleNet
 * Ensures messages survive page refreshes and notification clicks
 */


export interface PersistedRoom {
  roomId: string;
  messages: Message[];
  lastActivity: number;
  participantCount: number;
}

export class MessagePersistence {
  private static readonly STORAGE_KEY = 'peddlenet_messages';
  private static readonly MAX_ROOMS = 10; // Limit stored rooms
  private static readonly MAX_MESSAGES_PER_ROOM = 500; // Limit messages per room
  private static readonly ROOM_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Save messages for a specific room
   */
  static saveRoomMessages(roomId: string, messages: Message[], participantCount: number = 0): void {
    try {
      const stored = this.getAllRooms();
      
      // Update or create room entry
      stored[roomId] = {
        roomId,
        messages: messages.slice(-this.MAX_MESSAGES_PER_ROOM), // Keep only recent messages
        lastActivity: Date.now(),
        participantCount
      };

      // Clean up old rooms to prevent storage bloat
      this.cleanupOldRooms(stored);
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(stored));
      console.log(`💾 Saved ${messages.length} messages for room ${roomId}`);
    } catch (error) {
      console.warn('Failed to save room messages:', error);
    }
  }

  /**
   * Get messages for a specific room
   */
  static getRoomMessages(roomId: string): Message[] {
    try {
      const stored = this.getAllRooms();
      const room = stored[roomId];
      
      if (!room) {
        console.log(`📂 No stored messages found for room ${roomId}`);
        return [];
      }

      // Check if room is expired
      if (Date.now() - room.lastActivity > this.ROOM_EXPIRY) {
        console.log(`🕰️ Room ${roomId} messages expired, clearing`);
        this.clearRoomMessages(roomId);
        return [];
      }

      console.log(`📂 Loaded ${room.messages.length} messages for room ${roomId}`);
      return room.messages;
    } catch (error) {
      console.warn('Failed to load room messages:', error);
      return [];
    }
  }

  /**
   * Add a single message to a room (for real-time updates)
   */
  static addMessage(roomId: string, message: Message): void {
    try {
      const stored = this.getAllRooms();
      const room = stored[roomId];
      
      if (!room) {
        // Create new room entry
        stored[roomId] = {
          roomId,
          messages: [message],
          lastActivity: Date.now(),
          participantCount: 0
        };
      } else {
        // Check for duplicates
        const isDuplicate = room.messages.some(m => 
          m.id === message.id || 
          (m.content === message.content && m.sender === message.sender && 
           Math.abs(m.timestamp - message.timestamp) < 1000)
        );
        
        if (!isDuplicate) {
          room.messages.push(message);
          room.messages = room.messages
            .sort((a, b) => a.timestamp - b.timestamp)
            .slice(-this.MAX_MESSAGES_PER_ROOM);
          room.lastActivity = Date.now();
        } else {
          console.log('⚠️ Duplicate message not added to storage:', message.id);
        }
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(stored));
    } catch (error) {
      console.warn('Failed to add message to storage:', error);
    }
  }

  /**
   * Clear messages for a specific room
   */
  static clearRoomMessages(roomId: string): void {
    try {
      const stored = this.getAllRooms();
      delete stored[roomId];
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(stored));
      console.log(`🗑️ Cleared messages for room ${roomId}`);
    } catch (error) {
      console.warn('Failed to clear room messages:', error);
    }
  }

  /**
   * Get all stored rooms
   */
  private static getAllRooms(): Record<string, PersistedRoom> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.warn('Failed to parse stored rooms:', error);
      return {};
    }
  }

  /**
   * Clean up old rooms to prevent storage bloat
   */
  private static cleanupOldRooms(stored: Record<string, PersistedRoom>): void {
    const roomEntries = Object.entries(stored);
    
    // Remove expired rooms
    const activeRooms = roomEntries.filter(([_, room]) => 
      Date.now() - room.lastActivity < this.ROOM_EXPIRY
    );

    // If still too many rooms, keep only the most recent ones
    if (activeRooms.length > this.MAX_ROOMS) {
      activeRooms.sort(([_, a], [__, b]) => b.lastActivity - a.lastActivity);
      const roomsToKeep = activeRooms.slice(0, this.MAX_ROOMS);
      
      // Clear the stored object and repopulate with kept rooms
      Object.keys(stored).forEach(key => delete stored[key]);
      roomsToKeep.forEach(([roomId, room]) => {
        stored[roomId] = room;
      });
      
      console.log(`🧹 Cleaned up old rooms, keeping ${roomsToKeep.length} most recent`);
    }
  }

  /**
   * Get storage statistics
   */
  static getStorageStats(): {
    totalRooms: number;
    totalMessages: number;
    oldestRoom: string | null;
    newestRoom: string | null;
    storageSize: number;
  } {
    try {
      const stored = this.getAllRooms();
      const roomEntries = Object.entries(stored);
      
      if (roomEntries.length === 0) {
        return {
          totalRooms: 0,
          totalMessages: 0,
          oldestRoom: null,
          newestRoom: null,
          storageSize: 0
        };
      }

      const totalMessages = roomEntries.reduce((sum, [_, room]) => sum + room.messages.length, 0);
      
      const sortedByActivity = roomEntries.sort(([_, a], [__, b]) => a.lastActivity - b.lastActivity);
      const oldestRoom = sortedByActivity[0][0];
      const newestRoom = sortedByActivity[sortedByActivity.length - 1][0];
      
      const storageString = localStorage.getItem(this.STORAGE_KEY) || '';
      const storageSize = new Blob([storageString]).size;

      return {
        totalRooms: roomEntries.length,
        totalMessages,
        oldestRoom,
        newestRoom,
        storageSize
      };
    } catch (error) {
      console.warn('Failed to get storage stats:', error);
      return {
        totalRooms: 0,
        totalMessages: 0,
        oldestRoom: null,
        newestRoom: null,
        storageSize: 0
      };
    }
  }

  /**
   * Clear all stored messages (for privacy/debugging)
   */
  static clearAllMessages(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('🗑️ Cleared all stored messages');
    } catch (error) {
      console.warn('Failed to clear all messages:', error);
    }
  }

  /**
   * Merge server messages with locally stored messages
   * Handles the case where server provides message history
   */
  static mergeMessages(roomId: string, serverMessages: Message[], localMessages: Message[]): Message[] {
    try {
      // Create a map to track unique messages by ID and content
      const messageMap = new Map<string, Message>();
      
      // Add all messages, preferring server messages for conflicts
      [...localMessages, ...serverMessages].forEach(message => {
        const key = message.id || `${message.content}_${message.sender}_${message.timestamp}`;
        
        // Always prefer server messages (they come later in the array)
        // but keep messages that are only local (e.g., just sent)
        if (!messageMap.has(key) || serverMessages.includes(message)) {
          messageMap.set(key, message);
        }
      });
      
      // Convert back to array and sort by timestamp
      const mergedMessages = Array.from(messageMap.values())
        .sort((a, b) => a.timestamp - b.timestamp);
      
      console.log(`🔄 Merged messages for room ${roomId}:`, {
        server: serverMessages.length,
        local: localMessages.length,
        merged: mergedMessages.length
      });
      
      return mergedMessages;
    } catch (error) {
      console.warn('Failed to merge messages:', error);
      // Fallback to server messages if merge fails
      return serverMessages.length > 0 ? serverMessages : localMessages;
    }
  }
}

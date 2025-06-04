/**
 * Room code utilities for easy reconnection at festivals
 * Generates memorable codes that allow manual room joining
 */

export class RoomCodeManager {
  private static readonly ADJECTIVES = [
    'blue', 'red', 'gold', 'green', 'bright', 'magic', 'cosmic', 'electric',
    'neon', 'disco', 'wild', 'epic', 'mega', 'super', 'ultra', 'hyper'
  ];

  private static readonly NOUNS = [
    'stage', 'beat', 'vibe', 'party', 'crew', 'squad', 'tribe', 'gang',
    'fest', 'wave', 'zone', 'spot', 'camp', 'den', 'base', 'hub'
  ];

  /**
   * Generate a memorable room code from room ID
   */
  static generateRoomCode(roomId: string): string {
    // Use room ID as seed for consistent codes
    const hash = this.hashString(roomId);
    
    const adjIndex = Math.abs(hash) % this.ADJECTIVES.length;
    const nounIndex = Math.abs(hash >> 8) % this.NOUNS.length;
    const number = (Math.abs(hash >> 16) % 99) + 1;
    
    return `${this.ADJECTIVES[adjIndex]}-${this.NOUNS[nounIndex]}-${number}`;
  }

  /**
   * Extract room ID from room code
   */
  static getRoomIdFromCode(code: string): string | null {
    // For now, we'll need to search through possible room IDs
    // In a real implementation, you'd want a lookup service
    const normalizedCode = code.toLowerCase().trim();
    
    // Store code mappings in localStorage for session
    const mappings = this.getCodeMappings();
    return mappings[normalizedCode] || null;
  }

  /**
   * Store room code mapping for session
   */
  static storeCodeMapping(roomId: string, code: string): void {
    const mappings = this.getCodeMappings();
    mappings[code.toLowerCase()] = roomId;
    
    try {
      localStorage.setItem('peddlenet_room_codes', JSON.stringify(mappings));
    } catch (error) {
      console.warn('Failed to store room code mapping:', error);
    }
  }

  /**
   * Get stored room code mappings
   */
  private static getCodeMappings(): Record<string, string> {
    try {
      const stored = localStorage.getItem('peddlenet_room_codes');
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      return {};
    }
  }

  /**
   * Simple hash function for consistent code generation
   */
  private static hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }

  /**
   * Validate room code format
   */
  static isValidRoomCode(code: string): boolean {
    const pattern = /^[a-z]+-[a-z]+-\d{1,2}$/i;
    return pattern.test(code.trim());
  }

  /**
   * Get recent room codes for quick access
   */
  static getRecentRoomCodes(): Array<{ code: string; roomId: string; timestamp: number }> {
    try {
      const recent = localStorage.getItem('peddlenet_recent_rooms');
      if (!recent) return [];
      
      const rooms = JSON.parse(recent);
      return rooms
        .filter((room: any) => Date.now() - room.timestamp < 24 * 60 * 60 * 1000) // Last 24 hours
        .sort((a: any, b: any) => b.timestamp - a.timestamp)
        .slice(0, 5); // Max 5 recent rooms
    } catch (error) {
      return [];
    }
  }

  /**
   * Add room to recent list
   */
  static addToRecentRooms(roomId: string, code: string): void {
    try {
      const recent = this.getRecentRoomCodes();
      const newRoom = {
        code,
        roomId,
        timestamp: Date.now()
      };

      // Remove existing entry for this room
      const filtered = recent.filter(room => room.roomId !== roomId);
      
      // Add new entry at the beginning
      const updated = [newRoom, ...filtered].slice(0, 5);
      
      localStorage.setItem('peddlenet_recent_rooms', JSON.stringify(updated));
    } catch (error) {
      console.warn('Failed to update recent rooms:', error);
    }
  }
}

/**
 * Room discovery utilities for finding nearby groups
 */
export class RoomDiscovery {
  /**
   * Broadcast room presence for nearby discovery
   */
  static broadcastPresence(roomId: string, displayName: string, peerId: string): void {
    // In a real implementation, this would use WebRTC data channels
    // or a lightweight signaling service to broadcast presence
    const presence = {
      roomId,
      displayName,
      peerId,
      timestamp: Date.now(),
      type: 'room_presence'
    };

    // For now, store in localStorage as a simple implementation
    // Real implementation would use broadcast channels or signaling
    this.storePresence(presence);
  }

  /**
   * Find nearby rooms that user might want to rejoin
   */
  static findNearbyRooms(excludeRoomId?: string): Array<{
    roomId: string;
    displayName: string;
    peerId: string;
    lastSeen: number;
  }> {
    try {
      const stored = localStorage.getItem('peddlenet_nearby_presence');
      if (!stored) return [];

      const presence = JSON.parse(stored);
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

      return presence
        .filter((p: any) => 
          p.timestamp > fiveMinutesAgo && 
          p.roomId !== excludeRoomId
        )
        .sort((a: any, b: any) => b.timestamp - a.timestamp);
    } catch (error) {
      return [];
    }
  }

  private static storePresence(presence: any): void {
    try {
      const stored = localStorage.getItem('peddlenet_nearby_presence');
      const existing = stored ? JSON.parse(stored) : [];
      
      // Remove old presence for same room/user
      const filtered = existing.filter((p: any) => 
        !(p.roomId === presence.roomId && p.displayName === presence.displayName)
      );
      
      // Add new presence
      const updated = [presence, ...filtered].slice(0, 20); // Keep last 20
      
      localStorage.setItem('peddlenet_nearby_presence', JSON.stringify(updated));
    } catch (error) {
      console.warn('Failed to store presence:', error);
    }
  }
}

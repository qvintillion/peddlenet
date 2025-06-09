import { ServerUtils } from './server-utils';

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
    
    const code = `${this.ADJECTIVES[adjIndex]}-${this.NOUNS[nounIndex]}-${number}`;
    
    console.log('🏷️ Generated room code:', code, 'for room ID:', roomId, 'hash:', hash);
    
    return code;
  }

  /**
   * Extract room ID from room code (now with server lookup AND reverse engineering)
   */
  static async getRoomIdFromCode(code: string): Promise<string | null> {
    const normalizedCode = code.toLowerCase().trim();
    
    console.log('🔍 getRoomIdFromCode called with:', normalizedCode);
    
    // First try localStorage cache for faster lookup
    const mappings = this.getStoredCodeMappings();
    const cachedRoomId = mappings[normalizedCode];
    
    if (cachedRoomId) {
      console.log('🔍 Found room code in cache:', normalizedCode, '->', cachedRoomId);
      
      // Still check server to make sure room is active (optional verification)
      try {
        const serverUrl = ServerUtils.getHttpServerUrl();
        const response = await fetch(`${serverUrl}/resolve-room-code/${encodeURIComponent(normalizedCode)}`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000), // 5 second timeout
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.roomId === cachedRoomId) {
            console.log('✅ Server confirmed cached room code is still valid');
            return cachedRoomId;
          } else if (data.success && data.roomId !== cachedRoomId) {
            console.log('🔄 Server has different room ID for code, updating cache');
            this.storeCodeMapping(data.roomId, normalizedCode);
            return data.roomId;
          }
        }
      } catch (error) {
        console.warn('⚠️ Could not verify cached room code with server, using cached version:', error);
      }
      
      // Use cached version if server check fails
      return cachedRoomId;
    }
    
    // Try server lookup for room codes created by other users
    console.log('🌐 Checking server for room code:', normalizedCode);
    
    try {
      const serverUrl = ServerUtils.getHttpServerUrl();
      console.log('🔗 Requesting:', `${serverUrl}/resolve-room-code/${encodeURIComponent(normalizedCode)}`);
      
      const response = await fetch(`${serverUrl}/resolve-room-code/${encodeURIComponent(normalizedCode)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(8000), // 8 second timeout for server lookup
        mode: 'cors'
      });
      
      console.log('📡 Server response status:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📄 Server response data:', data);
        
        if (data.success && data.roomId) {
          console.log('✅ Found room code on server:', normalizedCode, '->', data.roomId);
          // Cache it locally for future use (but don't await - do it in background)
          this.storeCodeMapping(data.roomId, normalizedCode).catch(err => 
            console.warn('Failed to cache room code mapping:', err)
          );
          return data.roomId;
        }
      } else if (response.status === 404) {
        console.log('🚫 Room code not found on server (404):', normalizedCode);
        // Don't fall through to reverse engineering yet - let's see if server is just missing the endpoints
      } else {
        console.warn('⚠️ Server response not OK:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ Failed to resolve room code on server:', error);
      console.error('Error details:', {
        code: normalizedCode,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
    }
    
    // FALLBACK: Try reverse engineering common room ID patterns
    console.log('🔧 Attempting reverse engineering for room code:', normalizedCode);
    const possibleRoomIds = this.generatePossibleRoomIds(normalizedCode);
    
    for (const possibleRoomId of possibleRoomIds) {
      const generatedCode = this.generateRoomCode(possibleRoomId);
      if (generatedCode === normalizedCode) {
        console.log('✅ Reverse engineered room ID:', possibleRoomId, 'for code:', normalizedCode);
        // Cache this mapping for future use
        this.storeCodeMapping(possibleRoomId, normalizedCode).catch(err => 
          console.warn('Failed to cache reverse-engineered mapping:', err)
        );
        return possibleRoomId;
      }
    }
    
    console.log('🚫 Room code not found anywhere:', normalizedCode);
    return null;
  }

  /**
   * Generate possible room IDs that could produce this room code
   * This is a reverse engineering approach for when server lookup fails
   */
  private static generatePossibleRoomIds(roomCode: string): string[] {
    const possibleIds: string[] = [];
    
    // Extract the parts from the room code
    const parts = roomCode.split('-');
    if (parts.length !== 3) {
      return possibleIds;
    }
    
    const [adjective, noun, numberStr] = parts;
    
    // Common room ID patterns based on the code components
    const commonPatterns = [
      // Direct conversion: "blue-stage-42" -> "blue-stage-42"
      roomCode,
      
      // Title case: "blue-stage-42" -> "Blue-Stage-42"
      parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('-'),
      
      // Spaces: "blue-stage-42" -> "blue stage 42"
      parts.join(' '),
      
      // Title case with spaces: "Blue Stage 42"
      parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' '),
      
      // Without numbers: "blue-stage"
      `${adjective}-${noun}`,
      
      // Just the noun: "stage"
      noun,
      
      // Common room naming patterns
      `${adjective}-${noun}-room`,
      `${adjective}-${noun}-chat`,
      `${adjective}-${noun}-${numberStr}`,
      `${noun}-${numberStr}`,
      `${adjective}-room`,
      `${noun}-room`,
      
      // Festival-specific patterns
      `${adjective}-${noun}-fest`,
      `${adjective}-${noun}-party`,
      `${noun}-${adjective}`,
      `${noun}-${adjective}-${numberStr}`
    ];
    
    // Add variations with different cases and separators
    const variations: string[] = [];
    for (const pattern of commonPatterns) {
      variations.push(
        pattern,
        pattern.toLowerCase(),
        pattern.toUpperCase(),
        pattern.replace(/-/g, '_'),
        pattern.replace(/-/g, ''),
        pattern.replace(/ /g, '-'),
        pattern.replace(/ /g, '_'),
        pattern.replace(/ /g, '')
      );
    }
    
    // Remove duplicates and return
    return [...new Set(variations)];
  }

  /**
   * Store room code mapping for session AND register with server
   */
  static async storeCodeMapping(roomId: string, code: string): Promise<void> {
    const normalizedCode = code.toLowerCase();
    
    // Store locally first
    const mappings = this.getStoredCodeMappings();
    mappings[normalizedCode] = roomId;
    
    try {
      localStorage.setItem('peddlenet_room_codes', JSON.stringify(mappings));
      console.log('💾 Stored room code mapping locally:', normalizedCode, '->', roomId);
    } catch (error) {
      console.warn('Failed to store room code mapping locally:', error);
    }
    
    // Register with server so others can find it (with better error handling)
    try {
      const serverUrl = ServerUtils.getHttpServerUrl();
      console.log('📡 Registering room code with server:', `${serverUrl}/register-room-code`);
      
      const response = await fetch(`${serverUrl}/register-room-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          roomId,
          roomCode: normalizedCode
        }),
        signal: AbortSignal.timeout(10000), // 10 second timeout
        mode: 'cors'
      });
      
      console.log('📡 Server registration response:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📄 Server registration data:', data);
      
      if (data.success) {
        console.log('✅ Room code registered with server:', normalizedCode, '->', roomId);
      } else {
        console.warn('⚠️ Server rejected room code registration:', data.error);
      }
    } catch (error) {
      console.error('❌ Failed to register room code with server:', error);
      console.error('Registration error details:', {
        roomId,
        code: normalizedCode,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      // Continue anyway - local storage will work for this user
    }
  }

  /**
   * Get stored room code mappings (public for debugging)
   */
  static getCodeMappings(): Record<string, string> {
    return this.getStoredCodeMappings();
  }

  /**
   * Get stored room code mappings (private implementation)
   */
  private static getStoredCodeMappings(): Record<string, string> {
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
   * Enhanced for horizontal scrolling with more items and 7-day retention
   */
  static getRecentRoomCodes(): Array<{ 
    code: string; 
    roomId: string; 
    timestamp: number;
    displayName?: string;
  }> {
    try {
      const recent = localStorage.getItem('peddlenet_recent_rooms');
      if (!recent) return [];
      
      const rooms = JSON.parse(recent);
      return rooms
        .filter((room: any) => Date.now() - room.timestamp < 7 * 24 * 60 * 60 * 1000) // 7 days retention
        .sort((a: any, b: any) => b.timestamp - a.timestamp)
        .slice(0, 8); // Max 8 for horizontal scroll
    } catch (error) {
      return [];
    }
  }

  /**
   * Clear all recent rooms
   */
  static clearRecentRooms(): void {
    try {
      localStorage.removeItem('peddlenet_recent_rooms');
      console.log('✅ Recent rooms cleared');
    } catch (error) {
      console.warn('Failed to clear recent rooms:', error);
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
      const updated = [newRoom, ...filtered].slice(0, 8); // Keep max 8 for horizontal scroll
      
      localStorage.setItem('peddlenet_recent_rooms', JSON.stringify(updated));
    } catch (error) {
      console.warn('Failed to update recent rooms:', error);
    }
  }


  
  /**
   * Format timestamp for display in recent rooms
   */
  static formatTimeAgo(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    
    // Less than 1 minute
    if (diff < 60 * 1000) {
      return 'Just now';
    }
    
    // Less than 1 hour
    if (diff < 60 * 60 * 1000) {
      const minutes = Math.floor(diff / (60 * 1000));
      return `${minutes}m ago`;
    }
    
    // Less than 1 day
    if (diff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diff / (60 * 60 * 1000));
      return `${hours}h ago`;
    }
    
    // Less than 7 days
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      const days = Math.floor(diff / (24 * 60 * 60 * 1000));
      return `${days}d ago`;
    }
    
    // Fallback to date
    return new Date(timestamp).toLocaleDateString();
  }
}

/**
 * Room code debugging and diagnostics utilities
 */
export class RoomCodeDiagnostics {
  /**
   * Test room code functionality end-to-end
   */
  static async testRoomCodeSystem(testCode: string = 'test-debug-42'): Promise<{
    success: boolean;
    steps: Array<{ step: string; success: boolean; data?: any; error?: string }>;
  }> {
    const results = {
      success: false,
      steps: [] as Array<{ step: string; success: boolean; data?: any; error?: string }>
    };
    
    // Step 1: Generate a room code
    try {
      const testRoomId = 'test-room-debug-' + Date.now();
      const generatedCode = RoomCodeManager.generateRoomCode(testRoomId);
      results.steps.push({
        step: 'Generate room code',
        success: true,
        data: { roomId: testRoomId, code: generatedCode }
      });
      
      // Step 2: Store the mapping
      try {
        await RoomCodeManager.storeCodeMapping(testRoomId, generatedCode);
        results.steps.push({
          step: 'Store room code mapping',
          success: true,
          data: { roomId: testRoomId, code: generatedCode }
        });
        
        // Step 3: Retrieve the mapping
        try {
          const retrievedRoomId = await RoomCodeManager.getRoomIdFromCode(generatedCode);
          if (retrievedRoomId === testRoomId) {
            results.steps.push({
              step: 'Retrieve room code mapping',
              success: true,
              data: { expected: testRoomId, actual: retrievedRoomId }
            });
            results.success = true;
          } else {
            results.steps.push({
              step: 'Retrieve room code mapping',
              success: false,
              error: `Expected ${testRoomId}, got ${retrievedRoomId}`
            });
          }
        } catch (error) {
          results.steps.push({
            step: 'Retrieve room code mapping',
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      } catch (error) {
        results.steps.push({
          step: 'Store room code mapping',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    } catch (error) {
      results.steps.push({
        step: 'Generate room code',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    
    return results;
  }
  
  /**
   * Test server connectivity for room codes
   */
  static async testServerConnectivity(): Promise<{
    serverReachable: boolean;
    httpUrl: string;
    health?: any;
    roomCodeEndpoints?: {
      register: boolean;
      resolve: boolean;
    };
    error?: string;
  }> {
    try {
      const serverUrl = ServerUtils.getHttpServerUrl();
      
      // Test health endpoint
      const healthResponse = await fetch(`${serverUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      
      if (!healthResponse.ok) {
        return {
          serverReachable: false,
          httpUrl: serverUrl,
          error: `Health check failed: HTTP ${healthResponse.status}`
        };
      }
      
      const health = await healthResponse.json();
      
      // Test room code endpoints
      const testCode = 'test-connectivity-' + Date.now();
      const testRoomId = 'test-room-' + Date.now();
      
      // Test register endpoint
      let registerWorks = false;
      try {
        const registerResponse = await fetch(`${serverUrl}/register-room-code`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId: testRoomId, roomCode: testCode }),
          signal: AbortSignal.timeout(5000)
        });
        registerWorks = registerResponse.ok;
      } catch (error) {
        console.warn('Register endpoint test failed:', error);
      }
      
      // Test resolve endpoint
      let resolveWorks = false;
      try {
        const resolveResponse = await fetch(`${serverUrl}/resolve-room-code/${testCode}`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000)
        });
        resolveWorks = resolveResponse.status === 200 || resolveResponse.status === 404; // 404 is fine for non-existent code
      } catch (error) {
        console.warn('Resolve endpoint test failed:', error);
      }
      
      return {
        serverReachable: true,
        httpUrl: serverUrl,
        health,
        roomCodeEndpoints: {
          register: registerWorks,
          resolve: resolveWorks
        }
      };
      
    } catch (error) {
      return {
        serverReachable: false,
        httpUrl: ServerUtils.getHttpServerUrl(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
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

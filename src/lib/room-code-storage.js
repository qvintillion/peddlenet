/**
 * Shared room code storage for Next.js API routes
 * This ensures both register and resolve endpoints use the same data store
 */

// Shared in-memory storage for room codes
// In production, you'd want to use a database like Vercel KV or Redis
const roomCodeMappings = new Map<string, string>();

export class RoomCodeStorage {
  /**
   * Store a room code mapping
   */
  static set(roomCode: string, roomId: string): void {
    const normalizedCode = roomCode.toLowerCase();
    roomCodeMappings.set(normalizedCode, roomId);
    console.log(`📋 Stored room code mapping: ${normalizedCode} -> ${roomId}`);
  }

  /**
   * Get a room ID by room code
   */
  static get(roomCode: string): string | undefined {
    const normalizedCode = roomCode.toLowerCase();
    return roomCodeMappings.get(normalizedCode);
  }

  /**
   * Check if a room code exists
   */
  static has(roomCode: string): boolean {
    const normalizedCode = roomCode.toLowerCase();
    return roomCodeMappings.has(normalizedCode);
  }

  /**
   * Get all stored mappings (for debugging)
   */
  static getAll(): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [code, roomId] of roomCodeMappings.entries()) {
      result[code] = roomId;
    }
    return result;
  }

  /**
   * Get statistics about stored room codes
   */
  static getStats(): { totalCodes: number; mappings: string[] } {
    const mappings = Array.from(roomCodeMappings.entries()).map(
      ([code, roomId]) => `${code} -> ${roomId}`
    );
    return {
      totalCodes: roomCodeMappings.size,
      mappings
    };
  }

  /**
   * Clear all room code mappings (for testing)
   */
  static clear(): void {
    roomCodeMappings.clear();
    console.log('🗑️ Cleared all room code mappings');
  }
}

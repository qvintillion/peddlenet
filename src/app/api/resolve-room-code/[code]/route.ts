import { NextRequest, NextResponse } from 'next/server';
import { RoomCodeStorage } from '@/lib/room-code-storage';

// Required for static export builds
export const dynamic = 'force-dynamic';
export const revalidate = false;

// Import the room code generation logic
function generateRoomCodeOnServer(roomId: string): string | null {
  if (!roomId || typeof roomId !== 'string') return null;
  
  const adjectives = [
    'blue', 'red', 'gold', 'green', 'bright', 'magic', 'cosmic', 'electric',
    'neon', 'disco', 'wild', 'epic', 'mega', 'super', 'ultra', 'hyper'
  ];
  
  const nouns = [
    'stage', 'beat', 'vibe', 'party', 'crew', 'squad', 'tribe', 'gang',
    'fest', 'wave', 'zone', 'spot', 'camp', 'den', 'base', 'hub'
  ];
  
  // Simple hash function (matching client-side)
  let hash = 0;
  for (let i = 0; i < roomId.length; i++) {
    const char = roomId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  const adjIndex = Math.abs(hash) % adjectives.length;
  const nounIndex = Math.abs(hash >> 8) % nouns.length;
  const number = (Math.abs(hash >> 16) % 99) + 1;
  
  return `${adjectives[adjIndex]}-${nouns[nounIndex]}-${number}`;
}

function generatePossibleRoomIds(roomCode: string): string[] {
  const parts = roomCode.split('-');
  if (parts.length !== 3) return [];
  
  const [adjective, noun, numberStr] = parts;
  
  return [
    roomCode,
    parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('-'),
    parts.join(' '),
    parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' '),
    `${adjective}-${noun}`,
    noun,
    `${adjective}-${noun}-room`,
    `${noun}-${numberStr}`,
    `${adjective}-room`,
    `${noun}-room`,
    // Add slugified versions (most common)
    roomCode.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
  ].filter(id => id && id.length > 0);
}

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const code = params.code.toLowerCase();
    
    // Check stored mappings first using shared storage
    const roomId = RoomCodeStorage.get(code);
    
    if (roomId) {
      return NextResponse.json({
        success: true,
        roomId,
        code
      });
    }

    // Try auto-resolving with deterministic generation
    const possibleRoomIds = generatePossibleRoomIds(code);
    
    for (const possibleRoomId of possibleRoomIds) {
      try {
        const testCode = generateRoomCodeOnServer(possibleRoomId);
        if (testCode && testCode.toLowerCase() === code) {
          // Auto-register this mapping using shared storage
          RoomCodeStorage.set(code, possibleRoomId);
          console.log(`✨ Auto-resolved room code: ${code} -> ${possibleRoomId}`);
          
          return NextResponse.json({
            success: true,
            roomId: possibleRoomId,
            code,
            autoResolved: true
          });
        }
      } catch (error) {
        continue;
      }
    }
    
    return NextResponse.json({
      success: false,
      error: 'Room code not found'
    }, { status: 404 });

  } catch (error) {
    console.error('Error resolving room code:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Add CORS headers
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
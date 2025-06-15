import { NextRequest, NextResponse } from 'next/server';

// Simplified room code storage for Firebase Functions compatibility
const roomCodeMappings = new Map<string, string>();

// Required for Firebase Functions compatibility
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Explicitly set runtime

export async function POST(request: NextRequest) {
  try {
    console.log('📋 Room code registration attempt');
    
    const body = await request.json();
    const { roomId, roomCode } = body;

    if (!roomId || !roomCode) {
      console.error('❌ Missing required fields:', { roomId: !!roomId, roomCode: !!roomCode });
      return NextResponse.json(
        { error: 'roomId and roomCode are required' },
        { status: 400 }
      );
    }

    const normalizedCode = roomCode.toLowerCase();

    // Simple in-memory storage (for Firebase Functions)
    const existingRoomId = roomCodeMappings.get(normalizedCode);
    if (existingRoomId && existingRoomId !== roomId) {
      console.warn(`⚠️ Room code conflict: ${normalizedCode} already maps to ${existingRoomId}, requested for ${roomId}`);
      return NextResponse.json(
        { error: 'Room code already taken by another room' },
        { status: 409 }
      );
    }

    // Register the mapping
    roomCodeMappings.set(normalizedCode, roomId);
    
    console.log(`✅ Room code registered: ${normalizedCode} -> ${roomId}`);
    console.log(`📋 Total room codes stored: ${roomCodeMappings.size}`);

    return NextResponse.json({
      success: true,
      roomId,
      roomCode: normalizedCode,
      totalCodes: roomCodeMappings.size,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('❌ Room code registration error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
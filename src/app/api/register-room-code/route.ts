import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory storage for room codes
// In production, you'd want to use a database like Vercel KV or similar
const roomCodeMappings = new Map<string, string>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomId, roomCode } = body;

    if (!roomId || !roomCode) {
      return NextResponse.json(
        { error: 'roomId and roomCode are required' },
        { status: 400 }
      );
    }

    const normalizedCode = roomCode.toLowerCase();

    // Check if code is already taken by a different room
    const existingRoomId = roomCodeMappings.get(normalizedCode);
    if (existingRoomId && existingRoomId !== roomId) {
      return NextResponse.json(
        { error: 'Room code already taken by another room' },
        { status: 409 }
      );
    }

    // Register the mapping
    roomCodeMappings.set(normalizedCode, roomId);
    
    console.log(`📋 Registered room code: ${normalizedCode} -> ${roomId}`);

    return NextResponse.json({
      success: true,
      roomId,
      roomCode: normalizedCode
    });

  } catch (error) {
    console.error('Error registering room code:', error);
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const roomCodeMappings = new Map();

export async function POST(request) {
  try {
    const { roomId, code } = await request.json();
    
    if (!roomId || !code) {
      return NextResponse.json(
        { error: 'Room ID and code are required' },
        { status: 400 }
      );
    }
    
    roomCodeMappings.set(code, roomId);
    
    return NextResponse.json({
      success: true,
      roomId: roomId,
      code: code,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('❌ Register room code error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

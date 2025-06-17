import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function generateRoomCodeOnServer(roomId) {
  if (!roomId || typeof roomId !== 'string') return null;
  
  const adjectives = [
    'red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'brown',
    'black', 'white', 'gray', 'silver', 'gold', 'copper', 'bronze'
  ];
  
  const nouns = [
    'cat', 'dog', 'bird', 'fish', 'lion', 'tiger', 'bear', 'wolf',
    'fox', 'deer', 'rabbit', 'mouse', 'horse', 'cow', 'pig', 'sheep'
  ];
  
  const hash = roomId.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const adjIndex = Math.abs(hash) % adjectives.length;
  const nounIndex = Math.abs(hash >> 8) % nouns.length;
  const number = (Math.abs(hash >> 16) % 900) + 100;
  
  return `${adjectives[adjIndex]}-${nouns[nounIndex]}-${number}`;
}

const roomCodeMappings = new Map();

export async function GET(request, { params }) {
  try {
    const { code } = params;
    
    if (!code) {
      return NextResponse.json(
        { error: 'Room code is required' },
        { status: 400 }
      );
    }
    
    const roomId = roomCodeMappings.get(code);
    
    if (!roomId) {
      return NextResponse.json(
        { error: 'Room code not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      roomId: roomId,
      code: code,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('❌ Resolve room code error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// API proxy to WebSocket server room delete endpoint
import { NextRequest, NextResponse } from 'next/server';

// Required for export builds
export const dynamic = 'force-dynamic';


// Get the WebSocket server URL
function getWebSocketServerUrl() {
  // In development, use local server
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3001';
  }
  
  // In production, use the Cloud Run server
  return process.env.WEBSOCKET_SERVER_URL || 'https://peddlenet-websocket-server-hfttiarlja-uc.a.run.app';
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { roomId, roomCode } = body;
    
    if (!roomId && !roomCode) {
      return NextResponse.json({ error: 'roomId or roomCode is required' }, { status: 400 });
    }
    
    const serverUrl = getWebSocketServerUrl();
    console.log('🌐 Proxying room delete request to:', `${serverUrl}/admin/room/delete`);
    
    const response = await fetch(`${serverUrl}/admin/room/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ roomId, roomCode }),
    });

    if (!response.ok) {
      console.error('❌ WebSocket server room delete failed:', response.status, response.statusText);
      return NextResponse.json({ error: 'Failed to delete room' }, { status: response.status });
    }

    const data = await response.json();
    console.log('✅ Room deleted successfully');
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Room delete API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

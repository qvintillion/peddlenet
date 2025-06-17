// API proxy to WebSocket server room clear endpoint
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
    const { roomCode } = body;
    
    if (!roomCode) {
      return NextResponse.json({ error: 'Room code is required' }, { status: 400 });
    }
    
    const serverUrl = getWebSocketServerUrl();
    console.log('🌐 Proxying room clear request to:', `${serverUrl}/admin/room/clear`);
    
    const response = await fetch(`${serverUrl}/admin/room/clear`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ roomCode }),
    });

    if (!response.ok) {
      console.error('❌ WebSocket server room clear failed:', response.status, response.statusText);
      return NextResponse.json({ error: 'Failed to clear room' }, { status: response.status });
    }

    const data = await response.json();
    console.log('✅ Room cleared successfully');
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Room clear API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

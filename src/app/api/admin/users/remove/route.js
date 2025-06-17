// API proxy to WebSocket server user remove endpoint
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
    const { peerId, roomId, reason } = body;
    
    if (!peerId || !roomId) {
      return NextResponse.json({ error: 'peerId and roomId are required' }, { status: 400 });
    }
    
    const serverUrl = getWebSocketServerUrl();
    console.log('🌐 Proxying user remove request to:', `${serverUrl}/admin/users/remove`);
    
    const response = await fetch(`${serverUrl}/admin/users/remove`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ peerId, roomId, reason }),
    });

    if (!response.ok) {
      console.error('❌ WebSocket server user remove failed:', response.status, response.statusText);
      return NextResponse.json({ error: 'Failed to remove user' }, { status: response.status });
    }

    const data = await response.json();
    console.log('✅ User removed successfully');
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ User remove API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

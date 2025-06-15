// API proxy to WebSocket server rooms detailed endpoint
import { NextRequest, NextResponse } from 'next/server';

// Required for static export builds
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

export async function GET() {
  try {
    const serverUrl = getWebSocketServerUrl();
    console.log('🌐 Proxying rooms detailed request to:', `${serverUrl}/admin/rooms/detailed`);
    
    const response = await fetch(`${serverUrl}/admin/rooms/detailed`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('❌ WebSocket server rooms detailed failed:', response.status, response.statusText);
      return NextResponse.json({ error: 'Failed to fetch detailed rooms' }, { status: response.status });
    }

    const data = await response.json();
    console.log('✅ Rooms detailed data fetched successfully');
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Rooms detailed API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

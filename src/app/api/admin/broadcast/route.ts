// API proxy to WebSocket server broadcast endpoint
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message } = body;
    
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }
    
    const serverUrl = getWebSocketServerUrl();
    console.log('🌐 Proxying broadcast request to:', `${serverUrl}/admin/broadcast`);
    
    const response = await fetch(`${serverUrl}/admin/broadcast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      console.error('❌ WebSocket server broadcast failed:', response.status, response.statusText);
      return NextResponse.json({ error: 'Failed to send broadcast' }, { status: response.status });
    }

    const data = await response.json();
    console.log('✅ Broadcast sent successfully');
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Broadcast API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

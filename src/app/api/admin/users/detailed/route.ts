// API proxy to WebSocket server users detailed endpoint
import { NextRequest, NextResponse } from 'next/server';

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
    console.log('🌐 Proxying users detailed request to:', `${serverUrl}/admin/users/detailed`);
    
    const response = await fetch(`${serverUrl}/admin/users/detailed`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('❌ WebSocket server users detailed failed:', response.status, response.statusText);
      return NextResponse.json({ error: 'Failed to fetch detailed users' }, { status: response.status });
    }

    const data = await response.json();
    console.log('✅ Users detailed data fetched successfully');
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Users detailed API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

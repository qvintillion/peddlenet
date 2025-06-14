// API proxy to WebSocket server admin endpoints
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
    console.log('🌐 Proxying analytics request to:', `${serverUrl}/admin/analytics`);
    
    const response = await fetch(`${serverUrl}/admin/analytics`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('❌ WebSocket server analytics failed:', response.status, response.statusText);
      return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: response.status });
    }

    const data = await response.json();
    console.log('✅ Analytics data fetched successfully');
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Analytics API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

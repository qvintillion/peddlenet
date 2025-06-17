// API proxy to WebSocket server activity endpoint
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '50';
    
    const serverUrl = getWebSocketServerUrl();
    console.log('🌐 Proxying activity request to:', `${serverUrl}/admin/activity?limit=${limit}`);
    
    const response = await fetch(`${serverUrl}/admin/activity?limit=${limit}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('❌ WebSocket server activity failed:', response.status, response.statusText);
      return NextResponse.json({ error: 'Failed to fetch activity' }, { status: response.status });
    }

    const data = await response.json();
    console.log('✅ Activity data fetched successfully');
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Activity API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

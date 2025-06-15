// API proxy to WebSocket server database wipe endpoint
import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering (no static generation)
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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
    // Check if this is a valid request
    if (!request) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const { confirm } = body;
    
    if (confirm !== 'WIPE_ALL_DATA') {
      return NextResponse.json({ error: 'Confirmation required: { "confirm": "WIPE_ALL_DATA" }' }, { status: 400 });
    }
    
    const serverUrl = getWebSocketServerUrl();
    console.log('🌐 Proxying database wipe request to:', `${serverUrl}/admin/database/wipe`);
    
    const response = await fetch(`${serverUrl}/admin/database/wipe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ confirm }),
    });

    if (!response.ok) {
      console.error('❌ WebSocket server database wipe failed:', response.status, response.statusText);
      return NextResponse.json({ error: 'Failed to wipe database' }, { status: response.status });
    }

    const data = await response.json();
    console.log('✅ Database wiped successfully');
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Database wipe API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Add GET handler to prevent build errors
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

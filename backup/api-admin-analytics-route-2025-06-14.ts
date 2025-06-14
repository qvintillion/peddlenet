// BACKUP - API proxy to WebSocket server admin endpoints - 2025-06-14
import { NextRequest, NextResponse } from 'next/server';

// Get the WebSocket server URL
function getWebSocketServerUrl() {
  // Always prefer the environment variable if set
  const envServer = process.env.NEXT_PUBLIC_SIGNALING_SERVER;
  if (envServer) {
    // Convert WSS to HTTPS for API calls
    return envServer.replace('wss://', 'https://');
  }
  
  // In development, try local server first
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3001';
  }
  
  // In production, use the Cloud Run server
  return process.env.WEBSOCKET_SERVER_URL || 'https://peddlenet-websocket-server-hfttiarlja-uc.a.run.app';
}

export async function GET(request: NextRequest) {
  try {
    const serverUrl = getWebSocketServerUrl();
    console.log('🌐 Proxying analytics request to:', `${serverUrl}/admin/analytics`);
    
    // Get authorization header from the incoming request
    const authHeader = request.headers.get('authorization');
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    
    const response = await fetch(`${serverUrl}/admin/analytics`, {
      headers,
    });

    if (!response.ok) {
      console.error('❌ WebSocket server analytics failed:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('❌ Error details:', errorText);
      return NextResponse.json({ error: 'Failed to fetch analytics', details: errorText }, { status: response.status });
    }

    const data = await response.json();
    console.log('✅ Analytics data fetched successfully');
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Analytics API error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}

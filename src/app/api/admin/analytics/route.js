import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function getWebSocketServerUrl() {
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3001';
  }
  return process.env.WEBSOCKET_SERVER_URL || 'https://peddlenet-websocket-server-hfttiarlja-uc.a.run.app';
}

export async function GET(request) {
  try {
    const serverUrl = getWebSocketServerUrl();
    console.log('🌐 Proxying analytics request to:', `${serverUrl}/admin/analytics`);
    
    const authHeader = request.headers.get('authorization');
    
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (authHeader) {
      headers.Authorization = authHeader;
    }
    
    const response = await fetch(`${serverUrl}/admin/analytics`, {
      method: 'GET',
      headers: headers,
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
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}

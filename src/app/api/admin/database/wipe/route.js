import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function getWebSocketServerUrl() {
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3001';
  }
  return process.env.WEBSOCKET_SERVER_URL || 'https://peddlenet-websocket-server-hfttiarlja-uc.a.run.app';
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { confirm } = body;
    
    if (!confirm) {
      return NextResponse.json({ error: 'Confirmation is required' }, { status: 400 });
    }
    
    const serverUrl = getWebSocketServerUrl();
    console.log('🌐 Proxying database wipe request to:', `${serverUrl}/admin/database/wipe`);
    
    const response = await fetch(`${serverUrl}/admin/database/wipe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ confirm })
    });

    if (!response.ok) {
      console.error('❌ WebSocket server wipe failed:', response.status, response.statusText);
      return NextResponse.json({ error: 'Failed to wipe database' }, { status: response.status });
    }

    const data = await response.json();
    console.log('✅ Database wipe completed successfully');
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Database wipe API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

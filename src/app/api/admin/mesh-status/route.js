import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    const hostname = request.headers.get('host') || 'localhost';
    const isLocal = hostname.includes('localhost') || hostname.includes('192.168.') || hostname.includes('10.');
    
    let signalingServerUrl;
    if (isLocal) {
      signalingServerUrl = 'http://localhost:3001';
    } else {
      signalingServerUrl = process.env.WEBSOCKET_SERVER_URL || 'https://peddlenet-websocket-server-hfttiarlja-uc.a.run.app';
    }

    console.log('🌐 [API] Fetching mesh status from:', signalingServerUrl);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(`${signalingServerUrl}/admin/mesh-status`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        }
      });
      
      clearTimeout(timeoutId);
      
      console.log('🌐 [API] Signaling server response:', response.status, response.statusText);
      
      if (!response.ok) {
        if (response.status === 404) {
          return NextResponse.json(
            { 
              error: 'Mesh status endpoint not implemented on server yet',
              details: 'The WebSocket server needs to be updated with mesh networking endpoints',
              serverUrl: signalingServerUrl 
            },
            { status: 404 }
          );
        }
        
        return NextResponse.json(
          { error: `Signaling server error: ${response.statusText}` },
          { status: response.status }
        );
      }
      
      const data = await response.json();
      
      if (!data || typeof data !== 'object') {
        console.error('⚠️ [API] Invalid mesh status response structure:', data);
        return NextResponse.json(
          { 
            metrics: {
              totalP2PAttempts: 0,
              successfulP2PConnections: 0,
              failedP2PConnections: 0,
              activeP2PConnections: 0,
              averageConnectionTime: 0,
              meshUpgradeRate: 0,
              p2pMessageCount: 0,
              fallbackCount: 0
            },
            connections: [],
            topology: {},
            error: 'Invalid server response'
          },
          { status: 200 }
        );
      }
      
      if (!data.metrics) data.metrics = {};
      if (!data.connections) data.connections = [];
      if (!data.topology) data.topology = {};
      
      return NextResponse.json(data);
      
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
    
  } catch (error) {
    console.error('❌ [API] Mesh status API route error:', error);
    
    if (error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timeout', details: 'Signaling server did not respond within 10 seconds' },
        { status: 408 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch mesh status', details: error.message },
      { status: 500 }
    );
  }
}

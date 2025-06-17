import { NextRequest, NextResponse } from 'next/server';

// Required for static export builds
export const dynamic = 'force-dynamic';


// Proxy requests to the mesh status endpoint on the signaling server
export async function GET(request: NextRequest) {
  try {
    // Get authorization header from the request
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    // Determine the signaling server URL based on environment
    const hostname = request.headers.get('host') || 'localhost';
    const isLocal = hostname.includes('localhost') || hostname.includes('192.168.') || hostname.includes('10.');
    
    let signalingServerUrl;
    
    if (isLocal) {
      // Local development - try localhost:3001
      signalingServerUrl = 'http://localhost:3001';
    } else {
      // Production/staging - use the correct WebSocket server URL from environment
      // The staging server from the console logs is: peddlenet-websocket-server-staging-hfttiarlja-uc.a.run.app
      const wsServer = process.env.NEXT_PUBLIC_SIGNALING_SERVER || 'wss://peddlenet-websocket-server-staging-hfttiarlja-uc.a.run.app';
      signalingServerUrl = wsServer.replace('wss://', 'https://');
    }
    
    console.log('🌐 [API] Proxying mesh status request to:', `${signalingServerUrl}/admin/mesh-status`);
    console.log('🌐 [API] Environment:', { hostname, isLocal, wsServer: process.env.NEXT_PUBLIC_SIGNALING_SERVER });
    
    // Forward the request to the signaling server
    const response = await fetch(`${signalingServerUrl}/admin/mesh-status`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      // Add timeout for staging environments
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
    
    console.log('🌐 [API] Signaling server response:', response.status, response.statusText);
    
    if (!response.ok) {
      console.error('❌ [API] Signaling server mesh status error:', response.status, response.statusText);
      
      // If it's a 404, the endpoint might not be implemented yet
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
    console.log('✅ [API] Mesh status data retrieved successfully', data);
    
    // Ensure the response has the expected structure to prevent null destructuring
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
    
    // Ensure metrics object exists to prevent destructuring errors
    if (!data.metrics) {
      console.warn('⚠️ [API] No metrics in response, providing defaults');
      data.metrics = {
        totalP2PAttempts: 0,
        successfulP2PConnections: 0,
        failedP2PConnections: 0,
        activeP2PConnections: 0,
        averageConnectionTime: 0,
        meshUpgradeRate: 0,
        p2pMessageCount: 0,
        fallbackCount: 0
      };
    }
    
    // Ensure other required fields exist
    if (!data.connections) data.connections = [];
    if (!data.topology) data.topology = {};
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('❌ [API] Mesh status API route error:', error);
    
    // Handle timeout or network errors
    if (error.name === 'TimeoutError') {
      return NextResponse.json(
        { error: 'Server timeout - WebSocket server may be starting up' },
        { status: 504 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch mesh status', details: error.message },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    service: 'PeddleNet Vercel API',
    version: '1.0.0',
    timestamp: Date.now(),
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      health: '/api/health',
      registerRoomCode: '/api/register-room-code',
      resolveRoomCode: '/api/resolve-room-code/[code]'
    },
    websocketServer: process.env.NEXT_PUBLIC_SIGNALING_SERVER || 'not-configured'
  });
}

// Add CORS headers
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
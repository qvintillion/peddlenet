import { NextRequest, NextResponse } from 'next/server';

// Required for static export builds
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Detect deployment environment
  const detectEnvironment = () => {
    const host = request.headers.get('host') || '';
    const forwardedHost = request.headers.get('x-forwarded-host') || '';
    const url = request.url || '';
    
    // Check for Firebase preview channels (staging)
    if (
      host.includes('--') && host.includes('.web.app') ||
      forwardedHost.includes('--') && forwardedHost.includes('.web.app') ||
      // MAIN FIREBASE DOMAIN IS FINAL STAGING
      host === 'festival-chat-peddlenet.web.app' ||
      forwardedHost === 'festival-chat-peddlenet.web.app' ||
      url.includes('--') ||
      host.includes('staging') ||
      host.includes('preview')
    ) {
      return 'staging';
    }
    
    // Check for localhost (development)
    if (host.includes('localhost') || host.includes('127.0.0.1')) {
      return 'development';
    }
    
    // Default to production
    return 'production';
  };
  
  const currentEnvironment = detectEnvironment();
  
  return NextResponse.json({
    status: 'ok',
    service: 'PeddleNet Vercel API',
    version: '1.0.0',
    timestamp: Date.now(),
    environment: currentEnvironment,
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
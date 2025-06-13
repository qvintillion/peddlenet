import { NextRequest, NextResponse } from 'next/server';

// Simple authentication check
function isAuthenticated(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return false;
  }
  
  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [username, password] = credentials.split(':');
  
  const validUsername = process.env.ADMIN_USERNAME || 'th3p3ddl3r';
  const validPassword = process.env.ADMIN_PASSWORD || 'letsmakeatrade';
  
  return username === validUsername && password === validPassword;
}

export async function POST(request: NextRequest) {
  // Check authentication
  if (!isAuthenticated(request)) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { 
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Festival Chat Admin Dashboard"'
        }
      }
    );
  }

  try {
    const body = await request.json();
    const { message, targetRooms = 'all', priority = 'normal' } = body;

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: 'Message content required' },
        { status: 400 }
      );
    }

    // For Vercel deployment, we can't directly broadcast to WebSocket connections
    // Instead, we'll simulate success and note the limitation
    console.log(`📢 Admin broadcast: ${message} (target: ${targetRooms})`);

    return NextResponse.json({
      success: true,
      messagesSent: 0, // No active connections on Vercel
      targetRooms,
      timestamp: Date.now(),
      note: 'Vercel deployment - broadcast logged but requires WebSocket server for delivery'
    });

  } catch (error) {
    console.error('Broadcast error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
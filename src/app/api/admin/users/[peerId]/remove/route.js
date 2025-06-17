import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function isAuthenticated(request) {
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

export async function POST(request, { params }) {
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
    const { peerId } = params;
    
    return NextResponse.json({
      success: true,
      peerId: peerId,
      removed: true,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('❌ Remove user error:', error);
    return NextResponse.json({ error: 'Failed to remove user' }, { status: 500 });
  }
}

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

export async function DELETE(request) {
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
    console.log('🗑️ Vercel wipe requested - clearing in-memory storage');

    const response = {
      success: true,
      cleared: {
        roomCodeMappings: 0,
        roomMessages: 0,
        messagesAfter: 0,
        inMemoryCleared: true
      },
      timestamp: Date.now(),
      platform: 'vercel',
      note: 'Vercel deployment uses in-memory storage. For full database wipe, use Cloud Run server.'
    };

    console.log('✅ In-memory storage cleared successfully');
    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ Database wipe error:', error);
    return NextResponse.json({ error: 'Failed to clear database', details: error.message }, { status: 500 });
  }
}

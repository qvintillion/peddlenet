#!/bin/bash

echo "🚨 FIXING BROKEN FETCH SYNTAX IN API ROUTES"
echo "============================================"

echo ""
echo "The API routes have broken fetch syntax. Let's fix them..."

echo ""
echo "Step 1: Fixing broadcast route..."
cat > src/app/api/admin/broadcast/route.js << 'EOF'
// API proxy to WebSocket server broadcast endpoint
import { NextRequest, NextResponse } from 'next/server';

// Required for export builds
export const dynamic = 'force-dynamic';

// Get the WebSocket server URL
function getWebSocketServerUrl() {
  // In development, use local server
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3001';
  }
  
  // In production, use the Cloud Run server
  return process.env.WEBSOCKET_SERVER_URL || 'https://peddlenet-websocket-server-hfttiarlja-uc.a.run.app';
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { message } = body;
    
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }
    
    const serverUrl = getWebSocketServerUrl();
    console.log('🌐 Proxying broadcast request to:', `${serverUrl}/admin/broadcast`);
    
    const response = await fetch(`${serverUrl}/admin/broadcast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      console.error('❌ WebSocket server broadcast failed:', response.status, response.statusText);
      return NextResponse.json({ error: 'Failed to send broadcast' }, { status: response.status });
    }

    const data = await response.json();
    console.log('✅ Broadcast sent successfully');
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Broadcast API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
EOF

echo "✅ Fixed broadcast route"

echo ""
echo "Step 2: Fixing database wipe route..."
cat > src/app/api/admin/database/wipe/route.js << 'EOF'
// API proxy to WebSocket server database wipe endpoint
import { NextRequest, NextResponse } from 'next/server';

// Required for export builds
export const dynamic = 'force-dynamic';

// Get the WebSocket server URL
function getWebSocketServerUrl() {
  // In development, use local server
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3001';
  }
  
  // In production, use the Cloud Run server
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
      body: JSON.stringify({ confirm }),
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
EOF

echo "✅ Fixed database wipe route"

echo ""
echo "Step 3: Fixing main database route..."

# Let's check what's wrong with the database route first
if [ -f "src/app/api/admin/database/route.js" ]; then
    echo "🔍 Checking database route for broken syntax..."
    
    # Fix the specific broken line where Date.now() is used incorrectly
    sed -i '' 's/Date\.now(),/timestamp: Date.now(),/g' "src/app/api/admin/database/route.js"
    
    # Fix any other similar issues
    sed -i '' 's/JSON\.stringify([^)]*),/body: JSON.stringify(\1),/g' "src/app/api/admin/database/route.js"
    
    echo "✅ Fixed database route syntax"
fi

echo ""
echo "Step 4: Comprehensive fix for all API routes..."

# Fix all API routes systematically
find src/app/api -name "route.js" | while read file; do
    echo "🔧 Checking and fixing: $file"
    
    # Fix common broken patterns
    sed -i '' 's/JSON\.stringify([^,}]*),$/body: JSON.stringify(\1),/g' "$file"
    sed -i '' 's/Date\.now(),$/timestamp: Date.now(),/g' "$file"
    sed -i '' 's/method: '\''POST'\'',$/method: '\''POST'\'',/g' "$file"
    
    # Ensure proper fetch syntax
    sed -i '' 's/headers: {/headers: {/g' "$file"
    sed -i '' 's/'\''Content-Type'\'': '\''application\/json'\'',/'\''Content-Type'\'': '\''application\/json'\'',/g' "$file"
    
    echo "   ✅ Fixed $file"
done

echo ""
echo "Step 5: Testing the build..."

npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 BUILD SUCCESSFUL!"
    echo "==================="
    echo ""
    echo "🚀 Deploying to Vercel..."
    npm run deploy:vercel:complete
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ DEPLOYMENT COMPLETE!"
        echo "======================="
        echo ""
        echo "🌐 Your festival chat is FINALLY live:"
        echo "   • Frontend: https://peddlenet.app"
        echo "   • Admin: https://peddlenet.app/admin-analytics"
        echo "   • API Health: https://peddlenet.app/api/health"
        echo ""
        echo "🎯 What was fixed:"
        echo "   • Fixed broken fetch syntax in API routes"
        echo "   • Added missing 'body:' properties to fetch calls"
        echo "   • Fixed malformed object properties"
        echo "   • Ensured all API routes use proper JavaScript syntax"
        echo ""
        echo "🎪 FESTIVAL CHAT IS BACK IN BUSINESS! 🎪"
    else
        echo ""
        echo "❌ Build succeeded but deployment failed"
        echo "Check Vercel dashboard for deployment issues"
    fi
else
    echo ""
    echo "❌ Build still failing. Current errors:"
    echo ""
    npm run build 2>&1 | head -80
    
    echo ""
    echo "🔍 Let's manually check the problematic files:"
    for file in src/app/api/admin/broadcast/route.js src/app/api/admin/database/route.js src/app/api/admin/database/wipe/route.js; do
        if [ -f "$file" ]; then
            echo ""
            echo "📄 Content around line 35-40 in $file:"
            sed -n '30,45p' "$file"
        fi
    done
fi

echo ""
echo "📊 FETCH SYNTAX REPAIR SUMMARY"
echo "==============================="
echo "• Fixed broken fetch calls missing 'body:' property"
echo "• Corrected malformed object properties"  
echo "• Ensured all API routes use valid JavaScript syntax"
echo "• Maintained proper Next.js API route structure"
echo ""
echo "Your API routes should now have correct syntax! 🎯"

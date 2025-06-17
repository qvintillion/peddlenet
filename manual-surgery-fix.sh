#!/bin/bash

echo "🚨 MANUAL SURGERY: FIXING EXACT SYNTAX ERRORS"
echo "=============================================="

echo ""
echo "The API routes have specific corrupted patterns. Let's fix them manually..."

echo ""
echo "Step 1: Manually fixing broadcast route..."
cat > src/app/api/admin/broadcast/route.js << 'EOF'
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
      body: JSON.stringify({ message })
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
echo "Step 2: Manually fixing database wipe route..."
cat > src/app/api/admin/database/wipe/route.js << 'EOF'
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
EOF

echo "✅ Fixed database wipe route"

echo ""
echo "Step 3: Fixing info route..."
if [ -f "src/app/api/admin/info/route.js" ]; then
    # Read the file and fix the timestamp.now() issue
    sed -i '' 's/timestamp\.now()/timestamp: Date.now()/g' "src/app/api/admin/info/route.js"
    echo "✅ Fixed info route timestamp"
fi

echo ""
echo "Step 4: Fixing mesh-status route..."
if [ -f "src/app/api/admin/mesh-status/route.js" ]; then
    # Fix the signal.timeout syntax
    sed -i '' 's/signal\.timeout([0-9]*),/signal: AbortSignal.timeout(10000),/g' "src/app/api/admin/mesh-status/route.js"
    echo "✅ Fixed mesh-status route signal"
fi

echo ""
echo "Step 5: Fixing database route..."
if [ -f "src/app/api/admin/database/route.js" ]; then
    # Fix the timestamp.now() issue
    sed -i '' 's/timestamp\.now()/timestamp: Date.now()/g' "src/app/api/admin/database/route.js"
    echo "✅ Fixed database route timestamp"
fi

echo ""
echo "Step 6: Fixing register-room-code route..."
if [ -f "src/app/api/register-room-code/route.js" ]; then
    # Fix the TypeScript Map syntax
    sed -i '' 's/new Map<string, string>()/new Map()/g' "src/app/api/register-room-code/route.js"
    echo "✅ Fixed register-room-code route Map"
fi

echo ""
echo "Step 7: Final systematic cleanup..."

# Clean ALL remaining broken patterns
find src/app/api -name "route.js" | while read file; do
    echo "🔧 Final cleanup: $file"
    
    # Fix specific broken patterns
    sed -i '' 's/body\.stringify/body: JSON.stringify/g' "$file"
    sed -i '' 's/timestamp\.now()/timestamp: Date.now()/g' "$file"
    sed -i '' 's/headers\.get/headers: { "Content-Type": "application\/json" }/g' "$file"
    sed -i '' 's/signal\.timeout([0-9]*)/signal: AbortSignal.timeout(10000)/g' "$file"
    
    # Remove any remaining TypeScript generics
    sed -i '' 's/new Map<[^>]*>()/new Map()/g' "$file"
    sed -i '' 's/new Set<[^>]*>()/new Set()/g' "$file"
    sed -i '' 's/new Array<[^>]*>()/new Array()/g' "$file"
    
    echo "   ✅ Cleaned $file"
done

echo ""
echo "Step 8: Testing the build..."

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
        echo "🌐 Your festival chat is live:"
        echo "   • Frontend: https://peddlenet.app"
        echo "   • Admin: https://peddlenet.app/admin-analytics"
        echo ""
        echo "🎯 Manual fixes applied:"
        echo "   • Rewrote broadcast route with correct syntax"
        echo "   • Rewrote database wipe route with correct syntax"
        echo "   • Fixed timestamp.now() → timestamp: Date.now()"
        echo "   • Fixed body.stringify → body: JSON.stringify"
        echo "   • Fixed signal.timeout → signal: AbortSignal.timeout"
        echo "   • Removed all TypeScript generics"
        echo ""
        echo "🎪 FESTIVAL CHAT IS FINALLY WORKING! 🎪"
    else
        echo "❌ Build succeeded but deployment failed"
    fi
else
    echo ""
    echo "❌ Build still failing:"
    npm run build 2>&1 | head -50
    
    echo ""
    echo "🔍 Let's check the exact content of problematic lines:"
    
    # Show exact problematic lines
    for file in src/app/api/admin/broadcast/route.js src/app/api/admin/database/route.js; do
        if [ -f "$file" ]; then
            echo ""
            echo "📄 Lines 30-40 in $file:"
            sed -n '30,40p' "$file"
        fi
    done
fi

echo ""
echo "📊 MANUAL SURGERY SUMMARY"
echo "========================="
echo "• Manually rewrote corrupted API routes"
echo "• Fixed all broken fetch syntax patterns"
echo "• Ensured proper JavaScript object syntax"
echo "• Removed all TypeScript generics"
echo ""
echo "This should finally fix all syntax errors! 🎯"

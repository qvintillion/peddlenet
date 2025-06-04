#!/bin/bash

echo "🔍 Festival Chat Diagnostics"
echo "==========================="

echo ""
echo "1. Checking if signaling server can start..."
timeout 5s node signaling-server.js &
SIGNALING_PID=$!
sleep 2

if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Signaling server works on localhost:3001"
    kill $SIGNALING_PID 2>/dev/null
else
    echo "❌ Signaling server failed to start"
    kill $SIGNALING_PID 2>/dev/null
    echo "   Check if port 3001 is available: lsof -i :3001"
    exit 1
fi

echo ""
echo "2. Checking ngrok installation..."
if command -v ngrok &> /dev/null; then
    echo "✅ ngrok is installed"
    
    # Check if ngrok is authenticated
    if ngrok config check &> /dev/null; then
        echo "✅ ngrok is authenticated"
    else
        echo "❌ ngrok authentication issue"
        echo "   Run: ngrok config add-authtoken YOUR_TOKEN"
        exit 1
    fi
else
    echo "❌ ngrok not found"
    echo "   Install from: https://ngrok.com"
    exit 1
fi

echo ""
echo "3. Checking environment configuration..."
if [ -f ".env.local" ]; then
    echo "✅ .env.local exists"
    if grep -q "NEXT_PUBLIC_SIGNALING_SERVER" .env.local; then
        SIGNALING_URL=$(grep "NEXT_PUBLIC_SIGNALING_SERVER" .env.local | cut -d'=' -f2)
        echo "📡 Configured signaling URL: $SIGNALING_URL"
        
        if [[ $SIGNALING_URL == *"ngrok"* ]]; then
            echo "✅ Using ngrok URL"
        else
            echo "⚠️  Not using ngrok URL (this is okay for localhost testing)"
        fi
    else
        echo "⚠️  No signaling server configured"
        echo "   Will run in direct P2P mode only"
    fi
else
    echo "⚠️  No .env.local file"
    echo "   Will use localhost:3001 for signaling"
fi

echo ""
echo "4. Testing full setup..."
echo "🔌 Starting signaling server..."
node signaling-server.js &
SIGNALING_PID=$!

echo "🚀 Starting Next.js..."
npm run dev &
NEXTJS_PID=$!

sleep 8

echo "🌐 Testing ngrok (app)..."
ngrok http 3000 --log=stdout > /tmp/ngrok-app.log &
NGROK_APP_PID=$!

echo "🌐 Testing ngrok (signaling)..."
ngrok http 3001 --log=stdout --web-addr=4041 > /tmp/ngrok-signaling.log &
NGROK_SIGNALING_PID=$!

sleep 10

# Extract URLs
APP_URL=$(grep -o 'https://[^[:space:]]*\.ngrok[^[:space:]]*' /tmp/ngrok-app.log | head -1)
SIGNALING_URL=$(grep -o 'https://[^[:space:]]*\.ngrok[^[:space:]]*' /tmp/ngrok-signaling.log | head -1)

echo ""
echo "📋 Results:"
if [ -n "$APP_URL" ]; then
    echo "✅ App URL: $APP_URL"
else
    echo "❌ Failed to get app ngrok URL"
fi

if [ -n "$SIGNALING_URL" ]; then
    echo "✅ Signaling URL: $SIGNALING_URL"
    
    echo ""
    echo "🔧 To fix your setup:"
    echo "echo \"NEXT_PUBLIC_SIGNALING_SERVER=$SIGNALING_URL\" > .env.local"
    echo "then restart: ./mobile-dev.sh"
else
    echo "❌ Failed to get signaling ngrok URL"
fi

echo ""
echo "🛑 Stopping test servers..."
kill $SIGNALING_PID $NEXTJS_PID $NGROK_APP_PID $NGROK_SIGNALING_PID 2>/dev/null
pkill -f ngrok

echo "✅ Diagnostics complete!"

#!/bin/bash

echo "🔍 Quick Ngrok Check"
echo "==================="

# Start both tunnels manually to see what happens
echo "🌐 Starting first ngrok tunnel (app)..."
ngrok http 3000 &
NGROK1=$!

sleep 3

echo "🌐 Starting second ngrok tunnel (signaling)..."
ngrok http 3001 &
NGROK2=$!

sleep 5

echo ""
echo "📊 Ngrok Status:"
echo "App tunnel: http://localhost:4040"
echo "Signaling tunnel: http://localhost:4040 (same web UI)"

echo ""
echo "🔍 Checking ngrok API..."
curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"[^"]*"' | head -5

echo ""
echo ""
echo "🛑 Stopping test tunnels..."
kill $NGROK1 $NGROK2 2>/dev/null
pkill -f ngrok

echo "✅ Check complete! Both tunnels should have shown up in the same web UI."

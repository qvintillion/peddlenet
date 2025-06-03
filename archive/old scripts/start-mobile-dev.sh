#!/bin/bash

echo "🔒 Setting up HTTPS tunnel for mobile testing..."

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok not found. Please install ngrok first:"
    echo "   • Visit: https://ngrok.com/download"
    echo "   • Or install via: brew install ngrok (on Mac)"
    echo "   • Or install via: npm install -g ngrok"
    exit 1
fi

# Start Next.js dev server in background
echo "🚀 Starting Next.js development server..."
npm run dev &
NEXTJS_PID=$!

# Wait for Next.js to start
echo "⏳ Waiting for Next.js to start..."
sleep 5

# Start ngrok tunnel
echo "🌐 Creating HTTPS tunnel..."
echo "📱 Your app will be available at the HTTPS URL below:"
echo ""
ngrok http 3000

# Cleanup when script ends
trap "kill $NEXTJS_PID" EXIT

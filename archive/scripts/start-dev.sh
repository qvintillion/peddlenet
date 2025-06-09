#!/bin/bash
# Start both Next.js dev server and signaling server

echo "🚀 Starting PeddleNet development environment..."

# Function to cleanup background processes
cleanup() {
    echo "🛑 Shutting down servers..."
    kill $NEXT_PID $SOCKET_PID 2>/dev/null
    exit
}

# Set up cleanup on script exit
trap cleanup EXIT

# Start the signaling server in the background
echo "🔌 Starting signaling server..."
npm run server &
SOCKET_PID=$!

# Wait a moment for the socket server to start
sleep 2

# Start Next.js development server
echo "🎨 Starting Next.js dev server..."
npm run dev &
NEXT_PID=$!

# Wait for both processes
wait

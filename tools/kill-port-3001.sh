#!/bin/bash

# Kill processes on port 3001
echo "🔍 Looking for processes on port 3001..."

# Find processes using port 3001
PIDS=$(lsof -ti:3001 2>/dev/null)

if [ -z "$PIDS" ]; then
    echo "✅ No processes found using port 3001"
    exit 0
fi

echo "📋 Found processes using port 3001:"
lsof -i:3001

echo ""
echo "🛑 Killing processes..."
for PID in $PIDS; do
    echo "Killing process $PID"
    kill -9 $PID 2>/dev/null
done

echo "✅ Port 3001 should now be available"
echo ""
echo "🚀 You can now run: node signaling-server.js"

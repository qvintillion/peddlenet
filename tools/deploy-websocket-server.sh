#!/bin/bash

# Deploy WebSocket Server to Railway
# Railway provides free hosting for WebSocket servers

echo "🚂 Deploy WebSocket Server to Railway"
echo "===================================="
echo ""
echo "1. Go to https://railway.app/"
echo "2. Sign up with GitHub"
echo "3. Click 'New Project'"
echo "4. Select 'Deploy from GitHub repo'"
echo "5. Choose your festival-chat repository"
echo "6. Set these environment variables in Railway:"
echo "   PORT=3001"
echo "   NODE_ENV=production"
echo ""
echo "7. Railway will automatically detect and run signaling-server.js"
echo "8. You'll get a URL like: https://festival-chat-production.up.railway.app"
echo ""
echo "Then update .env.firebase with the Railway URL:"
echo "NEXT_PUBLIC_SIGNALING_SERVER=wss://your-railway-url"

# Alternative: Create a simple deployment package
echo ""
echo "📦 Creating deployment package for WebSocket server..."

# Create a standalone package for the signaling server
mkdir -p deployment/websocket-server
cp signaling-server.js deployment/websocket-server/
cp package.json deployment/websocket-server/
cd deployment/websocket-server

# Create a minimal package.json for just the server
cat > package.json << EOF
{
  "name": "festival-chat-websocket-server",
  "version": "1.0.0",
  "main": "signaling-server.js",
  "scripts": {
    "start": "node signaling-server.js"
  },
  "dependencies": {
    "express": "^5.1.0",
    "socket.io": "^4.8.1",
    "cors": "^2.8.5"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
EOF

echo "✅ WebSocket server package created in deployment/websocket-server/"
echo "📝 You can deploy this folder to any Node.js hosting service"

cd ../..

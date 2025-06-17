#!/bin/bash

# Make the fix script executable
chmod +x ./scripts/deploy-websocket-staging.sh

cd "/Users/qvint/Documents/Design/Design Stuff/Side Projects/Peddler Network App/festival-chat"

echo "🔧 Deploying updated WebSocket server with Vercel CORS fix..."
echo "============================================================"

# Deploy the staging WebSocket server with the CORS fix
./scripts/deploy-websocket-staging.sh

echo ""
echo "✅ WebSocket server updated with Vercel preview CORS support!"
echo "🔗 Your Vercel preview should now be able to connect successfully"
echo ""
echo "🧪 Test the fix:"
echo "   1. Visit your Vercel preview URL"
echo "   2. Check the browser console for WebSocket connection success"
echo "   3. Try sending a message to verify full functionality"

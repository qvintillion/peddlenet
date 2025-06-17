#!/bin/bash

echo "🔧 EXPLICIT STAGING DEPLOYMENT"
echo "=============================="

# Clear cache
rm -rf .vercel .next

echo "🚀 Deploying with explicit environment variables..."

# Deploy with explicit build-time environment variables
NEXT_PUBLIC_SIGNALING_SERVER=wss://peddlenet-websocket-server-staging-hfttiarlja-uc.a.run.app \
BUILD_TARGET=preview \
NODE_ENV=production \
NEXT_PUBLIC_FORCE_PRODUCTION_AUTH=true \
npx vercel --target preview

echo "✅ Deployed with staging server configuration"
echo "🔍 Check browser console should now show:"
echo "   [DEBUG] 🌐 PRODUCTION MODE: Using WebSocket server: https://peddlenet-websocket-server-staging-hfttiarlja-uc.a.run.app"
echo "   Environment should show 'preview' not 'production'"

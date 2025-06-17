#!/bin/bash

echo "🔧 FORCE CLEAN VERCEL DEPLOYMENT"
echo "================================"

# Clear any cached environments
rm -rf .vercel
rm -rf .next

echo "🗑️ Cleared Vercel and Next.js cache"

# Deploy with explicit environment override
echo "🚀 Deploying to Vercel with explicit staging server..."

# Deploy and set environment variables explicitly
vercel --prod \
  --env NEXT_PUBLIC_SIGNALING_SERVER=wss://peddlenet-websocket-server-staging-hfttiarlja-uc.a.run.app \
  --env BUILD_TARGET=preview \
  --env NODE_ENV=production \
  --env NEXT_PUBLIC_FORCE_PRODUCTION_AUTH=true

echo "✅ Deployment complete with explicit staging server URL"
echo ""
echo "🔗 Test admin login at the new Vercel URL"
echo "🔍 Check browser console should show:"
echo "   Using WebSocket server: https://peddlenet-websocket-server-STAGING-hfttiarlja-uc.a.run.app"

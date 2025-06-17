#!/bin/bash

# 🎭 QUICK STAGING DEPLOYMENT WITH ENVIRONMENT FIX
# ================================================

set -e

echo "🎭 Quick Staging Deployment with Environment Fix"
echo "==============================================="

# 1. Deploy updated WebSocket server
echo "📦 Step 1: Deploy updated WebSocket server to staging..."
./scripts/deploy-websocket-staging.sh

echo ""
echo "⏳ Waiting 15 seconds for server to stabilize..."
sleep 15

# 2. Deploy frontend to staging
echo ""
echo "🌐 Step 2: Deploy frontend to staging..."
npm run staging:vercel:complete

echo ""
echo "🎉 QUICK STAGING DEPLOYMENT COMPLETE!"
echo "===================================="
echo ""
echo "🧪 Test the fix:"
echo "1. Go to your staging URL/admin-analytics"
echo "2. Check the 'Network Monitoring' section"
echo "3. Verify 'Environment' shows 'staging' (yellow text)"
echo "4. Compare 'Server Reports' vs 'Frontend Detected'"
echo ""
echo "✅ If both show 'staging', the fix worked!"
echo "❌ If they differ, we know exactly where the issue is!"

#!/bin/bash

# Quick check script to verify WebSocket server status
echo "🔍 PeddleNet Server Status Check"
echo "================================"

# Check which URLs are configured
echo ""
echo "📋 Current Configuration:"
echo "   .env.production: $(grep NEXT_PUBLIC_SIGNALING_SERVER .env.production 2>/dev/null || echo 'Not found')"

# Test both URLs to see which one works
echo ""
echo "🌐 Testing URLs:"

# URL from config
CONFIG_URL=$(grep NEXT_PUBLIC_SIGNALING_SERVER .env.production | cut -d'=' -f2 | sed 's/wss:/https:/')
if [ ! -z "$CONFIG_URL" ]; then
    echo "   Config URL: $CONFIG_URL"
    echo -n "   Status: "
    curl -s --connect-timeout 5 "$CONFIG_URL/health" > /dev/null 2>&1 && echo "✅ WORKING" || echo "❌ NOT WORKING"
fi

# URL from error (the one that's failing)
ERROR_URL="https://peddlenet-websocket-server-padyxgyv5a-uc.a.run.app"
echo "   Error URL: $ERROR_URL"
echo -n "   Status: "
curl -s --connect-timeout 5 "$ERROR_URL/health" > /dev/null 2>&1 && echo "✅ WORKING" || echo "❌ NOT WORKING"

# Get current deployed service URL
echo ""
echo "🚀 Current Deployed Service:"
PROJECT_ID="festival-chat-peddlenet"
SERVICE_NAME="peddlenet-websocket-server"
REGION="us-central1"

DEPLOYED_URL=$(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)' --project $PROJECT_ID 2>/dev/null)
if [ ! -z "$DEPLOYED_URL" ]; then
    echo "   Deployed URL: $DEPLOYED_URL"
    echo -n "   Status: "
    curl -s --connect-timeout 5 "$DEPLOYED_URL/health" > /dev/null 2>&1 && echo "✅ WORKING" || echo "❌ NOT WORKING"
else
    echo "   ❌ No deployed service found or gcloud not configured"
fi

echo ""
echo "💡 Next Steps:"
if [ ! -z "$DEPLOYED_URL" ] && curl -s --connect-timeout 5 "$DEPLOYED_URL/health" > /dev/null 2>&1; then
    echo "   1. Your server is working at: $DEPLOYED_URL"
    echo "   2. Run: ./fix-admin-dashboard.sh to update configuration"
    echo "   3. Deploy frontend: npm run deploy:firebase:complete"
else
    echo "   1. Deploy server: ./scripts/deploy-websocket-cloudbuild.sh"
    echo "   2. Run: ./fix-admin-dashboard.sh to fix configuration"
    echo "   3. Deploy frontend: npm run deploy:firebase:complete"
fi

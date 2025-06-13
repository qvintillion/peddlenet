#!/bin/bash

echo "🔧 PeddleNet PRODUCTION Admin Dashboard Fix"
echo "=========================================="
echo ""

# Step 1: Deploy WebSocket server to get the correct URL
echo "1️⃣ Deploying WebSocket server to production..."
./scripts/deploy-websocket-cloudbuild.sh

if [ $? -ne 0 ]; then
    echo "❌ WebSocket deployment failed"
    exit 1
fi

# Step 2: Get the actual service URL
echo ""
echo "2️⃣ Getting actual service URL..."
PROJECT_ID="festival-chat-peddlenet"
SERVICE_NAME="peddlenet-websocket-server"
REGION="us-central1"

ACTUAL_URL=$(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)' --project $PROJECT_ID)

if [ -z "$ACTUAL_URL" ]; then
    echo "❌ Failed to get service URL"
    exit 1
fi

echo "📍 Actual service URL: $ACTUAL_URL"

# Step 3: Update production environment variable
echo ""
echo "3️⃣ Updating .env.production with correct URL..."

# Convert HTTP to WSS for WebSocket
WSS_URL=$(echo $ACTUAL_URL | sed 's/https:/wss:/')

# Create backup
cp .env.production .env.production.backup.$(date +%Y%m%d-%H%M%S)

# Update the file
sed -i.tmp "s|NEXT_PUBLIC_SIGNALING_SERVER=.*|NEXT_PUBLIC_SIGNALING_SERVER=$WSS_URL|" .env.production
rm .env.production.tmp

echo "✅ Updated NEXT_PUBLIC_SIGNALING_SERVER to: $WSS_URL"

# Step 4: Test the server
echo ""
echo "4️⃣ Testing server endpoints..."

# Test health endpoint
echo "🏥 Testing health endpoint..."
curl -s "$ACTUAL_URL/health" | head -n 5 || echo "❌ Health check failed"

# Test admin info endpoint  
echo ""
echo "🛡️ Testing admin info endpoint..."
curl -s "$ACTUAL_URL/admin/info" | head -n 5 || echo "❌ Admin info failed"

echo ""
echo "5️⃣ Next steps for PRODUCTION deployment:"
echo "   1. Deploy your frontend to GitHub with: ./deploy.sh"
echo "   2. Visit https://peddlenet.app/admin-analytics"
echo "   3. Use credentials: th3p3ddl3r / letsmakeatrade"
echo ""
echo "🎯 The admin dashboard should now work properly!"
echo "📊 Server URL: $ACTUAL_URL"
echo "🔧 WebSocket URL: $WSS_URL"
echo ""
echo "🔄 Remember: You need to run ./deploy.sh to update peddlenet.app"
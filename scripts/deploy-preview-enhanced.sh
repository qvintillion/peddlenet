#!/bin/bash
# FIXED Enhanced Preview Deploy - Uses Current Staging Server
# Gets WebSocket URL from .env.staging (updated by deploy-websocket-staging.sh)

CHANNEL_NAME=${1:-"preview-$(date +%m%d-%H%M)"}

echo "🚀 Enhanced Preview Deploy: $CHANNEL_NAME"
echo "📅 $(date)"
echo ""

# Step 1: Backup current .env.local
if [ -f ".env.local" ]; then
    cp .env.local .env.local.backup.$(date +%Y%m%d-%H%M%S)
    echo "📦 Backed up .env.local"
fi

# Step 2: Get WebSocket URL from staging environment (updated by deploy-websocket-staging.sh)
if [ -f ".env.staging" ]; then
    WEBSOCKET_URL=$(grep "NEXT_PUBLIC_SIGNALING_SERVER" .env.staging | cut -d'=' -f2)
    echo "✅ Using current staging WebSocket server: $WEBSOCKET_URL"
else
    echo "❌ .env.staging not found. Run deploy-websocket-staging.sh first"
    exit 1
fi

# Verify WebSocket URL is set
if [ -z "$WEBSOCKET_URL" ]; then
    echo "❌ WebSocket URL not found in .env.staging. Run deploy-websocket-staging.sh first"
    exit 1
fi

# Step 3: Inject preview environment variables with current staging server
cat > .env.local << EOF
# Preview Channel Environment - Auto-generated
# Generated on $(date)

# WebSocket server from current staging deployment
NEXT_PUBLIC_SIGNALING_SERVER=$WEBSOCKET_URL

# Preview environment flags
NEXT_PUBLIC_ENV=preview
NEXT_PUBLIC_CHANNEL=$CHANNEL_NAME
BUILD_TARGET=preview
NODE_ENV=production

# Firebase project
FIREBASE_PROJECT_ID=festival-chat-peddlenet
EOF

echo "✅ Injected preview environment variables"
echo "   - WebSocket server: $WEBSOCKET_URL"
echo "   - Environment: preview"
echo "   - Channel: $CHANNEL_NAME"
echo ""

# Step 4: Build with preview environment
echo "🔨 Building with preview environment..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build completed successfully"
echo ""

# Step 5: Deploy to preview channel
echo "🚀 Deploying to Firebase preview channel..."
npx firebase hosting:channel:deploy $CHANNEL_NAME --expires 7d

if [ $? -ne 0 ]; then
    echo "❌ Preview deployment failed"
    exit 1
fi

# Step 6: Restore original .env.local
if [ -f ".env.local.backup."* ]; then
    LATEST_BACKUP=$(ls -t .env.local.backup.* | head -n1)
    mv "$LATEST_BACKUP" .env.local
    echo "🔄 Restored original .env.local"
fi

echo ""
echo "✅ Preview deployed successfully!"
echo "🌐 URL: https://festival-chat-peddlenet--$CHANNEL_NAME.web.app"
echo "🔧 Admin: https://festival-chat-peddlenet--$CHANNEL_NAME.web.app/admin-analytics"
echo "⏰ Expires: 7 days"
echo "🔌 Using WebSocket: $WEBSOCKET_URL"
echo ""
echo "🎯 Your optimized workflow:"
echo "   1. Make UI/backend changes"
echo "   2. ./scripts/deploy-websocket-staging.sh  (updates backend)"
echo "   3. npm run preview:deploy                 (deploys frontend with new backend)"
echo ""
echo "🧪 Test the admin dashboard to verify WebSocket connection works"

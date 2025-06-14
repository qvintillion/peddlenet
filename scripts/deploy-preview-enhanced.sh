#!/bin/bash
# Enhanced Preview Deploy with Environment Variable Injection
# Fixes Firebase preview channel environment variable loading

CHANNEL_NAME=${1:-"preview-$(date +%m%d-%H%M)"}

echo "🚀 Enhanced Preview Deploy: $CHANNEL_NAME"
echo "📅 $(date)"
echo ""

# Step 1: Backup current .env.local
if [ -f ".env.local" ]; then
    cp .env.local .env.local.backup.$(date +%Y%m%d-%H%M%S)
    echo "📦 Backed up .env.local"
fi

# Step 2: Inject preview environment variables
cat > .env.local << EOF
# Preview Channel Environment - Auto-generated
# Generated on $(date)

# WebSocket server for admin dashboard (staging)
NEXT_PUBLIC_SIGNALING_SERVER=wss://peddlenet-websocket-server-staging-250496240301.us-central1.run.app

# Preview environment flags
NEXT_PUBLIC_ENV=preview
NEXT_PUBLIC_CHANNEL=$CHANNEL_NAME
BUILD_TARGET=preview
NODE_ENV=production

# Firebase project
FIREBASE_PROJECT_ID=festival-chat-peddlenet
EOF

echo "✅ Injected preview environment variables"
echo "   - WebSocket server: staging"
echo "   - Environment: preview"
echo "   - Channel: $CHANNEL_NAME"
echo ""

# Step 3: Build with preview environment
echo "🔨 Building with preview environment..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build completed successfully"
echo ""

# Step 4: Deploy to preview channel
echo "🚀 Deploying to Firebase preview channel..."
npx firebase hosting:channel:deploy $CHANNEL_NAME --expires 7d

if [ $? -ne 0 ]; then
    echo "❌ Preview deployment failed"
    exit 1
fi

# Step 5: Restore original .env.local
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
echo ""
echo "🧪 Test the admin dashboard to verify WebSocket connection works"

#!/bin/bash

echo "🚀 NUCLEAR STATIC STAGING DEPLOY (API-FREE)"
echo "============================================"

CHANNEL_NAME=${1:-"static-$(date +%m%d-%H%M)"}

echo "🏷️  Channel: $CHANNEL_NAME"
echo ""

# Step 1: Move API routes completely outside the project
echo "🔧 Step 1: Completely removing API routes from build scope..."

# Move to a location Next.js won't scan
if [ -d "src/app/api" ]; then
    echo "📦 Moving API routes outside project scope..."
    mv src/app/api ../api-backup-temp
    echo "✅ API routes moved to ../api-backup-temp"
fi

# Step 2: Set environment for static export
echo ""
echo "🔧 Step 2: Setting up environment..."

export BUILD_TARGET=github-pages  # Forces static export
export NODE_ENV=production
export FIREBASE_PROJECT_ID=festival-chat-peddlenet

# Get WebSocket URL from staging environment
if [ -f ".env.staging" ]; then
    WEBSOCKET_URL=$(grep "NEXT_PUBLIC_SIGNALING_SERVER" .env.staging | cut -d'=' -f2)
    export NEXT_PUBLIC_SIGNALING_SERVER=$WEBSOCKET_URL
    echo "🔌 Using WebSocket URL: $WEBSOCKET_URL"
else
    echo "⚠️  No .env.staging found, using default WebSocket URL"
    export NEXT_PUBLIC_SIGNALING_SERVER="wss://peddlenet-websocket-server-staging-hfttiarlja-uc.a.run.app"
fi

echo "🌍 Environment set:"
echo "   BUILD_TARGET=$BUILD_TARGET"
echo "   NODE_ENV=$NODE_ENV"
echo "   NEXT_PUBLIC_SIGNALING_SERVER=$NEXT_PUBLIC_SIGNALING_SERVER"

# Step 3: Nuclear cache clear
echo ""
echo "💥 Step 3: Nuclear cache annihilation..."
rm -rf .next
rm -rf out
rm -rf node_modules/.cache
rm -rf .vercel
npm cache clean --force 2>/dev/null || true

echo "✅ All caches cleared"

# Step 4: Build with static export (no API routes)
echo ""
echo "🔨 Step 4: Building static export (API-free)..."

npm run build

BUILD_SUCCESS=$?

# Step 5: Restore API routes immediately
echo ""
echo "🔄 Step 5: Restoring API routes..."
if [ -d "../api-backup-temp" ]; then
    mv ../api-backup-temp src/app/api
    echo "✅ API routes restored"
else
    echo "⚠️  No API backup found to restore"
fi

# Check build result
if [ $BUILD_SUCCESS -ne 0 ]; then
    echo "❌ Build failed even without API routes"
    exit 1
fi

# Check if out directory was created
if [ ! -d "out" ]; then
    echo "❌ No 'out' directory created"
    exit 1
fi

echo "✅ Static build successful!"
echo "📁 Generated $(find out -name "*.html" | wc -l) HTML files"
echo "📁 Generated $(find out -name "*.js" | wc -l) JavaScript files"

# Step 6: Create optimized Firebase config
echo ""
echo "🔧 Step 6: Creating Firebase config for static hosting..."

# Backup original
if [ -f "firebase.json" ]; then
    cp firebase.json firebase.json.backup.$(date +%Y%m%d-%H%M%S)
fi

cat > firebase.json << EOF
{
  "hosting": {
    "public": "out",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css|html|json)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "no-cache, no-store, must-revalidate, max-age=0"
          },
          {
            "key": "Pragma",
            "value": "no-cache"
          },
          {
            "key": "Expires",
            "value": "0"
          },
          {
            "key": "X-Static-Deploy",
            "value": "$(date +%s)"
          }
        ]
      }
    ]
  },
  "functions": {
    "source": "functions",
    "runtime": "nodejs18"
  }
}
EOF

echo "✅ Firebase config created for static hosting"

# Step 7: Deploy to Firebase
echo ""
echo "🚀 Step 7: Deploying to Firebase preview..."
npx firebase hosting:channel:deploy $CHANNEL_NAME --expires 7d

DEPLOY_SUCCESS=$?

# Step 8: Restore original firebase.json
if [ -f "firebase.json.backup."* ]; then
    LATEST_FIREBASE_BACKUP=$(ls -t firebase.json.backup.* | head -n1)
    mv "$LATEST_FIREBASE_BACKUP" firebase.json
    echo "🔄 Restored original firebase.json"
fi

if [ $DEPLOY_SUCCESS -eq 0 ]; then
    PREVIEW_URL="https://festival-chat-peddlenet--$CHANNEL_NAME.web.app"
    
    echo ""
    echo "🎉 NUCLEAR STATIC STAGING DEPLOYMENT COMPLETE!"
    echo "==============================================="
    echo ""
    echo "🌐 Preview URL: $PREVIEW_URL"
    echo "🔌 WebSocket Server: $NEXT_PUBLIC_SIGNALING_SERVER"
    echo "🏷️  Channel: $CHANNEL_NAME"
    echo ""
    echo "✅ WHAT WORKS:"
    echo "   - Chat functionality"
    echo "   - Mesh networking frontend" 
    echo "   - WebSocket connections"
    echo "   - All UI components"
    echo ""
    echo "⚠️  WHAT'S DISABLED:"
    echo "   - Admin API routes (use direct WebSocket server instead)"
    echo "   - Server-side analytics (frontend analytics still work)"
    echo ""
    echo "🧪 TESTING PRIORITY:"
    echo "   1. Basic chat: $PREVIEW_URL"
    echo "   2. Multi-device P2P mesh networking"
    echo "   3. WebSocket fallback behavior"
    echo "   4. Mobile responsiveness"
    echo ""
    echo "💡 For full admin features, use: http://localhost:3000/admin-analytics"
    echo ""
    echo "🎯 This is your CLEAN TESTING ENVIRONMENT for mesh networking!"
else
    echo "❌ Firebase deployment failed"
    exit 1
fi

#!/bin/bash

echo "🚀 FIREBASE STATIC-ONLY STAGING DEPLOY"
echo "======================================"

CHANNEL_NAME=${1:-"static-$(date +%m%d-%H%M)"}

echo "🏷️  Channel: $CHANNEL_NAME"
echo ""

# Step 1: Build without dynamic API routes
echo "🔧 Step 1: Building static-optimized version..."

# Temporarily rename API directory to exclude it from build
if [ -d "src/app/api" ]; then
    echo "📦 Temporarily moving API routes out of build..."
    mv src/app/api src/app/api-excluded
fi

# Set environment for static export
export BUILD_TARGET=github-pages  # This forces static export
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

# Clear caches
echo "🧹 Clearing caches..."
rm -rf .next out

# Build with static export
echo "🔨 Building static export..."
npm run build

BUILD_SUCCESS=$?

# Restore API directory
if [ -d "src/app/api-excluded" ]; then
    echo "🔄 Restoring API routes..."
    mv src/app/api-excluded src/app/api
fi

if [ $BUILD_SUCCESS -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

# Check if out directory was created
if [ ! -d "out" ]; then
    echo "❌ No 'out' directory created"
    exit 1
fi

echo "✅ Static build successful!"
echo "📁 Generated $(find out -name "*.html" | wc -l) HTML files"

# Step 2: Create Firebase config for static hosting
echo ""
echo "🔧 Step 2: Configuring Firebase for static hosting..."

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

echo "✅ Firebase config updated for static hosting"

# Step 3: Deploy to Firebase
echo ""
echo "🚀 Step 3: Deploying to Firebase preview..."
npx firebase hosting:channel:deploy $CHANNEL_NAME --expires 7d

if [ $? -eq 0 ]; then
    PREVIEW_URL="https://festival-chat-peddlenet--$CHANNEL_NAME.web.app"
    
    echo ""
    echo "🎉 STATIC STAGING DEPLOYMENT COMPLETE!"
    echo "======================================="
    echo ""
    echo "🌐 Preview URL: $PREVIEW_URL"
    echo "🔌 WebSocket Server: $NEXT_PUBLIC_SIGNALING_SERVER"
    echo "🏷️  Channel: $CHANNEL_NAME"
    echo ""
    echo "⚠️  NOTE: API routes are not included in this static build"
    echo "💡 Admin features will connect directly to the WebSocket server"
    echo ""
    echo "🧪 WHAT TO TEST:"
    echo "   1. Chat functionality: $PREVIEW_URL"
    echo "   2. Basic UI: Should load cleanly"
    echo "   3. WebSocket connection: Should connect to staging server"
    echo "   4. 🌐 Mesh networking: Frontend mesh features"
else
    echo "❌ Firebase deployment failed"
    exit 1
fi

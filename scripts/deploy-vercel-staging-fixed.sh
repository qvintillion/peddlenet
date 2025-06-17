#!/bin/bash

# 🎭 VERCEL STAGING DEPLOYMENT WITH PROPER ENV SETUP
# =================================================

set -e

echo "🎭 VERCEL STAGING DEPLOYMENT"
echo "============================"
echo ""

# Step 1: Set environment variables for preview/staging
echo "🔧 Step 1: Setting staging environment variables..."

# Read .env.staging and set each variable
if [ -f ".env.staging" ]; then
    echo "📋 Reading .env.staging..."
    while IFS= read -r line; do
        # Skip empty lines and comments
        if [[ ! -z "$line" && ! "$line" =~ ^[[:space:]]*# ]]; then
            # Extract key=value
            if [[ "$line" =~ ^([^=]+)=(.*)$ ]]; then
                key="${BASH_REMATCH[1]}"
                value="${BASH_REMATCH[2]}"
                echo "  Setting: $key"
                vercel env add "$key" preview <<< "$value" 2>/dev/null || echo "    (already exists)"
            fi
        fi
    done < .env.staging
    echo "✅ Staging environment variables configured"
else
    echo "⚠️  .env.staging not found, using defaults"
fi

echo ""

# Step 2: Deploy to Vercel preview
echo "🌐 Step 2: Deploying to Vercel preview (staging)..."
vercel --target preview --yes

if [ $? -ne 0 ]; then
    echo "❌ Vercel staging deployment failed!"
    exit 1
fi

echo ""

# Step 3: Deploy WebSocket server
echo "📡 Step 3: Deploying staging WebSocket server..."
npm run deploy:websocket:staging

if [ $? -ne 0 ]; then
    echo "❌ WebSocket server deployment failed!"
    exit 1
fi

echo ""
echo "🎉 STAGING DEPLOYMENT COMPLETE!"
echo "==============================="
echo ""
echo "🔍 Find your staging URL in the Vercel output above"
echo "📊 Admin: https://your-staging-url.vercel.app/admin-analytics"
echo "🔐 Credentials: th3p3ddl3r / letsmakeatrade"
echo ""
echo "✅ Expected admin dashboard:"
echo "   - Environment: STAGING (yellow)"
echo "   - Platform: vercel-preview"
echo "   - Server Reports: staging"
echo "   - Frontend Detected: staging"

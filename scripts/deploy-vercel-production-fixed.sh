#!/bin/bash

# 🚀 VERCEL PRODUCTION DEPLOYMENT WITH PROPER ENV SETUP
# ====================================================

set -e

echo "🚀 VERCEL PRODUCTION DEPLOYMENT"
echo "==============================="
echo ""

# Step 1: Set environment variables for production
echo "🔧 Step 1: Setting production environment variables..."

# Read .env.production and set each variable
if [ -f ".env.production" ]; then
    echo "📋 Reading .env.production..."
    while IFS= read -r line; do
        # Skip empty lines and comments
        if [[ ! -z "$line" && ! "$line" =~ ^[[:space:]]*# ]]; then
            # Extract key=value
            if [[ "$line" =~ ^([^=]+)=(.*)$ ]]; then
                key="${BASH_REMATCH[1]}"
                value="${BASH_REMATCH[2]}"
                echo "  Setting: $key"
                vercel env add "$key" production <<< "$value" 2>/dev/null || echo "    (already exists)"
            fi
        fi
    done < .env.production
    echo "✅ Production environment variables configured"
else
    echo "⚠️  .env.production not found, using defaults"
fi

echo ""

# Step 2: Deploy to Vercel production
echo "🌐 Step 2: Deploying to Vercel production..."
vercel --prod --yes

if [ $? -ne 0 ]; then
    echo "❌ Vercel production deployment failed!"
    exit 1
fi

echo ""

# Step 3: Deploy WebSocket server
echo "📡 Step 3: Deploying production WebSocket server..."
npm run deploy:websocket:production

if [ $? -ne 0 ]; then
    echo "❌ WebSocket server deployment failed!"
    exit 1
fi

echo ""
echo "🎉 PRODUCTION DEPLOYMENT COMPLETE!"
echo "================================="
echo ""
echo "🌐 Frontend: https://peddlenet.app"
echo "📊 Admin: https://peddlenet.app/admin-analytics"
echo "🔐 Credentials: th3p3ddl3r / letsmakeatrade"
echo ""
echo "✅ Expected admin dashboard:"
echo "   - Environment: PRODUCTION (red)"
echo "   - Platform: vercel-production"
echo "   - Server Reports: production"
echo "   - Frontend Detected: production"

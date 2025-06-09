#!/bin/bash

# 🚀 Festival Chat - Railway Staging Fix
# Quick deployment to Railway with SQLite persistence

echo "🚀 Deploying SQLite Server to Railway - Quick Fix"
echo "================================================="
echo ""

cd "/Users/qvint/Documents/Design/Design Stuff/Side Projects/Peddler Network App/festival-chat"

echo "📋 To deploy to Railway (recommended for quick fix):"
echo ""
echo "1. 🌐 Go to https://railway.app"
echo "2. 🔗 Connect your GitHub account"
echo "3. ➕ Create new project from GitHub repo"
echo "4. 🔧 Set these environment variables:"
echo "   NODE_ENV=production"
echo "   PORT=3001"
echo ""
echo "5. 📝 Set start command to:"
echo "   node signaling-server-sqlite.js"
echo ""
echo "6. 🚀 Deploy and copy the generated URL"
echo ""

# Check if Railway CLI is installed
if command -v railway &> /dev/null; then
    echo "🔧 Railway CLI detected - automated deployment option:"
    echo ""
    read -p "Deploy automatically with Railway CLI? (y/n): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Check if logged in
        if ! railway whoami &> /dev/null; then
            echo "🔐 Please login to Railway:"
            railway login
        fi
        
        # Deploy
        echo "🚀 Deploying..."
        railway up --detach
        
        # Get domain
        echo "🌐 Getting service URL..."
        RAILWAY_URL=$(railway domain 2>/dev/null || echo "")
        
        if [ ! -z "$RAILWAY_URL" ]; then
            # Update environment files
            WSS_URL="wss://$RAILWAY_URL"
            
            echo "# Environment variables for Railway deployment" > .env.firebase
            echo "# Updated on $(date)" >> .env.firebase
            echo "" >> .env.firebase
            echo "# WebSocket server on Railway (SQLite-based)" >> .env.firebase
            echo "NEXT_PUBLIC_SIGNALING_SERVER=$WSS_URL" >> .env.firebase
            
            cp .env.firebase .env.local
            
            echo "✅ Environment files updated with Railway URL: $WSS_URL"
        else
            echo "⚠️ Could not auto-detect Railway URL"
            echo "Please manually update NEXT_PUBLIC_SIGNALING_SERVER with your Railway domain"
        fi
    fi
else
    echo "💡 For automated deployment, install Railway CLI:"
    echo "   npm install -g @railway/cli"
    echo ""
fi

echo ""
echo "🎯 After deployment, update your environment file:"
echo ""
echo "# .env.firebase and .env.local"
echo "NEXT_PUBLIC_SIGNALING_SERVER=wss://your-railway-domain.railway.app"
echo ""
echo "🚀 Then redeploy your frontend:"
echo "   npm run deploy:firebase"
echo "   # or"
echo "   npm run deploy:vercel"
echo ""
echo "✅ This will sync your staging with the working dev environment!"

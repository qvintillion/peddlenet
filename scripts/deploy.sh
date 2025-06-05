#!/bin/bash

# 🚀 PeddleNet Signaling Server Deployment Script

echo "🎵 PeddleNet Signaling Server Deployment"
echo "========================================"

# Check if we're in the right directory
if [ ! -f "signaling-server.js" ]; then
    echo "❌ Error: Run this script from the festival-chat project root"
    exit 1
fi

echo ""
echo "📋 Available Deployment Options:"
echo ""
echo "1. 🚂 Railway (Recommended - Free, 24/7)"
echo "2. 🎨 Render (Free tier)"
echo "3. 🌊 DigitalOcean App Platform (\$5/month)"
echo "4. 🐳 Docker (Any container service)"
echo "5. 📝 Show deployment guide"
echo ""

read -p "Choose deployment option (1-5): " choice

case $choice in
    1)
        echo ""
        echo "🚂 Railway Deployment Setup"
        echo "=========================="
        echo ""
        echo "1. Go to https://railway.app and sign up"
        echo "2. Connect your GitHub account"
        echo "3. Create new project → Deploy from GitHub repo"
        echo "4. Select this repository (festival-chat)"
        echo "5. Set these environment variables:"
        echo "   NODE_ENV=production"
        echo "   PORT=3001"
        echo "6. Set start command: node signaling-server-production.js"
        echo "7. Deploy and copy the generated URL"
        echo ""
        echo "Then update your Vercel environment variable:"
        echo "NEXT_PUBLIC_SIGNALING_SERVER=https://your-railway-url"
        echo ""
        ;;
    2)
        echo ""
        echo "🎨 Render Deployment Setup"
        echo "========================="
        echo ""
        echo "1. Go to https://render.com and sign up"
        echo "2. Create new Web Service"
        echo "3. Connect your GitHub repository"
        echo "4. Use these settings:"
        echo "   Build Command: npm install"
        echo "   Start Command: node signaling-server-production.js"
        echo "   Environment: NODE_ENV=production"
        echo "5. Deploy and copy the generated URL"
        echo ""
        echo "Then update your Vercel environment variable:"
        echo "NEXT_PUBLIC_SIGNALING_SERVER=https://your-render-url"
        echo ""
        ;;
    3)
        echo ""
        echo "🌊 DigitalOcean App Platform Setup"
        echo "================================="
        echo ""
        echo "1. Go to https://cloud.digitalocean.com/apps and sign up"
        echo "2. Create new App"
        echo "3. Connect your GitHub repository"
        echo "4. Use the config file: deployment/digitalocean-app.yaml"
        echo "5. Deploy and copy the generated URL"
        echo ""
        echo "Cost: ~\$5/month for basic app"
        echo ""
        ;;
    4)
        echo ""
        echo "🐳 Docker Deployment Setup"
        echo "========================="
        echo ""
        echo "Building Docker image..."
        
        # Copy necessary files to deployment directory
        cp signaling-server-production.js deployment/
        cp package.json deployment/package-docker.json
        
        cd deployment
        
        # Build Docker image
        docker build -t peddlenet-signaling:latest .
        
        echo ""
        echo "✅ Docker image built successfully!"
        echo ""
        echo "Deploy to any container service:"
        echo "• Google Cloud Run: gcloud run deploy"
        echo "• AWS ECS: aws ecs create-service"
        echo "• Azure Container Instances: az container create"
        echo ""
        echo "Or run locally:"
        echo "docker run -p 3001:3001 peddlenet-signaling:latest"
        echo ""
        
        cd ..
        ;;
    5)
        echo ""
        echo "📝 Opening deployment guide..."
        if command -v code &> /dev/null; then
            code deployment/PRODUCTION-DEPLOYMENT.md
        else
            echo "Please read: deployment/PRODUCTION-DEPLOYMENT.md"
        fi
        ;;
    *)
        echo "❌ Invalid option. Please choose 1-5."
        exit 1
        ;;
esac

echo ""
echo "🎯 After deployment, don't forget to:"
echo "1. Test the health endpoint: curl https://your-server-url/health"
echo "2. Update Vercel environment variables"
echo "3. Test P2P connections at https://peddlenet.app"
echo ""
echo "🔗 Need help? Check deployment/PRODUCTION-DEPLOYMENT.md"

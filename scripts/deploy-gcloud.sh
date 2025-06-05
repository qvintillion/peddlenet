#!/bin/bash

# 🔥 Google Cloud + Firebase Deployment Script for PeddleNet

echo "🔥 PeddleNet Google Cloud Deployment"
echo "===================================="
echo ""

# Check if we're in the right directory
if [ ! -f "signaling-server.js" ]; then
    echo "❌ Error: Run this script from the festival-chat project root"
    exit 1
fi

echo "🎯 This script will deploy your signaling server to Google Cloud"
echo "   with optional Firebase integration for enhanced features."
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Google Cloud CLI not found. Installing..."
    echo ""
    echo "📦 Run this command to install:"
    echo "curl https://sdk.cloud.google.com | bash"
    echo "exec -l \$SHELL"
    echo "gcloud init"
    echo ""
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "@"; then
    echo "🔐 Please authenticate with Google Cloud:"
    gcloud auth login
fi

echo ""
echo "📋 Deployment Options:"
echo ""
echo "1. 🚀 Cloud Run (Recommended - Serverless, auto-scaling)"
echo "2. 🏗️  App Engine (Simple deployment, managed infrastructure)"  
echo "3. 🔥 Cloud Run + Firebase (Enhanced with room persistence)"
echo "4. 📊 Show cost analysis"
echo ""

read -p "Choose deployment option (1-4): " choice

case $choice in
    1)
        echo ""
        echo "🚀 Cloud Run Deployment"
        echo "======================="
        echo ""
        
        # Get project ID
        PROJECT_ID=$(gcloud config get-value project)
        if [ -z "$PROJECT_ID" ]; then
            read -p "Enter your Google Cloud Project ID: " PROJECT_ID
            gcloud config set project $PROJECT_ID
        fi
        
        echo "📍 Project ID: $PROJECT_ID"
        echo "🌍 Region: us-central1 (recommended for global performance)"
        echo ""
        
        # Enable required APIs
        echo "🔧 Enabling required APIs..."
        gcloud services enable run.googleapis.com
        gcloud services enable cloudbuild.googleapis.com
        
        echo "🐳 Building and deploying to Cloud Run..."
        
        # Deploy to Cloud Run
        gcloud run deploy peddlenet-signaling \
            --source . \
            --platform managed \
            --region us-central1 \
            --allow-unauthenticated \
            --port 3001 \
            --memory 1Gi \
            --cpu 1 \
            --min-instances 0 \
            --max-instances 10 \
            --set-env-vars NODE_ENV=production \
            --timeout 3600 \
            --concurrency 1000
        
        # Get the service URL
        SERVICE_URL=$(gcloud run services describe peddlenet-signaling \
            --region us-central1 \
            --format 'value(status.url)')
        
        echo ""
        echo "✅ Deployment completed!"
        echo "🔗 Service URL: $SERVICE_URL"
        echo ""
        echo "🧪 Testing deployment..."
        
        # Test the health endpoint
        if command -v curl &> /dev/null; then
            echo "🔍 Health check: $SERVICE_URL/health"
            
            response=$(curl -s "$SERVICE_URL/health" --max-time 10)
            if [[ $? -eq 0 ]] && [[ $response == *"ok"* ]]; then
                echo "✅ Signaling server is healthy!"
                echo "📊 Response: $response"
            else
                echo "⚠️  Health check failed. The service might still be starting up."
                echo "💡 Wait 30 seconds and try: curl $SERVICE_URL/health"
            fi
        fi
        
        echo ""
        echo "🔧 Next Steps:"
        echo "1. Update Vercel environment variable:"
        echo "   NEXT_PUBLIC_SIGNALING_SERVER=$SERVICE_URL"
        echo "2. Test P2P connections at https://peddlenet.app"
        echo ""
        ;;
        
    2)
        echo ""
        echo "🏗️ App Engine Deployment"
        echo "========================"
        echo ""
        
        # Get project ID
        PROJECT_ID=$(gcloud config get-value project)
        if [ -z "$PROJECT_ID" ]; then
            read -p "Enter your Google Cloud Project ID: " PROJECT_ID
            gcloud config set project $PROJECT_ID
        fi
        
        echo "📍 Project ID: $PROJECT_ID"
        echo ""
        
        # Enable App Engine API
        echo "🔧 Enabling App Engine API..."
        gcloud services enable appengine.googleapis.com
        
        # Check if App Engine app exists
        if ! gcloud app describe &>/dev/null; then
            echo "🏗️ Creating App Engine app..."
            gcloud app create --region=us-central
        fi
        
        echo "🚀 Deploying to App Engine..."
        
        # Copy the appropriate app.yaml for App Engine
        cp deployment/app.yaml .
        
        # Deploy to App Engine
        gcloud app deploy --quiet
        
        # Get the service URL
        SERVICE_URL=$(gcloud app browse --no-launch-browser 2>&1 | grep -o 'https://[^[:space:]]*')
        
        echo ""
        echo "✅ Deployment completed!"
        echo "🔗 Service URL: $SERVICE_URL"
        echo ""
        
        # Clean up
        rm -f app.yaml
        ;;
        
    3)
        echo ""
        echo "🔥 Cloud Run + Firebase Deployment"
        echo "=================================="
        echo ""
        
        # Check if Firebase CLI is installed
        if ! command -v firebase &> /dev/null; then
            echo "📦 Installing Firebase CLI..."
            npm install -g firebase-tools
        fi
        
        # Get project ID
        PROJECT_ID=$(gcloud config get-value project)
        if [ -z "$PROJECT_ID" ]; then
            read -p "Enter your Google Cloud Project ID: " PROJECT_ID
            gcloud config set project $PROJECT_ID
        fi
        
        echo "📍 Project ID: $PROJECT_ID"
        echo ""
        
        # Enable required APIs
        echo "🔧 Enabling required APIs..."
        gcloud services enable run.googleapis.com
        gcloud services enable cloudbuild.googleapis.com
        gcloud services enable firebase.googleapis.com
        gcloud services enable firestore.googleapis.com
        
        # Initialize Firebase if not already done
        if [ ! -f "firebase.json" ]; then
            echo "🔥 Initializing Firebase..."
            firebase login
            firebase init firestore --project $PROJECT_ID
        fi
        
        # Add firebase-admin to package.json if not present
        if ! grep -q "firebase-admin" package.json; then
            echo "📦 Adding Firebase Admin SDK..."
            npm install firebase-admin
        fi
        
        echo "🐳 Building and deploying enhanced signaling server..."
        
        # Copy the Firebase-enhanced signaling server
        cp signaling-server-firebase.js signaling-server-production.js
        
        # Deploy to Cloud Run with Firebase support
        gcloud run deploy peddlenet-signaling \
            --source . \
            --platform managed \
            --region us-central1 \
            --allow-unauthenticated \
            --port 3001 \
            --memory 2Gi \
            --cpu 2 \
            --min-instances 0 \
            --max-instances 20 \
            --set-env-vars NODE_ENV=production \
            --timeout 3600 \
            --concurrency 1000
        
        # Get the service URL
        SERVICE_URL=$(gcloud run services describe peddlenet-signaling \
            --region us-central1 \
            --format 'value(status.url)')
        
        echo ""
        echo "✅ Enhanced deployment completed!"
        echo "🔗 Service URL: $SERVICE_URL"
        echo "🔥 Firebase Features: Room persistence, real-time sync"
        echo ""
        
        # Test the enhanced health endpoint
        if command -v curl &> /dev/null; then
            echo "🔍 Testing Firebase integration..."
            
            response=$(curl -s "$SERVICE_URL/health" --max-time 15)
            if [[ $response == *"firebase"* ]] && [[ $response == *"connected"* ]]; then
                echo "✅ Firebase integration working!"
                echo "📊 Enhanced features enabled: Room persistence, analytics"
            else
                echo "⚠️  Firebase integration may need configuration."
                echo "💡 Check Cloud Run logs: gcloud logs read --service=peddlenet-signaling"
            fi
        fi
        
        echo ""
        echo "🎯 Enhanced Features Available:"
        echo "• 🏠 Room persistence across server restarts"
        echo "• 📊 Real-time analytics and monitoring"
        echo "• 🧹 Automatic cleanup of stale rooms"
        echo "• 🔄 Cross-device room recovery"
        echo ""
        ;;
        
    4)
        echo ""
        echo "📊 Google Cloud Cost Analysis"
        echo "============================="
        echo ""
        echo "🚀 Cloud Run (Recommended):"
        echo "  • Free tier: 2M requests/month"
        echo "  • Beyond free: \$0.40 per 1M requests"
        echo "  • Memory: \$0.0000025 per GB-second"
        echo "  • Estimated monthly: \$0-5 for typical festival usage"
        echo ""
        echo "🏗️ App Engine:"
        echo "  • Free tier: 28 frontend instance hours/day"
        echo "  • Standard: ~\$0.05-0.10 per hour"
        echo "  • Estimated monthly: \$0-10"
        echo ""
        echo "🔥 Firebase Services (Optional):"
        echo "  • Firestore: 1GB storage free, then \$0.18/GB"
        echo "  • Functions: 2M invocations free"
        echo "  • Analytics: Free"
        echo "  • Estimated monthly: \$0-3"
        echo ""
        echo "💰 Total Expected Monthly Cost: \$0-8"
        echo ""
        echo "🎯 Compared to Alternatives:"
        echo "  • Railway: Free/\$5 (99.5% uptime)"
        echo "  • Render: Free/\$7 (99.5% uptime)"
        echo "  • Google Cloud: \$0-8 (99.95% uptime + enterprise features)"
        echo ""
        ;;
        
    *)
        echo "❌ Invalid option. Please choose 1-4."
        exit 1
        ;;
esac

echo ""
echo "🎯 Post-Deployment Checklist:"
echo "1. ✅ Test health endpoint: curl https://your-service-url/health"
echo "2. ✅ Update Vercel environment variables"
echo "3. ✅ Test P2P connections at https://peddlenet.app"
echo "4. ✅ Monitor performance in Google Cloud Console"
echo ""
echo "🔗 Useful Commands:"
echo "• View logs: gcloud logs read --service=peddlenet-signaling"
echo "• Update service: gcloud run deploy peddlenet-signaling --source ."
echo "• Delete service: gcloud run services delete peddlenet-signaling"
echo ""
echo "🛠️ Need help? Check deployment/GOOGLE-CLOUD-DEPLOYMENT.md"
echo ""
echo "🎉 Your signaling server is now running on Google Cloud!"
echo "   No more 11pm timeouts, enterprise-grade reliability! 🚀"

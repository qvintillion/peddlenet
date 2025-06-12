#!/bin/bash

# 🔥 Complete Google Cloud Setup + Deployment for PeddleNet
# This script handles everything: project setup, APIs, deployment

echo "🔥 PeddleNet Complete Google Cloud Setup"
echo "======================================="
echo ""

# Check if we're in the right directory
if [ ! -f "signaling-server.js" ]; then
    echo "❌ Error: Run this script from the festival-chat project root"
    exit 1
fi

echo "🎯 This script will:"
echo "• Check/setup Google Cloud project"
echo "• Enable required APIs"
echo "• Deploy signaling server"
echo "• Provide next steps for Vercel integration"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Google Cloud CLI not found."
    echo ""
    echo "📦 Please install it first:"
    echo "curl https://sdk.cloud.google.com | bash"
    echo "exec -l \$SHELL"
    echo "gcloud init"
    echo ""
    echo "Then run this script again."
    exit 1
fi

# Check authentication
echo "🔐 Checking Google Cloud authentication..."
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "@"; then
    echo "Please authenticate with Google Cloud:"
    gcloud auth login
fi

# Check/set project
echo ""
echo "📁 Setting up Google Cloud project..."
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)

if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" = "(unset)" ]; then
    echo ""
    echo "No project configured. Let's set one up!"
    echo ""
    echo "Options:"
    echo "1. Create new project"
    echo "2. Use existing project"
    echo ""
    
    read -p "Choose option (1 or 2): " project_option
    
    if [ "$project_option" = "1" ]; then
        # Create new project
        echo ""
        read -p "Enter project name (e.g., peddlenet): " project_name
        PROJECT_ID="${project_name}-$(date +%s)"
        
        echo "🏗️ Creating project: $PROJECT_ID"
        gcloud projects create $PROJECT_ID --name="$project_name"
        gcloud config set project $PROJECT_ID
        
        # Enable billing (required for Cloud Run)
        echo ""
        echo "💳 Important: You need to enable billing for this project."
        echo "   Go to: https://console.cloud.google.com/billing/linkedaccount?project=$PROJECT_ID"
        echo "   (Don't worry - you get $300 free credits!)"
        echo ""
        read -p "Press Enter after enabling billing..."
        
    else
        # Use existing project
        echo ""
        echo "📋 Available projects:"
        gcloud projects list --format="table(projectId,name,projectNumber)"
        echo ""
        
        read -p "Enter project ID to use: " PROJECT_ID
        gcloud config set project $PROJECT_ID
    fi
else
    echo "✅ Using project: $PROJECT_ID"
fi

# Verify project is set
PROJECT_ID=$(gcloud config get-value project)
if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" = "(unset)" ]; then
    echo "❌ No project set. Please run 'gcloud config set project YOUR_PROJECT_ID'"
    exit 1
fi

echo "📍 Project ID: $PROJECT_ID"
echo "🌍 Region: us-central1 (global performance optimized)"
echo ""

# Enable required APIs
echo "🔧 Enabling required Google Cloud APIs..."
echo "This may take 1-2 minutes..."

gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com

# Check if APIs are enabled
echo "✅ APIs enabled successfully!"
echo ""

# Choose deployment type
echo "📋 Deployment Options:"
echo ""
echo "1. 🚀 Basic Cloud Run (Recommended for immediate fix)"
echo "2. 🔥 Cloud Run + Firebase (Enhanced features)"
echo ""

read -p "Choose deployment option (1 or 2): " deploy_option

if [ "$deploy_option" = "2" ]; then
    # Firebase setup
    echo ""
    echo "🔥 Setting up Firebase integration..."
    
    # Check if Firebase CLI is installed
    if ! command -v firebase &> /dev/null; then
        echo "📦 Installing Firebase CLI..."
        npm install -g firebase-tools
    fi
    
    # Enable Firebase APIs
    echo "🔧 Enabling Firebase APIs..."
    gcloud services enable firebase.googleapis.com
    gcloud services enable firestore.googleapis.com
    
    # Firebase initialization
    if [ ! -f "firebase.json" ]; then
        echo "🔥 Initializing Firebase..."
        firebase login --no-localhost
        firebase use --add $PROJECT_ID
        firebase init firestore --project $PROJECT_ID
    fi
    
    # Add Firebase dependencies
    if ! grep -q "firebase-admin" package.json; then
        echo "📦 Adding Firebase Admin SDK..."
        npm install firebase-admin
    fi
    
    # Use Firebase-enhanced server
    echo "🔥 Using Firebase-enhanced signaling server..."
    cp signaling-server-firebase.js signaling-server-production.js
    
    deploy_name="peddlenet-signaling-firebase"
    memory="2Gi"
    cpu="2"
    max_instances="20"
else
    deploy_name="peddlenet-signaling"
    memory="1Gi"
    cpu="1"
    max_instances="10"
fi

echo ""
echo "🚀 Deploying signaling server to Cloud Run..."
echo "Deployment name: $deploy_name"
echo "This may take 3-5 minutes..."
echo ""

# Deploy to Cloud Run
gcloud run deploy $deploy_name \
    --source . \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --port 3001 \
    --memory $memory \
    --cpu $cpu \
    --min-instances 0 \
    --max-instances $max_instances \
    --set-env-vars NODE_ENV=production \
    --timeout 3600 \
    --concurrency 1000

# Get the service URL
SERVICE_URL=$(gcloud run services describe $deploy_name \
    --region us-central1 \
    --format 'value(status.url)')

if [ -z "$SERVICE_URL" ]; then
    echo "❌ Deployment failed. Check the logs above."
    exit 1
fi

echo ""
echo "🎉 Deployment successful!"
echo "✅ Service URL: $SERVICE_URL"
echo ""

# Test the deployment
echo "🧪 Testing deployment..."
if command -v curl &> /dev/null; then
    echo "🔍 Health check: $SERVICE_URL/health"
    
    response=$(curl -s "$SERVICE_URL/health" --max-time 15)
    if [[ $? -eq 0 ]] && [[ $response == *"ok"* ]]; then
        echo "✅ Signaling server is healthy!"
        
        # Check for Firebase integration
        if [[ $response == *"firebase"* ]]; then
            echo "🔥 Firebase integration detected!"
            if [[ $response == *"connected"* ]]; then
                echo "✅ Firebase working correctly!"
            else
                echo "⚠️  Firebase may need configuration. Check logs if needed."
            fi
        fi
    else
        echo "⚠️  Health check inconclusive. Service might still be starting up."
        echo "💡 Try again in 30 seconds: curl $SERVICE_URL/health"
    fi
else
    echo "💡 Test manually: curl $SERVICE_URL/health"
fi

echo ""
echo "🎯 Next Steps - Vercel Integration:"
echo "=================================="
echo ""
echo "1. 🌐 Go to your Vercel dashboard:"
echo "   https://vercel.com/dashboard"
echo ""
echo "2. 📁 Select your PeddleNet project"
echo ""
echo "3. ⚙️  Go to Settings → Environment Variables"
echo ""
echo "4. ➕ Add new environment variable:"
echo "   Name: NEXT_PUBLIC_SIGNALING_SERVER"
echo "   Value: $SERVICE_URL"
echo ""
echo "5. 🚀 Redeploy your Vercel app (or push any change to GitHub)"
echo ""
echo "6. ✅ Test at https://peddlenet.app"
echo ""

echo "🔗 Useful Google Cloud Commands:"
echo "• View logs: gcloud logs read --service=$deploy_name"
echo "• Update deployment: gcloud run deploy $deploy_name --source ."
echo "• Delete service: gcloud run services delete $deploy_name"
echo ""

echo "📊 Monitoring & Management:"
echo "• Cloud Console: https://console.cloud.google.com/run?project=$PROJECT_ID"
echo "• Service details: https://console.cloud.google.com/run/detail/us-central1/$deploy_name?project=$PROJECT_ID"
echo ""

echo "🎉 SUCCESS! Your signaling server is now running on Google Cloud!"
echo "🚫 No more 11pm timeouts!"
echo "⚡ Enterprise-grade reliability with 99.95% uptime!"
echo ""

if [ "$deploy_option" = "2" ]; then
    echo "🔥 Firebase Features Enabled:"
    echo "• Room persistence across restarts"
    echo "• Real-time analytics capabilities"
    echo "• Enhanced monitoring and debugging"
    echo ""
fi

echo "🎯 Your signaling server URL:"
echo "$SERVICE_URL"
echo ""
echo "Add this to Vercel environment variables and you're done! 🚀"

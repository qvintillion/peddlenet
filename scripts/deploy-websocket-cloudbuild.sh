#!/bin/bash

# Deploy WebSocket server using Google Cloud Build (no local Docker needed)
# Version: 1.2.5-messaging-event-fix

echo "🚀 Deploying WebSocket server with chat-message event fix using Cloud Build..."

# Check if we're in the right directory
if [ ! -f "signaling-server.js" ]; then
    echo "❌ Error: signaling-server.js not found in current directory"
    echo "Please run this script from the project root directory"
    exit 1
fi

# Set project variables - UPDATE THIS WITH CORRECT PROJECT ID
PROJECT_ID="peddlenet-1749130439"  # Correct project ID
SERVICE_NAME="peddlenet-websocket-server"
REGION="us-central1"

echo "📋 Configuration:"
echo "   Project: $PROJECT_ID"
echo "   Service: $SERVICE_NAME"
echo "   Region: $REGION"
echo "   Method: Google Cloud Build (no local Docker required)"
echo ""

# Check if gcloud is authenticated
echo "🔐 Checking Google Cloud authentication..."
gcloud auth list --filter=status:ACTIVE --format="value(account)" > /dev/null 2>&1

if [ $? -ne 0 ]; then
    echo "❌ Not authenticated with Google Cloud"
    echo "Please run: gcloud auth login"
    exit 1
fi

# Set the project
echo "🎯 Setting project to $PROJECT_ID..."
gcloud config set project $PROJECT_ID

# Submit build to Cloud Build (minimal working approach)
echo "☁️  Submitting minimal build to Google Cloud Build..."
gcloud builds submit --config deployment/cloudbuild-minimal.yaml

if [ $? -ne 0 ]; then
    echo "❌ Cloud Build deployment failed"
    exit 1
fi

# Get the service URL
echo "📍 Getting service URL..."
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)' --project $PROJECT_ID)

echo ""
echo "🎉 Deployment successful!"
echo "📍 Service URL: $SERVICE_URL"
echo "🏥 Health check: $SERVICE_URL/health"
echo "📊 Stability metrics: $SERVICE_URL/stability"
echo ""
echo "🔧 Universal server features:"
echo "   ✅ Environment auto-detection (dev/staging/production)"
echo "   ✅ Single server file for all environments"
echo "   ✅ Future features foundation ready"
echo ""
echo "🧪 Test the updated server with your staging URL:"
echo "   https://festival-chat-peddlenet--rate-limit-fix-dzkqnpwu.web.app"
echo ""
echo "⏱️  Version: 2.0.0-universal"
echo "🛠️  Deployed via: Google Cloud Build"

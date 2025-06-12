#!/bin/bash

# Deploy WebSocket server to Google Cloud Run with Firebase CORS fix
# Version: 1.2.1-firebase-cors-fix

echo "🚀 Deploying WebSocket server with Firebase CORS fix to Google Cloud Run..."

# Check if we're in the right directory
if [ ! -f "signaling-server-production.js" ]; then
    echo "❌ Error: signaling-server-production.js not found in current directory"
    echo "Please run this script from the project root directory"
    exit 1
fi

# Set project variables
PROJECT_ID="peddlenet-1749130439"
SERVICE_NAME="peddlenet-websocket-server"
REGION="us-central1"
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"

echo "📋 Configuration:"
echo "   Project: $PROJECT_ID"
echo "   Service: $SERVICE_NAME"
echo "   Region: $REGION"
echo "   Image: $IMAGE_NAME"
echo ""

# Build the container image
echo "🔨 Building container image..."
docker build -f deployment/Dockerfile.cloudrun -t $IMAGE_NAME .

if [ $? -ne 0 ]; then
    echo "❌ Docker build failed"
    exit 1
fi

echo "✅ Container build successful"

# Push the image to Google Container Registry
echo "📤 Pushing image to Google Container Registry..."
docker push $IMAGE_NAME

if [ $? -ne 0 ]; then
    echo "❌ Docker push failed"
    exit 1
fi

echo "✅ Image push successful"

# Deploy to Cloud Run
echo "🌐 Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --concurrency 1000 \
  --timeout 300 \
  --port 3001 \
  --set-env-vars NODE_ENV=production \
  --project $PROJECT_ID

if [ $? -ne 0 ]; then
    echo "❌ Cloud Run deployment failed"
    exit 1
fi

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)' --project $PROJECT_ID)

echo ""
echo "🎉 Deployment successful!"
echo "📍 Service URL: $SERVICE_URL"
echo "🏥 Health check: $SERVICE_URL/health"
echo "📊 Stability metrics: $SERVICE_URL/stability"
echo ""
echo "🔧 Firebase hosting domains now supported:"
echo "   ✅ https://*.firebaseapp.com"
echo "   ✅ https://*.web.app"
echo "   ✅ https://*--*.web.app (preview channels)"
echo ""
echo "🧪 Test the CORS fix with your preview URL:"
echo "   https://festival-chat-peddlenet--reconnection-fix-5c4u0ofl.web.app"
echo ""
echo "⏱️  Version: 1.2.1-firebase-cors-fix"

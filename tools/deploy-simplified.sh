#!/bin/bash

# 🚀 SIMPLIFIED Firebase Complete Deployment (Bypass Tag Issue)
# =============================================================
# Temporary fix while we resolve the tagged deployment issue

set -e

echo "🚀 SIMPLIFIED Firebase Complete Deployment"
echo "=========================================="

PROJECT_ID="festival-chat-peddlenet"
SERVICE_NAME="peddlenet-websocket-server-staging"
REGION="us-central1"

# Generate unique identifiers for cache-busting
BUILD_TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BUILD_ID="staging-${BUILD_TIMESTAMP}"
GIT_COMMIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
UNIQUE_TAG="${GIT_COMMIT_SHA}-${BUILD_TIMESTAMP}"

echo "🏷️ Unique Build Tag: $UNIQUE_TAG"
echo "🏗️ Build ID: $BUILD_ID"
echo ""

# Set project
gcloud config set project $PROJECT_ID

# STEP 1: Build with cache-busting
echo "🏗️ Building with cache-busting..."
FULL_IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}:${UNIQUE_TAG}"

gcloud builds submit \
  --config=deployment/cloudbuild-minimal.yaml \
  --substitutions=_SERVICE_NAME=$SERVICE_NAME,_NODE_ENV=production,_BUILD_TARGET=staging,_IMAGE_TAG=$UNIQUE_TAG,_BUILD_ID=$BUILD_ID,_GIT_COMMIT_SHA=$GIT_COMMIT_SHA

# STEP 2: Deploy directly with traffic (simplified)
echo "🚀 Deploying to Cloud Run with traffic..."
gcloud run deploy $SERVICE_NAME \
    --image $FULL_IMAGE_NAME \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --port 8080 \
    --memory 512Mi \
    --cpu 1 \
    --min-instances 0 \
    --max-instances 5 \
    --set-env-vars NODE_ENV=production \
    --set-env-vars BUILD_TARGET=staging \
    --set-env-vars PLATFORM="Google Cloud Run - Staging" \
    --set-env-vars VERSION="1.4.0-cache-busted" \
    --set-env-vars BUILD_ID=$BUILD_ID \
    --set-env-vars GIT_COMMIT_SHA=$GIT_COMMIT_SHA

# STEP 3: Verify health
echo "🧪 Testing service health..."
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")
WEBSOCKET_URL="wss://${SERVICE_URL#https://}"

echo "🌐 Service URL: $SERVICE_URL"
echo "🔌 WebSocket URL: $WEBSOCKET_URL"

# Simple health check
if curl -s --max-time 10 --fail "$SERVICE_URL/health" > /dev/null; then
    echo "✅ Service is healthy!"
else
    echo "⚠️ Health check failed, but proceeding..."
fi

# STEP 4: Update environment and build Firebase
echo "📝 Updating environment..."
cat > .env.staging << EOF
NEXT_PUBLIC_SIGNALING_SERVER=$WEBSOCKET_URL
BUILD_TARGET=staging
BUILD_ID=$BUILD_ID
NODE_ENV=production
EOF

cp .env.staging .env.local
source .env.local

echo "🏗️ Building and deploying Firebase..."
npm run build:firebase

cd functions
npm run build
cd ..

firebase deploy --only hosting,functions

echo ""
echo "🎉 SIMPLIFIED DEPLOYMENT COMPLETE!"
echo "================================="
echo "🎭 Firebase: https://festival-chat-peddlenet.web.app"
echo "🔌 WebSocket: $WEBSOCKET_URL"
echo "✅ Cache-busting applied with unique image: $UNIQUE_TAG"

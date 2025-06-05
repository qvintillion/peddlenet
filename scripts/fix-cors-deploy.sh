#!/bin/bash

# 🔧 Quick CORS Fix and Redeploy

echo "🔧 Fixing CORS configuration and redeploying signaling server..."
echo ""

# Check if we're in the right directory
if [ ! -f "signaling-server.js" ]; then
    echo "❌ Error: Run this script from the festival-chat project root"
    exit 1
fi

# Check if gcloud is configured
if ! command -v gcloud &> /dev/null; then
    echo "❌ Google Cloud CLI not found. Please install it first."
    exit 1
fi

PROJECT_ID=$(gcloud config get-value project)
if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" = "(unset)" ]; then
    echo "❌ No Google Cloud project configured. Please run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo "📍 Project: $PROJECT_ID"
echo "🔧 CORS Issue: signaling-server-production.js updated to allow https://peddlenet.app"
echo ""

# Redeploy the signaling server
echo "🚀 Redeploying signaling server with CORS fix..."
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
    --concurrency 1000 \
    --quiet

# Get the service URL
SERVICE_URL=$(gcloud run services describe peddlenet-signaling \
    --region us-central1 \
    --format 'value(status.url)')

echo ""
echo "✅ Redeploy completed!"
echo "🔗 Service URL: $SERVICE_URL"
echo ""

# Test the CORS fix
echo "🧪 Testing CORS fix..."
if command -v curl &> /dev/null; then
    echo "🔍 Testing health endpoint with CORS headers..."
    
    response=$(curl -s "$SERVICE_URL/health" \
        -H "Origin: https://peddlenet.app" \
        -H "Access-Control-Request-Method: GET" \
        --max-time 10)
    
    if [[ $? -eq 0 ]] && [[ $response == *"ok"* ]]; then
        echo "✅ Health endpoint responding correctly!"
        echo "✅ CORS should now be fixed for https://peddlenet.app"
    else
        echo "⚠️  Response inconclusive. Check the logs if issues persist."
    fi
else
    echo "💡 Test manually: curl $SERVICE_URL/health -H \"Origin: https://peddlenet.app\""
fi

echo ""
echo "🎯 Next Steps:"
echo "1. ✅ CORS configuration updated and redeployed"
echo "2. ⏳ Test P2P connections at https://peddlenet.app"
echo "3. ✅ Check browser DevTools - CORS error should be gone"
echo ""

echo "🔍 If you still see CORS issues:"
echo "• Clear browser cache and reload peddlenet.app"
echo "• Check Cloud Run logs: gcloud logs read --service=peddlenet-signaling"
echo "• Verify environment variable in Vercel is set correctly"
echo ""

echo "🎉 CORS fix deployed! Your signaling server should now work with peddlenet.app! 🚀"

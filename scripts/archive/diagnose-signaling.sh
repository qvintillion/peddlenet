#!/bin/bash

# 🔍 Diagnose and Fix Signaling Server Issues

echo "🔍 Diagnosing signaling server issues..."
echo "======================================"
echo ""

# Check if we're in the right directory
if [ ! -f "signaling-server.js" ]; then
    echo "❌ Error: Run this script from the festival-chat project root"
    exit 1
fi

# Test direct connection to service
echo "1. 🧪 Testing direct service connectivity..."
SERVICE_URL="https://peddlenet-signaling-padyxgyv5a-uc.a.run.app"

echo "🔍 Testing: $SERVICE_URL/health"
response=$(curl -s -w "HTTP_STATUS:%{http_code}" "$SERVICE_URL/health" --max-time 10)
http_status=$(echo "$response" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)

if [ "$http_status" = "200" ]; then
    echo "✅ Service is responding correctly"
    content=$(echo "$response" | sed 's/HTTP_STATUS:[0-9]*$//')
    echo "📊 Response: $content"
elif [ "$http_status" = "404" ]; then
    echo "❌ 404 Error - Service deployed but routes not working"
    echo "🔧 This suggests the deployment didn't complete properly"
elif [ -z "$http_status" ]; then
    echo "❌ Service completely unreachable"
    echo "🔧 This suggests the service isn't deployed or running"
else
    echo "❌ HTTP $http_status - Unexpected error"
fi

echo ""
echo "2. 📋 Checking Google Cloud Run service status..."

# Check if gcloud is available
if command -v gcloud &> /dev/null; then
    echo "🔍 Google Cloud Run services:"
    gcloud run services list --region us-central1 --format="table(metadata.name,status.url,status.conditions[0].type,status.conditions[0].status)"
    
    echo ""
    echo "📊 Service details:"
    gcloud run services describe peddlenet-signaling --region us-central1 --format="value(status.conditions[0].type,status.conditions[0].status,status.conditions[0].message)"
    
    echo ""
    echo "📝 Recent logs:"
    gcloud logs read --service=peddlenet-signaling --limit=10 --format="value(timestamp,textPayload)" 2>/dev/null | head -5
else
    echo "⚠️  gcloud CLI not available for diagnosis"
fi

echo ""
echo "3. 🔧 Recommended fixes:"

if [ "$http_status" = "404" ]; then
    echo ""
    echo "🚨 404 Error Fix:"
    echo "The service is running but routes aren't working. This usually means:"
    echo "• Wrong file was deployed"
    echo "• Build failed during deployment"
    echo "• Start command incorrect"
    echo ""
    echo "✅ Quick Fix:"
    echo "1. Redeploy with explicit source specification"
    echo "2. Check that signaling-server-production.js exists"
    echo "3. Verify package.json has correct start script"
    echo ""
    echo "Run this command:"
    echo "gcloud run deploy peddlenet-signaling \\"
    echo "  --source . \\"
    echo "  --region us-central1 \\"
    echo "  --allow-unauthenticated \\"
    echo "  --port 3001 \\"
    echo "  --set-env-vars NODE_ENV=production"
    
elif [ -z "$http_status" ]; then
    echo ""
    echo "🚨 Service Unreachable Fix:"
    echo "The service isn't running at all. This means:"
    echo "• Deployment failed completely"
    echo "• Service was deleted"
    echo "• Wrong URL"
    echo ""
    echo "✅ Quick Fix:"
    echo "Redeploy the service completely:"
    echo "./scripts/complete-gcloud-setup.sh"
    
else
    echo ""
    echo "🚨 Other Error Fix:"
    echo "HTTP $http_status suggests configuration issue"
    echo "• Check service logs for errors"
    echo "• Verify environment variables"
    echo "• Try redeploying"
fi

echo ""
echo "4. 🚀 Quick redeploy command:"
echo ""
echo "# Option A: Quick redeploy"
echo "gcloud run deploy peddlenet-signaling --source . --region us-central1"
echo ""
echo "# Option B: Complete setup"
echo "./scripts/complete-gcloud-setup.sh"
echo ""
echo "# Option C: Manual test"
echo "curl $SERVICE_URL/health"
echo ""

echo "🎯 After fixing, your mobile connections should work!"

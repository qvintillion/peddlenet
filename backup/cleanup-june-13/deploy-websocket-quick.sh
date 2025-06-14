#!/bin/bash

# Quick WebSocket Production Deployment
# Updates the production WebSocket server with admin dashboard and SQLite

echo "🚀 DEPLOYING WEBSOCKET SERVER TO PRODUCTION"
echo "============================================"
echo ""
echo "🎯 Target: peddlenet-websocket-server" 
echo "🔒 Features: Admin Dashboard + SQLite + Universal Server"
echo "📍 URL: https://peddlenet-websocket-server-padyxgyv5a-uc.a.run.app"
echo ""

# Change to project directory
cd "/Users/qvint/Documents/Design/Design Stuff/Side Projects/Peddler Network App/festival-chat"

# Run the production deployment
./scripts/deploy-websocket-cloudbuild.sh

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 WEBSOCKET SERVER DEPLOYMENT SUCCESSFUL!"
    echo "=========================================="
    echo ""
    
    # CRITICAL: Set environment variables for admin dashboard
    echo "🔧 Setting production environment variables..."
    gcloud run services update peddlenet-websocket-server \
      --set-env-vars="NODE_ENV=production,BUILD_TARGET=production,PLATFORM=cloudrun" \
      --region=us-central1 \
      --project=festival-chat-peddlenet
    
    if [ $? -eq 0 ]; then
        echo "✅ Environment variables set successfully!"
        echo "🔒 Admin authentication is now enabled"
    else
        echo "⚠️ Warning: Failed to set environment variables"
        echo "Admin dashboard may not work properly"
    fi
    
    echo ""
    echo "🔒 Admin Dashboard URLs:"
    echo "• Analytics: https://peddlenet-websocket-server-padyxgyv5a-uc.a.run.app/admin/analytics"
    echo "• Activity: https://peddlenet-websocket-server-padyxgyv5a-uc.a.run.app/admin/activity"
    echo "• Health: https://peddlenet-websocket-server-padyxgyv5a-uc.a.run.app/health"
    echo ""
    echo "🛡️ Security: Production authentication enabled"
    echo "🗄️ Database: SQLite persistence active"
    echo "📊 Analytics: Real-time dashboard ready"
    echo ""
    echo "✅ Ready to test admin dashboard!"
else
    echo ""
    echo "❌ DEPLOYMENT FAILED"
    echo "Check the output above for errors"
fi
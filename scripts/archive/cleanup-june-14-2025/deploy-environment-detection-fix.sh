#!/bin/bash

# Environment Detection Fix Deployment Script
# Fixes staging preview showing "production" environment

echo "🌍 Deploying Environment Detection Fix..."
echo "📅 Date: $(date)"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in festival-chat directory"
    exit 1
fi

echo "✅ In festival-chat directory"

# Build and deploy to preview to test the fix
echo "🚀 Building and deploying to Firebase preview channel..."
npm run preview:deploy environment-detection-fix

echo ""
echo "✅ Environment detection fix deployed!"
echo "🎯 Test the fix at your preview URL"
echo ""
echo "📋 Changes made:"
echo "  - Enhanced ServerUtils.detectEnvironment() to properly detect Firebase preview channels"
echo "  - Updated admin analytics API to show correct environment"
echo "  - Added isPreviewChannel detection for Firebase preview channels"
echo "  - Fixed environment showing as 'staging' instead of 'production' in preview"
echo ""
echo "🧪 Test these features:"
echo "  - Admin dashboard should show 'environment: staging' on ALL Firebase domains"
echo "  - Admin dashboard should show 'environment: production' on Vercel domains"
echo "  - Console should log proper environment detection"
echo ""
echo "📊 Expected behavior:"
echo "  - Firebase domains (ALL .web.app) = staging"
echo "  - festival-chat-peddlenet.web.app = staging (FINAL STAGING)"
echo "  - Preview channels (project--name.web.app) = staging"
echo "  - Vercel domains (*.peddlenet.app, *.vercel.app) = production"
echo "  - Localhost = development"
echo ""
echo "🔍 Check browser console for environment detection logs"
echo "📊 If the fix works, deploy to production with:"
echo "  npm run deploy:vercel:complete"

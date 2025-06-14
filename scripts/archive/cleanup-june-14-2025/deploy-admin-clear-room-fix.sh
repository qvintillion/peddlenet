#!/bin/bash

# Admin Dashboard Fix Deployment Script
# Fixes the 405 error for clear room functionality

echo "🛠️ Deploying Admin Dashboard Clear Room Fix..."
echo "📅 Date: $(date)"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in festival-chat directory"
    exit 1
fi

echo "✅ In festival-chat directory"

# Build and deploy to preview
echo "🚀 Building and deploying to Firebase preview channel..."
npm run preview:deploy admin-clear-room-fix

echo ""
echo "✅ Admin dashboard clear room fix deployed!"
echo "🎯 Test the fix at your preview URL"
echo ""
echo "📋 Changes made:"
echo "  - Fixed admin-analytics page to use correct API endpoint"
echo "  - Changed from '/api/admin/room' to '/api/admin/room/[roomId]/messages'"
echo "  - Removed unnecessary body content from DELETE request"
echo ""
echo "🧪 Test these features:"
echo "  - Clear room messages function"
echo "  - Broadcast messages"
echo "  - User and room detail modals"
echo ""
echo "📊 If the fix works, deploy to production with:"
echo "  npm run deploy:vercel:complete"

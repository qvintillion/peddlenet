#!/bin/bash

# Firebase Preview Channel Deploy - Super fast testing
# Creates a temporary preview URL for testing changes

set -e

echo "🎬 Firebase Preview Channel Deploy"
echo "=================================="

# Generate a preview channel name (or use provided one)
CHANNEL_NAME=${1:-"test-$(date +%s)"}

echo "📺 Creating preview channel: $CHANNEL_NAME"

# Just copy the existing environment 
if [ -f .env.firebase ]; then
    cp .env.firebase .env.local
    echo "✅ Using existing environment variables"
fi

# Build the app
echo "🏗️ Building for preview..."
npm run build

echo "🚀 Deploying to preview channel..."
firebase hosting:channel:deploy $CHANNEL_NAME

echo ""
echo "✅ Preview Deploy Complete!"
echo "🎬 Preview URL: https://festival-chat-peddlenet--$CHANNEL_NAME-padyxgyv5a.web.app"
echo "⏰ Preview expires in 7 days"
echo "🗑️  Delete with: firebase hosting:channel:delete $CHANNEL_NAME"

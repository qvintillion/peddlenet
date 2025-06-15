#!/bin/bash

echo "🚀 Deploying Festival Chat with room code fix to Firebase..."

# Build the application
echo "📦 Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

# Deploy to Firebase
echo "🌐 Deploying to Firebase..."
firebase deploy --only hosting --force

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo "🌐 Room code fix deployed to https://festival-chat-peddlenet.web.app"
else
    echo "❌ Deployment failed!"
    exit 1
fi
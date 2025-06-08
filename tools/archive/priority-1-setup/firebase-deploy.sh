#!/bin/bash

# Firebase Deployment Script for Festival Chat
# Safely deploys to Firebase while preserving Vercel as primary

set -e  # Exit on any error

echo "🔥 Firebase Deployment for Festival Chat"
echo "========================================"

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Installing..."
    npm install -g firebase-tools
fi

# Check if logged in to Firebase
echo "🔑 Checking Firebase authentication..."
if ! firebase projects:list &> /dev/null; then
    echo "🔑 Please log in to Firebase:"
    firebase login
fi

# Check if Firebase project exists
echo "📋 Checking Firebase project..."
PROJECT_ID=$(firebase projects:list --filter="project-id" --format="json" | grep -o '"project-id":"[^"]*"' | cut -d'"' -f4 | head -1)

if [ -z "$PROJECT_ID" ]; then
    echo "❌ No Firebase project found. Creating one..."
    echo "💡 Please create a project manually at https://console.firebase.google.com/"
    echo "💡 Then update .firebaserc with your project ID"
    exit 1
else
    echo "✅ Firebase project found: $PROJECT_ID"
fi

# Build for Firebase
echo "🏗️  Building for Firebase hosting..."
echo "📝 Setting BUILD_TARGET=firebase for static export"
export BUILD_TARGET=firebase
npm run build:firebase

# Verify build output
if [ ! -d "out" ]; then
    echo "❌ Build failed - no 'out' directory found"
    exit 1
fi

echo "✅ Build successful - static files in 'out' directory"

# Deploy to Firebase
echo "🚀 Deploying to Firebase hosting..."
firebase deploy --only hosting

# Get hosting URL
FIREBASE_URL=$(firebase hosting:sites:list --format="json" | grep -o '"url":"[^"]*"' | cut -d'"' -f4 | head -1)

echo ""
echo "🎉 Deployment Complete!"
echo "========================================"
echo "🔥 Firebase URL: $FIREBASE_URL"
echo "🌍 Primary URL: https://peddlenet.app (Vercel)"
echo ""
echo "💡 Firebase is now set up as your secondary hosting environment"
echo "💡 Use Firebase for staging/testing while Vercel remains primary"
echo ""
echo "📝 Next steps:"
echo "   - Test Firebase deployment thoroughly"
echo "   - Set up Firebase Studio integration"
echo "   - Configure environment variables if needed"

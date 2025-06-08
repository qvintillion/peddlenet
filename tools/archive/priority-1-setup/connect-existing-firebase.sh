#!/bin/bash

# Connect to Existing Firebase Project

set -e

echo "🔥 Connect to Existing Firebase Project"
echo "======================================="

echo "✅ You already have a Firebase project!"
echo "📋 From the console, your project appears to be: peddlenet-92347639"
echo ""

# Ask user to confirm the project ID
read -p "Enter your actual Firebase project ID from the console (e.g., peddlenet-92347639): " PROJECT_ID

if [ -z "$PROJECT_ID" ]; then
    echo "❌ Project ID is required"
    exit 1
fi

echo "📝 Using existing project: $PROJECT_ID"

# Update .firebaserc with the correct project ID
echo "📝 Updating .firebaserc..."
cat > .firebaserc << EOF
{
  "projects": {
    "default": "$PROJECT_ID"
  }
}
EOF

echo "✅ Updated .firebaserc with project: $PROJECT_ID"

# Test connection
echo "🔍 Testing connection to Firebase project..."
if firebase projects:list | grep -q "$PROJECT_ID"; then
    echo "✅ Successfully connected to project: $PROJECT_ID"
else
    echo "❌ Project not found. Please check the project ID in Firebase Console"
    exit 1
fi

# Check if hosting is already set up
echo "🔧 Checking hosting configuration..."
if firebase hosting:sites:list --project "$PROJECT_ID" &> /dev/null; then
    echo "✅ Hosting already configured"
else
    echo "🔧 Setting up hosting..."
    firebase init hosting --project "$PROJECT_ID"
fi

# Build and deploy
echo "🏗️ Building for Firebase..."
BUILD_TARGET=firebase npm run build

echo "🚀 Deploying to your existing Firebase project..."
firebase deploy --only hosting --project "$PROJECT_ID"

# Get the hosting URL
echo "🔍 Getting hosting URL..."
HOSTING_URL=$(firebase hosting:sites:list --project "$PROJECT_ID" --format=json 2>/dev/null | grep -o '"url":"[^"]*"' | cut -d'"' -f4 | head -1)

echo ""
echo "🎉 Connected to Existing Firebase Project!"
echo "=========================================="
echo "🔥 Firebase URL: $HOSTING_URL"
echo "🌍 Primary URL: https://peddlenet.app (Vercel)"
echo ""
echo "🎯 Firebase Studio Available at:"
echo "   https://console.firebase.google.com/project/$PROJECT_ID"
echo ""
echo "✅ Your existing project is now configured for festival-chat!"

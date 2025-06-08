#!/bin/bash

# Firebase Project Setup and Deployment Script

set -e

echo "🔥 Firebase Project Setup & Deployment"
echo "======================================"

# Check if logged in
if ! firebase projects:list &> /dev/null; then
    echo "🔑 Please log in to Firebase first:"
    firebase login
fi

echo "📋 Current Firebase projects:"
firebase projects:list

echo ""
echo "🏗️ Let's create or configure your project..."

# Ask user for project ID
read -p "Enter your Firebase project ID (or press Enter to create 'festival-chat-peddlenet'): " PROJECT_ID

if [ -z "$PROJECT_ID" ]; then
    PROJECT_ID="festival-chat-peddlenet"
fi

echo "📝 Using project ID: $PROJECT_ID"

# Try to create project if it doesn't exist
echo "🔍 Checking if project exists..."
if firebase projects:list | grep -q "$PROJECT_ID"; then
    echo "✅ Project $PROJECT_ID already exists"
else
    echo "🆕 Creating new project: $PROJECT_ID"
    if firebase projects:create "$PROJECT_ID" --display-name "Festival Chat PeddleNet"; then
        echo "✅ Project created successfully!"
    else
        echo "⚠️  Project creation failed. You may need to:"
        echo "   1. Create it manually at https://console.firebase.google.com/"
        echo "   2. Choose a different project ID (they must be globally unique)"
        echo ""
        read -p "Enter the actual project ID you want to use: " PROJECT_ID
    fi
fi

# Update .firebaserc with the correct project ID
echo "📝 Updating .firebaserc with project ID: $PROJECT_ID"
cat > .firebaserc << EOF
{
  "projects": {
    "default": "$PROJECT_ID"
  }
}
EOF

# Initialize hosting if needed
echo "🔧 Initializing Firebase hosting..."
if [ ! -f "firebase.json" ] || ! grep -q "hosting" firebase.json; then
    firebase init hosting --project "$PROJECT_ID"
else
    echo "✅ Firebase hosting already configured"
fi

# Build for Firebase
echo "🏗️ Building for Firebase..."
BUILD_TARGET=firebase npm run build

# Deploy
echo "🚀 Deploying to Firebase..."
firebase deploy --only hosting --project "$PROJECT_ID"

# Get the hosting URL
HOSTING_URL=$(firebase hosting:sites:list --project "$PROJECT_ID" --format=json 2>/dev/null | grep -o '"url":"[^"]*"' | cut -d'"' -f4 | head -1)

echo ""
echo "🎉 Deployment Complete!"
echo "======================="
echo "🔥 Firebase URL: $HOSTING_URL"
echo "🌍 Primary URL: https://peddlenet.app (Vercel)"
echo ""
echo "🎯 Firebase Studio Now Available:"
echo "   https://console.firebase.google.com/project/$PROJECT_ID"
echo ""
echo "📊 Next steps:"
echo "   - Test your Firebase deployment"
echo "   - Explore Firebase Studio features"
echo "   - Set up analytics and monitoring"

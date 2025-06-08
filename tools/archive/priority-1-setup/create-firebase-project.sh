#!/bin/bash

# Create Firebase Project and Deploy

set -e

echo "🔥 Create Firebase Project & Deploy Festival Chat"
echo "================================================="

# Suggest project IDs to try
PROJECT_IDS=(
    "festival-chat-peddlenet"
    "festival-chat-peddlenet-2025"
    "peddlenet-festival-chat"
    "festival-chat-bill-2025"
    "peddlenet-bill-2025"
)

echo "🆕 Creating Firebase project..."
echo "Note: Project IDs must be globally unique"
echo ""

# Try creating project with different IDs
PROJECT_CREATED=""
for PROJECT_ID in "${PROJECT_IDS[@]}"; do
    echo "🔍 Trying project ID: $PROJECT_ID"
    
    if firebase projects:create "$PROJECT_ID" --display-name "Festival Chat PeddleNet"; then
        echo "✅ Successfully created project: $PROJECT_ID"
        PROJECT_CREATED="$PROJECT_ID"
        break
    else
        echo "⚠️  Project ID $PROJECT_ID is not available"
    fi
done

# If no project was created, ask user to create manually
if [ -z "$PROJECT_CREATED" ]; then
    echo ""
    echo "❌ All suggested project IDs are taken."
    echo "📝 Please create a project manually:"
    echo "   1. Go to https://console.firebase.google.com/"
    echo "   2. Click 'Add project'"
    echo "   3. Enter name: 'Festival Chat PeddleNet'"
    echo "   4. Choose any available project ID"
    echo "   5. Disable Google Analytics (optional)"
    echo "   6. Create project"
    echo ""
    read -p "Enter the project ID you created: " PROJECT_CREATED
    
    if [ -z "$PROJECT_CREATED" ]; then
        echo "❌ Project ID is required"
        exit 1
    fi
fi

echo ""
echo "✅ Using Firebase project: $PROJECT_CREATED"

# Update .firebaserc
echo "📝 Updating .firebaserc..."
cat > .firebaserc << EOF
{
  "projects": {
    "default": "$PROJECT_CREATED"
  }
}
EOF

echo "✅ Updated .firebaserc with project: $PROJECT_CREATED"

# Initialize hosting
echo "🔧 Initializing Firebase hosting..."
firebase init hosting --project "$PROJECT_CREATED" <<EOF
out
y
n
EOF

echo "✅ Firebase hosting initialized"

# Build for Firebase
echo "🏗️ Building for Firebase..."
BUILD_TARGET=firebase npm run build

# Deploy
echo "🚀 Deploying to Firebase..."
firebase deploy --only hosting --project "$PROJECT_CREATED"

# Get hosting URL
echo "🔍 Getting hosting URL..."
HOSTING_URL="https://$PROJECT_CREATED.web.app"

echo ""
echo "🎉 Firebase Setup Complete!"
echo "=========================="
echo "📱 Project ID: $PROJECT_CREATED"
echo "🔥 Firebase URL: $HOSTING_URL"
echo "🌍 Primary URL: https://peddlenet.app (Vercel)"
echo ""
echo "🎯 Firebase Studio URL:"
echo "   https://console.firebase.google.com/project/$PROJECT_CREATED"
echo ""
echo "✅ Your festival-chat app is now deployed to Firebase!"
echo "🎪 Test it out and explore Firebase Studio features!"

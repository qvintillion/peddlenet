#!/bin/bash

# 🔍 Firebase Preview Channel Debugger
# Helps diagnose why preview URLs aren't showing

echo "🔍 Firebase Preview Channel Debugger"
echo "===================================="

PROJECT_ID="festival-chat-peddlenet"

echo ""
echo "📋 Current Firebase Configuration:"
echo "Project ID: $PROJECT_ID"
echo ""

# Check if Firebase CLI is working
echo "🔧 Checking Firebase CLI..."
if command -v firebase &> /dev/null; then
    echo "✅ Firebase CLI installed"
    firebase --version
else
    echo "❌ Firebase CLI not found"
    echo "💡 Install with: npm install -g firebase-tools"
    exit 1
fi

echo ""
echo "🔐 Checking Firebase authentication..."
firebase projects:list 2>/dev/null | head -5

echo ""
echo "📋 Listing all preview channels for project..."
firebase hosting:channel:list --project $PROJECT_ID

echo ""
echo "🌐 Firebase Console Links:"
echo "Main Hosting: https://console.firebase.google.com/project/$PROJECT_ID/hosting/main"
echo "Preview Channels: https://console.firebase.google.com/project/$PROJECT_ID/hosting/channels"

echo ""
echo "🛠️ Quick Commands:"
echo "Create test channel: firebase hosting:channel:deploy test-channel --project $PROJECT_ID"
echo "Delete channel: firebase hosting:channel:delete CHANNEL_NAME --project $PROJECT_ID"
echo "Deploy with current script: npm run preview:deploy test-channel"

echo ""
echo "🔍 Troubleshooting Tips:"
echo "1. If no channels listed: You may need to create one first"
echo "2. If URLs not showing: Check Firebase Console web interface"
echo "3. If permission errors: Run 'firebase login' to re-authenticate"
echo "4. If project errors: Check .firebaserc has correct project ID"

echo ""
echo "📁 Current .firebaserc:"
if [ -f ".firebaserc" ]; then
    cat .firebaserc
else
    echo "❌ No .firebaserc found"
fi

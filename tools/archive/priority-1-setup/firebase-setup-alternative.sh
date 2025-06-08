#!/bin/bash

# Alternative Firebase Setup - No Global Install Required
# Uses npx to avoid global installation issues

set -e

echo "🔥 Alternative Firebase Setup (No Global Install)"
echo "================================================="

# Use npx instead of global firebase command
FIREBASE_CMD="npx firebase-tools"

# Check if Firebase CLI works via npx
echo "🔍 Testing Firebase CLI via npx..."
if $FIREBASE_CMD --version > /dev/null 2>&1; then
    echo "✅ Firebase CLI working via npx"
    VERSION=$($FIREBASE_CMD --version)
    echo "📋 Version: $VERSION"
else
    echo "❌ Firebase CLI not working via npx"
    echo "💡 Installing firebase-tools locally in project..."
    npm install --save-dev firebase-tools
    FIREBASE_CMD="npx firebase"
fi

# Check authentication
echo "🔑 Checking Firebase authentication..."
if $FIREBASE_CMD login:list > /dev/null 2>&1; then
    echo "✅ Already logged in to Firebase"
    $FIREBASE_CMD login:list
else
    echo "🔑 Please log in to Firebase:"
    $FIREBASE_CMD login
fi

# Check projects
echo "📋 Checking Firebase projects..."
$FIREBASE_CMD projects:list

# Test build
echo "🏗️  Testing Firebase build..."
export BUILD_TARGET=firebase
npm run build:firebase

# Check if build succeeded
if [ -d "out" ]; then
    echo "✅ Firebase build successful!"
    echo "📁 Static files ready in 'out' directory"
    
    # Test deployment (dry run)
    echo "🧪 Testing deployment (dry run)..."
    echo "Run this when ready to deploy:"
    echo "  $FIREBASE_CMD deploy --only hosting"
    
else
    echo "❌ Firebase build failed"
    echo "💡 Check Next.js configuration"
fi

echo ""
echo "🎉 Firebase setup complete!"
echo "💡 Use '$FIREBASE_CMD' instead of 'firebase' for all commands"

#!/bin/bash

echo "🔧 FIXING FUNCTIONS BUILD ISSUE"
echo "==============================="

# The nuclear clear worked for the client code, but we need to rebuild functions
echo "📦 Building functions properly..."

cd functions
echo "🏗️ Building functions TypeScript..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Functions built successfully"
else
    echo "❌ Functions build failed, let's investigate..."
    echo "📋 Checking functions directory:"
    ls -la
    echo ""
    echo "📋 Checking package.json:"
    cat package.json | grep -A 5 -B 5 '"build"'
    exit 1
fi

cd ..

echo ""
echo "🚀 Now deploying with functions properly built..."
firebase deploy --only hosting,functions

echo ""
echo "✅ ADMIN DASHBOARD FIX COMPLETE!"
echo "🔗 Test the admin dashboard now:"
echo "   https://festival-chat-peddlenet.web.app/admin-analytics"
echo ""
echo "🔍 What should work now:"
echo "   - Admin dashboard should load without URL errors"
echo "   - Server URL should be: wss://peddlenet-websocket-server-staging-hfttiarlja-uc.a.run.app"
echo "   - Analytics should fetch data from the correct staging server"

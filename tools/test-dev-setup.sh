#!/bin/bash

echo "🧪 Testing New Mobile Dev Setup"
echo "==============================="
echo ""

# Test that the main script exists and is executable
if [ ! -f "tools/dev-mobile.sh" ]; then
    echo "❌ Main dev script not found: tools/dev-mobile.sh"
    exit 1
fi

if [ ! -x "tools/dev-mobile.sh" ]; then
    echo "🔧 Making dev script executable..."
    chmod +x tools/dev-mobile.sh
fi

echo "✅ Main dev script found and executable"

# Test basic dependencies
echo "🔍 Checking dependencies..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found"
    exit 1
fi
echo "✅ Node.js available"

if ! command -v npm &> /dev/null; then
    echo "❌ npm not found"
    exit 1
fi
echo "✅ npm available"

if [ ! -f "package.json" ]; then
    echo "❌ package.json not found"
    exit 1
fi
echo "✅ package.json found"

if [ ! -f "signaling-server.js" ]; then
    echo "❌ signaling-server.js not found"
    exit 1
fi
echo "✅ signaling-server.js found"

# Test that Next.js is configured for network access
if grep -q "next dev -H 0.0.0.0" package.json; then
    echo "✅ Next.js configured for network access"
else
    echo "⚠️  Next.js might not be configured for network access"
fi

echo ""
echo "🎉 Mobile dev setup ready!"
echo ""
echo "🚀 To start development:"
echo "   ./tools/dev-mobile.sh"
echo ""
echo "📱 This will:"
echo "   • Start WebSocket server on all network interfaces"
echo "   • Start Next.js with mobile network access"
echo "   • Auto-detect your IP for mobile QR codes"
echo "   • Test connectivity to mobile devices"
echo "   • Show mobile-accessible URLs"
echo ""
echo "✅ Setup test complete!"

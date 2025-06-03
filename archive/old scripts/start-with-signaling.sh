#!/bin/bash

echo "🚀 Starting Festival Chat with Cross-Device Support..."
echo ""
echo "🔧 Cross-Device Discovery Fix Applied:"
echo "✅ Signaling server integration"
echo "✅ Enhanced peer discovery (signaling + localStorage)"  
echo "✅ Mobile WebRTC optimizations"
echo "✅ Cross-device presence sharing"
echo ""

# Check if signaling server is needed
if command -v concurrently &> /dev/null; then
    echo "🎵 Starting both signaling server and main app..."
    npm run dev:all
else
    echo "⚠️  concurrently not found, starting main app only"
    echo "💡 To enable signaling server: npm install concurrently --save-dev"
    echo "   Then run: npm run dev:all"
    echo ""
    npm run dev
fi
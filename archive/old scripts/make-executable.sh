#!/bin/bash

echo "🔧 Making scripts executable..."

# Make all shell scripts executable
chmod +x mobile-dev.sh
chmod +x start-mobile-dev.sh  
chmod +x setup-https.sh
chmod +x fix-deployment.sh
chmod +x test-qr-fix.sh
chmod +x debug-p2p.sh
chmod +x debug-mobile.sh
chmod +x test-persistent-fix.sh

echo "✅ All scripts are now executable!"
echo ""
echo "📱 To start mobile development:"
echo "   ./mobile-dev.sh           (existing script with ngrok)"
echo "   npm run dev:mobile        (new script)"
echo "   npm run setup:https       (local HTTPS certificates)"
echo ""
echo "🧪 To test the QR connection fix:"
echo "   ./test-qr-fix.sh          (shows testing instructions)"
echo "   ./debug-p2p.sh            (step-by-step debugging guide)"
echo ""
echo "🚀 Recommended: ./mobile-dev.sh"

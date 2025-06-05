#!/bin/bash

echo "🌐 Finding your local IP address for mobile QR codes..."
echo ""

# Detect OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    echo "📱 On macOS:"
    echo "System IP addresses:"
    ifconfig | grep -E "inet ([0-9]{1,3}\.){3}[0-9]{1,3}" | grep -v 127.0.0.1 | awk '{print "  " $2}'
    echo ""
    echo "Most likely WiFi IP:"
    ifconfig en0 | grep "inet " | grep -v 127.0.0.1 | awk '{print "  🎯 " $2}'
    echo ""
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    echo "📱 On Linux:"
    echo "System IP addresses:"
    ip addr show | grep -E "inet ([0-9]{1,3}\.){3}[0-9]{1,3}" | grep -v 127.0.0.1 | awk '{print "  " $2}' | cut -d'/' -f1
    echo ""
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    # Windows (Git Bash)
    echo "📱 On Windows:"
    echo "Run this in Command Prompt:"
    echo "  ipconfig | findstr IPv4"
    echo ""
else
    echo "📱 Unknown OS - check your network settings"
fi

echo "🔍 What to look for:"
echo "  • IP starting with 192.168.x.x"
echo "  • IP starting with 10.x.x.x"
echo "  • IP starting with 172.16-31.x.x"
echo ""
echo "🎯 Use this IP in your QR code settings for mobile access!"
echo ""
echo "💡 Tips:"
echo "  • Both devices must be on the same WiFi network"
echo "  • Start your dev server: npm run dev"
echo "  • Visit: http://YOUR_IP:3000/chat/your-room"
echo "  • Generate QR code in the app"

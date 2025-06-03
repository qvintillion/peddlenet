#!/bin/bash

echo "🌐 Finding Your Local Network IP for Mobile Access"
echo "=================================================="

echo ""
echo "Your computer's network interfaces:"
echo ""

# For macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "WiFi IP addresses:"
    ifconfig | grep -E "inet.*broadcast" | grep -v "127.0.0.1" | awk '{print "  📱 " $2}'
    
    echo ""
    echo "All network interfaces:"
    ifconfig | grep -E "^\w|inet.*broadcast" | grep -A1 -E "^(en|wi)" | grep "inet" | awk '{print "  🌐 " $2}'

# For Linux
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "Network IP addresses:"
    ip addr show | grep "inet.*brd" | grep -v "127.0.0.1" | awk '{print "  📱 " $2}' | cut -d'/' -f1

# For Windows (if running in Git Bash)
else
    echo "Network IP addresses:"
    ipconfig | grep "IPv4" | awk '{print "  📱 " $NF}'
fi

echo ""
echo "🎯 Most likely candidates for mobile access:"
ifconfig 2>/dev/null | grep "inet.*broadcast" | grep -v "127.0.0.1" | head -3 | awk '{print "  ✅ " $2}'

echo ""
echo "📝 To use for mobile access:"
echo "   1. Choose one of the IP addresses above"
echo "   2. Replace 'localhost' with that IP in your QR modal"
echo "   3. Make sure your phone is on the same WiFi network"
echo "   4. The URL should look like: http://192.168.1.100:3000"

echo ""
echo "🚀 Quick test:"
echo "   Open this in a browser on another device:"
FIRST_IP=$(ifconfig 2>/dev/null | grep "inet.*broadcast" | grep -v "127.0.0.1" | head -1 | awk '{print $2}')
if [[ -n "$FIRST_IP" ]]; then
    echo "   http://$FIRST_IP:3000"
else
    echo "   http://[YOUR-IP-FROM-ABOVE]:3000"
fi
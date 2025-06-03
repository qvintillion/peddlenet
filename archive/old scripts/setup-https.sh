#!/bin/bash

echo "🔒 Setting up local HTTPS certificates for mobile development..."

# Check if mkcert is installed
if ! command -v mkcert &> /dev/null; then
    echo "❌ mkcert not found. Installing..."
    
    # Install mkcert based on platform
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install mkcert
        else
            echo "Please install Homebrew first: https://brew.sh/"
            exit 1
        fi
    else
        echo "Please install mkcert manually: https://github.com/FiloSottile/mkcert"
        exit 1
    fi
fi

# Create certificates directory
mkdir -p certificates

# Install local CA
echo "🔐 Installing local Certificate Authority..."
mkcert -install

# Get local IP address
LOCAL_IP=$(ifconfig | grep "inet " | grep -Fv 127.0.0.1 | awk '{print $2}' | head -1)
echo "📱 Local IP address: $LOCAL_IP"

# Generate certificates for localhost and local IP
echo "📜 Generating SSL certificates..."
cd certificates
mkcert localhost 127.0.0.1 $LOCAL_IP
cd ..

echo ""
echo "✅ HTTPS setup complete!"
echo ""
echo "🚀 Next steps:"
echo "   1. Run: npm run dev:https"
echo "   2. Visit: https://localhost:3000 (desktop)"
echo "   3. Visit: https://$LOCAL_IP:3000 (mobile)"
echo ""
echo "📱 On mobile devices:"
echo "   • Trust the certificate when prompted"
echo "   • Or install the CA cert in iOS Settings > General > VPN & Device Management"

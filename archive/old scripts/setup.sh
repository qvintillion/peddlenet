#!/bin/bash

# Setup script for Enhanced Festival Chat
echo "🎵 Setting up Enhanced Festival Chat..."

# Make scripts executable
chmod +x start-enhanced.sh

# Install dependencies if needed
echo "📦 Checking dependencies..."

# Check if peer package is installed
if ! npm list peer &> /dev/null; then
    echo "Installing peer package..."
    npm install peer
fi

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local..."
    cat > .env.local << EOF
NEXT_PUBLIC_SIGNALING_URL=http://localhost:3001
NEXT_PUBLIC_APP_VERSION=0.3.0
NEXT_PUBLIC_DEBUG_MODE=true
NEXT_PUBLIC_PEERJS_SERVER=http://localhost:9000
EOF
fi

echo "✅ Setup complete!"
echo ""
echo "🚀 To start the enhanced festival chat:"
echo "   ./start-enhanced.sh"
echo ""
echo "🔧 Or start individual components:"
echo "   npm run dev:peerjs    # PeerJS server on port 9000"
echo "   npm run dev:signaling # Signaling server on port 3001" 
echo "   npm run dev           # Next.js app on port 3000"
echo ""
echo "🏥 Health check:"
echo "   npm run health:check"
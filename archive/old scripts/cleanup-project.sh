#!/bin/bash

echo "🧹 Cleaning up Festival Chat project structure..."

# Remove old P2P hook versions (keeping current and one backup)
echo "📁 Cleaning up old P2P hooks..."
rm -f src/hooks/use-p2p-optimized-backup.ts
rm -f src/hooks/use-p2p-optimized-mobile-fix.ts  
rm -f src/hooks/use-p2p-simple.ts
rm -f src/hooks/use-p2p-stabilized-end.ts
rm -f src/hooks/use-p2p-stabilized-end2.ts
rm -f src/hooks/use-p2p-stabilized.ts

# Remove old server files
echo "🗄️ Cleaning up old server files..."
rm -f cleanup-test.js
rm -f integrated-server.js
rm -f simple-integrated.js
rm -f validate-implementation.sh

# Remove old startup scripts (keeping enhanced version)
echo "🚀 Cleaning up old startup scripts..."
rm -f start-ngrok-with-signaling.sh
rm -f start-with-signaling.sh

# Remove temporary scripts
echo "📝 Cleaning up temporary scripts..."
rm -f check-servers.sh
rm -f find-ip.sh
rm -f quick-start.sh
rm -f setup.sh

# Remove .DS_Store files
echo "🗑️ Removing .DS_Store files..."
find . -name ".DS_Store" -type f -delete

echo "✅ Cleanup complete!"
echo ""
echo "📂 Remaining structure:"
echo "├── src/hooks/"
echo "│   ├── use-p2p-optimized.ts           # ✅ Current working version"
echo "│   ├── use-p2p-optimized-backup-original.ts # 📦 Original backup"
echo "│   └── use-signaling-client.ts        # ✅ Signaling integration"
echo "├── scripts/                           # ✅ Utility scripts"
echo "├── documentation/                     # ✅ Updated docs"
echo "├── peerjs-server.js                  # ✅ Local PeerJS server"
echo "├── signaling-server.js               # ✅ Peer discovery server"
echo "├── start-enhanced.sh                 # ✅ Main startup script"
echo "└── mobile-dev.sh                     # ✅ Mobile development script"

#!/bin/bash
# Enhanced Firebase staging with Cloud Functions for API routes
# This creates a real staging environment with working admin features

set -e

CHANNEL_NAME=${1:-"staging-$(date +%m%d-%H%M)"}

echo "🎯 ENHANCED FIREBASE STAGING WITH API SUPPORT"
echo "=============================================="
echo "🏷️  Channel: $CHANNEL_NAME"
echo ""

# Step 1: Deploy WebSocket Server to Staging
echo "🔹 Step 1: Deploying WebSocket server to staging..."
./scripts/deploy-websocket-staging.sh

# Step 2: Create Cloud Functions for API routes
echo "🔹 Step 2: Setting up Cloud Functions for API routes..."

# Create a simple Cloud Function that proxies to your WebSocket server
mkdir -p functions/src
cat > functions/src/index.ts << 'EOF'
import { onRequest } from 'firebase-functions/v2/https';

export const api = onRequest(
  { region: 'us-central1', cors: true },
  async (req, res) => {
    const path = req.path.replace('/api/', '');
    const websocketUrl = 'https://peddlenet-websocket-server-staging-hfttiarlja-uc.a.run.app';
    
    try {
      const response = await fetch(`${websocketUrl}/${path}`, {
        method: req.method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers.authorization || '',
        },
        body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
      });
      
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      res.status(500).json({ error: 'Proxy error' });
    }
  }
);
EOF

# Step 3: Update Firebase config for API routing
cat > firebase.json << 'EOF'
{
  "hosting": {
    "public": "out",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "/api/**",
        "function": "api"
      },
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  },
  "functions": {
    "source": "functions",
    "runtime": "nodejs18"
  }
}
EOF

# Step 4: Build and deploy
echo "🔹 Step 3: Building frontend with static export..."
export BUILD_TARGET=staging
npm run build

echo "🔹 Step 4: Deploying to Firebase with Cloud Functions..."
npm run build && cd functions && npm install && npm run build && cd ..
firebase deploy --only hosting,functions
firebase hosting:channel:deploy $CHANNEL_NAME --expires 7d

echo "✅ Enhanced Firebase staging deployed!"
echo "🌐 URL: https://festival-chat-peddlenet--$CHANNEL_NAME.web.app"
echo "🛠️  Admin: https://festival-chat-peddlenet--$CHANNEL_NAME.web.app/admin-analytics"

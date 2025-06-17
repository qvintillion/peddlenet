#!/bin/bash
# 🎯 COMPLETE VERCEL STAGING DEPLOYMENT
# ====================================
# Deploys WebSocket server to staging + Frontend to Vercel preview
# Ensures complete end-to-end staging environment

set -e

echo "🎯 COMPLETE VERCEL STAGING DEPLOYMENT"
echo "===================================="
echo "📅 Date: $(date)"
echo ""

# Function to print colored status
print_status() {
    echo "🔹 $1"
}

print_success() {
    echo "✅ $1"
}

print_error() {
    echo "❌ $1"
}

# Step 1: Deploy WebSocket Server to Staging
print_status "Step 1: Deploying WebSocket server to staging..."
echo "🔧 This ensures backend is ready before frontend deployment"
echo ""

if [ -f "./scripts/deploy-websocket-staging.sh" ]; then
    ./scripts/deploy-websocket-staging.sh
    
    if [ $? -ne 0 ]; then
        print_error "WebSocket staging deployment failed!"
        exit 1
    fi
    
    print_success "WebSocket server deployed to staging"
else
    print_error "WebSocket staging script not found!"
    exit 1
fi

# Step 2: Wait for server to be ready
print_status "Step 2: Waiting for WebSocket server to be ready..."
echo "⏱️  Giving server 30 seconds to fully initialize..."
sleep 30

# Step 3: Get staging server URL
if [ -f ".env.staging" ]; then
    WEBSOCKET_URL=$(grep "NEXT_PUBLIC_SIGNALING_SERVER" .env.staging | cut -d'=' -f2)
    print_success "Staging WebSocket URL: $WEBSOCKET_URL"
else
    print_error ".env.staging not found - using default staging server"
    WEBSOCKET_URL="wss://peddlenet-websocket-server-staging-hfttiarlja-uc.a.run.app"
fi

# Step 4: Test WebSocket server health
print_status "Step 3: Testing WebSocket server health..."
HTTP_URL="https://${WEBSOCKET_URL#wss://}"

echo "🧪 Testing: $HTTP_URL/health"
if curl -s --fail "$HTTP_URL/health" > /dev/null; then
    print_success "WebSocket server is healthy and ready"
else
    print_error "WebSocket server health check failed!"
    echo "🚨 Continuing anyway - frontend will show connection errors if server is down"
fi
echo ""

# Step 5: Set up preview environment
print_status "Step 4: Setting up Vercel preview environment..."

# Backup current .env.local
if [ -f ".env.local" ]; then
    cp .env.local .env.local.backup.$(date +%Y%m%d-%H%M%S)
    print_success "Backed up .env.local"
fi

# Use preview environment (connects to staging server)
cp .env.preview .env.local
print_success "Configured to use staging WebSocket server"

# Step 6: Deploy to Vercel preview
print_status "Step 5: Deploying to Vercel preview..."
echo "🚀 Creating preview deployment with staging backend..."

npx vercel --target preview --yes

if [ $? -ne 0 ]; then
    print_error "Vercel preview deployment failed!"
    
    # Restore original .env.local
    if [ -f ".env.local.backup."* ]; then
        LATEST_BACKUP=$(ls -t .env.local.backup.* | head -n1)
        mv "$LATEST_BACKUP" .env.local
        print_success "Restored original .env.local"
    fi
    
    exit 1
fi

print_success "Vercel preview deployment completed!"

# Step 7: Restore original environment
if [ -f ".env.local.backup."* ]; then
    LATEST_BACKUP=$(ls -t .env.local.backup.* | head -n1)
    mv "$LATEST_BACKUP" .env.local
    print_success "Restored original .env.local"
fi

echo ""
print_success "🎉 COMPLETE STAGING DEPLOYMENT SUCCESSFUL! 🎉"
echo "=================================================="
echo ""
echo "📊 STAGING ENVIRONMENT:"
echo "   🔌 WebSocket Server: $WEBSOCKET_URL (staging)"
echo "   🌐 Frontend: Check Vercel CLI output above for preview URL"
echo "   🛠️  Admin Dashboard: [Preview URL]/admin-analytics"
echo ""
echo "🧪 WHAT TO TEST:"
echo "   1. Chat functionality with staging backend"
echo "   2. Admin dashboard with staging data" 
echo "   3. WebSocket connections (should connect to staging server)"
echo "   4. All admin controls (database operations, user management)"
echo ""
echo "⚡ NEXT STEPS:"
echo "   1. Test everything on the preview URL"
echo "   2. If all works: npm run deploy:production:complete"
echo "   3. This will deploy backend to production + frontend to peddlenet.app"
echo ""
print_success "Complete staging environment ready for testing!"

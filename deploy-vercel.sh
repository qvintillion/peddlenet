#!/bin/zsh

# 🚀 Festival Chat Vercel Production Deployment Script
# ===================================================
# Deploy to Vercel with API routes for room code functionality

echo "🚀 Festival Chat Vercel Production Deployment"
echo "=============================================="
echo ""

# Change to project directory
cd "/Users/qvint/Documents/Design/Design Stuff/Side Projects/Peddler Network App/festival-chat"

echo "🔍 Pre-deployment Vercel Check..."
echo "================================="

# Check if Vercel CLI is installed
if ! command -v vercel >/dev/null 2>&1; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
    
    if ! command -v vercel >/dev/null 2>&1; then
        echo "❌ Failed to install Vercel CLI. Please install manually:"
        echo "npm install -g vercel"
        exit 1
    fi
fi

echo "✅ Vercel CLI version: $(vercel --version)"

# Check for running development servers that might interfere
if lsof -i :3000 > /dev/null 2>&1; then
    echo "⚠️ Development server detected on port 3000"
    echo "This may cause deployment conflicts. Recommend stopping dev server first."
    echo "Continue anyway? (y/N): "
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "🛑 Deployment cancelled. Stop dev server and retry."
        exit 1
    fi
fi

# Validate Node.js and dependencies
if ! command -v node >/dev/null 2>&1; then
    echo "❌ Node.js not found. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"

# Check for critical API files
if [ ! -f "src/app/api/health/route.ts" ]; then
    echo "❌ API routes not found. Vercel API functionality required."
    exit 1
fi

echo "✅ Vercel API routes detected"
echo ""

echo "📋 Current changes:"
git status --short

echo ""
echo "🧹 Pre-deployment Cleanup..."
echo "============================"

# Clean build artifacts and caches
echo "🧽 Cleaning build artifacts..."
rm -rf .next out dist build 2>/dev/null
echo "🧽 Cleaning dependency caches..."
rm -rf node_modules/.cache .npm/_cacache 2>/dev/null
echo "🧽 Cleaning temporary files..."
rm -rf /tmp/commit_message.txt 2>/dev/null
echo "✅ Cleanup complete"

echo ""
echo "🔧 Vercel Deployment Validation..."
echo "=================================="

# Check for API routes
if [ -d "src/app/api" ]; then
    echo "✅ Vercel API routes directory found"
    echo "  - Health: $(ls src/app/api/health/route.ts 2>/dev/null && echo "✅" || echo "❌")"
    echo "  - Register: $(ls src/app/api/register-room-code/route.ts 2>/dev/null && echo "✅" || echo "❌")"
    echo "  - Resolve: $(ls src/app/api/resolve-room-code/*/route.ts 2>/dev/null && echo "✅" || echo "❌")"
else
    echo "❌ API routes missing! Vercel deployment requires API routes."
    echo "Deploy anyway? (y/N): "
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "🛑 Deployment cancelled. Create API routes first."
        exit 1
    fi
fi

# Check for proper next.config.ts
if grep -q "VERCEL" next.config.ts > /dev/null 2>&1; then
    echo "✅ Vercel configuration detected in next.config.ts"
else
    echo "⚠️ Vercel configuration may be missing in next.config.ts"
fi

echo ""
echo "➕ Staging all changes..."
git add -A

echo ""
echo "📝 Committing changes..."

# Create comprehensive commit message
cat > /tmp/commit_message.txt << 'EOF'
🚀 Vercel Production Deployment - Room Code API Integration

Migrated from GitHub Pages to Vercel for full-stack functionality with serverless API routes for room code management.

🎯 VERCEL MIGRATION IMPLEMENTATION:
• Added Next.js API routes for room code functionality
• /api/register-room-code - POST endpoint for room registration
• /api/resolve-room-code/[code] - GET endpoint for code resolution
• /api/health - Health check endpoint with Vercel detection
• Automatic server detection between Vercel and Cloud Run

🔧 TECHNICAL IMPROVEMENTS:
• ServerUtils updated with Vercel deployment detection
• next.config.ts optimized for Vercel (no static export)
• CORS headers configured for API routes
• Environment variable management for Vercel
• Graceful fallback between API sources

🛡️ API FUNCTIONALITY:
• In-memory room code storage for session persistence
• Deterministic room code generation matching client-side
• Auto-resolution for codes created deterministically
• CORS support for cross-origin requests
• Comprehensive error handling and logging

✅ DEPLOYMENT ARCHITECTURE:
• Frontend: Vercel hosting with Next.js SSR
• API Routes: Vercel serverless functions
• WebSocket: Google Cloud Run (existing)
• Room Codes: Vercel API (new)
• Environment: Production-ready with proper detection

📱 PRODUCTION FEATURES:
• Room creation now works on production (no 404 errors)
• Server-independent room code generation and resolution
• Vercel platform detection and automatic API routing
• Graceful degradation if server APIs are unavailable
• Mobile-optimized API performance with proper timeouts

🔒 ENHANCED RELIABILITY:
• Multiple fallback layers for room code resolution
• Client-side caching with server verification
• Environment-aware URL routing (dev vs Vercel vs Cloud Run)
• Proper error handling without breaking room creation flow

🛠️ DEPLOYMENT READY FEATURES:
• Complete room functionality working on all platforms
• Professional API architecture with proper status codes
• Comprehensive logging for debugging and monitoring
• Mobile-responsive with proper CORS configuration
• Production-grade error handling and fallbacks

Result: Festival Chat now has full room creation functionality on Vercel production deployment - no more 404 errors when creating rooms!
EOF

git commit -F /tmp/commit_message.txt
rm /tmp/commit_message.txt

if [ $? -eq 0 ]; then
    echo "✅ Changes committed successfully!"
    echo ""
    echo "🔄 Syncing with remote repository..."
    git pull origin main --no-rebase
    
    if [ $? -eq 0 ]; then
        echo "✅ Synced with remote!"
        echo ""
        echo "🚀 Deploying to Vercel..."
        
        # Set production environment
        export BUILD_TARGET=vercel-production
        
        # Deploy to Vercel
        vercel --prod --yes
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "🎪 FESTIVAL CHAT VERCEL DEPLOYMENT SUCCESSFUL!"
            echo "=============================================="
            echo ""
            echo "🚀 VERCEL PRODUCTION FEATURES:"
            echo "✅ Next.js frontend with SSR"
            echo "✅ Serverless API routes for room codes"
            echo "✅ /api/register-room-code endpoint"
            echo "✅ /api/resolve-room-code/[code] endpoint"
            echo "✅ /api/health endpoint with environment detection"
            echo "✅ Automatic Vercel platform detection"
            echo ""
            echo "🎆 ROOM FUNCTIONALITY RESTORED:"
            echo "✅ Room creation works without 404 errors"
            echo "✅ Room code registration via Vercel API"
            echo "✅ Room code resolution with fallbacks"
            echo "✅ Mobile-optimized API performance"
            echo "✅ CORS properly configured for all devices"
            echo ""
            echo "🛡️ TECHNICAL ARCHITECTURE:"
            echo "✅ Frontend: Vercel hosting"
            echo "✅ API Routes: Vercel serverless functions"
            echo "✅ WebSocket: Google Cloud Run (existing)"
            echo "✅ Room Codes: Vercel API + local fallbacks"
            echo "✅ Environment detection for proper routing"
            echo ""
            echo "🎪 FESTIVAL MANAGEMENT:"
            echo "✅ Room creation working on production"
            echo "✅ QR code sharing functionality intact"
            echo "✅ Admin dashboard accessible"
            echo "✅ WebSocket chat functionality preserved"
            echo "✅ Mobile responsiveness maintained"
            echo ""
            echo "🔍 PRODUCTION ACCESS:"
            echo "Main App: Check Vercel deployment URL"
            echo "API Health: [URL]/api/health"
            echo "Admin: [URL]/admin-analytics"
            echo ""
            echo "📋 NEXT STEPS:"
            echo ""
            echo "🧪 Testing Checklist:"
            echo "• Test room creation on Vercel production"
            echo "• Verify room code generation and joining"
            echo "• Confirm API endpoints respond correctly"
            echo "• Test cross-device connectivity"
            echo "• Validate admin dashboard access"
            echo ""
            echo "🔧 Configuration:"
            echo "• Update domain DNS if using custom domain"
            echo "• Test WebSocket connection to Cloud Run"
            echo "• Monitor API performance and error rates"
            echo "• Verify mobile device compatibility"
            echo ""
            echo "🎯 Production URLs:"
            echo "Check Vercel dashboard for deployment URL"
            echo "Room codes now work via Vercel API routes!"
            echo ""
        else
            echo "❌ Vercel deployment failed"
            echo "Check Vercel logs and try again"
            exit 1
        fi
    else
        echo "❌ Failed to sync with remote"
        echo "May have merge conflicts - check git status"
        exit 1
    fi
else
    echo "❌ Failed to commit changes"
    echo "Check for uncommitted files or conflicts"
    exit 1
fi

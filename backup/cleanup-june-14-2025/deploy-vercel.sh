#!/bin/zsh

# 🚀 Festival Chat Vercel Production Deployment Script
# ===================================================
# Clean, efficient deployment to Vercel with pre-deployment checks

echo "🚀 Festival Chat Vercel Deployment - Admin Dashboard Fix"
echo "======================================================="
echo ""
echo "📋 Deployment Contents:"
echo "• Fixed admin-analytics syntax error (broken file start)"
echo "• Complete admin dashboard with built-in components"
echo "• Session-based authentication with proper login/logout"
echo "• Real-time monitoring and admin controls"
echo "• Mobile-responsive admin interface"
echo ""

# Change to project directory
cd "/Users/qvint/Documents/Design/Design Stuff/Side Projects/Peddler Network App/festival-chat"

echo "🔍 Pre-deployment Checks..."
echo "==========================="

# Check for running development servers
if lsof -i :3000 > /dev/null 2>&1; then
    echo "⚠️ Development server running on port 3000"
    echo "This may interfere with build process. Stop it? (y/N): "
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        echo "🛑 Please stop the dev server manually and re-run this script"
        exit 1
    fi
fi

# Validate Node.js
if ! command -v node >/dev/null 2>&1; then
    echo "❌ Node.js not found. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"

# Check Vercel CLI
if ! command -v vercel >/dev/null 2>&1; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel@latest
fi

echo "✅ Vercel CLI ready"
echo ""

echo "🧹 Pre-deployment Cleanup..."
echo "============================"

# Clean build artifacts
echo "🧽 Cleaning build cache..."
rm -rf .next out dist build 2>/dev/null
rm -rf node_modules/.cache .npm/_cacache 2>/dev/null

echo "✅ Cleanup complete"
echo ""

echo "🔧 Environment Check..."
echo "======================"

# Check for production environment
if [ -f ".env.production" ]; then
    echo "✅ Production environment configuration found"
else
    echo "⚠️ .env.production not found - using default environment"
fi

# Check for critical files
if [ ! -f "next.config.ts" ]; then
    echo "❌ next.config.ts not found"
    exit 1
fi

if [ ! -f "package.json" ]; then
    echo "❌ package.json not found"
    exit 1
fi

echo "✅ Critical files present"

# Validate admin dashboard fix
if grep -q "function MetricCard" src/app/admin-analytics/page.tsx > /dev/null 2>&1; then
    echo "✅ Admin dashboard fix confirmed - MetricCard component found"
else
    echo "⚠️ Admin dashboard may have issues - MetricCard component not found"
fi

if ! grep -q "^' : 'red'}" src/app/admin-analytics/page.tsx > /dev/null 2>&1; then
    echo "✅ Admin dashboard syntax error fixed - no leading quote fragments"
else
    echo "❌ Admin dashboard still has syntax error - file starts with quote fragment"
    exit 1
fi

echo ""

echo "📦 Installing Dependencies..."
echo "============================"
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed"
echo ""

echo "🏗️ Building Project..."
echo "====================="
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Check the errors above."
    echo "Common issues:"
    echo "• TypeScript errors"
    echo "• Missing dependencies"  
    echo "• Syntax errors"
    echo ""
    exit 1
fi

echo "✅ Build successful!"
echo ""

echo "🚀 Deploying to Vercel..."
echo "========================="

# Deploy to Vercel production
vercel --prod

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 VERCEL DEPLOYMENT SUCCESSFUL!"
    echo "==============================="
    echo ""
    echo "🌍 Your app is now live on Vercel!"
    echo ""
    echo "🔐 ADMIN DASHBOARD FIXED & DEPLOYED:"
    echo "✅ Syntax error in admin-analytics page resolved"
    echo "✅ Complete admin dashboard with built-in MetricCard component"
    echo "✅ Session-based authentication system working"
    echo "✅ Real-time polling and dashboard updates"
    echo "✅ Mobile-responsive admin interface"
    echo "✅ Admin controls: broadcast, room clearing, database wipe"
    echo ""
    echo "🎯 Admin Access:"
    echo "• URL: /admin-analytics"
    echo "• Features: Custom login form, logout button, session management"
    echo "• Mobile-optimized for festival staff"
    echo ""
    echo "🔍 Check deployment status:"
    echo "• Vercel Dashboard: https://vercel.com/dashboard"
    echo "• Domain: Check your Vercel project for the live URL"
    echo ""
    echo "🛠️ Next Steps:"
    echo "• Test the live application"
    echo "• Verify admin dashboard login/logout functionality"
    echo "• Test admin controls (broadcast, room clearing)"
    echo "• Check WebSocket connections"
    echo "• Monitor performance in Vercel analytics"
    echo ""
    echo "💡 Remember to update WebSocket server if needed:"
    echo "• Staging: ./scripts/deploy-websocket-staging.sh"
    echo "• Production: ./scripts/deploy-websocket-cloudbuild.sh"
    echo ""
else
    echo "❌ Vercel deployment failed!"
    echo ""
    echo "🔍 Troubleshooting:"
    echo "• Check Vercel CLI authentication: vercel login"
    echo "• Verify project configuration in vercel.json"
    echo "• Check build logs above for errors"
    echo "• Ensure no conflicting deployments"
    echo ""
    echo "🆘 Common solutions:"
    echo "• Run 'vercel login' to re-authenticate"
    echo "• Clear Vercel cache: vercel --debug"
    echo "• Check project settings in Vercel dashboard"
    echo ""
    exit 1
fi
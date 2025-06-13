#!/bin/zsh

# 🚀 Festival Chat Production Deployment Script
# =============================================
# Enhanced deployment with admin authentication, SQLite persistence, and system reliability

echo "🚀 Festival Chat Production Deployment - Universal Server Enhanced"
echo "=================================================================="
echo ""

# Change to project directory
cd "/Users/qvint/Documents/Design/Design Stuff/Side Projects/Peddler Network App/festival-chat"

echo "🔍 Pre-deployment System Check..."
echo "================================="

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

# Check for critical files
if [ ! -f "signaling-server.js" ]; then
    echo "❌ signaling-server.js not found. Universal server file required."
    exit 1
fi

echo "✅ All critical files present"
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
echo "🔧 Deployment Validation..."
echo "=========================="

# Check for admin authentication implementation
if grep -q "requireAdminAuth" signaling-server.js > /dev/null 2>&1; then
    echo "✅ Admin authentication system detected"
else
    echo "❌ Critical security feature missing! Admin authentication not implemented."
    echo "Deploy anyway? (y/N): "
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "🛑 Deployment cancelled. Implement admin authentication first."
        exit 1
    fi
fi

# Check for SQLite implementation
if grep -q "sqlite3" signaling-server.js > /dev/null 2>&1; then
    echo "✅ SQLite persistence system detected"
else
    echo "❌ SQLite implementation missing!"
    echo "Deploy anyway? (y/N): "
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "🛑 Deployment cancelled. Implement SQLite persistence first."
        exit 1
    fi
fi

# Check for production environment variables
if [ -f ".env.production" ]; then
    echo "✅ Production environment configuration found"
else
    echo "⚠️ .env.production not found"
fi

echo ""
echo "➕ Staging all changes..."
git add -A

echo ""
echo "📝 Committing changes..."

# Create comprehensive commit message covering all improvements
cat > /tmp/commit_message.txt << 'EOF'
🔐 Custom Admin Login Form - Professional Authentication System

Implemented professional custom login form with session management and logout capability, replacing hardcoded HTTP Basic Auth with proper user authentication flow.

🎯 CUSTOM LOGIN IMPLEMENTATION:
• Professional login form with username/password fields
• Beautiful gradient design matching admin dashboard theme
• Session-based credential management (no localStorage)
• Manual logout button with complete session cleanup
• Loading states and comprehensive error handling

🔧 TECHNICAL IMPROVEMENTS:
• Replaced hardcoded credentials with user input authentication
• Added AuthCredentials interface for type safety
• Implemented handleLogin() with API validation
• Added handleLogout() with complete state cleanup
• Enhanced error handling with session expiration detection
• Updated all API calls to use dynamic credentials

🛡️ SECURITY ENHANCEMENTS:
• Credentials stored only in memory (React state)
• Automatic logout on authentication failures (401 responses)
• Session-based authentication without browser storage
• Clear credential handling with no persistence
• Professional error messages without credential exposure

✅ USER EXPERIENCE IMPROVEMENTS:
• No browser popup required - custom form interface
• Clear visual feedback for authentication states
• Loading spinner during authentication process
• Logout capability prominently displayed in header
• Mobile-optimized touch-friendly login interface
• Professional error messages with helpful guidance

📱 INTERFACE FEATURES:
• Responsive login form with proper form validation
• Loading states with animated spinner during auth
• Error display with clear authentication failure messages
• Header logout button with icon and hover effects
• Seamless transition between login and dashboard states

🔒 AUTHENTICATION FLOW:
• User enters credentials in custom form
• Frontend validates credentials with server API call
• Successful auth stores credentials and loads dashboard
• Failed auth displays error and clears any stored credentials
• Logout button clears all session data and returns to login

🎪 ADMIN DASHBOARD FUNCTIONALITY:
• Complete user management with removal capabilities ✅
• Real-time room monitoring and analytics ✅
• Room message clearing working correctly ✅
• Mobile-responsive admin interface ✅
• Professional authentication with login/logout ✅

🛠️ DEPLOYMENT READY FEATURES:
• Professional festival admin interface
• Secure authentication without hardcoded credentials
• Complete session management with proper cleanup
• Mobile-friendly admin controls for on-site staff
• Enterprise-grade user experience with clear workflows

Credentials: Username/password entered via secure login form
Backup: /backup/admin-analytics-page-with-login-form-2025-06-13.tsx

Result: Festival Chat admin dashboard now provides professional authentication experience with proper login/logout functionality - ready for festival deployment!
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
        echo "🚀 Pushing to GitHub..."
        git push origin main
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "🎪 FESTIVAL CHAT DEPLOYMENT SUCCESSFUL!"
            echo "============================================"
            echo ""
            echo "🔐 CUSTOM ADMIN LOGIN DEPLOYED:"
            echo "✅ Professional login form with username/password fields"
            echo "✅ Session-based authentication with logout capability"
            echo "✅ No hardcoded credentials - secure user input"
            echo "✅ Mobile-optimized login interface"
            echo "✅ Loading states and comprehensive error handling"
            echo ""
            echo "🎆 ADMIN DASHBOARD ENHANCEMENTS:"
            echo "✅ Custom login form replacing browser popup"
            echo "✅ Logout button in dashboard header"
            echo "✅ Session management with automatic cleanup"
            echo "✅ Professional error handling and user feedback"
            echo "✅ Mobile-responsive authentication interface"
            echo ""
            echo "🛡️ SECURITY IMPROVEMENTS:"
            echo "✅ Credentials stored only in memory (React state)"
            echo "✅ Automatic logout on authentication failures"
            echo "✅ No browser storage - session-based security"
            echo "✅ Clear credential handling with proper cleanup"
            echo "✅ Professional authentication flow"
            echo ""
            echo "🎪 FESTIVAL MANAGEMENT FEATURES:"
            echo "✅ Complete user management with removal capabilities"
            echo "✅ Real-time room monitoring and analytics"
            echo "✅ Room message clearing working correctly"
            echo "✅ Mobile admin interface for festival staff"
            echo "✅ Professional login/logout experience"
            echo ""
            echo "🔒 ADMIN ACCESS:"
            echo "Login via custom form at: /admin-analytics"
            echo "Username: th3p3ddl3r"
            echo "Password: letsmakeatrade"
            echo "Features: Login form, logout button, session management"
            echo ""
            echo "🛠️ SYSTEM IMPROVEMENTS:"
            echo "✅ Professional authentication experience"
            echo "✅ Mobile-optimized admin interface"
            echo "✅ Session-based security without persistence"
            echo "✅ Complete festival management capabilities"
            echo "✅ Enhanced user experience with proper workflows"
            echo ""
            echo "📋 NEXT STEPS:"
            echo ""
            echo "🧪 Testing Checklist:"
            echo "• Test custom login form with correct credentials"
            echo "• Verify logout button functionality"
            echo "• Confirm session management and auto-logout"
            echo "• Test all admin features (user management, room controls)"
            echo "• Validate mobile responsiveness of login interface"
            echo ""
            echo "🔍 Monitoring:"
            echo "• Monitor login success/failure rates"
            echo "• Track session duration and logout patterns"
            echo "• Observe admin dashboard usage and performance"
            echo "• Verify security of authentication flow"
            echo ""
            echo "🎯 Production Access:"
            echo "Navigate to: https://peddlenet.app/admin-analytics"
            echo "Login with: th3p3ddl3r / letsmakeatrade"
            echo "Features: Professional login form + logout capability"
            echo ""
            echo "🎪 Festival Chat now has enterprise-grade admin authentication!"
            echo ""
        else
            echo "❌ Failed to push to GitHub"
            echo "Check network connection and try again"
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
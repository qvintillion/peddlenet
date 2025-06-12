#!/bin/bash

# 🔧 Deploy Message Updater
# =========================
# Quick script to update deploy.sh commit messages

echo "🔧 Festival Chat Deploy Message Updater"
echo "========================================"
echo ""

# Get the current commit title and description
CURRENT_TITLE=$(grep "COMMIT_TITLE=" ../deploy.sh | head -1 | cut -d'"' -f2)
echo "Current commit title: $CURRENT_TITLE"
echo ""

# Ask for new title
read -p "Enter new commit title (or press Enter to keep current): " NEW_TITLE
if [ -z "$NEW_TITLE" ]; then
    NEW_TITLE="$CURRENT_TITLE"
fi

echo ""
echo "🎯 Choose deployment type:"
echo "1. 🐛 Bug fix / small improvement"
echo "2. ✨ New feature addition"
echo "3. 🎨 UI/UX improvements" 
echo "4. 📱 Mobile enhancements"
echo "5. ⚡ Performance optimization"
echo "6. 📚 Documentation update"
echo "7. 🔧 Infrastructure/DevOps"
echo "8. 🧹 Code cleanup/refactoring"
echo "9. 🔒 Security improvements"
echo "10. 📦 Dependencies update"
echo "11. 💾 Custom description"

read -p "Select type (1-11): " DEPLOY_TYPE

case $DEPLOY_TYPE in
    1)
        DESCRIPTION_TEMPLATE="🐛 **BUG FIX - PRODUCTION IMPROVEMENT**

Quick fix deployment to resolve specific issues and improve user experience.

🔧 **Bug Fixes & Improvements:**
✅ [Describe the specific bug fixed or improvement made]
✅ [Any additional fixes included]
✅ Enhanced error handling and user feedback
✅ Improved stability and reliability"
        ;;
    2)
        DESCRIPTION_TEMPLATE="✨ **NEW FEATURE DEPLOYMENT**

Adding new functionality to enhance the Festival Chat experience.

🚀 **New Features:**
✅ [Describe the main new feature]
✅ [Any supporting features or improvements]
✅ Enhanced user interface for new functionality
✅ Mobile optimization for new features"
        ;;
    3)
        DESCRIPTION_TEMPLATE="🎨 **UI/UX ENHANCEMENT DEPLOYMENT**

Improving the visual design and user experience of Festival Chat.

🎨 **Design Improvements:**
✅ [Describe visual/UX changes]
✅ Enhanced user interface elements
✅ Improved accessibility and usability
✅ Better responsive design across devices"
        ;;
    4)
        DESCRIPTION_TEMPLATE="📱 **MOBILE EXPERIENCE ENHANCEMENT**

Optimizing Festival Chat for mobile devices and touch interactions.

📱 **Mobile Improvements:**
✅ [Describe mobile-specific improvements]
✅ Enhanced touch interactions and gestures
✅ Better responsive layout for small screens
✅ Improved mobile performance and loading"
        ;;
    5)
        DESCRIPTION_TEMPLATE="⚡ **PERFORMANCE OPTIMIZATION**

Improving speed, efficiency, and resource usage of Festival Chat.

⚡ **Performance Enhancements:**
✅ [Describe performance improvements]
✅ Optimized loading times and responsiveness
✅ Better resource management and caching
✅ Enhanced scalability and stability"
        ;;
    6)
        DESCRIPTION_TEMPLATE="📚 **DOCUMENTATION UPDATE**

Improving developer documentation and user guides.

📚 **Documentation Improvements:**
✅ [Describe documentation changes]
✅ Updated setup and deployment guides
✅ Enhanced troubleshooting resources
✅ Better code comments and README files"
        ;;
    7)
        DESCRIPTION_TEMPLATE="🔧 **INFRASTRUCTURE & DEVOPS IMPROVEMENT**

Enhancing development workflow and deployment processes.

🔧 **Infrastructure Improvements:**
✅ [Describe infrastructure changes]
✅ Enhanced deployment scripts and automation
✅ Better monitoring and error handling
✅ Improved development environment setup"
        ;;
    8)
        DESCRIPTION_TEMPLATE="🧹 **CODE CLEANUP & REFACTORING**

Improving code quality, organization, and maintainability.

🧹 **Code Quality Improvements:**
✅ [Describe refactoring changes]
✅ Enhanced code organization and structure
✅ Removed technical debt and unused code
✅ Better error handling and logging"
        ;;
    9)
        DESCRIPTION_TEMPLATE="🔒 **SECURITY ENHANCEMENT**

Improving security measures and protecting user data.

🔒 **Security Improvements:**
✅ [Describe security enhancements]
✅ Enhanced data protection and validation
✅ Better authentication and authorization
✅ Improved secure communication protocols"
        ;;
    10)
        DESCRIPTION_TEMPLATE="📦 **DEPENDENCIES UPDATE**

Updating libraries, frameworks, and development tools.

📦 **Dependency Updates:**
✅ [Describe dependency changes]
✅ Updated to latest stable versions
✅ Enhanced security and performance
✅ Better compatibility and features"
        ;;
    11)
        echo ""
        echo "Enter your custom description (press Ctrl+D when finished):"
        DESCRIPTION_TEMPLATE=$(cat)
        ;;
    *)
        echo "Invalid selection. Using current description."
        exit 1
        ;;
esac

echo ""
echo "✅ Deploy message prepared!"
echo ""
echo "📋 New commit title: $NEW_TITLE"
echo ""
echo "🎯 You can now edit the deploy.sh file with these details, or run it as-is."
echo ""
echo "💡 Remember to customize the [Describe...] placeholders in the description!"

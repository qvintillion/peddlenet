#!/bin/bash

echo "🧹 Cleaning Up Unnecessary Scripts"
echo "=================================="
echo ""

cd "/Users/qvint/Documents/Design/Design Stuff/Side Projects/Peddler Network App/festival-chat"

echo "📋 Scripts to remove:"

# List of scripts to remove (keeping only dev-mobile.sh and deploy.sh)
SCRIPTS_TO_REMOVE=(
    "commit-and-deploy.sh"
    "comprehensive-message-debug.sh"
    "debug-messages.sh"
    "deploy-message-fix.sh"
    "deploy-to-github.sh"
    "enhanced-debug.sh"
    "fix-auto-deploy.sh"
    "fix-connections-debug.sh"
    "fix-display-name.sh"
    "fix-github-push.sh"
    "fix-peer-count.sh"
    "git-deploy.sh"
    "make-executable.sh"
    "make-scripts-executable.sh"
    "mobile-dev.sh"
    "mobile-ip-fix.sh"
    "quick-deploy-git.sh"
    "run-deploy.sh"
    "sync-and-push.sh"
    "urgent-fix-loop.sh"
)

# Remove scripts
for script in "${SCRIPTS_TO_REMOVE[@]}"; do
    if [ -f "$script" ]; then
        echo "  🗑️  $script"
        rm "$script"
    fi
done

echo ""
echo "📋 Documentation to archive:"

# Archive old documentation files
DOCS_TO_ARCHIVE=(
    "COMMIT-MESSAGE.md"
    "DEPLOY-CHECKLIST.md"
    "DEPLOYMENT-SUMMARY.md"
    "DEPLOYMENT.md"
    "DEV-SCRIPT-MIGRATION.md"
    "DUPLICATE-FIX-SUMMARY.md"
    "MESSAGE-DISPLAY-FIX.md"
    "MOBILE-DEV-IMPROVED.md"
)

# Create archive/docs directory if it doesn't exist
mkdir -p archive/docs

for doc in "${DOCS_TO_ARCHIVE[@]}"; do
    if [ -f "$doc" ]; then
        echo "  📦 $doc → archive/docs/"
        mv "$doc" "archive/docs/"
    fi
done

echo ""
echo "📋 Keeping essential scripts:"
echo "  ✅ dev-mobile.sh (development testing)"
echo "  ✅ deploy.sh (deployment with editable commit messages)"
echo "  ✅ tools/ directory (development utilities)"

echo ""
echo "📋 Making essential scripts executable:"
chmod +x dev-mobile.sh
chmod +x deploy.sh
echo "  ✅ dev-mobile.sh is executable"
echo "  ✅ deploy.sh is executable"

echo ""
echo "🎉 Cleanup complete!"
echo ""
echo "📝 Next steps:"
echo "  🧪 Test development: ./dev-mobile.sh"
echo "  🚀 Deploy changes: Edit deploy.sh commit message, then run ./deploy.sh"
echo ""
echo "💡 Workflow:"
echo "  1. Make changes to your code"
echo "  2. Test with: ./dev-mobile.sh"
echo "  3. Edit commit message in deploy.sh"
echo "  4. Deploy with: ./deploy.sh"

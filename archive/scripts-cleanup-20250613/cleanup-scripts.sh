#!/bin/bash

# 🧹 Clean up unnecessary scripts created during admin dashboard fixes
# Removes temporary deployment scripts and keeps only essential ones

echo "🧹 Cleaning up unnecessary scripts..."

# List of scripts to remove (created during troubleshooting)
SCRIPTS_TO_REMOVE=(
    "complete-admin-fix.sh"
    "complete-admin-fix-final.sh" 
    "deploy-final-admin-fix.sh"
    "fix-admin-dashboard.sh"
    "quick-fix-admin.sh"
    "make-admin-fix-executable.sh"
    "make-complete-fix-executable.sh"
    "make-executable.sh"
    "chmod-fix.sh"
    "setup-vercel.sh"
)

# Move scripts to archive
echo "📦 Moving scripts to archive folder..."
mkdir -p archive/scripts-cleanup-$(date +%Y%m%d)

for script in "${SCRIPTS_TO_REMOVE[@]}"; do
    if [ -f "$script" ]; then
        echo "  📄 Archiving: $script"
        mv "$script" "archive/scripts-cleanup-$(date +%Y%m%d)/"
    fi
done

echo ""
echo "✅ Script cleanup complete!"
echo ""
echo "📋 Remaining essential scripts:"
echo "  - deploy.sh (main production deployment)"
echo "  - deploy-websocket-quick.sh (WebSocket server updates)"
echo "  - check-server-status.sh (server health checks)"
echo ""
echo "📁 Archived scripts moved to: archive/scripts-cleanup-$(date +%Y%m%d)/"
echo ""
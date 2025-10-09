#!/bin/bash
# Cleanup temporary documentation files
# Run after creating new official DEPLOYMENT.md

echo "🗑️ Cleaning up temporary documentation files..."
echo ""

cd "$(dirname "$0")"

# Move old deployment guide to archive
if [ -f "docs/06-DEPLOYMENT.md" ]; then
    mv docs/06-DEPLOYMENT.md docs/archive/06-DEPLOYMENT-OLD.md
    echo "✓ Archived old docs/06-DEPLOYMENT.md"
fi

# Remove temporary investigation docs
rm -f QR-CODE-FIX-GUIDE.md
rm -f DEPLOYMENT-WORKFLOW-CLARITY.md
rm -f DEPLOYMENT-SIMPLE-ANSWER.md
rm -f COMMANDS-EXPLAINED.md
rm -f VERCEL-GITHUB-CONNECTION-EXPLAINED.md
rm -f FIX-CLEANUP-AND-PUSH.md
rm -f CLEANUP-QUICK-START.md

echo "✓ Removed temporary documentation files"
echo ""
echo "📄 New official deployment guide: docs/DEPLOYMENT.md"
echo "✅ Cleanup complete!"

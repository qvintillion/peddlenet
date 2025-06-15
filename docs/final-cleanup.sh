#!/bin/bash

# Final Documentation Cleanup Script
# Organizes remaining historical files into proper archive structure

set -e

DOCS_DIR="/Users/qvint/Documents/Design/Design Stuff/Side Projects/Peddler Network App/festival-chat/docs"
cd "$DOCS_DIR"

echo "🧹 Final documentation cleanup..."

# Create additional archive directories
mkdir -p archive/implementation-guides
mkdir -p archive/deployment-strategies  
mkdir -p archive/environment-fixes

# Move implementation guides to archive
echo "📁 Moving implementation guides..."
[ -f "MESH-IMPLEMENTATION-STATUS.md" ] && mv "MESH-IMPLEMENTATION-STATUS.md" archive/implementation-guides/
[ -f "MESH-PHASE-1-COMPLETE.md" ] && mv "MESH-PHASE-1-COMPLETE.md" archive/implementation-guides/
[ -f "ANALYTICS-ADMIN-DASHBOARD-COMPREHENSIVE.md" ] && mv "ANALYTICS-ADMIN-DASHBOARD-COMPREHENSIVE.md" archive/implementation-guides/

# Move deployment strategy docs to archive  
echo "📁 Moving deployment strategies..."
[ -f "DEPLOYMENT-WORKFLOW.md" ] && mv "DEPLOYMENT-WORKFLOW.md" archive/deployment-strategies/
[ -f "DEPLOYMENT-WORKFLOW-OPTIMIZED.md" ] && mv "DEPLOYMENT-WORKFLOW-OPTIMIZED.md" archive/deployment-strategies/
[ -f "FIREBASE-SCRIPTS-STREAMLINING.md" ] && mv "FIREBASE-SCRIPTS-STREAMLINING.md" archive/deployment-strategies/
[ -f "PRODUCTION-DEPLOYMENT-GUIDE.md" ] && mv "PRODUCTION-DEPLOYMENT-GUIDE.md" archive/deployment-strategies/
[ -f "PRODUCTION-DEPLOYMENT-UPDATES.md" ] && mv "PRODUCTION-DEPLOYMENT-UPDATES.md" archive/deployment-strategies/

# Move environment-specific fixes to archive
echo "📁 Moving environment fixes..."
[ -f "ENVIRONMENT-SYNC-ISSUE-TRACKING.md" ] && mv "ENVIRONMENT-SYNC-ISSUE-TRACKING.md" archive/environment-fixes/
[ -f "FIREBASE-PREVIEW-SETUP.md" ] && mv "FIREBASE-PREVIEW-SETUP.md" archive/environment-fixes/
[ -f "STAGING-SYNC-CURRENT-SESSION.md" ] && mv "STAGING-SYNC-CURRENT-SESSION.md" archive/environment-fixes/

# Move miscellaneous docs to appropriate archives
echo "📁 Moving miscellaneous docs..."
[ -f "BACKUP_INFO.md" ] && mv "BACKUP_INFO.md" archive/deprecated/
[ -f "ROOT-CLEANUP-SUMMARY.md" ] && mv "ROOT-CLEANUP-SUMMARY.md" archive/session-summaries/
[ -f "PRODUCTION-SUCCESS-STAGING-READY.md" ] && mv "PRODUCTION-SUCCESS-STAGING-READY.md" archive/session-summaries/

# Clean up any remaining dated files (move to june-2025-fixes if June 2025)
echo "📁 Moving remaining June 2025 files..."
find . -maxdepth 1 -name "*JUNE*2025*.md" -exec mv {} archive/june-2025-fixes/ \; 2>/dev/null || true
find . -maxdepth 1 -name "*-2025.md" -exec mv {} archive/june-2025-fixes/ \; 2>/dev/null || true

# Move any remaining session summaries
find . -maxdepth 1 -name "SESSION-*.md" -exec mv {} archive/session-summaries/ \; 2>/dev/null || true

echo "✅ Documentation cleanup complete!"
echo ""
echo "📊 Current structure:"
echo "├── Core Documentation (numbered 01-12)"
echo "├── Feature Guides (MESH-, ADMIN-, etc.)"  
echo "├── Current Implementation Docs"
echo "└── archive/"
echo "    ├── june-2025-fixes/ (Daily fixes from June 2025)"
echo "    ├── session-summaries/ (Development session summaries)"
echo "    ├── deprecated/ (Outdated approaches)"
echo "    ├── implementation-guides/ (Historical implementations)"
echo "    ├── deployment-strategies/ (Old deployment approaches)"
echo "    └── environment-fixes/ (Environment-specific fixes)"
echo ""
echo "📚 Main documentation index: README.md"
echo "🚀 Deployment guide: 06-DEPLOYMENT.md"  
echo "🔧 Troubleshooting: 11-TROUBLESHOOTING.md"

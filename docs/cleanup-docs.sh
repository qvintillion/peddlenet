#!/bin/bash

# Documentation Cleanup Script - Moving historical files to archive
echo "🧹 Cleaning up documentation folder..."

DOCS_DIR="/Users/qvint/Documents/Design/Design Stuff/Side Projects/Peddler Network App/festival-chat/docs"
ARCHIVE_JUNE="/Users/qvint/Documents/Design/Design Stuff/Side Projects/Peddler Network App/festival-chat/docs/archive/june-2025-fixes"
ARCHIVE_SESSIONS="/Users/qvint/Documents/Design/Design Stuff/Side Projects/Peddler Network App/festival-chat/docs/archive/session-summaries"
ARCHIVE_DEPRECATED="/Users/qvint/Documents/Design/Design Stuff/Side Projects/Peddler Network App/festival-chat/docs/archive/deprecated"

# Move June 2025 fixes and daily session docs
echo "📁 Moving June 2025 fixes..."
mv "$DOCS_DIR"/ADMIN-*-JUNE-*-2025.md "$ARCHIVE_JUNE/" 2>/dev/null || true
mv "$DOCS_DIR"/BUILD-*-JUNE-*-2025.md "$ARCHIVE_JUNE/" 2>/dev/null || true
mv "$DOCS_DIR"/CRITICAL-*-JUNE-*-2025.md "$ARCHIVE_JUNE/" 2>/dev/null || true
mv "$DOCS_DIR"/CUSTOM-*-JUNE-*-2025.md "$ARCHIVE_JUNE/" 2>/dev/null || true
mv "$DOCS_DIR"/DEPLOYMENT-*-JUNE-*-2025.md "$ARCHIVE_JUNE/" 2>/dev/null || true
mv "$DOCS_DIR"/ENVIRONMENT-*-JUNE-*-2025.md "$ARCHIVE_JUNE/" 2>/dev/null || true
mv "$DOCS_DIR"/MESH-*-JUNE-*-2025.md "$ARCHIVE_JUNE/" 2>/dev/null || true
mv "$DOCS_DIR"/MESSAGE-*-JUNE-*-2025.md "$ARCHIVE_JUNE/" 2>/dev/null || true
mv "$DOCS_DIR"/NEXT-*-JUNE-*-2025.md "$ARCHIVE_JUNE/" 2>/dev/null || true
mv "$DOCS_DIR"/NOTIFICATION-*-JUNE-*-2025.md "$ARCHIVE_JUNE/" 2>/dev/null || true
mv "$DOCS_DIR"/P2P-*-JUNE-*-2025.md "$ARCHIVE_JUNE/" 2>/dev/null || true
mv "$DOCS_DIR"/PACKAGE-*-JUNE-*-2025.md "$ARCHIVE_JUNE/" 2>/dev/null || true
mv "$DOCS_DIR"/PREVIEW-*-JUNE-*-2025.md "$ARCHIVE_JUNE/" 2>/dev/null || true
mv "$DOCS_DIR"/PRODUCTION-*-JUNE-*-2025.md "$ARCHIVE_JUNE/" 2>/dev/null || true
mv "$DOCS_DIR"/ROOM-*-JUNE-*-2025.md "$ARCHIVE_JUNE/" 2>/dev/null || true
mv "$DOCS_DIR"/SCRIPT-*-JUNE-*-2025.md "$ARCHIVE_JUNE/" 2>/dev/null || true
mv "$DOCS_DIR"/SSR-*-JUNE-*-2025.md "$ARCHIVE_JUNE/" 2>/dev/null || true
mv "$DOCS_DIR"/STAGING-*-JUNE-*-2025.md "$ARCHIVE_JUNE/" 2>/dev/null || true
mv "$DOCS_DIR"/UNIQUE-*-JUNE-*-2025.md "$ARCHIVE_JUNE/" 2>/dev/null || true
mv "$DOCS_DIR"/USER-*-JUNE-*-2025.md "$ARCHIVE_JUNE/" 2>/dev/null || true
mv "$DOCS_DIR"/VARIABLE-*-JUNE-*-2025.md "$ARCHIVE_JUNE/" 2>/dev/null || true
mv "$DOCS_DIR"/WEBRTC-*-JUNE-*-2025.md "$ARCHIVE_JUNE/" 2>/dev/null || true
mv "$DOCS_DIR"/WEBSOCKET-*-JUNE-*-2025.md "$ARCHIVE_JUNE/" 2>/dev/null || true

# Move session summaries
echo "📁 Moving session summaries..."
mv "$DOCS_DIR"/SESSION-*-2025.md "$ARCHIVE_SESSIONS/" 2>/dev/null || true
mv "$DOCS_DIR"/CLEANUP-*-2025.md "$ARCHIVE_SESSIONS/" 2>/dev/null || true
mv "$DOCS_DIR"/DOCUMENTATION-UPDATE-*.md "$ARCHIVE_SESSIONS/" 2>/dev/null || true

# Move deprecated/outdated docs
echo "📁 Moving deprecated docs..."
mv "$DOCS_DIR"/BACKUP-PLAN-DEPLOYMENT.md "$ARCHIVE_DEPRECATED/" 2>/dev/null || true
mv "$DOCS_DIR"/FIREBASE_PREVIEW_SOLUTIONS.md "$ARCHIVE_DEPRECATED/" 2>/dev/null || true
mv "$DOCS_DIR"/IMMEDIATE-FIX-PLAN.md "$ARCHIVE_DEPRECATED/" 2>/dev/null || true
mv "$DOCS_DIR"/MINIMAL-DEPLOYMENT-APPROACH.md "$ARCHIVE_DEPRECATED/" 2>/dev/null || true
mv "$DOCS_DIR"/QUICK-FIX-PRODUCTION-SERVER.md "$ARCHIVE_DEPRECATED/" 2>/dev/null || true
mv "$DOCS_DIR"/SOLUTION-READY-FOR-DEPLOYMENT.md "$ARCHIVE_DEPRECATED/" 2>/dev/null || true
mv "$DOCS_DIR"/STAGING-DEPLOYMENT-FIX.md "$ARCHIVE_DEPRECATED/" 2>/dev/null || true
mv "$DOCS_DIR"/SQLITE3-*.md "$ARCHIVE_DEPRECATED/" 2>/dev/null || true

# Move specific fix files
mv "$DOCS_DIR"/COMPLETE-FRONTEND-ERROR-FIX-JUNE-14-2025.md "$ARCHIVE_JUNE/" 2>/dev/null || true
mv "$DOCS_DIR"/COMPREHENSIVE-NULL-DESTRUCTURING-FIX-JUNE-14-2025.md "$ARCHIVE_JUNE/" 2>/dev/null || true
mv "$DOCS_DIR"/OOPS-MESSAGING-REGRESSION-FIX-JUNE-13-2025.md "$ARCHIVE_JUNE/" 2>/dev/null || true

echo "✅ Documentation cleanup complete!"
echo "📊 Archive structure:"
echo "  - june-2025-fixes/: Daily fixes and implementations"
echo "  - session-summaries/: Session summaries and cleanup docs"  
echo "  - deprecated/: Outdated deployment approaches"

#!/bin/bash

# Quick batch move for June 2025 files
DOCS="/Users/qvint/Documents/Design/Design Stuff/Side Projects/Peddler Network App/festival-chat/docs"
ARCHIVE="$DOCS/archive/june-2025-fixes"

echo "Moving June 2025 fix files to archive..."

# Session summaries first
mv "$DOCS/SESSION-SUMMARY-JUNE-12-2025.md" "$DOCS/archive/session-summaries/" 2>/dev/null
mv "$DOCS/SESSION-SUMMARY-JUNE-15-2025.md" "$DOCS/archive/session-summaries/" 2>/dev/null
mv "$DOCS/CLEANUP-COMPLETE-SUMMARY-JUNE-14-2025.md" "$DOCS/archive/session-summaries/" 2>/dev/null

# Move admin fixes
mv "$DOCS/ADMIN-"*"-JUNE-"*"-2025.md" "$ARCHIVE/" 2>/dev/null

# Move critical fixes  
mv "$DOCS/CRITICAL-"*"-JUNE-"*"-2025.md" "$ARCHIVE/" 2>/dev/null

# Move specific implementation docs
mv "$DOCS/CUSTOM-"*"-JUNE-"*"-2025.md" "$ARCHIVE/" 2>/dev/null
mv "$DOCS/P2P-"*"-JUNE-"*"-2025.md" "$ARCHIVE/" 2>/dev/null
mv "$DOCS/MESH-"*"-JUNE-"*"-2025.md" "$ARCHIVE/" 2>/dev/null

echo "✅ Key files moved to archive"

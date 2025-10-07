#!/bin/bash
# Documentation Cleanup Script - October 2025
# Consolidates and archives documentation after reset

set -e

echo "📚 Festival Chat Documentation Cleanup - October 2025"
echo "===================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}▸${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Get project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

print_status "Working directory: $PROJECT_ROOT"
echo ""

# Create necessary directories
print_status "Creating directory structure..."
mkdir -p docs/archive/june-2025-fixes
mkdir -p docs/archive/june-2025-deployment-issues
mkdir -p docs/archive/june-2025-admin-fixes
mkdir -p docs/archive/mesh-networking
print_success "Directory structure created"
echo ""

# Move root-level documentation to docs folder
print_status "Moving root-level documentation to docs folder..."

if [ -f "DEPLOYMENT_READINESS.md" ]; then
    mv "DEPLOYMENT_READINESS.md" "docs/DEPLOYMENT_READINESS.md"
    print_success "Moved DEPLOYMENT_READINESS.md"
fi

if [ -f "WEB_APP_RESET_DOCUMENTATION.md" ]; then
    mv "WEB_APP_RESET_DOCUMENTATION.md" "docs/WEB_APP_RESET_DOCUMENTATION.md"
    print_success "Moved WEB_APP_RESET_DOCUMENTATION.md"
fi

echo ""

# Archive June 2025 fix documents
print_status "Archiving June 2025 fix documents..."

# Deployment-related fixes
DEPLOYMENT_FIXES=(
    "CRITICAL-DEPLOYMENT-ANALYSIS-JUNE-13-2025.md"
    "CRITICAL-PRODUCTION-DEPLOYMENT-FIXES-JUNE-12-2025.md"
    "DEPLOYMENT-GUIDE-UPDATED-JUNE-13-2025.md"
    "DEPLOYMENT-WORKFLOW-OPTIMIZED.md"
    "DEPLOYMENT-WORKFLOW.md"
    "DEPLOY-ENHANCED-SERVER-READY.md"
    "ENVIRONMENT-DETECTION-FIX-JUNE-13-2025.md"
    "ENVIRONMENT-SYNC-ISSUE-TRACKING.md"
    "FIREBASE-PREVIEW-SETUP.md"
    "FIREBASE-SCRIPTS-STREAMLINING.md"
    "FIREBASE_PREVIEW_SOLUTIONS.md"
    "PRODUCTION-DEPLOYMENT-COMMANDS-JUNE-14-2025.md"
    "PRODUCTION-DEPLOYMENT-GUIDE.md"
    "PRODUCTION-DEPLOYMENT-READY-JUNE-14-2025.md"
    "PRODUCTION-DEPLOYMENT-UPDATES.md"
    "PRODUCTION-SUCCESS-STAGING-READY.md"
    "QUICK-FIX-PRODUCTION-SERVER.md"
    "STAGING-DEPLOYMENT-FIX.md"
    "STAGING-SYNC-CURRENT-SESSION.md"
    "STAGING-WEBSOCKET-ENDPOINT-FIX-JUNE-14-2025.md"
    "VERCEL-DEPLOYMENT-GUIDE.md"
    "WEBSOCKET-CORS-API-FIX-JUNE-2025.md"
    "WEBSOCKET-WORKFLOW-FIX-JUNE-12-2025.md"
)

for file in "${DEPLOYMENT_FIXES[@]}"; do
    if [ -f "docs/$file" ]; then
        mv "docs/$file" "docs/archive/june-2025-deployment-issues/"
        print_success "Archived $file"
    fi
done

# Admin dashboard fixes
ADMIN_FIXES=(
    "ADMIN-ANALYTICS-DASHBOARD-IMPLEMENTATION-JUNE-2025.md"
    "ADMIN-ANALYTICS-DEPLOYMENT-CHECKLIST.md"
    "ADMIN-ANALYTICS-RESTORATION-COMPLETE-JUNE-13-2025.md"
    "ADMIN-AUTH-FIX-SESSION-SUMMARY-JUNE-13-2025.md"
    "ADMIN-AUTHENTICATION-IMPLEMENTED-JUNE-12-2025.md"
    "ADMIN-CLEAR-ROOM-FIX-JUNE-13-2025.md"
    "ADMIN-DASHBOARD-FIXES-COMPLETE-JUNE-13-2025.md"
    "ADMIN-DASHBOARD-MAJOR-UPDATES-JUNE-14-2025.md"
    "ADMIN-DASHBOARD-NODEENV-IMPLEMENTATION-JUNE-12-2025.md"
    "ADMIN-DASHBOARD-ROOM-MANAGEMENT-FIXES-JUNE-13-2025.md"
    "ADMIN-DASHBOARD-URL-FIX-JUNE-12-2025.md"
    "ADMIN-HYDRATION-FIX-COMPLETE-JUNE-14-2025.md"
    "CLEAR-ROOM-MESSAGES-FIX-JUNE-12-2025.md"
    "CUSTOM-LOGIN-IMPLEMENTATION-SESSION-SUMMARY-JUNE-13-2025.md"
    "MESSAGE-TRACKING-ANALYTICS-FIX-JUNE-13-2025.md"
    "ROOM-CODE-404-FIX-JUNE-13-2025.md"
    "ROOM-SWITCHER-ENHANCEMENT-JUNE-12-2025.md"
    "ROOM-SWITCHER-UI-FIX-JUNE-12-2025.md"
)

for file in "${ADMIN_FIXES[@]}"; do
    if [ -f "docs/$file" ]; then
        mv "docs/$file" "docs/archive/june-2025-admin-fixes/"
        print_success "Archived $file"
    fi
done

# Build and code fixes
BUILD_FIXES=(
    "BUILD-HYDRATION-FIXES-JUNE-14-2025.md"
    "COMPLETE-FRONTEND-ERROR-FIX-JUNE-14-2025.md"
    "COMPREHENSIVE-NULL-DESTRUCTURING-FIX-JUNE-14-2025.md"
    "CRITICAL-FIX-JUNE-2025.md"
    "CRITICAL-MESSAGE-FIX-JUNE-13-2025.md"
    "DEVELOPMENT-STABILITY-UX-UPDATE-JUNE-11-2025.md"
    "DOCKER-PACKAGE-WARNINGS-FIX-JUNE-2025.md"
    "NOTIFICATION-FIXES-JUNE-11-2025.md"
    "NOTIFICATION-IMPROVEMENTS-JUNE-2025.md"
    "OOPS-MESSAGING-REGRESSION-FIX-JUNE-13-2025.md"
    "PACKAGE-WARNINGS-FIX-JUNE-2025.md"
    "PREVIEW-MESSAGE-DISPLAY-FIX-JUNE-2025.md"
    "SQLITE3-FALLBACK-APPROACH.md"
    "SQLITE3-SOLUTION-IMPLEMENTED.md"
    "SSR-ENVIRONMENT-FIX-JUNE-2025.md"
    "UNIQUE-USER-DISPLAY-FIX-JUNE-14-2025.md"
    "USER-DEDUPLICATION-FIX-JUNE-14-2025.md"
    "VARIABLE-SCOPE-FIX-JUNE-14-2025.md"
    "WEBSOCKET-SERVER-RESTORATION-JUNE-11-2025.md"
)

for file in "${BUILD_FIXES[@]}"; do
    if [ -f "docs/$file" ]; then
        mv "docs/$file" "docs/archive/june-2025-fixes/"
        print_success "Archived $file"
    fi
done

# Mesh networking documents
MESH_DOCS=(
    "MESH-DEBUG-PANEL-STAGING-ACCESS-JUNE-14-2025.md"
    "MESH-IMPLEMENTATION-STATUS.md"
    "MESH-NETWORKING-BRANCH-STRATEGY-JUNE-14-2025.md"
    "MESH-NETWORKING-IMPLEMENTATION-GUIDE.md"
    "MESH-PHASE-1-COMPLETE.md"
    "MESH-STATUS-URL-FIX-COMPLETE-JUNE-14-2025.md"
    "MESH-TESTING-GUIDE.md"
    "P2P connection problems doc"
    "P2P-CONNECTION-ERRORS-FIXED-JUNE-14-2025.md"
)

for file in "${MESH_DOCS[@]}"; do
    if [ -f "docs/$file" ]; then
        mv "docs/$file" "docs/archive/mesh-networking/"
        print_success "Archived $file"
    fi
done

# Session summaries and cleanup docs
SESSION_DOCS=(
    "CLEANUP-COMPLETE-SUMMARY-JUNE-14-2025.md"
    "CLEANUP-HISTORY-JUNE-2025.md"
    "DOCUMENTATION-UPDATE-DECEMBER-2025.md"
    "DOCUMENTATION-UPDATE-JUNE-11-2025.md"
    "DOCUMENTATION-UPDATE-JUNE-13-2025.md"
    "NEXT-SESSION-SETUP-JUNE-14-2025.md"
    "NEXT-STEPS-CUSTOM-WEBRTC-JUNE-15-2025.md"
    "ROOT-CLEANUP-SUMMARY.md"
    "SCRIPT-CLEANUP-SUMMARY-JUNE-2025.md"
    "SCRIPTS-CLEANUP-SUMMARY-JUNE-2025.md"
    "SESSION-COMPLETE-ENVIRONMENT-PARITY-BREAKTHROUGH.md"
    "SESSION-CPU-OPTIMIZATION-ADMIN-MODAL-FIX-JAN-10-2025.md"
    "SESSION-SUMMARY-JUNE-12-2025.md"
    "SESSION-SUMMARY-JUNE-15-2025.md"
)

for file in "${SESSION_DOCS[@]}"; do
    if [ -f "docs/$file" ]; then
        mv "docs/$file" "docs/archive/june-2025-fixes/"
        print_success "Archived $file"
    fi
done

# Miscellaneous archived docs
MISC_ARCHIVED=(
    "BACKUP-PLAN-DEPLOYMENT.md"
    "BACKUP_INFO.md"
    "IMMEDIATE-FIX-PLAN.md"
    "MESSAGING-TROUBLESHOOTING-GUIDE.md"
    "MINIMAL-DEPLOYMENT-APPROACH.md"
    "PRODUCTION-CHECKLIST.md"
    "SOLUTION-READY-FOR-DEPLOYMENT.md"
)

for file in "${MISC_ARCHIVED[@]}"; do
    if [ -f "docs/$file" ]; then
        mv "docs/$file" "docs/archive/june-2025-deployment-issues/"
        print_success "Archived $file"
    fi
done

echo ""

# Create README for main archive
print_status "Creating archive documentation..."
cat > docs/archive/README.md << 'EOF'
# Documentation Archive

This directory contains historical documentation from the project's development history.

## Directory Structure

### `june-2025-fixes/`
General bug fixes, build issues, and code improvements from June 2025.

### `june-2025-deployment-issues/`
Deployment pipeline issues and resolutions from June 2025.

### `june-2025-admin-fixes/`
Admin dashboard related fixes from June 2025.

### `mesh-networking/`
Mesh networking P2P implementation (removed in October 2025 reset).

## Why These Are Archived

On October 7, 2025, we performed a hard reset to resolve deployment and performance issues. These documents represent the troubleshooting period and are archived for historical reference.

See: [OCTOBER-2025-RESET-AND-RECOVERY.md](../OCTOBER-2025-RESET-AND-RECOVERY.md)
EOF

print_success "Created archive/README.md"

# Create sub-archive READMEs
cat > docs/archive/june-2025-fixes/README.md << 'EOF'
# June 2025 Fixes Archive

General bug fixes, build issues, and code improvements.
Resolved by October 2025 reset to clean state.
EOF

cat > docs/archive/june-2025-deployment-issues/README.md << 'EOF'
# June 2025 Deployment Issues Archive

Deployment pipeline issues and resolutions.
Resolved by October 2025 reset and proper architecture documentation.
EOF

cat > docs/archive/june-2025-admin-fixes/README.md << 'EOF'
# June 2025 Admin Dashboard Fixes Archive

Admin dashboard related fixes.
Current admin docs: ADMIN-ANALYTICS-DASHBOARD-COMPLETE.md
EOF

cat > docs/archive/mesh-networking/README.md << 'EOF'
# Mesh Networking Archive

Mesh networking P2P implementation documentation.
Removed in October 2025 reset - planned for future Phase 3+.
EOF

print_success "Created archive indexes"
echo ""

# Update main docs README
print_status "Updating docs/README.md..."
cat > docs/README.md << 'EOF'
# Festival Chat Documentation

**Status:** Post-Reset Clean State (October 2025)

---

## 📚 Core Documentation

1. **[Quick Start](./01-QUICK-START.md)** - Get started fast
2. **[User Guide](./02-USER-GUIDE.md)** - Feature overview
3. **[Mesh Networking](./03-MESH-NETWORKING.md)** - Future: P2P (not yet implemented)
4. **[Architecture](./04-ARCHITECTURE.md)** - System design
6. **[Deployment](./06-DEPLOYMENT.md)** - Deployment workflows ⭐
7. **[Mobile Optimization](./07-MOBILE-OPTIMIZATION.md)** - Mobile-first design
8. **[Connection Resilience](./08-CONNECTION-RESILIENCE.md)** - Reliability
9. **[Performance Monitoring](./09-PERFORMANCE-MONITORING.md)** - Metrics
10. **[Next Steps Roadmap](./10-NEXT-STEPS-ROADMAP.md)** - Future plans
11. **[Troubleshooting](./11-TROUBLESHOOTING.md)** - Common issues ⭐
12. **[Comprehensive Next Steps](./12-COMPREHENSIVE-NEXT-STEPS.md)** - Detailed roadmap

## 🎯 Current Status (October 2025)

- **[October 2025 Reset & Recovery](./OCTOBER-2025-RESET-AND-RECOVERY.md)** ⭐⭐ READ THIS FIRST
- **[Web App Reset Documentation](./WEB_APP_RESET_DOCUMENTATION.md)** - Detailed reset process
- **[Deployment Readiness](./DEPLOYMENT_READINESS.md)** - Current status

## 🎪 Admin Dashboard

- **[Admin Analytics Dashboard Complete](./ADMIN-ANALYTICS-DASHBOARD-COMPLETE.md)** - Complete guide
- **[Admin API Reference](./ADMIN-ANALYTICS-API-REFERENCE.md)** - API docs
- **[Admin Troubleshooting](./ADMIN_TROUBLESHOOTING.md)** - Admin-specific issues
- **[Analytics Comprehensive](./ANALYTICS-ADMIN-DASHBOARD-COMPREHENSIVE.md)** - Detailed analytics

## 🚀 Deployment

- **[Nuclear Cache Busting Guide](./NUCLEAR-CACHE-BUSTING-GUIDE.md)** - Cache clearing strategies

## 🗂️ Archive

Historical documentation: **[archive/](./archive/)** - June 2025 fixes and issues

---

## ✅ Current Features

- Real-time WebSocket messaging
- Room creation and QR codes
- Cross-device sync
- Admin dashboard
- Mobile-responsive
- Push notifications

## ⏳ In Progress

- Staging deployment testing
- Cross-platform testing

## ❌ Not Implemented

- Mesh networking (future Phase 3+)
- Bluetooth connectivity (future)

---

**Last Updated:** October 7, 2025  
**Status:** Post-Reset Clean State
EOF

print_success "Updated docs/README.md"
echo ""

# Summary
echo ""
echo "════════════════════════════════════════════════════════════"
print_success "Documentation cleanup complete!"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "📊 Summary:"
echo "  ✓ Moved root docs to docs/ folder"
echo "  ✓ Archived June 2025 fix documents"
echo "  ✓ Organized into categorical archives"
echo "  ✓ Created archive indexes"
echo "  ✓ Updated main docs README"
echo ""
echo "📁 Archive Structure:"
echo "  docs/archive/"
echo "    ├── june-2025-fixes/"
echo "    ├── june-2025-deployment-issues/"
echo "    ├── june-2025-admin-fixes/"
echo "    └── mesh-networking/"
echo ""
echo "📚 Active Documentation:"
echo "  See: docs/README.md"
echo ""
echo "🎯 Next Steps:"
echo "  1. Review docs/README.md"
echo "  2. Read OCTOBER-2025-RESET-AND-RECOVERY.md"
echo "  3. Test staging deployment"
echo ""
print_success "Ready for staging deployment!"
echo ""

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
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
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

# Create README for archive
print_status "Creating archive README..."
cat > docs/archive/README.md << 'EOF'
# Documentation Archive

This directory contains historical documentation from the project's development history.

## Directory Structure

### `june-2025-fixes/`
General bug fixes, build issues, and code improvements from June 2025:
- Build and hydration fixes
- Notification improvements
- User deduplication
- SQLite3 implementation
- General code quality fixes

### `june-2025-deployment-issues/`
Deployment pipeline issues and resolutions from June 2025:
- Environment detection fixes
- Deployment workflow optimizations
- Firebase/Vercel configuration
- WebSocket server deployment
- Staging and production deployment guides

### `june-2025-admin-fixes/`
Admin dashboard related fixes from June 2025:
- Authentication implementation
- Dashboard UI fixes
- Room management improvements
- Analytics restoration
- URL routing fixes

### `mesh-networking/`
Mesh networking P2P implementation (removed in October 2025 reset):
- Phase 1 implementation guides
- Testing documentation
- Debug panel access
- P2P connection troubleshooting

## Why These Are Archived

On October 7, 2025, we performed a hard reset to a clean state (origin/main from June 15, 2025) to resolve:
- Deployment pipeline breakage
- Environment synchronization issues
- Build error cycling (Tailwind/TypeScript/Components)
- Mesh networking complexity causing slow connections

These documents represent the fix attempts and solutions during the problematic period. They are archived for historical reference and to understand what issues were resolved by the reset.

## Current Documentation

See the parent `docs/` directory for current, active documentation:
- `OCTOBER-2025-RESET-AND-RECOVERY.md` - Summary of what happened and why
- `01-QUICK-START.md` through `12-COMPREHENSIVE-NEXT-STEPS.md` - Core guides
- `DEPLOYMENT_READINESS.md` - Current deployment status
- `WEB_APP_RESET_DOCUMENTATION.md` - Detailed reset process

---

**Archive Date:** October 7, 2025  
**Reason:** Reset to clean state, consolidated fix documentation
EOF

print_success "Created archive/README.md"
echo ""

# Create updated docs README
print_status "Creating updated docs README..."
cat > docs/README.md << 'EOF'
# Festival Chat Documentation

**Status:** Post-Reset Clean State (October 2025)  
**Current Version:** June 15, 2025 baseline + October improvements

---

## 📚 Documentation Structure

### Getting Started
1. **[Quick Start Guide](./01-QUICK-START.md)** - Get up and running fast
2. **[User Guide](./02-USER-GUIDE.md)** - Feature overview and usage

### Technical Documentation
3. **[Mesh Networking](./03-MESH-NETWORKING.md)** - Future: P2P architecture (not currently implemented)
4. **[Architecture](./04-ARCHITECTURE.md)** - System design and components
6. **[Deployment Guide](./06-DEPLOYMENT.md)** - Deployment workflows and platforms
7. **[Mobile Optimization](./07-MOBILE-OPTIMIZATION.md)** - Mobile-first design
8. **[Connection Resilience](./08-CONNECTION-RESILIENCE.md)** - Reliability patterns
9. **[Performance Monitoring](./09-PERFORMANCE-MONITORING.md)** - Metrics and monitoring

### Planning & Maintenance
10. **[Next Steps Roadmap](./10-NEXT-STEPS-ROADMAP.md)** - Future development plans
11. **[Troubleshooting](./11-TROUBLESHOOTING.md)** - Common issues and solutions
12. **[Comprehensive Next Steps](./12-COMPREHENSIVE-NEXT-STEPS.md)** - Detailed roadmap

### Admin Dashboard
- **[Admin Analytics Dashboard](./ADMIN-ANALYTICS-DASHBOARD-COMPLETE.md)** - Complete admin guide
- **[Admin API Reference](./ADMIN-ANALYTICS-API-REFERENCE.md)** - API documentation
- **[Admin Troubleshooting](./ADMIN_TROUBLESHOOTING.md)** - Admin-specific issues
- **[Analytics Dashboard Comprehensive](./ANALYTICS-ADMIN-DASHBOARD-COMPREHENSIVE.md)** - Detailed analytics guide

### Current Status (October 2025)
- **[October 2025 Reset & Recovery](./OCTOBER-2025-RESET-AND-RECOVERY.md)** ⭐ **START HERE**
- **[Web App Reset Documentation](./WEB_APP_RESET_DOCUMENTATION.md)** - Detailed reset process
- **[Deployment Readiness](./DEPLOYMENT_READINESS.md)** - Current deployment status

### Deployment Guides
- **[Nuclear Cache Busting Guide](./NUCLEAR-CACHE-BUSTING-GUIDE.md)** - Aggressive cache clearing strategies

---

## 🔍 Quick Navigation

### I want to...
- **Get started developing** → [01-QUICK-START.md](./01-QUICK-START.md)
- **Deploy to staging** → [06-DEPLOYMENT.md](./06-DEPLOYMENT.md#staging-environment)
- **Deploy to production** → [06-DEPLOYMENT.md](./06-DEPLOYMENT.md#production-environment)
- **Fix an issue** → [11-TROUBLESHOOTING.md](./11-TROUBLESHOOTING.md)
- **Understand the reset** → [OCTOBER-2025-RESET-AND-RECOVERY.md](./OCTOBER-2025-RESET-AND-RECOVERY.md)
- **Access admin dashboard** → [ADMIN-ANALYTICS-DASHBOARD-COMPLETE.md](./ADMIN-ANALYTICS-DASHBOARD-COMPLETE.md)
- **Clear cache issues** → [NUCLEAR-CACHE-BUSTING-GUIDE.md](./NUCLEAR-CACHE-BUSTING-GUIDE.md)

---

## 📊 Current Project Status

### ✅ Working Features
- Real-time WebSocket messaging
- Room creation and QR code invites
- Cross-device synchronization
- Mobile-responsive design
- Admin analytics dashboard
- Display name system
- Message history
- Connection status indicators

### ❌ Not Currently Implemented
- Mesh networking P2P (removed in reset)
- Bluetooth connectivity (future Phase 3+)
- Advanced admin analytics (to be restored)

### 🎯 Active Goals
1. Deploy to staging successfully
2. Test cross-platform (web + Android)
3. Restore admin analytics from backup
4. Deploy to production

---

## 📝 Documentation Guidelines

### When to Update Documentation
- ✅ After completing a feature
- ✅ After fixing a bug
- ✅ After deployment changes
- ✅ When architecture changes
- ❌ Don't create fix documents during active development

### Where to Put Documentation
- **Core guides** → Numbered docs (01-12)
- **Feature-specific** → Named docs (ADMIN-*, MESH-*, etc.)
- **Status updates** → Root level initially, then move to docs/
- **Fix attempts** → If complex enough to need docs, consolidate after resolution
- **Historical** → archive/ subdirectories

### Documentation Best Practices
1. Use clear, descriptive titles
2. Include date for time-sensitive docs
3. Mark status clearly (✅ Complete, ⏳ In Progress, ❌ Deprecated)
4. Cross-reference related documents
5. Archive old fix documents after issues resolved

---

## 🗂️ Archive

Historical documentation is preserved in the **[archive/](./archive/)** directory:
- June 2025 fix documents
- Deployment issue troubleshooting
- Admin dashboard fix history
- Mesh networking implementation (removed)

See **[archive/README.md](./archive/README.md)** for details.

---

**Last Updated:** October 7, 2025  
**Documentation Version:** Post-Reset v1.0  
**Project Status:** Ready for staging deployment
EOF

print_success "Created docs/README.md"
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
print_success "Documentation cleanup complete!"
echo ""
echo "📊 Summary:"
echo "  • Moved root docs to docs/ folder"
echo "  • Archived June 2025 fix documents"
echo "  • Created consolidated recovery document"
echo "  • Updated docs/README.md with new structure"
echo "  • Created archive/README.md for reference"
echo ""
echo "📁 New structure:"
echo "  docs/"
echo "    ├── 01-12 (Core documentation)"
echo "    ├── ADMIN-* (Admin dashboard guides)"
echo "    ├── OCTOBER-2025-RESET-AND-RECOVERY.md (Consolidates all fixes)"
echo "    ├── DEPLOYMENT_READINESS.md (Current status)"
echo "    ├── WEB_APP_RESET_DOCUMENTATION.md (Reset details)"
echo "    ├── README.md (Documentation index)"
echo "    └── archive/"
echo "        ├── june-2025-fixes/"
echo "        ├── june-2025-deployment-issues/"
echo "        ├── june-2025-admin-fixes/"
echo "        ├── mesh-networking/"
echo "        └── README.md"
echo ""
print_warning "Next steps:"
echo "  1. Review docs/OCTOBER-2025-RESET-AND-RECOVERY.md"
echo "  2. Test staging deployment"
echo "  3. Commit cleaned documentation to GitHub"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
EOF

print_success "Created cleanup-documentation.sh"
echo ""

# Make script executable
chmod +x docs/cleanup-documentation.sh 2>/dev/null || print_warning "Could not make script executable (run: chmod +x docs/cleanup-documentation.sh)"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
print_success "Cleanup script created!"
echo ""
echo "📝 Created files:"
echo "  1. docs/OCTOBER-2025-RESET-AND-RECOVERY.md"
echo "  2. docs/cleanup-documentation.sh"
echo ""
echo "🚀 To run the cleanup:"
echo "  cd festival-chat"
echo "  chmod +x docs/cleanup-documentation.sh"
echo "  ./docs/cleanup-documentation.sh"
echo ""
echo "⚠️  This will:"
echo "  • Move DEPLOYMENT_READINESS.md and WEB_APP_RESET_DOCUMENTATION.md to docs/"
echo "  • Archive all June 2025 fix documents"
echo "  • Create organized archive structure"
echo "  • Create docs/README.md with new index"
echo ""
print_warning "Review the script before running to ensure it matches your needs!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

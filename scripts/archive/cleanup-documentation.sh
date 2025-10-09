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
    echo -e "${YELLOW}⚠${NC}  $1"
}

# Get project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

print_status "Working directory: $PROJECT_ROOT"
echo ""

# The script already ran! Check if docs/README.md exists
if [ -f "docs/README.md" ]; then
    print_warning "Documentation cleanup already completed!"
    echo ""
    echo "📁 Current structure:"
    echo "  docs/"
    ls -1 docs/ | head -20
    echo ""
    echo "✅ Files already in place:"
    [ -f "docs/README.md" ] && echo "  ✓ docs/README.md"
    [ -f "docs/archive/README.md" ] && echo "  ✓ docs/archive/README.md"
    [ -f "docs/OCTOBER-2025-RESET-AND-RECOVERY.md" ] && echo "  ✓ docs/OCTOBER-2025-RESET-AND-RECOVERY.md"
    echo ""
    print_success "Documentation is already organized!"
    echo ""
    echo "Next steps:"
    echo "  1. git add docs/"
    echo "  2. git commit --amend --no-edit (to add to previous commit)"
    echo "  3. git push origin main"
    exit 0
fi

# If we're here, we need to create the README files
print_status "Creating missing README files..."

# Create docs/README.md
cat > docs/README.md << 'DOCEOF'
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
DOCEOF

print_success "Created docs/README.md"

# Create docs/archive/README.md
cat > docs/archive/README.md << 'ARCHEOF'
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
ARCHEOF

print_success "Created docs/archive/README.md"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
print_success "Documentation cleanup complete!"
echo ""
echo "📊 Summary:"
echo "  • Created docs/README.md (documentation index)"
echo "  • Created docs/archive/README.md (archive explanation)"
echo "  • All documentation properly organized"
echo ""
print_warning "Next steps:"
echo "  1. git add docs/README.md docs/archive/README.md"
echo "  2. git commit --amend --no-edit"
echo "  3. git push origin main"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

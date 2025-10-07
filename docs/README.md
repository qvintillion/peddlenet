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

# 📚 PeddleNet Festival Chat Documentation

*Last Updated: June 15, 2025*

## 🎯 Current Documentation

### Core Documentation
| File | Description | Status |
|------|-------------|---------|
| [01-QUICK-START.md](01-QUICK-START.md) | Getting started guide | ✅ Current |
| [02-USER-GUIDE.md](02-USER-GUIDE.md) | End-user documentation | ✅ Current |
| [04-ARCHITECTURE.md](04-ARCHITECTURE.md) | System architecture overview | ✅ Current |
| [06-DEPLOYMENT.md](06-DEPLOYMENT.md) | **Enhanced deployment with cache-busting** | ✅ **Updated June 15** |
| [11-TROUBLESHOOTING.md](11-TROUBLESHOOTING.md) | **Troubleshooting with cache solutions** | ✅ **Updated June 15** |

### Feature-Specific Documentation
| File | Description | Status |
|------|-------------|---------|
| [03-MESH-NETWORKING.md](03-MESH-NETWORKING.md) | P2P mesh networking implementation | ✅ Current |
| [07-MOBILE-OPTIMIZATION.md](07-MOBILE-OPTIMIZATION.md) | Mobile-first design patterns | ✅ Current |
| [08-CONNECTION-RESILIENCE.md](08-CONNECTION-RESILIENCE.md) | Connection recovery strategies | ✅ Current |
| [09-PERFORMANCE-MONITORING.md](09-PERFORMANCE-MONITORING.md) | Performance tracking | ✅ Current |

### Admin & Analytics
| File | Description | Status |
|------|-------------|---------|
| [ADMIN-ANALYTICS-DASHBOARD-COMPLETE.md](ADMIN-ANALYTICS-DASHBOARD-COMPLETE.md) | Admin dashboard implementation | ✅ Current |
| [ADMIN-ANALYTICS-API-REFERENCE.md](ADMIN-ANALYTICS-API-REFERENCE.md) | Admin API documentation | ✅ Current |
| [ADMIN_TROUBLESHOOTING.md](ADMIN_TROUBLESHOOTING.md) | Admin-specific troubleshooting | ✅ Current |

### Planning & Roadmap
| File | Description | Status |
|------|-------------|---------|
| [10-NEXT-STEPS-ROADMAP.md](10-NEXT-STEPS-ROADMAP.md) | Feature roadmap | ✅ Current |
| [12-COMPREHENSIVE-NEXT-STEPS.md](12-COMPREHENSIVE-NEXT-STEPS.md) | Comprehensive planning | ✅ Current |

### Specialized Guides
| File | Description | Status |
|------|-------------|---------|
| [MESH-NETWORKING-IMPLEMENTATION-GUIDE.md](MESH-NETWORKING-IMPLEMENTATION-GUIDE.md) | Mesh networking setup | ✅ Current |
| [MESH-TESTING-GUIDE.md](MESH-TESTING-GUIDE.md) | Testing mesh features | ✅ Current |
| [NUCLEAR-CACHE-BUSTING-GUIDE.md](NUCLEAR-CACHE-BUSTING-GUIDE.md) | Extreme cache clearing | ✅ Current |
| [PRODUCTION-CHECKLIST.md](PRODUCTION-CHECKLIST.md) | Pre-production verification | ✅ Current |
| [VERCEL-DEPLOYMENT-GUIDE.md](VERCEL-DEPLOYMENT-GUIDE.md) | Vercel-specific deployment | ✅ Current |
| [ROOT-CLEANUP-SUMMARY-JUNE-15-2025.md](ROOT-CLEANUP-SUMMARY-JUNE-15-2025.md) | Root folder organization cleanup | ✅ **New June 15** |

## 📁 Archive Structure

### Recent Fixes (June 2025)
Located in: `archive/june-2025-fixes/`
- Daily implementation fixes
- Specific feature implementations
- Critical issue resolutions

### Session Summaries
Located in: `archive/session-summaries/`
- Development session summaries
- Major milestone completions
- Documentation update summaries

### Deprecated Documentation
Located in: `archive/deprecated/`
- Outdated deployment approaches
- Superseded implementation guides
- Legacy troubleshooting docs

## 🚀 Quick Navigation

### For Developers
1. **Start Here**: [01-QUICK-START.md](01-QUICK-START.md)
2. **Deploy**: [06-DEPLOYMENT.md](06-DEPLOYMENT.md) 
3. **Troubleshoot**: [11-TROUBLESHOOTING.md](11-TROUBLESHOOTING.md)
4. **Architecture**: [04-ARCHITECTURE.md](04-ARCHITECTURE.md)

### For Administrators  
1. **Admin Dashboard**: [ADMIN-ANALYTICS-DASHBOARD-COMPLETE.md](ADMIN-ANALYTICS-DASHBOARD-COMPLETE.md)
2. **API Reference**: [ADMIN-ANALYTICS-API-REFERENCE.md](ADMIN-ANALYTICS-API-REFERENCE.md)
3. **Admin Troubleshooting**: [ADMIN_TROUBLESHOOTING.md](ADMIN_TROUBLESHOOTING.md)

### For Feature Development
1. **Mesh Networking**: [03-MESH-NETWORKING.md](03-MESH-NETWORKING.md)
2. **Mobile Optimization**: [07-MOBILE-OPTIMIZATION.md](07-MOBILE-OPTIMIZATION.md)
3. **Performance**: [09-PERFORMANCE-MONITORING.md](09-PERFORMANCE-MONITORING.md)

## 🔧 Recent Major Updates

### June 15, 2025 - Enhanced Cache-Busting Deployment
- ✅ **Unique Docker image tagging** prevents container caching
- ✅ **Explicit traffic management** with health verification
- ✅ **Comprehensive cache clearing** for all deployment layers
- ✅ **Build-time verification** prevents environment variable issues
- ✅ **Automatic development environment protection**

**Key Files Updated**:
- `06-DEPLOYMENT.md` - Complete rewrite with cache-busting strategies
- `11-TROUBLESHOOTING.md` - Added cache-related issue solutions
- `/scripts/deploy-websocket-staging.sh` - Enhanced with cache-busting
- `/tools/deploy-complete-enhanced.sh` - Comprehensive deployment

### Documentation Cleanup Process
- ✅ **Archive structure created** for historical fixes
- ✅ **Daily session docs archived** to prevent clutter
- ✅ **Deprecated approaches moved** to archive
- ✅ **Current docs updated** with latest solutions
- ✅ **Root folder organized** - deprecated scripts and files archived
- ✅ **Package.json updated** with corrected script paths

## 📋 Documentation Standards

### File Naming Convention
- `##-TITLE.md` - Core documentation (numbered)
- `FEATURE-SPECIFIC-GUIDE.md` - Feature implementation guides
- `ADMIN-*.md` - Admin and analytics documentation
- `archived/` - Historical and deprecated documentation

### Content Structure
1. **Purpose & Overview** - What this document covers
2. **Quick Reference** - Commands and key information
3. **Detailed Implementation** - Step-by-step instructions
4. **Troubleshooting** - Common issues and solutions
5. **References** - Links to related documentation

### Update Process
1. **Make changes** to relevant documentation
2. **Update the README.md** index with changes
3. **Archive old versions** if significantly changed
4. **Test documented procedures** before marking complete

## 🔍 Finding Documentation

### Search by Topic
- **Deployment Issues**: `06-DEPLOYMENT.md`, `11-TROUBLESHOOTING.md`
- **Cache Problems**: Search for "cache" in troubleshooting docs
- **WebSocket Issues**: `11-TROUBLESHOOTING.md` > WebSocket section
- **Admin Dashboard**: `ADMIN-*` files
- **Mesh Networking**: `03-MESH-NETWORKING.md`, `MESH-*` files

### Search by Error Message
- **"Deployment successful but no changes"**: `11-TROUBLESHOOTING.md`
- **"Environment variables not picked up"**: `06-DEPLOYMENT.md`
- **"WebSocket connection refused"**: `11-TROUBLESHOOTING.md`
- **"Traffic stuck on old revision"**: `06-DEPLOYMENT.md`

---

*This documentation index is maintained as part of the festival-chat project. For questions or suggestions, refer to the troubleshooting guides or check the archive for historical context.*

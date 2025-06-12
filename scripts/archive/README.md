# 📦 Archived Scripts - June 12, 2025

## 🎆 **Context: Post-Environment-Parity-Breakthrough Cleanup**

These scripts were moved to archive after achieving **perfect environment parity** across all deployment targets (dev, preview, staging, production) on June 12, 2025.

## 📋 **Archived Scripts Inventory**

### **🔍 Development & Debugging Tools**
- `debug-build.sh` - Debug Next.js build issues
- `debug-urls.sh` - URL and environment debugging  
- `diagnose-signaling.sh` - WebSocket connection diagnostics
- `get-build-logs.sh` - Retrieve Cloud Build logs
- `health-check.js` - Server health monitoring utility
- `ngrok-diagnostic.js` - Ngrok tunnel debugging
- `verify-environment.sh` - Environment variable validation
- `investigate-chrome-profiles.sh` - Chrome profile troubleshooting

### **📦 Package Management & Testing**
- `check-package-health.sh` - NPM package health checker
- `fix-package-warnings.sh` - Resolve package deprecation warnings
- `test-all-package-fixes.sh` - Comprehensive package testing
- `test-better-sqlite3.sh` - SQLite library testing
- `test-server-package.sh` - Server package validation
- `test-p2p-connection.js` - Peer-to-peer connection testing
- `test-room-stats.sh` - Room statistics testing

### **🚀 Legacy Deployment Scripts**
- `deploy-gcloud.sh` - Direct Google Cloud deployment
- `deploy-websocket-docker.sh` - Docker-based WebSocket deployment
- `deploy-websocket-environments.sh` - Multi-environment WebSocket deployment
- `deploy-staging-simple.sh` - Standalone staging deployment (replaced by `tools/deploy-complete.sh`)
- `complete-gcloud-setup.sh` - Google Cloud setup automation
- `update-deploy-message.sh` - Deployment message utilities

### **🖥️ UI & Browser Utilities**
- `manual-preview-open.sh` - Manual preview channel opening
- `open-in-chrome-profile.sh` - Chrome profile management

## 🎯 **Why These Were Archived**

With the **breakthrough workflow established**, these scripts became obsolete because:

1. **Environment Parity Achieved** - All environments now work consistently
2. **Streamlined Deployment** - Three-tier workflow handles all deployment needs
3. **Production Safety** - New scripts prevent conflicts and protect production
4. **Complete Integration** - Preview workflow fully integrated into package.json

## 🔧 **When You Might Need These**

These archived scripts may still be useful for:

- **Deep Debugging** - When standard troubleshooting isn't enough
- **Alternative Deployment** - If you need to deploy to different targets
- **Research & Development** - Understanding different implementation approaches
- **Emergency Recovery** - If main deployment scripts encounter issues
- **Custom Configurations** - Building specialized deployment workflows

## 🎉 **Current State: Streamlined Success**

The remaining scripts in `/scripts/` represent the **essential, production-ready workflow**:

```bash
# ✅ ESSENTIAL SCRIPTS (Active)
scripts/
├── dev-mobile.sh                    # Development with mobile support
├── deploy-preview-simple.sh         # Preview channel deployment
├── preview-manager.sh               # Preview channel management
├── deploy-websocket-staging.sh      # Staging WebSocket deployment
├── deploy-websocket-cloudbuild.sh   # Production WebSocket deployment
└── make-scripts-executable.sh       # Utility script

# ✅ MAIN DEPLOYMENT (Root level)
deploy.sh                            # Production deployment to GitHub
```

## 📚 **Historical Significance**

This cleanup represents the successful completion of the **June 12, 2025 Environment Synchronization Project**, which achieved:

- ✅ Perfect messaging parity across all environments
- ✅ Streamlined three-tier deployment workflow  
- ✅ Production-safe development processes
- ✅ Complete preview integration
- ✅ Zero-risk deployment scripts

**These archived scripts played crucial roles in reaching this breakthrough and remain available for reference and specialized use cases.**

---

*Archived: June 12, 2025*  
*Reason: Workflow streamlined after environment parity breakthrough*  
*Status: Available for reference and specialized use cases*

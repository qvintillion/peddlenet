# 🚀 Festival Chat Scripts - Essential Collection

## ✅ **ACTIVE SCRIPTS** (June 12, 2025 - Post-Environment-Parity-Breakthrough)

After achieving perfect environment parity across all deployment targets, these are the **essential scripts** for your streamlined three-tier workflow:

### **🎯 Core Development**
- **`dev-mobile.sh`** - Mobile development with automatic IP detection
  ```bash
  npm run dev:mobile  # Uses this script
  ```

### **🎪 Preview Environment (Feature Testing)**
- **`deploy-preview-simple.sh`** - Deploy to Firebase preview channels
  ```bash
  npm run preview:deploy feature-name  # Uses this script
  ```
- **`preview-manager.sh`** - Manage preview channels (list, delete, open)
  ```bash
  npm run preview:list     # Uses this script
  npm run preview:manage   # Uses this script  
  npm run preview:cleanup  # Uses this script
  ```

### **🏗️ Staging & Production Deployment**
- **`deploy-websocket-staging.sh`** - Deploy staging WebSocket server only
  ```bash
  # Optional: Deploy staging server independently
  ./scripts/deploy-websocket-staging.sh
  ```
- **`deploy-websocket-cloudbuild.sh`** - Deploy production WebSocket server
  ```bash
  # Used by main deployment when WebSocket server needs updating
  ```

### **🛠️ Utilities**
- **`make-scripts-executable.sh`** - Make all scripts executable
  ```bash
  ./scripts/make-scripts-executable.sh
  ```

---

## 🎆 **YOUR COMPLETE WORKFLOW**

```bash
# 1. DEVELOPMENT
npm run dev:mobile

# 2. PREVIEW (Feature Testing)  
npm run preview:deploy feature-name
npm run preview:list
npm run preview:manage
npm run preview:cleanup

# 3. STAGING (Pre-production)
npm run deploy:firebase:complete     # Handles both server + frontend

# 4. PRODUCTION (Release)
./deploy.sh                          # Root level script
```

---

## 📦 **ARCHIVED SCRIPTS** (`scripts/archive/`)

These scripts have been moved to `scripts/archive/` as they're no longer needed in the streamlined workflow:

**Development & Debugging:**
- `debug-build.sh`, `debug-urls.sh`, `diagnose-signaling.sh`
- `get-build-logs.sh`, `health-check.js`, `ngrok-diagnostic.js`
- `verify-environment.sh`, `investigate-chrome-profiles.sh`

**Package Management:**
- `check-package-health.sh`, `fix-package-warnings.sh`
- `test-all-package-fixes.sh`, `test-better-sqlite3.sh`, `test-server-package.sh`

**Legacy Deployment:**
- `deploy-gcloud.sh`, `deploy-websocket-docker.sh`, `deploy-websocket-environments.sh`
- `deploy-staging-simple.sh` (replaced by `tools/deploy-complete.sh`)
- `complete-gcloud-setup.sh`, `update-deploy-message.sh`

**Testing & Utilities:**
- `test-p2p-connection.js`, `test-room-stats.sh`
- `manual-preview-open.sh`, `open-in-chrome-profile.sh`

**Note**: These archived scripts contain valuable troubleshooting tools and alternative approaches that may be useful for debugging or special cases.

---

## 🎯 **BREAKTHROUGH ACHIEVEMENT**

This clean script structure reflects the **June 12, 2025 breakthrough** where we achieved:

✅ **Perfect Environment Parity** - All environments working with identical messaging behavior  
✅ **Streamlined Workflow** - Clean three-tier deployment system  
✅ **Production Safety** - Zero-risk deployment processes  
✅ **Complete Preview Integration** - Full channel management system  

**Result**: Your deployment workflow is now **production-ready and fully streamlined**! 🚀

---

## 🔧 **Making Scripts Executable**

If any script shows "permission denied":
```bash
chmod +x ./scripts/script-name.sh
# OR run the batch command:
./scripts/make-scripts-executable.sh
```

## 📚 **Documentation References**

- **Environment Parity**: `docs/ENVIRONMENT-SYNC-ISSUE-TRACKING.md`
- **Current Session**: `docs/STAGING-SYNC-CURRENT-SESSION.md`  
- **Troubleshooting**: `docs/11-TROUBLESHOOTING.md`
- **Architecture**: `docs/04-ARCHITECTURE.md`

# 🚀 Festival Chat Scripts - Essential Collection

## ✅ **ACTIVE SCRIPTS** (June 12, 2025 - Clean & Optimized)

After implementing the admin dashboard and NODE_ENV compliance fix, these are the **essential scripts** for your streamlined workflow:

### **🎯 Core Development**
- **`dev-mobile.sh`** - Mobile development with automatic IP detection
  ```bash
  npm run dev:mobile  # Uses this script
  ```
- **`make-scripts-executable.sh`** - Make all scripts executable
  ```bash
  ./scripts/make-scripts-executable.sh
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

### **🛠️ Environment Management**
- **`env-switch.sh`** - Switch between development environments
  ```bash
  npm run env:show         # Uses this script
  npm run env:dev          # Uses this script
  npm run env:staging      # Uses this script
  npm run env:production   # Uses this script
  ```

### **🐎 Admin Dashboard Tools**
- **`nuclear-admin-fix.sh`** - Emergency fix for admin dashboard cache issues
  ```bash
  npm run admin:nuclear-fix  # Uses this script
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
npm run deploy:firebase:complete     # Uses enhanced deployment script

# 4. PRODUCTION (Release)
./deploy.sh                          # Root level script

# 5. ADMIN DASHBOARD
# Access at: /admin-analytics on any deployed environment
npm run admin:nuclear-fix            # If dashboard has cache issues
```

---

## 📦 **ARCHIVED SCRIPTS** (`scripts/archive/`)

**Recently Cleaned Up (June 12, 2025):**
These scripts have been moved to `scripts/archive/` as they're no longer needed in the streamlined workflow:

**Cache Management (Superseded by nuclear-admin-fix.sh):**
- `clear-cache-rebuild.sh`, `force-clear-all-cache.sh`, `nuclear-cache-clear.sh`
- `clear-room-cache.sh` - Room-specific cache clearing

**Development Utilities (One-off tools):**
- `add-build-marker.sh` - Build verification timestamps
- `fix-functions-deploy.sh` - Functions deployment fix
- `verify-build-sync.sh` - Build synchronization verification

**Package Management (Broken references cleaned up):**
- `fix-package-warnings.sh`, `check-package-health.sh`
- `test-all-package-fixes.sh`, `test-better-sqlite3.sh`, `test-server-package.sh`

**Note**: These archived scripts contain valuable troubleshooting tools that may be useful for debugging or special cases, but are not part of the standard workflow.

---

## 🎯 **RECENT ACHIEVEMENTS** (June 12, 2025)

✅ **Admin Analytics Dashboard** - Comprehensive real-time monitoring and control system  
✅ **NODE_ENV Compliance** - Eliminated Next.js warnings with proper environment handling  
✅ **Script Cleanup** - Streamlined to essential scripts only  
✅ **Package.json Cleanup** - Removed broken script references  
✅ **Enhanced Deployment** - Comprehensive cache clearing and validation  

**Result**: Your script ecosystem is now **clean, focused, and production-ready**! 🚀

---

## 🔧 **Making Scripts Executable**

If any script shows "permission denied":
```bash
chmod +x ./scripts/script-name.sh
# OR run the batch command:
./scripts/make-scripts-executable.sh
```

## 📚 **Documentation References**

- **Admin Dashboard**: `docs/ADMIN-DASHBOARD-URL-FIX-JUNE-12-2025.md`
- **NODE_ENV Fix**: Environment compliance documentation in README.md
- **Troubleshooting**: `docs/11-TROUBLESHOOTING.md`
- **Architecture**: `docs/04-ARCHITECTURE.md`

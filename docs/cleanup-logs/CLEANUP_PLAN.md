# Festival Chat - Folder Cleanup Plan
**Date:** October 9, 2025
**Purpose:** Clean up root folder and consolidate documentation after Phase 2 WebSocket optimization

---

## 📋 Current State Analysis

### Root Folder Issues:
- **32 loose files** (.md, .sh, .txt) cluttering root directory
- Multiple duplicate/outdated documentation files
- Old deployment scripts that should be in `/scripts`
- Temporary files that should be removed
- Old backup scripts no longer needed

### Docs Folder Issues:
- Multiple overlapping documentation files
- Some docs are outdated (pre-October reset)
- Phase 1 and Phase 2 docs scattered
- Archive folder exists but not consistently used

---

## 🗑️ ROOT FOLDER CLEANUP

### Files to DELETE (Outdated/Temporary):

#### Temporary Merge/Commit Files:
- `MERGE_COMMIT_MESSAGE.txt` - One-time use, no longer needed
- `MERGE_MESSAGE_TEMP.txt` - Duplicate of above
- `chmod` - Empty file

#### Outdated Documentation (Pre-October Reset):
- `CURRENT-STATUS-OCT-2025.md` - Outdated, replaced by Phase 2 docs
- `READY-FOR-STAGING.md` - Outdated, pre-Phase 1
- `DOCUMENTATION-CONSOLIDATION-COMPLETE.md` - Old consolidation from Oct 7
- `PHASE1-COMPLETE.md` - Duplicate of docs/PHASE_1_WEBSOCKET_OPTIMIZATION_COMPLETE.md

#### Duplicate/Superseded Files:
- `ADMIN_DASHBOARD_STAGING_TESTING.md` - Should be in `/docs`
- `CLAUDE_CODE_WEBSOCKET_OPTIMIZATION.md` - Should consolidate with Phase docs
- `PHASE_1_WEBSOCKET_OPTIMIZATION_COMPLETE.md` - Already in `/docs`

#### Old Deployment Scripts (Move or Delete):
- `backup-to-github.sh` - Old, use git directly
- `backup-to-github-enhanced.sh` - Old, use git directly
- `deploy-to-github.sh` - Redundant
- `quick-github-push.sh` - Redundant
- `deploy-nuclear-static.sh` - Outdated deployment method
- `deploy-static-staging.sh` - Outdated
- `deploy-room-code-fix.sh` - One-time fix, no longer needed
- `quick-firebase-deploy.sh` - Redundant with `/scripts`
- `check-vercel-connection.sh` - One-time diagnostic
- `cleanup-documentation.sh` - One-time use
- `cleanup-temp-docs.sh` - One-time use
- `complete-cleanup-and-push.sh` - One-time use
- `fix-build-issues.sh` - One-time fix
- `fix-cache-corruption.sh` - One-time fix
- `fix-dev-cache.sh` - One-time fix
- `quick-fix-export.sh` - One-time fix
- `phase1-install-deps.sh` - One-time setup
- `install-mesh-deps.sh` - One-time setup

#### Outdated Config Files:
- `firebase-static-only.json` - Old config
- `firebase.json.backup.20251007-182709` - Backup file
- `peerjs-server.js` - P2P removed in Phase 2
- `run_deploy.sh` - Old deployment script
- `ngrok.yml` - Old tunnel config

### Files to KEEP in Root:

#### Essential Documentation:
- `README.md` - Main project readme (needs update)
- `PROJECT-INSTRUCTIONS.md` - Important project setup
- `QUICK-REFERENCE.md` - Quick reference guide
- `AI-ASSISTANT-CONTEXT.md` - AI context (needs update)

#### Active Configuration:
- `.env*` files (all environment configs)
- `package.json` & `package-lock.json`
- `next.config.ts`
- `tsconfig.json`
- `tailwind.config.ts`
- `eslint.config.mjs`
- `postcss.config.mjs`
- `firebase.json` (current)
- `firestore.rules` & `firestore.indexes.json`
- `storage.rules`
- `.firebaserc`
- `vercel.json`
- `.gitignore`
- `.gcloudignore`
- `.dockerignore`
- `Dockerfile.minimal`
- `LICENSE`

#### Active Server Code:
- `signaling-server.js` - Main WebSocket server

#### Directories:
- `src/` - Source code
- `public/` - Public assets
- `scripts/` - Deployment scripts (organized)
- `deployment/` - Cloud deployment configs
- `docs/` - Documentation (needs cleanup)
- `tools/` - Development tools (needs cleanup)
- `functions/` - Firebase functions
- `data/` - Data files
- `.next/` - Build output
- `node_modules/` - Dependencies
- `.git/` - Git repo
- `.vercel/` - Vercel config
- `.vscode/` - VS Code settings

#### Directories to DELETE:
- `archive/` - Old archive (duplicate of docs/archive)
- `backup/` - Old backup (everything in git)
- `signaling-only/` - Outdated signaling setup

---

## 📚 DOCS FOLDER CLEANUP

### Files to KEEP (Core Documentation):

#### Current User Guides:
- `01-QUICK-START.md` - Essential
- `02-USER-GUIDE.md` - Essential
- `11-TROUBLESHOOTING.md` - Essential
- `README.md` - Docs index

#### Architecture & Technical:
- `03-MESH-NETWORKING.md` - Keep (Android BLE reference)
- `04-ARCHITECTURE.md` - Essential
- `07-MOBILE-OPTIMIZATION.md` - Keep
- `08-CONNECTION-RESILIENCE.md` - Keep
- `09-PERFORMANCE-MONITORING.md` - Keep

#### Current Deployment:
- `DEPLOYMENT.md` - Essential
- `vercel-environment-setup.md` - Keep

#### Phase 2 Documentation (CURRENT STATE):
- `PHASE_2_COMPLETE.md` - Current state
- `PHASE_2_WEBSOCKET_OPTIMIZATION_PLAN.md` - Reference
- `websocket-phase1-optimizations.md` - Historical reference

#### Admin Dashboard:
- `ADMIN-ANALYTICS-API-REFERENCE.md` - Keep (API reference)
- `ADMIN_TROUBLESHOOTING.md` - Keep

### Files to MOVE to docs/archive/:

#### Outdated/Historical:
- `10-NEXT-STEPS-ROADMAP.md` - Outdated roadmap
- `12-COMPREHENSIVE-NEXT-STEPS.md` - Outdated roadmap
- `OCTOBER-2025-RESET-AND-RECOVERY.md` - Historical
- `WEB_APP_RESET_DOCUMENTATION.md` - Historical reset doc
- `PRODUCTION-DISCONNECT-FIX-OCT-2025.md` - One-time fix
- `PRODUCTION-MERGE-CHECKLIST-OCT-2025.md` - One-time checklist
- `DEPLOYMENT_READINESS.md` - Outdated
- `NUCLEAR-CACHE-BUSTING-GUIDE.md` - One-time fix guide
- `SPEC-UI-ANALYTICS-FIXES-MAY-JUNE-2025.md` - Historical

#### Duplicate Admin Docs:
- `ADMIN-ANALYTICS-DASHBOARD-COMPLETE.md` - Duplicate info
- `ANALYTICS-ADMIN-DASHBOARD-COMPREHENSIVE.md` - Duplicate info

### NEW Documentation to CREATE:

#### `docs/CURRENT-STATE-OCT-2025.md`
**Content:**
- Project overview after Phase 2
- What's working (WebSocket-only architecture)
- What's removed (P2P code)
- Current deployment (staging + production)
- Next steps (Android BLE mesh)

#### Update `README.md` (root)
**Content:**
- Brief project description
- Current version: 4.1-websocket-only
- Quick start link
- Link to docs/CURRENT-STATE-OCT-2025.md

#### Update `AI-ASSISTANT-CONTEXT.md`
**Content:**
- Phase 2 complete status
- WebSocket-only architecture
- P2P removed from frontend and backend
- Current file structure
- Recent changes summary

---

## 🎯 CLEANUP EXECUTION PLAN

### Step 1: Create Archive Directories
```bash
mkdir -p docs/archive/october-2025-reset
mkdir -p docs/archive/old-deployment-scripts
mkdir -p docs/archive/one-time-fixes
```

### Step 2: Move Historical Docs
```bash
# Move reset/recovery docs
mv docs/OCTOBER-2025-RESET-AND-RECOVERY.md docs/archive/october-2025-reset/
mv docs/WEB_APP_RESET_DOCUMENTATION.md docs/archive/october-2025-reset/

# Move one-time fixes
mv docs/PRODUCTION-DISCONNECT-FIX-OCT-2025.md docs/archive/one-time-fixes/
mv docs/PRODUCTION-MERGE-CHECKLIST-OCT-2025.md docs/archive/one-time-fixes/
mv docs/NUCLEAR-CACHE-BUSTING-GUIDE.md docs/archive/one-time-fixes/

# Move outdated roadmaps
mv docs/10-NEXT-STEPS-ROADMAP.md docs/archive/
mv docs/12-COMPREHENSIVE-NEXT-STEPS.md docs/archive/

# Move duplicate admin docs
mv docs/ADMIN-ANALYTICS-DASHBOARD-COMPLETE.md docs/archive/
mv docs/ANALYTICS-ADMIN-DASHBOARD-COMPREHENSIVE.md docs/archive/

# Move outdated deployment
mv docs/DEPLOYMENT_READINESS.md docs/archive/
mv docs/SPEC-UI-ANALYTICS-FIXES-MAY-JUNE-2025.md docs/archive/
```

### Step 3: Delete Temporary Root Files
```bash
# Delete temp files
rm MERGE_COMMIT_MESSAGE.txt
rm MERGE_MESSAGE_TEMP.txt
rm chmod

# Delete outdated docs from root
rm CURRENT-STATUS-OCT-2025.md
rm READY-FOR-STAGING.md
rm DOCUMENTATION-CONSOLIDATION-COMPLETE.md
rm PHASE1-COMPLETE.md
rm ADMIN_DASHBOARD_STAGING_TESTING.md
rm CLAUDE_CODE_WEBSOCKET_OPTIMIZATION.md
rm PHASE_1_WEBSOCKET_OPTIMIZATION_COMPLETE.md
```

### Step 4: Clean Up Old Scripts
```bash
# Create archive for old scripts
mkdir -p scripts/archive

# Move old deployment scripts
mv backup-to-github.sh scripts/archive/
mv backup-to-github-enhanced.sh scripts/archive/
mv deploy-to-github.sh scripts/archive/
mv quick-github-push.sh scripts/archive/
mv deploy-nuclear-static.sh scripts/archive/
mv deploy-static-staging.sh scripts/archive/
mv deploy-room-code-fix.sh scripts/archive/
mv quick-firebase-deploy.sh scripts/archive/
mv check-vercel-connection.sh scripts/archive/
mv cleanup-documentation.sh scripts/archive/
mv cleanup-temp-docs.sh scripts/archive/
mv complete-cleanup-and-push.sh scripts/archive/
mv fix-build-issues.sh scripts/archive/
mv fix-cache-corruption.sh scripts/archive/
mv fix-dev-cache.sh scripts/archive/
mv quick-fix-export.sh scripts/archive/
mv phase1-install-deps.sh scripts/archive/
mv install-mesh-deps.sh scripts/archive/
```

### Step 5: Clean Up Old Config Files
```bash
# Move to archive
mkdir -p archive/old-configs
mv firebase-static-only.json archive/old-configs/
mv firebase.json.backup.20251007-182709 archive/old-configs/
mv peerjs-server.js archive/old-configs/
mv run_deploy.sh archive/old-configs/
mv ngrok.yml archive/old-configs/
```

### Step 6: Remove Old Directories
```bash
# Remove duplicate archives/backups (everything is in git)
rm -rf archive/
rm -rf backup/
rm -rf signaling-only/
```

### Step 7: Create New Documentation
```bash
# Create current state doc
touch docs/CURRENT-STATE-OCT-2025.md

# Update main files (manual editing)
# - README.md
# - AI-ASSISTANT-CONTEXT.md
```

---

## ✅ EXPECTED RESULTS

### Root Folder After Cleanup:
- **~15 files** (down from 32)
- Only essential docs: README, PROJECT-INSTRUCTIONS, QUICK-REFERENCE, AI-ASSISTANT-CONTEXT
- All scripts in `/scripts`
- All documentation in `/docs`
- Clean and organized

### Docs Folder After Cleanup:
- **~15 active docs** (down from 30)
- Clear separation: active vs archived
- Phase 2 state clearly documented
- Easy to find current information

### Key Documentation Hierarchy:
```
festival-chat/
├── README.md                           # Project overview
├── PROJECT-INSTRUCTIONS.md             # Setup instructions
├── QUICK-REFERENCE.md                  # Quick commands
├── AI-ASSISTANT-CONTEXT.md             # AI context (updated)
│
├── docs/
│   ├── README.md                       # Docs index
│   ├── CURRENT-STATE-OCT-2025.md       # Current state (NEW)
│   │
│   ├── 01-QUICK-START.md               # User guides
│   ├── 02-USER-GUIDE.md
│   ├── 11-TROUBLESHOOTING.md
│   │
│   ├── 03-MESH-NETWORKING.md           # Architecture
│   ├── 04-ARCHITECTURE.md
│   ├── 07-MOBILE-OPTIMIZATION.md
│   ├── 08-CONNECTION-RESILIENCE.md
│   ├── 09-PERFORMANCE-MONITORING.md
│   │
│   ├── DEPLOYMENT.md                   # Deployment
│   ├── vercel-environment-setup.md
│   │
│   ├── PHASE_2_COMPLETE.md             # Current phase docs
│   ├── PHASE_2_WEBSOCKET_OPTIMIZATION_PLAN.md
│   ├── websocket-phase1-optimizations.md
│   │
│   ├── ADMIN-ANALYTICS-API-REFERENCE.md # Admin
│   ├── ADMIN_TROUBLESHOOTING.md
│   │
│   └── archive/                        # Historical docs
│       ├── october-2025-reset/
│       ├── one-time-fixes/
│       └── ...
│
├── scripts/
│   ├── deploy-websocket-staging.sh    # Active deployment
│   ├── deploy-websocket-cloudbuild.sh
│   └── archive/                        # Old scripts
│
└── signaling-server.js                 # Server code
```

---

## 🚨 Important Notes

**DO NOT DELETE:**
- Any `.env*` files
- `package.json` / `package-lock.json`
- Any config files (next.config.ts, tsconfig.json, etc.)
- `signaling-server.js`
- `/src` directory
- `/deployment` directory
- `/scripts/deploy-websocket-*.sh` (active deployment scripts)

**SAFE TO DELETE:**
- `archive/` and `backup/` folders (everything is in git)
- Old `.sh` scripts in root (move to scripts/archive)
- Temporary `.md` and `.txt` files
- One-time fix scripts

---

## 🎯 Success Criteria

✅ Root folder has < 20 files
✅ All scripts in `/scripts`
✅ All docs in `/docs`
✅ Clear current state documentation
✅ Archive clearly separated from active docs
✅ README and AI-ASSISTANT-CONTEXT updated
✅ No duplicate files
✅ Easy to understand project structure

---

**Ready to Execute:** Yes
**Estimated Time:** 15-20 minutes
**Risk Level:** LOW (everything backed up in git)

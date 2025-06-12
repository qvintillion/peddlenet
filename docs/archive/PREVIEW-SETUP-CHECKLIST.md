# 🚀 Firebase Preview Channels - Quick Setup Checklist

## ✅ **Immediate Setup Tasks**

### **1. Make Scripts Executable**
```bash
cd /Users/qvint/Documents/Design/Design\ Stuff/Side\ Projects/Peddler\ Network\ App/festival-chat
chmod +x make-scripts-executable.sh && ./make-scripts-executable.sh
```

### **2. Test Manual Preview (Optional - Local Testing)**
```bash
# Test manual preview deployment
npm run preview:manual test-setup

# List existing channels
npm run preview:list

# Manage channels
npm run preview:manage help
```

### **3. GitHub Repository Setup**

**Navigate to your GitHub repository:**
- Go to: `Settings` → `Secrets and variables` → `Actions`

**Add Required Secrets:**

**FIREBASE_SERVICE_ACCOUNT_FESTIVAL_CHAT:**
```bash
# 1. Go to Firebase Console → Project Settings → Service Accounts
# 2. Click "Generate New Private Key" 
# 3. Copy the ENTIRE JSON content
# 4. Paste as GitHub secret value
```

**FIREBASE_SIGNALING_SERVER_URL:**
```bash
# Your production WebSocket server URL
# Example: wss://your-websocket-server.run.app
```

**FIREBASE_TOKEN (Optional):**
```bash
# Generate token for CLI operations
firebase login:ci
# Copy the generated token
```

### **4. Test GitHub Actions**

**Create Test PR:**
```bash
# Create a test branch
git checkout -b test/preview-channels

# Make a small change
echo "# Testing preview channels" >> README.md

# Commit and push
git add README.md
git commit -m "test: Setup Firebase preview channels"
git push origin test/preview-channels

# Create Pull Request on GitHub
# → Should automatically trigger preview deployment
```

## 🎯 **Verification Steps**

### **✅ Manual Preview Test**
- [ ] Run `npm run preview:manual` successfully
- [ ] Preview URL opens and shows Festival Chat
- [ ] Basic functionality works (room creation, QR codes)

### **✅ GitHub Actions Test**
- [ ] Create test pull request
- [ ] GitHub Actions workflow runs successfully  
- [ ] Preview URL posted in PR comment
- [ ] Preview channel accessible and functional

### **✅ Mobile Testing**
- [ ] Preview works on iPhone Safari
- [ ] Preview works on Android Chrome
- [ ] QR code scanning functional
- [ ] Notifications work correctly

## 🛠️ **Available Commands**

### **Preview Management**
```bash
npm run preview:manual [channel-name]    # Create manual preview
npm run preview:list                     # List all channels
npm run preview:manage                   # Full management interface
npm run preview:cleanup                  # Show expired channels
```

### **Direct Script Usage**
```bash
./scripts/deploy-preview-manual.sh [channel-name]
./scripts/preview-manager.sh [command] [args]
```

### **GitHub Actions Features**
- ✅ Auto-deploy on PR creation/updates
- ✅ Auto-cleanup on PR close
- ✅ Manual workflow dispatch
- ✅ Custom channel names
- ✅ 7-day auto-expiration

## 🎉 **Success Criteria**

You'll know the setup is complete when:

1. ✅ Manual previews deploy successfully
2. ✅ GitHub Actions workflow runs without errors
3. ✅ Preview URLs are accessible and functional
4. ✅ Mobile testing works correctly
5. ✅ PR comments show preview information

## 🚨 **Troubleshooting Quick Fixes**

**Build Errors:**
```bash
npm run build:firebase  # Test build locally
```

**Permission Errors:**
```bash
chmod +x scripts/*.sh   # Fix script permissions
```

**Firebase Auth Errors:**
- Regenerate service account key
- Check GitHub secrets configuration
- Verify Firebase project permissions

---

**🎪 Ready to complete Phase 1B with Firebase preview channels!**

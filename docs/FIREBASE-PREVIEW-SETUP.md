# 🔥 Firebase Preview Channels Setup - Festival Chat

**Status**: Ready for GitHub Actions setup  
**Last Updated**: June 11, 2025

## 🎯 **Overview**

Firebase Preview Channels enable automatic preview deployments for every pull request, allowing rapid testing and stakeholder review without affecting production.

## 📁 **Files Created**

### **GitHub Actions Workflow**
- `.github/workflows/preview-deploy.yml` - Automated PR preview deployments
- Triggers on PR creation/updates and manual dispatch
- Auto-cleanup when PRs are closed

### **Manual Scripts**
- `scripts/deploy-preview-manual.sh` - Manual preview channel creation
- `scripts/preview-manager.sh` - Preview channel management utilities
- `make-scripts-executable.sh` - Helper to set script permissions

### **Package.json Scripts Added**
```json
{
  "preview:manual": "Manual preview deployment",
  "preview:manage": "Preview channel management",
  "preview:list": "List all preview channels", 
  "preview:cleanup": "Show expired channels for cleanup"
}
```

## 🔧 **Setup Requirements**

> **📝 Quick Setup**: See **[DEPLOYMENT-WORKFLOW.md](./DEPLOYMENT-WORKFLOW.md)** for complete workflow integration
>
> **📂 Archived Guides**: Historical setup documentation moved to **[docs/archive/](./archive/)** – use this guide for current setup

### **1. Make Scripts Executable**

```bash
# Quick command to make all scripts executable
npm run scripts:make-executable

# Or manually:
chmod +x scripts/*.sh
```

### **2. GitHub Secrets Configuration**

You need to add these secrets to your GitHub repository settings:

```bash
# Navigate to: GitHub Repo → Settings → Secrets and Variables → Actions
```

**Required Secrets:**
- `FIREBASE_SERVICE_ACCOUNT_FESTIVAL_CHAT` - Firebase service account JSON
- `FIREBASE_TOKEN` - Firebase CLI token (optional, for cleanup)
- `FIREBASE_SIGNALING_SERVER_URL` - Production signaling server URL

### **3. Firebase Service Account Setup**

```bash
# Create service account in Firebase Console
# 1. Go to Firebase Console → Project Settings → Service Accounts
# 2. Click "Generate New Private Key"
# 3. Save the JSON file securely
# 4. Copy entire JSON content to GitHub secret
```

### **4. Firebase CLI Token (Optional)**

```bash
# Generate Firebase token for CLI operations
firebase login:ci

# Copy the token to GitHub secret: FIREBASE_TOKEN
```

## 🚀 **Usage**

### **Automatic Preview Deployments**

**Pull Request Workflow:**
1. Create a pull request to `main` branch
2. GitHub Actions automatically builds and deploys preview
3. Preview URL posted as PR comment
4. Preview auto-expires in 7 days
5. Preview auto-deletes when PR is closed

**Preview URL Format:**
```
https://festival-chat-peddlenet--pr-123-abcd1234.web.app
```

### **Manual Preview Deployments**

**Create Manual Preview:**
```bash
# Default timestamp-based channel
npm run preview:manual

# Custom channel name
npm run preview:manual my-feature-test

# Or direct script usage
./scripts/deploy-preview-manual.sh my-feature-test
```

**Manage Preview Channels:**
```bash
# List all channels
npm run preview:list

# Full management interface
npm run preview:manage

# Cleanup expired channels
npm run preview:cleanup

# Delete specific channel
npm run preview:manage delete pr-123

# Open channel in browser
npm run preview:manage open my-feature-test
```

## 📋 **GitHub Actions Workflow Features**

### **Automatic Triggers**
- ✅ Pull request creation
- ✅ Pull request updates (new commits)
- ✅ Pull request reopening
- ✅ Manual workflow dispatch
- ✅ Auto-cleanup on PR close

### **Smart Build Process**
- ✅ Node.js 18 environment
- ✅ Dependency caching
- ✅ Project structure verification
- ✅ Firebase-optimized build
- ✅ Build output validation

### **Preview Management**
- ✅ Unique channel per PR (`pr-123`)
- ✅ Custom channel names (manual dispatch)
- ✅ 7-day auto-expiration
- ✅ Automatic cleanup
- ✅ PR comment with testing checklist

### **Error Handling**
- ✅ Comprehensive logging
- ✅ Build verification steps
- ✅ Graceful failure handling
- ✅ Clear error messages

## 🧪 **Testing Checklist**

When a preview is deployed, test these features:

### **Core Functionality**
- [ ] Homepage loads correctly
- [ ] Room creation works
- [ ] QR code generation
- [ ] Room joining via QR scan
- [ ] Real-time messaging
- [ ] Cross-device messaging

### **Advanced Features** 
- [ ] Cross-room notifications
- [ ] Room navigation/switching
- [ ] Background notifications
- [ ] Service worker notifications
- [ ] Auto-reconnection
- [ ] Mobile optimization

### **Mobile Testing**
- [ ] iPhone Safari functionality
- [ ] Android Chrome functionality
- [ ] QR scanning from mobile
- [ ] Touch interactions
- [ ] Notification permissions
- [ ] Background messaging

## 🛠️ **Deployment Workflow Integration**

### **Development Cycle with Previews**

```bash
# 1. Feature development
git checkout -b feature/new-room-navigation
# Make changes to code

# 2. Quick local testing
npm run dev:mobile

# 3. Create PR (triggers auto-preview)
git push origin feature/new-room-navigation
# Create PR → Auto-preview deployed

# 4. Manual preview for testing variations
npm run preview:manual feature-variation-1

# 5. Iterate based on preview testing
# Make changes, push to PR → Auto-update preview

# 6. Production deployment
npm run deploy:firebase:complete  # Full deployment
./deploy.sh                       # Production via GitHub
```

### **Integration with Existing Scripts**

The preview system works alongside your existing deployment scripts:

- `npm run deploy:firebase:super-quick` - Quick staging deploys
- `npm run deploy:firebase:quick` - Standard staging deploys  
- `npm run deploy:firebase:complete` - Full infrastructure deploys
- `./deploy.sh` - Production GitHub deployment

## 📊 **Benefits for Festival Chat Development**

### **🎯 Enhanced Testing**
- Test features before production
- Stakeholder review with real URLs
- Cross-device testing verification
- Real-world mobile testing

### **⚡ Faster Iteration**
- Automatic preview on every PR
- No manual deployment needed
- Quick feature validation
- Immediate feedback loop

### **🛡️ Risk Mitigation**
- Test breaking changes safely
- Validate mobile compatibility
- Check notification functionality
- Verify QR code generation

### **👥 Team Collaboration**
- Shareable preview URLs
- Easy stakeholder reviews
- Clear testing checklists
- Automatic cleanup

## 🚨 **Troubleshooting**

### **Common Issues**

**Build Failures:**
```bash
# Check build output locally
npm run build:firebase

# Verify Next.js static export
ls -la out/
```

**GitHub Actions Failures:**
- Check GitHub repository secrets
- Verify Firebase service account permissions
- Review workflow logs for specific errors
- Ensure Firebase project ID matches

**Firebase Authentication Issues:**
- Regenerate service account key
- Verify project permissions
- Check Firebase CLI installation

**Script Permission Issues:**
```bash
# Make scripts executable
chmod +x scripts/deploy-preview-manual.sh
chmod +x scripts/preview-manager.sh

# Or use helper script
chmod +x make-scripts-executable.sh && ./make-scripts-executable.sh
```

## 🎉 **Next Steps**

### **Immediate Setup (This Week)**
1. ✅ Add GitHub repository secrets
2. ✅ Test manual preview deployment
3. ✅ Create test pull request
4. ✅ Verify automatic preview creation

### **Testing & Validation (Week 2)**
1. ✅ Mobile device testing
2. ✅ Cross-room notification testing
3. ✅ Performance validation
4. ✅ Stakeholder review process

### **Phase 2 Preparation**
- Preview channels ready for data intelligence features
- Automated testing for analytics implementation
- Stakeholder review for Phase 2 planning

---

**🎪 Firebase preview channels are now ready for Festival Chat development!** This completes Phase 1B and sets the foundation for rapid iteration in Phase 2.

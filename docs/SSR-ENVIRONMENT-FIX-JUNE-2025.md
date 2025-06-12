# 🎩 SSR Environment Variable Fix - June 2025

## 🎯 **Issue Summary**

**Problem**: Preview staging deployments were connecting to production server instead of preview server  
**Root Cause**: Festival Chat uses SSR via Firebase Functions, environment variables read at runtime  
**Solution**: Set Firebase Functions environment variables + SSR-aware deployment scripts  

## 🔍 **The Discovery**

During debugging in June 2025, we discovered Festival Chat uses **Server-Side Rendering (SSR)** via Firebase Functions:

```json
// firebase.json - The smoking gun
{
  "hosting": {
    "rewrites": [
      {
        "source": "**",
        "function": "nextjsFunc"  // <- SSR via Firebase Functions!
      }
    ]
  }
}
```

This means environment variables are read at **runtime** by Firebase Functions, not at build time.

## 🏗️ **Architecture Understanding**

```
Next.js Build Time → Static files (.next/)
     ↓
Firebase Functions Runtime → Reads environment variables
     ↓  
Client Browser → Receives server-rendered pages
```

## 🐛 **The Root Cause**

Preview deployments failed because:
1. ✅ **Build environment** was correctly set (`.env.preview`)
2. ❌ **Runtime environment** was NOT set (Firebase Functions config)
3. ℹ️ **Result**: Browser showed production server URL despite preview build

## 🔧 **The Fix**

### Step 1: Set Firebase Functions Environment
```bash
# Set environment for Firebase Functions runtime
firebase functions:config:set \
  next_public.signaling_server="wss://peddlenet-websocket-server-preview-433318323150.us-central1.run.app" \
  --project "festival-chat-peddlenet"

# Redeploy functions to pick up new environment
firebase deploy --only functions
```

### Step 2: Use SSR-Aware Preview Script
```bash
# New SSR-aware preview staging script
./preview-staging-ssr.sh feature-name
```

## 📋 **Environment Variable Priority (SSR)**

For SSR deployment:
1. **Firebase Functions runtime config** → `functions:config:set` 💯 **Most Important for SSR**
2. **Build-time environment** → `.env.local`, `.env.preview` 📋 **For build optimization**  
3. **Explicit environment variables** → `NEXT_PUBLIC_*=value npm run build` 🔧 **Build overrides**

## 🧪 **Testing SSR Environment**

After SSR deployment, check browser console:

**✅ Correct (Preview)**:
```
NEXT_PUBLIC_SIGNALING_SERVER: wss://peddlenet-websocket-server-preview-433318323150.us-central1.run.app
```

**❌ Wrong (Production)**:
```
NEXT_PUBLIC_SIGNALING_SERVER: wss://peddlenet-websocket-server-padyxgyv5a-uc.a.run.app
```

## 🎭 **SSR-Aware Scripts**

### **preview-staging-ssr.sh**
```bash
./preview-staging-ssr.sh room-stats-fix
```

**Features**:
- ✅ Verifies Firebase Functions environment is correctly set
- ✅ Builds both Next.js app AND Firebase Functions with preview environment
- ✅ Deploys to Firebase preview channel for stakeholder review
- ✅ Handles SSR environment variables properly
- ✅ Provides clear testing instructions

**What it does**:
1. Verifies Firebase Functions environment configuration
2. Cache busts all builds (Next.js, Firebase, Functions)
3. Temporarily disables conflicting environment files
4. Builds with explicit preview environment variables
5. Builds Firebase Functions with correct environment
6. Deploys to Firebase preview channel
7. Provides testing instructions with correct URLs

## 📚 **Technical Details**

### **Firebase Functions Environment Commands**
```bash
# Set environment variables
firebase functions:config:set key="value" --project PROJECT_ID

# Get current environment
firebase functions:config:get --project PROJECT_ID

# Remove environment variables
firebase functions:config:unset key --project PROJECT_ID
```

### **SSR vs Static Hosting**

**Static Hosting** (what we thought we had):
- Environment variables baked into build at build time
- Build once, deploy static files
- Fast CDN delivery

**SSR via Firebase Functions** (what we actually have):
- Environment variables read at runtime by functions
- Server renders each request dynamically
- More flexible but requires runtime environment config

## 🎯 **Resolution Status**

- ✅ **Issue**: Environment variables not applying to SSR runtime
- ✅ **Root Cause**: Firebase Functions environment not configured
- ✅ **Solution**: Set `functions:config:set` + SSR-aware scripts
- ✅ **Testing**: Browser console shows correct preview server URL
- ✅ **Scripts**: `preview-staging-ssr.sh` handles SSR properly

## 🚀 **Usage**

For preview staging deployments:
```bash
# Use SSR-aware script
./preview-staging-ssr.sh your-feature-name

# Follow testing instructions in output
# Verify browser console shows preview server URL
```

This fix ensures preview staging works correctly with the SSR architecture! 🎉

# 🔧 MESSAGING TROUBLESHOOTING GUIDE

## 📋 **Quick Diagnostic Checklist**

**If messaging stops working in staging/production but works in dev:**

### **🚨 Critical Check #1: Message Broadcasting Logic**
```bash
# Check the exact broadcasting method used
grep -n "emit.*chat-message" signaling-server*.js

# ✅ CORRECT (should find this):
# io.to(roomId).emit('chat-message', enhancedMessage);

# ❌ WRONG (if you find this):
# socket.to(roomId).emit('chat-message', enhancedMessage);
```

### **🔍 Critical Check #2: Server Version**
```bash
# Check deployed server version
curl https://your-server-url/health | jq .version

# ✅ EXPECTED: "1.2.0-messaging-fix" or newer
# ❌ PROBLEM: older version without fix
```

### **🐛 Critical Check #3: Deployment Configuration**
```bash
# Check which server file is being deployed
grep "COPY.*server.js" Dockerfile*

# ✅ EXPECTED: COPY signaling-server-production-FIXED.js ./server.js
# ❌ PROBLEM: COPY signaling-server-production.js ./server.js
```

---

## 🚨 **Common Issues & Solutions**

### **Issue 1: Messages Don't Appear on Sender's Device**

**Symptoms**:
- Dev environment: Messages appear immediately ✅
- Staging/Production: Messages don't appear on sending device ❌
- Other devices in room see the messages ✅

**Root Cause**: Using `socket.to()` instead of `io.to()`

**Solution**:
```javascript
// ❌ BROKEN
socket.to(roomId).emit('chat-message', message);

// ✅ FIXED  
io.to(roomId).emit('chat-message', message);
```

**Fix Steps**:
1. Update server to use `io.to(roomId)`
2. Redeploy server: `./scripts/deploy-websocket-cloudbuild.sh`
3. Test immediately after deployment

---

### **Issue 2: Docker Build Failures**

**Symptoms**:
```
BUILD FAILURE: Build step failure: build step 0 "gcr.io/cloud-builders/docker" failed
```

**Common Causes**:

#### **A. SQLite Compilation Issues**
```bash
# Check for problematic dependencies
grep "better-sqlite3" package.json

# If found, remove it:
npm uninstall better-sqlite3
```

#### **B. Wrong Server File**
```bash
# Check Dockerfile configuration
cat Dockerfile.minimal

# Should contain:
# COPY signaling-server-production-FIXED.js ./server.js
```

#### **C. Missing Dependencies**
```bash
# Verify package.json has required dependencies
grep -E "(socket.io|express|cors)" package.json
```

**Solution Steps**:
1. Use `signaling-server-production-FIXED.js` (no SQLite)
2. Remove `better-sqlite3` from dependencies
3. Use `Dockerfile.minimal` configuration
4. Redeploy: `./scripts/deploy-websocket-cloudbuild.sh`

---

### **Issue 3: Environment Parity Problems**

**Symptoms**:
- Different behavior between dev, staging, and production
- Features work in one environment but not others

**Diagnosis**:
```bash
# Compare server file sizes (should be similar for same logic)
wc -l signaling-server*.js

# Check which server each environment uses
grep "npm run dev" package.json  # Should show dev server
grep "COPY.*server.js" Dockerfile*  # Should show production server
```

**Solution**:
1. Ensure all environments use same core messaging logic
2. Use `io.to(roomId)` in all server files
3. Deploy same logic across environments
4. Test messaging in each environment

---

### **Issue 4: Background Notifications Not Working**

**Symptoms**:
- Messages appear in current room ✅
- No notifications for messages in other rooms ❌

**Check**:
```javascript
// Verify notification subscription handling
socket.on('subscribe-notifications', ({ roomId, displayName }) => {
  // Should add socket to notification subscribers
});

// Verify notification broadcasting
const subscribers = notificationSubscribers.get(roomId);
if (subscribers && subscribers.size > 0) {
  subscribers.forEach(subscriberSocketId => {
    // Should emit to background subscribers
  });
}
```

**Solution**: Use `signaling-server-production-FIXED.js` which includes notification system

---

## 🔍 **Diagnostic Commands**

### **Server Health & Status**
```bash
# Check server health
curl https://your-server-url/health

# Check server version specifically
curl https://your-server-url/health | jq .version

# Check server features
curl https://your-server-url/signaling-proxy | jq .features
```

### **Build & Deployment**
```bash
# Test local build (dry run)
docker build -f Dockerfile.minimal -t test-build .

# Deploy with verbose logging
./scripts/deploy-websocket-cloudbuild.sh

# Check Cloud Run logs
gcloud run logs read peddlenet-websocket-server --region=us-central1
```

### **Code Analysis**
```bash
# Find all message broadcasting code
grep -rn "emit.*chat-message" signaling-server*.js

# Compare server implementations
diff signaling-server-production.js signaling-server-production-FIXED.js

# Check for SQLite dependencies
grep -rn "sqlite" *.js package.json
```

---

## ✅ **Verification Steps**

### **After Any Fix**

1. **Build Verification**:
   ```bash
   ./scripts/deploy-websocket-cloudbuild.sh
   # Should complete without errors
   ```

2. **Server Health**:
   ```bash
   curl https://your-server-url/health | jq .version
   # Should return current version
   ```

3. **Messaging Test**:
   - Open two browser windows
   - Join same room from both
   - Send message from first window
   - ✅ Message should appear in BOTH windows immediately

4. **Cross-Environment Test**:
   - Test in dev: `npm run dev:mobile`
   - Test in staging: Visit Firebase staging URL
   - Test in production: Visit production URL
   - ✅ All should behave identically

---

## 🚨 **Emergency Recovery**

### **If Everything Breaks**

1. **Revert to Known Good Configuration**:
   ```bash
   # Use the verified working server
   cp signaling-server-production-FIXED.js temp-server.js
   
   # Update Dockerfile.minimal to use it
   sed -i 's/COPY.*server.js/COPY temp-server.js .\/server.js/' Dockerfile.minimal
   
   # Deploy immediately
   ./scripts/deploy-websocket-cloudbuild.sh
   ```

2. **Minimal Working Server** (if needed):
   - Use `signaling-server-production-FIXED.js`
   - Remove all SQLite references
   - Use minimal dependencies only
   - Deploy with `Dockerfile.minimal`

---

## 📚 **Critical Patterns to Remember**

### **✅ Always Do This**
```javascript
// Message broadcasting (includes sender)
io.to(roomId).emit('chat-message', message);

// Health endpoint versioning
version: '1.2.0-messaging-fix'

// Minimal Docker builds when debugging
COPY signaling-server-production-FIXED.js ./server.js
```

### **❌ Never Do This**
```javascript
// Message broadcasting (excludes sender)
socket.to(roomId).emit('chat-message', message);

// Complex builds when simple ones fail
COPY signaling-server-sqlite-enhanced.js ./server.js  // If builds failing

// SQLite in Docker without proper setup
"better-sqlite3": "^11.7.0"  // Causes compilation issues
```

---

## 📞 **Quick Reference**

### **Working Configuration**
- **Server**: `signaling-server-production-FIXED.js`
- **Docker**: `Dockerfile.minimal`
- **Version**: `1.2.0-messaging-fix`
- **Key Fix**: `io.to(roomId)` for messaging

### **Deploy Commands**
```bash
# Server
./scripts/deploy-websocket-cloudbuild.sh

# Staging  
npm run deploy:firebase:complete

# Production
./deploy.sh
```

### **Test URLs**
- **Dev**: localhost:3000
- **Staging**: festival-chat-peddlenet.web.app
- **Production**: peddlenet.app

---

**Last Updated**: June 12, 2025  
**Status**: ✅ All issues resolved  
**Confidence**: ⭐⭐⭐⭐⭐ Maximum

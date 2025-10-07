# 🌐 WebSocket CORS & API Fix (June 11, 2025)

## 🎯 Problem Solved

### **Firebase Preview CORS Blocking**
- **Issue**: Preview deployments (`festival-chat-peddlenet--*-*.web.app`) couldn't connect to WebSocket server
- **Error**: `Access to XMLHttpRequest blocked by CORS policy: No 'Access-Control-Allow-Origin' header`
- **Impact**: Preview staging appeared to work but had no server connection

### **Rate Limiting Reconnection Loops**
- **Issue**: Firebase staging showed infinite reconnection loops with "Connection rate limit exceeded"
- **Cause**: Client treated rate limiting as retryable error, causing connection storms
- **Impact**: Server overload and poor user experience

## 🔧 CORS Configuration Updates

### **Enhanced WebSocket Server CORS Patterns**
Updated `signaling-server-production.js` with comprehensive Firebase domain support:

```javascript
// Socket.IO CORS configuration
cors: {
  origin: [
    // Existing patterns
    "http://localhost:3000",
    "https://peddlenet.app",
    "https://*.firebaseapp.com", 
    "https://*.web.app",
    
    // NEW: Enhanced Firebase preview support
    /^https:\/\/[a-zA-Z0-9-]+--[a-zA-Z0-9-]+\.[a-zA-Z0-9-]+\.web\.app$/,
    /^https:\/\/festival-chat-peddlenet--[a-zA-Z0-9-]+\.web\.app$/,
    
    // Other hosting platforms
    "https://*.vercel.app",
    "https://*.ngrok.io",
    /^https:\/\/[a-zA-Z0-9-]+\.ngrok(-free)?\.app$/,
    /^https:\/\/[a-zA-Z0-9-]+\.vercel\.app$/
  ],
  methods: ["GET", "POST"],
  credentials: true
}
```

### **Express CORS Middleware**
Updated Express app with matching CORS patterns for HTTP endpoints:

```javascript
app.use(cors({
  origin: [
    // Same patterns as Socket.IO
    // Ensures /health, /stability, /resolve-room-code work from all domains
  ],
  methods: ["GET", "POST", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400 // Cache preflight for 24 hours
}));
```

## 🛡️ Rate Limiting Protection

### **Enhanced Error Detection**
```javascript
// Strict rate limit identification
const isRateLimit = error.message.includes('rate limit') || 
                   error.message.includes('throttle') ||
                   error.message.includes('Connection rate limit exceeded');
```

### **Extended Backoff for Rate Limits**
```javascript
if (isRateLimit) {
  // 15-30 second delays instead of standard exponential backoff
  const rateLimitDelay = Math.min(15000 + Math.random() * 15000, 30000);
  
  // Auto-stop after 5 consecutive rate limit hits
  if (retryCount >= 5) {
    setShouldAutoReconnect(false);
    console.log('🛑 Too many rate limit retries, stopping auto-reconnect');
  }
}
```

### **Connection Attempt Throttling**
```javascript
// Minimum 3 seconds between any connection attempts
const timeSinceLastAttempt = now - lastConnectionAttempt.current;
if (timeSinceLastAttempt < 3000) {
  console.log('⏳ Rate limiting connection attempts');
  return;
}
```

## 🧪 Testing Results

### **Preview Staging (CORS Fix)**
✅ **Before**: CORS errors, no server connection
✅ **After**: Clean connection, full functionality

### **Firebase Staging (Rate Limiting Fix)**
✅ **Before**: Infinite reconnection loops
✅ **After**: Controlled backoff, auto-stop protection

### **Development Environment**
✅ **Before**: Working (local server)
✅ **After**: Enhanced with health monitoring

## 🚀 Deployment Process

### **WebSocket Server Update**
```bash
# Deploy updated WebSocket server to Google Cloud Run
cd "/path/to/festival-chat"
chmod +x scripts/deploy-websocket-cloudbuild.sh
./scripts/deploy-websocket-cloudbuild.sh
```

### **Client Code Deployment**
```bash
# Preview testing (now with CORS support)
npm run preview:deploy feature-name

# Firebase staging (now with rate limiting protection)
npm run deploy:firebase:complete

# Production (full feature set)
./deploy.sh
```

## 📊 Domain Support Matrix

| Environment | Domain Pattern | CORS Support | Features |
|-------------|---------------|--------------|----------|
| **Development** | `localhost:3000` | ✅ Native | Full dev features |
| **Preview** | `festival-chat-peddlenet--*-*.web.app` | ✅ **NEW** | Full testing |
| **Firebase Staging** | `festival-chat-peddlenet.web.app` | ✅ Existing | Rate limit protection |
| **Production** | `peddlenet.app` | ✅ Existing | Full stability |

## 🔍 Debugging CORS Issues

### **Check CORS Headers**
```bash
# Test WebSocket server CORS response
curl -H "Origin: https://festival-chat-peddlenet--test-abc123.web.app" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://peddlenet-websocket-server-padyxgyv5a-uc.a.run.app/health
```

### **Browser Console Debugging**
```javascript
// Check if CORS is working
fetch('https://peddlenet-websocket-server-padyxgyv5a-uc.a.run.app/health')
  .then(response => response.json())
  .then(data => console.log('✅ CORS working:', data))
  .catch(error => console.error('❌ CORS blocked:', error));

// Check WebSocket connection
window.EnhancedConnectionResilience.getState();
```

## ⚠️ Important Notes

### **Firebase Preview Channel Format**
Firebase preview channels use this format:
- Standard: `https://project-name--channel-name-id.web.app`
- Our format: `https://festival-chat-peddlenet--feature-name-id.web.app`

The regex patterns now properly match both formats.

### **Rate Limiting vs Connection Failures**
- **Rate Limits**: Server protection, use extended backoff (15-30s)
- **Connection Failures**: Network issues, use exponential backoff (1-15s)
- **Cold Starts**: Cloud Run wake-up, use short delays (2-5s)

### **Auto-Recovery**
```javascript
// Manual recovery after rate limiting
hook.forceReconnect(); // Resets all counters and attempts fresh connection
```

## 🎉 Benefits Achieved

### **Development Experience**
- ✅ Preview channels now work identically to production
- ✅ No more mysterious "working but not connected" scenarios
- ✅ Consistent testing across all environments

### **Server Protection**
- ✅ Eliminated connection storms during rate limiting
- ✅ Proper respect for server rate limits
- ✅ Reduced Cloud Run resource consumption

### **User Experience**
- ✅ Graceful handling of connection issues
- ✅ Clear feedback about connection state
- ✅ Automatic recovery when possible

---

## 🔗 Related Documentation

- [Connection Resilience](./08-CONNECTION-RESILIENCE.md) - Full connection management system
- [Deployment Workflow](./DEPLOYMENT-WORKFLOW.md) - Environment-specific deployment
- [Firebase Preview Setup](./FIREBASE-PREVIEW-SETUP.md) - Preview channel configuration

**Version**: 1.2.2-preview-cors-fix  
**Deployed**: June 11, 2025  
**Status**: ✅ Production Ready

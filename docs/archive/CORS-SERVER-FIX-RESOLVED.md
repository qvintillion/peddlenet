# 🚨 CRITICAL SERVER FIX NEEDED - CORS & Cold Start Issues

## **Problem Analysis**

Based on the error logs, we have multiple critical issues:

### 1. **CORS Configuration Missing** ❌
```
Access to XMLHttpRequest at 'https://peddlenet-websocket-server-padyxgyv5a-uc.a.run.app/socket.io/' from origin 'https://peddlenet.app' has been blocked by CORS policy
```

**Root Cause**: The Cloud Run server is not returning proper CORS headers for Socket.IO polling transport.

### 2. **Cloud Run Cold Start Issues** ❄️
- Server is going cold and taking too long to respond
- Multiple failed connection attempts trigger circuit breaker
- No proper health check or warm-up strategy

### 3. **Background Notification Conflicts** 🔔
- Multiple WebSocket connections competing
- Rate limiting causing connection failures
- No proper connection coordination

---

## **IMMEDIATE FIXES NEEDED**

### **1. Update Server CORS Configuration**

Your current server (`signaling-server.js`) has CORS configured but it may not be working properly on Cloud Run. Update the CORS configuration:

```javascript
// Enhanced CORS configuration for Cloud Run
const io = new Server(server, {
  cors: {
    origin: [
      "https://peddlenet.app",
      "https://*.vercel.app",
      "https://*.firebaseapp.com", 
      "https://*.web.app",
      "http://localhost:3000",
      /^https:\/\/[a-zA-Z0-9-]+\.vercel\.app$/,
      /^https:\/\/[a-zA-Z0-9-]+\.firebaseapp\.com$/,
      /^https:\/\/.*\.web\.app$/
    ],
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
  },
  // CRITICAL: Ensure polling transport works on Cloud Run
  transports: ['polling', 'websocket'], // Polling FIRST for Cloud Run
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
  // CRITICAL: Add these for Cloud Run compatibility
  allowUpgrades: true,
  cookie: false, // Disable cookies for Cloud Run
  serveClient: false // Don't serve Socket.IO client
});

// CRITICAL: Add explicit CORS middleware for all routes
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://peddlenet.app',
    'http://localhost:3000',
    // Add others as needed
  ];
  
  if (allowedOrigins.includes(origin) || !origin) {
    res.header('Access-Control-Allow-Origin', origin || '*');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS,PUT,DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});
```

### **2. Add Health Check Endpoint for Cloud Run**

Add this to your server:

```javascript
// CRITICAL: Cloud Run health check
app.get('/_ah/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: Date.now(),
    uptime: process.uptime()
  });
});

// Enhanced health endpoint with CORS
app.get('/health', (req, res) => {
  // Ensure CORS headers
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  
  res.json({ 
    status: 'ok',
    service: 'PeddleNet WebSocket Server',
    uptime: Math.floor(uptime),
    connections: {
      current: connectionStats.currentConnections,
      peak: connectionStats.peakConnections,
      total: connectionStats.totalConnections
    },
    cors: {
      enabled: true,
      origins: ['https://peddlenet.app', 'http://localhost:3000']
    },
    environment: process.env.NODE_ENV || 'production',
    timestamp: Date.now()
  });
});
```

### **3. Add Keep-Alive Strategy**

Add this to prevent cold starts:

```javascript
// CRITICAL: Keep-alive strategy for Cloud Run
if (process.env.NODE_ENV === 'production') {
  // Ping self every 5 minutes to prevent cold starts
  setInterval(async () => {
    try {
      const response = await fetch(`http://localhost:${PORT}/health`);
      console.log('🏥 Keep-alive ping:', response.status);
    } catch (error) {
      console.warn('Keep-alive ping failed:', error.message);
    }
  }, 5 * 60 * 1000); // Every 5 minutes
}
```

---

## **CLIENT-SIDE FIXES**

### **1. Enhanced Connection Strategy**

Update your WebSocket connection options:

```javascript
const socket = io(serverUrl, {
  // CRITICAL: Start with polling for Cloud Run compatibility
  transports: ['polling', 'websocket'],
  timeout: 30000, // Longer timeout for cold starts
  forceNew: true,
  
  // Enhanced Cloud Run settings
  upgrade: true,
  rememberUpgrade: false, // Don't remember for cold starts
  
  // Polling-specific settings for Cloud Run
  polling: {
    extraHeaders: {
      'Access-Control-Request-Headers': 'content-type'
    }
  },
  
  // Longer timeouts for cold starts
  pingTimeout: 60000,
  pingInterval: 25000,
  
  // Connection efficiency
  withCredentials: true, // Ensure CORS credentials
  autoConnect: true,
  closeOnBeforeunload: false
});
```

### **2. Enhanced Cold Start Detection**

Update your reconnection logic:

```javascript
socket.on('disconnect', (reason) => {
  console.log(`🔌 Enhanced disconnect:`, reason);
  
  const isCloudRunColdStart = reason === 'transport close' || 
                              reason === 'ping timeout' ||
                              reason === 'transport error';
  
  if (isCloudRunColdStart) {
    console.log(`❄️ Cloud Run cold start detected - using aggressive reconnection`);
    
    // Immediately try reconnection for cold starts
    setTimeout(() => {
      console.log('🔄 Cold start reconnection attempt...');
      connectToServer();
    }, 1000); // Just 1 second delay for cold starts
  } else {
    // Normal exponential backoff for other disconnects
    const backoffDelay = getExponentialBackoffDelay();
    setTimeout(() => connectToServer(), backoffDelay);
  }
});
```

---

## **DEPLOYMENT COMMANDS**

### **1. Update Server First**
```bash
# Deploy the fixed server
./scripts/deploy-websocket-cloudbuild.sh
```

### **2. Test Server Health**
```bash
# Test the CORS fix
curl -H "Origin: https://peddlenet.app" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     https://peddlenet-websocket-server-padyxgyv5a-uc.a.run.app/health
```

### **3. Deploy Client Changes**
```bash
# Test in staging first
npm run deploy:firebase:complete

# Then deploy to production
./deploy.sh
```

---

## **NOTIFICATION SYSTEM FIXES**

### **1. Connection Coordination**

Add this to prevent conflicts:

```javascript
// CRITICAL: Prevent multiple connections
class ConnectionCoordinator {
  private static activeConnections = new Map<string, WebSocket>();
  
  static registerConnection(key: string, socket: WebSocket) {
    // Close existing connection
    const existing = this.activeConnections.get(key);
    if (existing && existing.readyState === WebSocket.OPEN) {
      existing.close();
    }
    
    this.activeConnections.set(key, socket);
  }
  
  static unregisterConnection(key: string) {
    this.activeConnections.delete(key);
  }
}
```

### **2. Smart Notification Logic**

Update background notifications to be smarter:

```javascript
// Only connect for notifications when:
// 1. User is not in any active chat
// 2. User has favorited rooms
// 3. No active WebSocket chat connection exists

const shouldConnectForNotifications = () => {
  return !hasActiveChatConnection() && 
         hasFavoritedRooms() && 
         isNotificationPermissionGranted();
};
```

---

## **MONITORING & DEBUGGING**

### **1. Add Connection Diagnostics**

```javascript
// Enhanced connection diagnostics
const getConnectionDiagnostics = () => {
  return {
    serverUrl: ServerUtils.getWebSocketServerUrl(),
    corsOrigin: window.location.origin,
    transportUsed: socket?.io?.engine?.transport?.name,
    connectionState: socket?.connected ? 'connected' : 'disconnected',
    lastError: socket?.io?.engine?.transport?.socket?.onerror,
    timestamp: Date.now()
  };
};
```

### **2. Add Server Logging**

```javascript
// Enhanced server logging for debugging
io.engine.on('connection_error', (err) => {
  console.error('🚨 Socket.IO connection error:', {
    message: err.message,
    code: err.code,
    context: err.context,
    type: err.type,
    origin: err.req?.headers?.origin,
    userAgent: err.req?.headers['user-agent']
  });
});
```

---

## **TESTING CHECKLIST**

- [ ] Server CORS headers working
- [ ] Cold start reconnection works
- [ ] Background notifications don't conflict
- [ ] Circuit breaker recovers properly
- [ ] Mobile connections stable
- [ ] Desktop connections stable
- [ ] Message delivery working
- [ ] Notification delivery working

---

## **NEXT STEPS**

1. **UPDATE SERVER CORS** (CRITICAL - do this first)
2. **Deploy server with `./scripts/deploy-websocket-cloudbuild.sh`**
3. **Test CORS with curl command above**
4. **Update client connection logic**
5. **Deploy client with staging test first**
6. **Monitor logs for improvements**

The CORS issue is the root cause of most connection problems. Fix this first and the other issues should resolve.

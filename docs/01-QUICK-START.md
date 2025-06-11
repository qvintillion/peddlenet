# 🚀 Quick Start Guide - Festival Chat

## 🎯 Get Up and Running in 5 Minutes

Festival Chat is a production-ready real-time messaging platform. This guide will get you from zero to chatting across devices in 5 minutes.

## ⚡ Prerequisites

- **Node.js 18-24** installed (v24.1.0 currently supported)
- **Git** for cloning
- **Two devices** on same WiFi (desktop + mobile for testing)
- **Basic terminal usage** knowledge

## 🔧 Installation

### 1. Clone and Setup
```bash
# Clone the repository
git clone [your-repo-url] festival-chat
cd festival-chat

# Install dependencies
npm install

# Verify installation
npm run build
```

### 2. Start Development Server
```bash
# Start with mobile support (recommended)
npm run dev:mobile

# Expected output:
# ✅ Detected local IP: 192.168.x.x
# 🔧 Connection Resilience loaded
# 🎵 Festival Chat Server running on port 3001
# 💾 SQLite persistence enabled!
# 📦 Using better-sqlite3 for persistence
```

### 3. Test Cross-Device Messaging

**Desktop (Host Device)**:
1. Open http://localhost:3000
2. Create room: \"Main Stage VIP\"
3. Note the **Room Code** displayed (e.g., \"bright-stage-42\")
4. Share QR code or room code with mobile device

**Mobile (Guest Device)**:
1. Connect to same WiFi network
2. Open http://[YOUR-IP]:3000 (IP shown in terminal)
3. **Option A**: Scan QR code with camera
4. **Option B**: Enter room code \"bright-stage-42\"
5. Join conversation

**Test Messaging**:
- Send message from desktop → should appear on mobile
- Send message from mobile → should appear on desktop
- ✅ **Success!** You have real-time cross-device messaging

## 🎪 Core Features Overview

### **Room Creation**
```markdown
1. Enter room name (e.g., \"Mainstage VIP\")
2. Click \"Create Room\"
3. Share room code or QR code with others
4. Start chatting instantly
```

### **Room Joining**
```markdown
Method 1 - QR Code:
1. Scan QR code with mobile camera
2. Automatically join conversation

Method 2 - Room Code:
1. Get room code from someone (e.g., \"bright-stage-42\")
2. Enter code exactly as provided
3. Click \"Join Room\"

Method 3 - Recent Rooms:
1. Previously joined rooms appear in recent list
2. Click to rejoin instantly
```

### **Real-Time Messaging**
```markdown
✅ Messages appear instantly on all devices
✅ Message history preserved across reconnections
✅ Works on desktop, mobile, tablet
✅ No accounts or signups required
```

## 🧪 Testing Checklist

### Basic Functionality
- [ ] **Room Creation**: Can create room with custom name
- [ ] **QR Code Generation**: QR code appears and can be scanned
- [ ] **Room Code Sharing**: Room code works for manual joining
- [ ] **Cross-Device Messaging**: Desktop ↔ Mobile messaging works
- [ ] **Message Persistence**: Messages survive page refresh

### Advanced Features
- [ ] **Recent Rooms**: Previously joined rooms appear in list
- [ ] **Connection Resilience**: App reconnects after network interruption
- [ ] **Mobile Optimization**: Touch targets work well on mobile
- [ ] **Multiple Users**: 3+ people can chat in same room
- [ ] **Room Code Clarity**: Easy to distinguish between room name and code

### Network Testing
- [ ] **Same WiFi**: Works when all devices on same network
- [ ] **Network Switching**: Handles WiFi to cellular transitions
- [ ] **Reconnection**: Automatically reconnects after brief disconnection
- [ ] **Error Handling**: Graceful error messages for connection issues

## 🎯 Common Use Cases

### **Festival/Event Scenario**
```markdown
Scenario: Coachella VIP Area Chat

1. VIP Host creates room \"Coachella VIP Lounge\"
2. Room code generated: \"purple-stage-15\"
3. Host shares QR code at VIP entrance
4. Guests scan QR or enter \"purple-stage-15\"
5. Instant group chat for VIP attendees
6. Messages persist throughout event
```

### **Conference/Meeting Scenario**
```markdown
Scenario: TechCrunch Conference Networking

1. Session leader creates \"AI Panel Discussion\"
2. Projects QR code on presentation screen
3. Attendees scan to join discussion chat
4. Real-time Q&A during presentation
5. Networking continues after session
```

### **Private Group Scenario**
```markdown
Scenario: Wedding Party Coordination

1. Maid of honor creates \"Sarah's Wedding Party\"
2. Shares room code \"bright-party-88\" in group text
3. All bridesmaids join throughout the day
4. Coordinate timing, locations, photos
5. Chat history preserved for memories
```

## 📱 Mobile-Specific Features

### **QR Code Scanning**
- **Camera Access**: Tap \"Scan QR\" and allow camera permission
- **Auto-Focus**: Camera automatically focuses on QR codes
- **Instant Join**: Successfully scanned codes join room immediately
- **Fallback**: Manual room code entry if camera unavailable

### **Touch Optimization**
- **44px Touch Targets**: All buttons meet mobile accessibility standards
- **Swipe Gestures**: Intuitive navigation on touch devices
- **Keyboard Handling**: Message input stays visible when typing
- **Safe Areas**: Proper spacing for iPhone notch and Android navigation

### **Network Resilience**
- **WiFi ↔ Cellular**: Handles network transitions gracefully
- **Airplane Mode**: Reconnects automatically when network restored
- **Weak Signal**: Polling fallback for poor WebSocket connections
- **Background**: Messages received when app backgrounded

## 🔧 Troubleshooting

### **\"Server Offline\" Error**
```bash
Problem: Mobile shows \"Server offline\"
Solution: 
1. Ensure both devices on same WiFi
2. Check IP address shown in terminal
3. Try http://[YOUR-IP]:3000 on mobile
4. Restart with `npm run dev:mobile`
```

### **QR Code Not Working**
```bash
Problem: QR code scan fails
Solution:
1. Ensure camera permissions granted
2. Try manual room code entry instead
3. Check QR code shows network IP (not localhost)
4. Verify WiFi connectivity
```

### **Messages Not Syncing**
```bash
Problem: Messages don't appear on other devices
Solution:
1. Check WebSocket connection (browser console)
2. Refresh both devices
3. Verify same room code/name used
4. Check for \"Connected\" indicator
```

### **Development Server Issues**
```bash
Problem: Server won't start or crashes
Solution:
1. Check Node.js version (need 18+)
2. Clear cache: `rm -rf .next node_modules/.cache`
3. Reinstall: `rm -rf node_modules && npm install`
4. Try different port: `PORT=3002 npm run dev:mobile`
```

## 🛠️ Development Commands Reference

```bash
# Development
npm run dev                 # Frontend only (localhost)
npm run dev:mobile         # Frontend + backend (network accessible)
npm run server             # Backend only

# Building
npm run build              # Build for production
npm run build:mobile       # Build optimized for mobile

# Testing
npm run diagnostics        # Open connection diagnostics
curl http://localhost:3001/health  # Check server health

# Deployment
./deploy.sh                        # Full deployment to production
npm run deploy:firebase:quick      # Quick frontend deploy
npm run deploy:firebase:complete   # Full stack deploy
```

## 📊 Performance Expectations

### **Connection Times**
- **QR Code → Chat**: 5-10 seconds end-to-end
- **Manual Join**: 3-5 seconds room code entry to messages
- **Reconnection**: <5 seconds after network restoration
- **Message Delivery**: <100ms on local network

### **Capacity Limits**
- **Users per Room**: 50+ concurrent (tested)
- **Message History**: 100 messages per room stored
- **Room Persistence**: 24 hours server-side
- **Local Storage**: 500 messages per room, 10 rooms max

### **Network Requirements**
- **WiFi**: 802.11n or better recommended
- **Bandwidth**: 10KB/s per user (very lightweight)
- **Latency**: <500ms for good experience
- **Reliability**: Works on 3G+ cellular connections

## 🎉 Success Indicators

### **You'll Know It's Working When:**
- ✅ **Terminal shows network IP** (not localhost)
- ✅ **Mobile can access http://[IP]:3000** successfully
- ✅ **QR code scanning** joins room instantly
- ✅ **Messages appear immediately** on all devices
- ✅ **\"Connected\" indicator** shows green on all devices
- ✅ **Page refresh preserves** message history
- ✅ **Recent rooms** appear for quick rejoining

### **Ready for Production When:**
- ✅ **Cross-device messaging** works reliably
- ✅ **Multiple users** can join same room
- ✅ **Network interruptions** handle gracefully
- ✅ **Mobile experience** feels native and responsive
- ✅ **Room codes** are easy to share and remember

## 🚀 Next Steps

### **After Quick Start Success:**
1. **Read [User Guide](./02-USER-GUIDE.md)** - Learn all features
2. **Review [Architecture](./04-ARCHITECTURE.md)** - Understand how it works
3. **Check [Deployment Guide](./06-DEPLOYMENT.md)** - Deploy to production
4. **Explore [Next Steps Roadmap](./10-NEXT-STEPS-ROADMAP.md)** - Future enhancements

### **For Development:**
1. **Study [Developer Guide](./03-DEVELOPER-GUIDE.md)** - Development workflow
2. **Review [Mobile Optimization](./07-MOBILE-OPTIMIZATION.md)** - Mobile-specific features
3. **Learn [Connection Resilience](./08-CONNECTION-RESILIENCE.md)** - Error handling patterns

---

**🎪 Congratulations!** You now have a working Festival Chat setup with real-time cross-device messaging. Perfect for festivals, events, conferences, or anywhere people need to connect instantly without complex setup.

*Ready to chat across the festival grounds!* 🎵📱
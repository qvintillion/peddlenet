# 🚀 Quick Start Guide

Get Festival Chat running in under 5 minutes!

## ⚡ Instant Setup

### 1. Prerequisites
```bash
# Ensure you have:
- Node.js 18+ installed
- npm or yarn
- Modern browser (Chrome, Safari, Firefox)
```

### 2. Start Development Server
```bash
# Navigate to project
cd festival-chat

# Choose your development mode:

# Option A: Same WiFi network (simpler, faster)
./mobile-ip-fix.sh

# Option B: Cross-network testing (uses ngrok)
./mobile-dev.sh
```

### 3. Test the App
1. **Desktop**: Open `https://your-ngrok-url.io/admin`
2. **Create Room**: Enter any room name → "Create & Join Room"
3. **Generate QR**: Click "📱 Invite" button
4. **Mobile**: Scan QR code with phone camera
5. **Chat**: Start messaging instantly!

## ✅ Expected Results

**Connection time**: 5-10 seconds  
**Network support**: WiFi, Cellular, Mixed networks  
**Browser support**: Chrome, Safari, Firefox (mobile + desktop)  
**Offline capability**: Works without internet once connected

## 🔧 Development URLs

- **Admin Panel**: `https://your-ngrok-url.io/admin`
- **Test Room**: `https://your-ngrok-url.io/test-room` (for debugging)
- **Chat Room**: `https://your-ngrok-url.io/chat/[room-name]`
- **Ngrok Dashboard**: `http://localhost:4040`

## 🆘 Quick Troubleshooting

### Mobile Won't Connect?
```bash
# 1. Ensure HTTPS (check for 🔒 in mobile browser)
# 2. Try different mobile browser (Safari → Chrome)
# 3. Check ngrok tunnel is stable
```

### Peer Recreation Issues?
```bash
# Clear cache and restart
rm -rf .next
./mobile-dev.sh
```

### Still Having Issues?
- [📋 Troubleshooting Guide](./TROUBLESHOOTING.md)
- [🔧 Development Guide](./DEVELOPMENT-GUIDE.md)

## 🎯 Next Steps

Once basic setup works:
- [👥 User Guide](./USER-GUIDE.md) - Learn all features
- [🏗️ Technical Architecture](./TECHNICAL-ARCHITECTURE.md) - Understand the tech
- Deploy to production: `vercel --prod`

**Success Indicator**: When both devices show green status and can exchange messages in real-time, you're ready to use Festival Chat at events! 🎪

# 📱 Mobile Development Setup Guide

## The Problem ❌
Mobile browsers require HTTPS for:
- **WebRTC** (P2P connections)
- **Camera access** (QR scanning)
- **Secure contexts** (crypto APIs)
- **Service Workers** (PWA features)

Your app won't work on mobile with `http://localhost:3000` ❌

## Solution: HTTPS Tunnel 🚀

### **Option 1: Use ngrok (Recommended)**

1. **Install ngrok** (if not installed):
   ```bash
   # Mac with Homebrew
   brew install ngrok
   
   # Or download from: https://ngrok.com/download
   ```

2. **Run the mobile dev script**:
   ```bash
   chmod +x mobile-dev.sh
   ./mobile-dev.sh
   ```

3. **Get your HTTPS URL**:
   - Open http://localhost:4040 in your browser
   - Copy the HTTPS URL (like `https://abc123.ngrok.io`)
   - Open that URL on your phone

### **Option 2: Use the new dev:mobile script**

```bash
# Make script executable
chmod +x start-mobile-dev.sh

# Run it
npm run dev:mobile
```

### **Option 3: Local HTTPS certificates**

```bash
# Setup local HTTPS
npm run setup:https

# Run with HTTPS
npm run dev:https

# Visit https://[YOUR_LOCAL_IP]:3000 on mobile
```

## Testing Checklist 📋

Once you have HTTPS working:

### **Desktop Testing**:
- ✅ Visit your HTTPS URL
- ✅ Create a room (should auto-join)
- ✅ Generate QR code (📱 Invite button)
- ✅ Check console for stable peer ID

### **Mobile Testing**:
- ✅ Scan QR code with mobile browser
- ✅ Should connect in 5-10 seconds
- ✅ Send messages between devices
- ✅ Check connection status

### **P2P Testing**:
- ✅ Multiple devices joining same room
- ✅ Direct connections via QR
- ✅ Offline messaging after connection
- ✅ Connection recovery

## Troubleshooting 🔧

### **Common Issues**:

1. **"This site can't be reached"**
   - Check if ngrok is running
   - Verify the HTTPS URL is correct
   - Try refreshing the ngrok tunnel

2. **"WebRTC not supported"**
   - Ensure you're using HTTPS
   - Check mobile browser support
   - Try different browser (Chrome/Safari)

3. **QR codes not working**
   - Verify HTTPS URL in QR
   - Check stable peer ID generation
   - Test QR scanning apps

4. **Connections failing**
   - Check STUN/TURN server access
   - Verify firewall settings
   - Test different network conditions

## Quick Start Commands 🚀

```bash
# Option A: Use existing script (recommended)
./mobile-dev.sh

# Option B: Use new ngrok script
npm run dev:mobile

# Option C: Local HTTPS setup
npm run setup:https
npm run dev:https
```

## What Each Script Does:

### **mobile-dev.sh** (existing):
- Starts Next.js dev server
- Creates ngrok tunnel  
- Shows ngrok dashboard URL
- Handles cleanup on exit

### **start-mobile-dev.sh** (new):
- Checks if ngrok is installed
- Starts dev server in background
- Creates HTTPS tunnel automatically
- Shows tunnel URL directly

### **setup-https.sh** (new):
- Installs mkcert for local CA
- Generates SSL certificates
- Sets up local HTTPS development
- Works without internet

Choose the option that works best for your setup! 🎯

# 🎪 Festival Chat - Streamlined Development & Deployment

## 🎆 **PRODUCTION SUCCESS!**

**🏆 BREAKTHROUGH:** Festival chat messaging now works flawlessly in production!
- ✅ **Fast connections** (5-10 seconds)
- ✅ **Instant bidirectional messaging** 
- ✅ **Cross-device support** (desktop ↔ mobile)
- ✅ **Solo messaging** enabled
- ✅ **Message persistence** working

---

## 🚀 Quick Start

### 📱 Development Testing
```bash
./dev-mobile.sh
```
- Starts both Next.js and signaling server
- Auto-detects your IP for mobile testing
- Cross-device testing ready (desktop ↔ mobile)

### 🚀 Deployment
```bash
# 1. Edit the commit message in deploy.sh
# 2. Run deployment
./deploy.sh
```
- Stages, commits, and pushes to GitHub
- Triggers automatic Vercel deployment
- Edit commit message before each deployment

---

## 📂 Essential Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `dev-mobile.sh` | Development testing | `./dev-mobile.sh` |
| `deploy.sh` | Production deployment | Edit message, then `./deploy.sh` |

---

## 🔄 Development Workflow

1. **Make changes** to your code
2. **Test locally**: `./dev-mobile.sh`
3. **Edit commit message** in `deploy.sh`
4. **Deploy**: `./deploy.sh`

---

## 🧪 Mobile Testing

When you run `./dev-mobile.sh`:

1. 🖥️ **Desktop**: Open http://localhost:3000
2. 📱 **Mobile**: Connect to same WiFi, open http://[YOUR-IP]:3000
3. 🏠 **Both**: Join the same room name
4. 💬 **Test**: Send messages between devices

---

## 🎯 Features

✅ **Cross-device chat** (mobile ↔ desktop)  
✅ **QR code room sharing**  
✅ **Real-time message sync**  
✅ **Persistent chat rooms**  
✅ **Automatic IP detection**  

---

*Clean, simple, festival-ready! 🎪*
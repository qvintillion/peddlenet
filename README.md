# 🎵 PeddleNet

> **Instant P2P networking for festivals and events - Connect when WiFi doesn't**

[![Live Demo](https://img.shields.io/badge/Live-Demo-purple?style=for-the-badge)](https://peddlenet.app)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![WebRTC](https://img.shields.io/badge/WebRTC-P2P-green?style=for-the-badge)](https://webrtc.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

## ⚡ Quick Start

**Try it live**: [peddlenet.app](https://peddlenet.app)

1. Create a room and join automatically
2. Share QR code to invite others  
3. Instant P2P connections (5-10 seconds)
4. Works offline once connected!

## 🌟 Features

- **🚀 Instant Connection**: QR code to live chat in seconds
- **📱 Cross-Platform**: Desktop ↔ Mobile seamlessly  
- **🌐 Works Offline**: P2P connections survive network outages
- **🔒 Privacy First**: No registration, no data collection
- **🎪 Festival Ready**: Designed for crowded, low-connectivity environments

## 🏗️ Tech Stack

- **Frontend**: Next.js 15 + React 19 + TypeScript
- **P2P Layer**: WebRTC with persistent peer management
- **Styling**: Tailwind CSS
- **Deployment**: Vercel + Cloudflare CDN
- **Domain**: Custom domain with SSL

## 🚀 Development

### Prerequisites
- Node.js 18+
- npm or yarn

### Setup
```bash
git clone https://github.com/YOUR_USERNAME/peddlenet.git
cd peddlenet
npm install
npm run dev
```

Visit `http://localhost:3000` to see the app running.

### Testing Cross-Device
```bash
# Start dev server
npm run dev

# Get your local IP for mobile testing
ifconfig | grep "inet " | grep -v 127.0.0.1

# Access from mobile: http://[YOUR-IP]:3000
```

## 📱 How It Works

### P2P Architecture
- Uses WebRTC for direct peer-to-peer connections
- QR codes contain room info and peer connection details
- No central server required after initial connection
- Messages route directly between devices

### Connection Flow
1. **Host** creates room → gets unique peer ID
2. **QR Code** contains room ID + peer connection info
3. **Guest** scans QR → establishes direct P2P connection
4. **Mesh Network** allows multiple participants

## 🎪 Perfect for Events

### Use Cases
- **Music Festivals**: Coordinate with friends when cell towers are overloaded
- **Camping Events**: Communication without internet infrastructure  
- **Corporate Retreats**: Team coordination in remote locations
- **Emergency Response**: Backup communication when networks fail
- **Conferences**: Attendee networking and coordination

### Why P2P?
- **Resilient**: Works when centralized networks fail
- **Fast**: Direct connections = minimal latency
- **Private**: No data passes through servers
- **Scalable**: Each connection adds capacity to the network

## 🛠️ Project Structure

```
src/
├── app/                    # Next.js app router
│   ├── page.tsx           # Homepage with room creation
│   ├── chat/[roomId]/     # P2P chat interface
│   ├── diagnostics/       # Network testing tools
│   └── layout.tsx         # App layout and metadata
├── components/            # Reusable React components
├── hooks/                 # Custom React hooks (P2P logic)
├── lib/                   # Utilities and constants
└── utils/                 # Helper functions
```

## 🚢 Deployment

### Vercel (Recommended)
```bash
# Deploy to production
npm run deploy:vercel
```

### Manual Build
```bash
npm run build
npm run start
```

## 🔧 Configuration

### Environment Variables
```bash
# Optional: Add to .env.local
NEXT_PUBLIC_APP_NAME=PeddleNet
NEXT_PUBLIC_PEER_SERVER_HOST=custom-peer-server.com
```

### Custom Domain
1. Configure DNS to point to Vercel
2. Add domain in Vercel dashboard
3. SSL automatically configured

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📊 Roadmap

### ✅ Current (v1.0)
- P2P chat with QR invitations
- Cross-platform compatibility
- Production deployment

### 🔄 Next (v1.1) 
- Enhanced peer discovery
- Room persistence
- 10+ peer capacity

### 🕸️ Future (v2.0)
- Mesh networking with message routing
- File sharing capabilities
- Voice/video over P2P
- Geolocation-based discovery

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🎯 Vision

**Make event communication bulletproof.**

PeddleNet aims to become the standard for event communication, providing reliable P2P networking that works in any environment. From intimate gatherings to massive festivals, when traditional networks fail, PeddleNet connects.

---

**Live Demo**: [peddlenet.app](https://peddlenet.app)  
**Status**: Production Ready ✅  
**Next**: Mesh Network Evolution 🕸️
# Force deployment trigger

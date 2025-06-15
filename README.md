# 🎭 PeddleNet Festival Chat

**Real-time P2P chat application for festivals and events with WebRTC mesh networking**

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-web-orange)

## 🚀 Quick Start

### Development
```bash
# Install dependencies
npm install

# Start development server with mobile support
npm run dev:mobile

# Start with WebSocket server
npm run dev:with-server
```

### Deployment
```bash
# Deploy WebSocket server to staging
./scripts/deploy-websocket-staging.sh

# Complete staging deployment (Firebase + WebSocket)
npm run deploy:firebase:complete

# Production deployment
npm run deploy:vercel:complete
```

## 📁 Project Structure

```
festival-chat/
├── 📄 Core Configuration
│   ├── package.json              # Dependencies and scripts
│   ├── next.config.ts            # Next.js configuration
│   ├── tailwind.config.ts        # Tailwind CSS config
│   ├── firebase.json             # Firebase hosting config
│   └── vercel.json               # Vercel deployment config
│
├── 🎯 Application Code
│   ├── src/                      # Next.js app source code
│   ├── public/                   # Static assets
│   └── functions/                # Firebase functions
│
├── 🛠️ Infrastructure
│   ├── deployment/               # Docker and Cloud Build configs
│   ├── scripts/                  # Enhanced deployment scripts
│   ├── tools/                    # Utility scripts and tools
│   └── signaling-server.js       # Universal WebSocket server
│
├── 📚 Documentation
│   ├── docs/                     # Comprehensive documentation
│   └── README.md                 # This file
│
├── 🔒 Environment & Security
│   ├── .env.*                    # Environment configurations
│   ├── .firebaserc              # Firebase project config
│   └── storage.rules            # Firebase security rules
│
└── 📦 Archive & Backup
    ├── archive/                  # Historical files and deprecated code
    └── backup/                   # Automatic backups
```

## 🎯 Key Features

### Real-Time Communication
- **WebRTC P2P Messaging**: Direct peer-to-peer communication
- **WebSocket Fallback**: Reliable message delivery
- **Room-Based Chat**: Organized by festival/event rooms
- **Cross-Device Sync**: Messages sync across all devices

### Mobile-First Design
- **QR Code Connections**: Instant room joining via QR scan
- **Responsive Interface**: Optimized for mobile and desktop
- **Offline Resilience**: Works with poor festival connectivity
- **Auto-Reconnection**: Seamless connection recovery

### Advanced Networking
- **Mesh Networking**: P2P connections between multiple users
- **Connection Tracking**: Real-time connection status monitoring
- **Smart Routing**: Automatic fallback to WebSocket when needed
- **Background Notifications**: Cross-room message notifications

### Admin & Analytics
- **Real-Time Dashboard**: Monitor connections and performance
- **User Management**: Track active users and rooms
- **Performance Metrics**: Connection success rates and latency
- **Health Monitoring**: System status and diagnostics

## 🔧 Environment Configuration

### Development
```bash
# Auto-detected local IP for mobile testing
NEXT_PUBLIC_DETECTED_IP=auto
```

### Staging
```bash
# Staging WebSocket server on Cloud Run
NEXT_PUBLIC_SIGNALING_SERVER=wss://peddlenet-websocket-server-staging-*.a.run.app
BUILD_TARGET=staging
NODE_ENV=production
```

### Production
```bash
# Production WebSocket server
NEXT_PUBLIC_SIGNALING_SERVER=wss://peddlenet-websocket-server-*.a.run.app
BUILD_TARGET=production
NODE_ENV=production
```

## 📋 Available Scripts

### Development
| Script | Description |
|--------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run dev:mobile` | Start with mobile optimization and QR code |
| `npm run dev:with-server` | Start with local WebSocket server |

### Deployment
| Script | Description |
|--------|-------------|
| `npm run deploy:firebase:complete` | **Enhanced**: Complete staging deployment with cache-busting |
| `npm run staging:unified` | Deploy to staging environment |
| `npm run deploy:vercel:complete` | Deploy to production on Vercel |

### WebSocket Server
| Script | Description |
|--------|-------------|
| `./scripts/deploy-websocket-staging.sh` | **Enhanced**: Deploy staging WebSocket with cache-busting |
| `./scripts/deploy-websocket-cloudbuild.sh` | Deploy production WebSocket server |

### Utility
| Script | Description |
|--------|-------------|
| `npm run backup:github` | Backup project to GitHub |
| `npm run env:staging` | Switch to staging environment |
| `npm run env:production` | Switch to production environment |

## 🧪 Testing & Health Checks

### Health Endpoints
```bash
# WebSocket server health
curl https://peddlenet-websocket-server-staging-*.a.run.app/health

# Firebase hosting
curl https://festival-chat-peddlenet.web.app

# Admin dashboard  
curl https://festival-chat-peddlenet.web.app/admin-analytics
```

### Mobile Testing
1. Run `npm run dev:mobile`
2. Scan QR code with mobile device
3. Test P2P connections between devices
4. Verify message synchronization

## 📚 Documentation

### Core Guides
- **[Quick Start](docs/01-QUICK-START.md)** - Getting started guide
- **[Deployment](docs/06-DEPLOYMENT.md)** - Enhanced deployment with cache-busting
- **[Troubleshooting](docs/11-TROUBLESHOOTING.md)** - Common issues and solutions
- **[Architecture](docs/04-ARCHITECTURE.md)** - System design overview

### Feature Documentation
- **[Mesh Networking](docs/03-MESH-NETWORKING.md)** - P2P implementation
- **[Mobile Optimization](docs/07-MOBILE-OPTIMIZATION.md)** - Mobile-first patterns
- **[Admin Dashboard](docs/ADMIN-ANALYTICS-DASHBOARD-COMPLETE.md)** - Admin features

### Complete Index
See **[Documentation Index](docs/README.md)** for all available guides.

## 🚨 Recent Major Updates

### ✅ Enhanced Cache-Busting Deployment (June 15, 2025)
- **Unique Docker image tagging** prevents container caching
- **Ultra-short traffic tags** comply with Cloud Run limits
- **Explicit traffic management** with health verification
- **Comprehensive cache clearing** for all deployment layers
- **Automatic environment protection** and restoration

### ✅ Project Organization Cleanup
- **Archived deprecated scripts** to maintain clean root
- **Organized documentation** with proper indexing
- **Streamlined deployment workflows** with enhanced scripts
- **Consolidated environment management**

## 🔍 Troubleshooting

### Common Issues
- **"Deployment successful but no changes"**: Use enhanced cache-busting scripts
- **"WebSocket connection failed"**: Check health endpoints and CORS
- **"Environment variables not set"**: Verify `.env.*` files match target environment
- **"Traffic tag too long"**: Enhanced scripts use ultra-short tags automatically

See **[Complete Troubleshooting Guide](docs/11-TROUBLESHOOTING.md)** for detailed solutions.

## 🤝 Contributing

1. **Development**: Use `npm run dev:mobile` for testing
2. **Testing**: Verify on multiple devices with QR code connections
3. **Deployment**: Use enhanced scripts for staging tests
4. **Documentation**: Update relevant docs in `/docs` folder

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Live App**: https://festival-chat-peddlenet.web.app
- **Admin Dashboard**: https://festival-chat-peddlenet.web.app/admin-analytics
- **GitHub**: https://github.com/qvintillion/peddlenet
- **Documentation**: [docs/README.md](docs/README.md)

---

*Built for festivals, optimized for mobile, powered by WebRTC*

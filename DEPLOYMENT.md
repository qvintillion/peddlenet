# 🚀 Deployment Guide - Festival Chat

Complete deployment workflow documentation for the hybrid Vercel + Cloud Run architecture.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐
│   Vercel        │    │   Cloud Run      │
│   Frontend +    │    │   WebSocket      │
│   Admin APIs    │◄──►│   Server         │
│                 │    │                  │
│ Next.js App     │    │ Socket.IO        │
│ /api/admin/*    │    │ Real-time Chat   │
│ Session Mgmt    │    │ Universal Server │
└─────────────────┘    └──────────────────┘
```

## 🔄 4-Tier Deployment Workflow

### **1. Development (Local) 🏠**
**Purpose:** Fast UI iteration and component testing
```bash
npm run dev:mobile
```

**Environment:**
- Frontend: `localhost:3000`
- Backend: `localhost:3001`
- Network: Auto-detected IP for mobile testing
- Database: In-memory
- Session: Development mode

**When to use:**
- UI/UX development
- Component testing
- Mobile QR code testing
- Quick iterations

### **2. Preview Staging (Quick Testing) 🎆**
**Purpose:** Quick testing and stakeholder sharing
```bash
npm run preview:deploy feature-name
```

**Environment:**
- Frontend: Firebase Preview Channel
- Backend: Preview WebSocket server
- Database: Preview environment
- Session: Preview mode
- URL: `https://festival-chat--feature-name-[hash].web.app`

**When to use:**
- Feature demonstrations
- Stakeholder reviews
- Quick testing with others
- Temporary deployments

**Management:**
```bash
npm run preview:list     # List all preview channels
npm run preview:manage   # Manage existing channels  
npm run preview:cleanup  # Clean up expired channels
```

### **3. Final Staging (Comprehensive Validation) 🌍**
**Purpose:** Final validation before production
```bash
npm run deploy:firebase:complete
```

**Environment:**
- Frontend: Firebase Hosting (staging)
- Backend: Staging WebSocket server
- Database: Staging environment
- Session: Production-like
- URL: `https://festival-chat.web.app`

**When to use:**
- Final testing before production
- Performance validation
- Full feature testing
- Security validation
- Admin dashboard testing

### **4. Production (Vercel) 🚀**
**Purpose:** Live production deployment
```bash
vercel --prod --yes
# or
./deploy.sh
```

**Environment:**
- Frontend: Vercel (`https://peddlenet.app`)
- Backend: Production Cloud Run server
- Database: Production
- Session: Production with 24-hour persistence
- Admin: Full analytics dashboard

**When to use:**
- Final deployment to live users
- After successful staging validation
- High confidence deployments

## 🔧 WebSocket Server Updates

When the universal server needs updates:

### **Staging Server Update**
```bash
./scripts/deploy-websocket-staging.sh
```
- Updates staging WebSocket server
- Safe for testing server changes
- Used with final staging environment

### **Production Server Update**
```bash
./scripts/deploy-websocket-cloudbuild.sh  
```
- Updates production WebSocket server
- Only after staging validation
- Critical for live chat functionality

## 📊 Admin Dashboard Deployment

The admin dashboard is included in all deployments:

### **Access Points:**
- **Development:** `http://localhost:3000/admin-analytics`
- **Preview:** `https://preview-url/admin-analytics`
- **Staging:** `https://festival-chat.web.app/admin-analytics`
- **Production:** `https://peddlenet.app/admin-analytics`

### **Credentials:**
- **Username:** `th3p3ddl3r`
- **Password:** `letsmakeatrade`

### **Features:**
- 24-hour session persistence
- Real-time analytics dashboard
- User and room management
- Activity feed with 100-record retention
- Broadcast messaging
- Database management

## 🛠️ Environment Configuration

### **Environment Variables**

**Development (.env.local):**
```env
NEXT_PUBLIC_DETECTED_IP=auto-detected
NEXT_PUBLIC_SIGNALING_SERVER=http://localhost:3001
NODE_ENV=development
BUILD_TARGET=development
```

**Preview (.env.preview):**
```env
NEXT_PUBLIC_SIGNALING_SERVER=wss://preview-websocket-server.run.app
NODE_ENV=production
BUILD_TARGET=staging
PLATFORM=firebase
```

**Staging (.env.staging):**
```env
NEXT_PUBLIC_SIGNALING_SERVER=wss://staging-websocket-server.run.app
NODE_ENV=production
BUILD_TARGET=staging
PLATFORM=firebase
```

**Production (.env.production):**
```env
NEXT_PUBLIC_SIGNALING_SERVER=wss://peddlenet-websocket-server-hfttiarlja-uc.a.run.app
NODE_ENV=production
BUILD_TARGET=production
PLATFORM=vercel
```

## 📋 Pre-Deployment Checklist

### **Before Any Deployment:**
- [ ] Code committed to git
- [ ] Tests passing locally
- [ ] No console errors
- [ ] Mobile testing completed
- [ ] QR codes working

### **Before Final Staging:**
- [ ] Preview testing successful
- [ ] All features working
- [ ] Performance acceptable
- [ ] Admin dashboard tested
- [ ] WebSocket connections stable

### **Before Production:**
- [ ] Staging fully validated
- [ ] Admin dashboard fully functional
- [ ] All user flows tested
- [ ] Performance benchmarks met
- [ ] Error handling verified

## 🔍 Deployment Verification

### **Post-Deployment Tests:**

**1. Basic Functionality:**
```bash
# Test health endpoint
curl https://your-domain.com/api/health

# Expected: 200 OK with JSON response
```

**2. Admin Dashboard:**
- [ ] Login page loads
- [ ] Authentication works
- [ ] Dashboard shows data
- [ ] Session persists across refresh
- [ ] All modals work
- [ ] Admin controls functional

**3. Chat Functionality:**
- [ ] Room creation works
- [ ] QR codes generate correctly
- [ ] Cross-device messaging
- [ ] Message persistence
- [ ] Auto-reconnection
- [ ] Room codes work

**4. WebSocket Connection:**
- [ ] Real-time messaging
- [ ] Connection indicators
- [ ] Auto-reconnection
- [ ] Network resilience

## 🔧 Troubleshooting Deployments

### **Common Issues:**

**Build Failures:**
```bash
# Clean and rebuild
rm -rf .next out node_modules/.cache
npm cache clean --force
npm install
npm run build
```

**Environment Issues:**
```bash
# Check environment detection
npm run env:show

# Set correct environment
npm run env:dev      # for development
npm run env:staging  # for staging
npm run env:production # for production
```

**WebSocket Connection Issues:**
- Check `NEXT_PUBLIC_SIGNALING_SERVER` environment variable
- Verify WebSocket server is running
- Test with `./check-server-status.sh`

**Admin Dashboard Issues:**
- Clear browser cache and localStorage
- Check authentication credentials
- Verify API endpoints are working
- Test with browser developer tools

### **Rollback Procedures:**

**Vercel Rollback:**
```bash
# List deployments
vercel list

# Rollback to previous deployment
vercel rollback [deployment-url]
```

**WebSocket Server Rollback:**
```bash
# Redeploy previous version
git checkout [previous-commit]
./scripts/deploy-websocket-cloudbuild.sh
git checkout main
```

## 📊 Performance Monitoring

### **Key Metrics to Monitor:**

**Frontend (Vercel):**
- Build time
- Bundle size
- Core Web Vitals
- API response times

**WebSocket Server (Cloud Run):**
- Connection count
- Message throughput
- Memory usage
- Cold starts

**Admin Dashboard:**
- Session persistence
- Data loading times
- Modal responsiveness
- Activity feed performance

### **Monitoring Tools:**
- Vercel Analytics (automatic)
- Cloud Run Monitoring (Google Cloud Console)
- Browser Developer Tools
- Admin dashboard built-in metrics

## 🔐 Security Considerations

### **Admin Dashboard:**
- 24-hour session expiry
- Basic authentication
- CORS configuration
- Rate limiting on API endpoints

### **WebSocket Server:**
- Connection throttling
- Rate limiting per IP
- CORS configuration
- Health monitoring

### **General Security:**
- HTTPS everywhere
- Secure WebSocket (WSS)
- No sensitive data in localStorage
- Environment-specific configurations

## 📈 Scaling Considerations

### **Current Limits:**
- 50+ users per room
- 100 messages per room history
- 24-hour room persistence
- 100 admin activity records

### **Scaling WebSocket Server:**
```bash
# Update Cloud Run configuration
gcloud run services update peddlenet-websocket-server \
  --memory=2Gi \
  --cpu=2 \
  --max-instances=10
```

### **Scaling Frontend:**
- Vercel automatically scales
- Edge caching for static assets
- API routes scale automatically

## 📚 Related Documentation

- [README.md](../README.md) - Main project documentation
- [docs/04-ARCHITECTURE.md](../docs/04-ARCHITECTURE.md) - Technical architecture
- [docs/11-TROUBLESHOOTING.md](../docs/11-TROUBLESHOOTING.md) - Detailed troubleshooting

---

## 🎯 Quick Reference

**Development:**
```bash
npm run dev:mobile
```

**Preview:**
```bash
npm run preview:deploy feature-name
```

**Staging:**
```bash
npm run deploy:firebase:complete
```

**Production:**
```bash
vercel --prod --yes
```

**WebSocket Updates:**
```bash
# Staging
./scripts/deploy-websocket-staging.sh

# Production  
./scripts/deploy-websocket-cloudbuild.sh
```

**Admin Dashboard:**
- URL: `/admin-analytics`
- User: `th3p3ddl3r`
- Pass: `letsmakeatrade`
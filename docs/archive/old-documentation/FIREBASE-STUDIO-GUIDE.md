# 🔥 Firebase Studio Integration Guide

## 🎯 **Access Firebase Studio**

1. **Firebase Console**: https://console.firebase.google.com/
2. **Select your project**: festival-chat-peddlenet (or your actual project name)
3. **Navigate to Hosting**: Left sidebar → Hosting

## 🚀 **Development Workflow with Firebase Studio**

### **Local Development**
```bash
# 1. Start local dev server (Next.js)
npm run dev

# 2. In another terminal, start Firebase emulators (optional)
firebase emulators:start --only hosting

# 3. Make your changes in VS Code/your editor
# 4. Test locally at http://localhost:3000 (Next.js) or http://localhost:5000 (Firebase)
```

### **Deploy to Firebase**
```bash
# 1. Build for Firebase
BUILD_TARGET=firebase npm run build

# 2. Deploy to Firebase
firebase deploy --only hosting

# 3. View live site
firebase open hosting:site
```

### **Preview Channels (Staging)**
```bash
# Create preview deployment
firebase hosting:channel:deploy preview

# Deploy specific feature
firebase hosting:channel:deploy feature-xyz --expires 7d
```

## 🔧 **Firebase Studio Features You Can Now Use**

### **1. Real-time Analytics**
- View in Firebase Console → Analytics
- See user engagement, page views, etc.

### **2. Performance Monitoring**
- Firebase Console → Performance
- Monitor app loading times, network requests

### **3. Hosting Management**
- Firebase Console → Hosting
- Manage domains, SSL certificates
- View deployment history
- Rollback if needed

### **4. Remote Config (Optional)**
- Firebase Console → Remote Config
- Change app behavior without redeployment
- Feature flags, A/B testing

### **5. Authentication (Future)**
- Firebase Console → Authentication
- User management, social logins

## 📊 **Environment Management**

### **Primary: Vercel (Production)**
- URL: https://peddlenet.app
- Auto-deploys from main branch
- Optimized for production traffic

### **Secondary: Firebase (Staging/Testing)**
- URL: https://your-project.web.app
- Manual deploys for testing
- Great for preview builds and testing

## 🔄 **Recommended Workflow**

1. **Develop locally**: `npm run dev`
2. **Test on Firebase**: `BUILD_TARGET=firebase npm run build && firebase serve`
3. **Deploy to Firebase staging**: `firebase deploy --only hosting`
4. **Test thoroughly on Firebase URL**
5. **Deploy to Vercel production**: `git push origin main`

## 🚨 **Important Notes**

- ✅ **Your Vercel deployment is preserved** as primary production
- ✅ **Firebase serves as secondary/staging environment**
- ✅ **WebSocket server compatibility**: Test that your signaling server works with Firebase hosting
- ✅ **Environment variables**: May need to configure for Firebase deployment

## 🛠️ **Troubleshooting**

### **Build Issues**
```bash
# Clear Next.js cache
rm -rf .next
BUILD_TARGET=firebase npm run build
```

### **Deployment Issues**
```bash
# Check Firebase configuration
firebase projects:list
firebase target:apply hosting main your-site-name
```

### **WebSocket Connection Issues**
- Firebase hosting serves static files only
- Your WebSocket server (`signaling-server.js`) runs separately
- Update `NEXT_PUBLIC_SIGNALING_SERVER` environment variable for Firebase builds

## 🎉 **You're Ready for Firebase Studio!**

Firebase Studio is now configured and ready for:
- 📱 **Real-time development**
- 🚀 **Easy deployments**
- 📊 **Performance monitoring**
- 🧪 **Preview environments**
- 🔧 **Configuration management**

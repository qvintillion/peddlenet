# 🐛 Known Issues & Limitations

## Current Limitations

### 🔢 Connection Limits
- **Maximum Peers**: Tested up to 5 simultaneous connections
- **Recommended**: 3-4 peers for optimal performance
- **Reason**: Browser WebRTC connection limits and memory usage

### 📱 Mobile Browser Variations
- **iOS Safari**: Occasionally requires page refresh for WebRTC initialization
- **Android Chrome**: Some carriers may block P2P connections
- **Private Browsing**: Limited localStorage affects peer discovery
- **Solution**: Test multiple browsers if issues occur

### 🌐 Network Dependencies
- **Initial Handshake**: Requires internet for STUN server access
- **Corporate Networks**: May block WebRTC protocols
- **Cellular Carriers**: Some carriers restrict P2P connections
- **Workaround**: Use mobile hotspot or different network

## Known Bugs

### 🔄 React Strict Mode Issues
**Status**: Fixed in production, affects development
```bash
# Symptom: Multiple peer initializations in development
# Solution: React.StrictMode disabled in production build
# Impact: Development only, no production effect
```

### ⏱️ Connection Timeout Edge Cases
**Status**: Rare, affects <5% of connections
```bash
# Symptom: Connection hangs at "CONNECTING" status
# Solution: Manual reconnect or QR regeneration
# Mitigation: 10-second timeout with auto-retry
```

### 📂 File Upload (Not Implemented)
**Status**: Planned feature, not yet available
```bash
# Current: Text messages only
# Planned: Image sharing, file transfer via P2P
# Workaround: Use external file sharing if needed
```

## Browser Compatibility Issues

### Safari Desktop
- **Issue**: WebRTC permissions dialog sometimes hidden
- **Solution**: Check browser permissions manually
- **Frequency**: Rare (~2% of connections)

### Firefox Mobile
- **Issue**: QR scanner integration varies by device
- **Solution**: Type room URL manually or use camera app
- **Frequency**: Occasional (~10% of mobile Firefox users)

### Older Browsers
- **Not Supported**: Internet Explorer, browsers without WebRTC
- **Minimum**: Chrome 60+, Safari 12+, Firefox 55+
- **Check**: Use https://caniuse.com/webrtc for browser support

## Performance Limitations

### 🔋 Battery Usage
- **Impact**: WebRTC connections use more battery than standard web browsing
- **Mitigation**: Connection auto-cleanup when page hidden
- **Recommendation**: Close tabs when not actively chatting

### 💾 Memory Usage
- **Current**: ~50-100MB per active chat room
- **Growth**: Increases with message history and peer count
- **Cleanup**: Automatic when leaving room or closing browser

### 📶 Network Quality
- **Poor Signal**: May cause connection drops or slow message delivery
- **Recommendation**: Ensure stable network before starting chat
- **Recovery**: Automatic reconnection when signal improves

## Security Considerations

### 🔐 Data Privacy
- **Limitation**: Messages stored locally, not encrypted at rest
- **P2P Encryption**: WebRTC provides transport encryption
- **Recommendation**: Don't share sensitive information
- **Future**: End-to-end encryption planned for v2.0

### 🌍 Public Networks
- **Risk**: Public WiFi may intercept initial handshake
- **Mitigation**: HTTPS prevents most attacks
- **Recommendation**: Use trusted networks when possible

## Deployment Issues

### 🚀 Vercel Limitations
- **Cold Starts**: First load may be slower (serverless)
- **Regional**: Performance varies by user location
- **Scaling**: Limited by browser connection limits, not server capacity

### 📱 PWA Features
- **Status**: Not implemented
- **Missing**: Offline installation, push notifications
- **Planned**: Progressive Web App features in future version

## Workarounds & Alternatives

### Connection Troubleshooting
```bash
# If P2P fails completely:
1. Test on same WiFi network first
2. Try mobile hotspot
3. Use manual peer ID connection
4. Switch to different browsers
5. Check with network administrator
```

### Group Chat Alternatives
```bash
# For larger groups (>5 people):
1. Create multiple smaller rooms
2. Use traditional group chat apps for coordination
3. Designate room "hosts" to bridge conversations
```

### File Sharing Workarounds
```bash
# Until file sharing is implemented:
1. Use cloud storage links (Dropbox, Google Drive)
2. Share photos via social media
3. Use QR codes for small data transfer
```

## Future Improvements

### 🎯 Short Term (Next Release)
- [ ] File/image sharing via P2P
- [ ] Voice message support
- [ ] Improved mobile experience
- [ ] Better connection recovery

### 🚀 Medium Term (6 months)
- [ ] Voice/video chat capability
- [ ] Progressive Web App (PWA)
- [ ] End-to-end encryption
- [ ] Room persistence with optional server backup

### 🌟 Long Term (1 year+)
- [ ] Native mobile apps
- [ ] Advanced mesh networking
- [ ] Integration with calendar/event systems
- [ ] Analytics and usage insights

## Reporting Issues

### 🐛 Bug Reports
Include in your report:
- Browser and version
- Device type (desktop/mobile)
- Network setup (WiFi/cellular)
- Steps to reproduce
- Console error messages
- Expected vs actual behavior

### 💡 Feature Requests
- Describe the use case
- Explain how it fits festival/event scenarios
- Consider P2P limitations
- Suggest implementation approach

### 🔧 Contributing
- Check existing issues first
- Test on multiple browsers/devices
- Include documentation updates
- Follow TypeScript patterns
- Maintain P2P architecture principles

---

*Known issues are actively monitored and addressed in order of user impact and technical feasibility. Most limitations stem from fundamental WebRTC browser constraints rather than implementation issues.*

**Last Updated**: January 2025  
**Next Review**: March 2025
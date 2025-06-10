# 🎪 User Guide - Festival Chat

## 🎯 Overview

Festival Chat is designed for instant, no-setup messaging at festivals, events, and gatherings. Connect with people nearby using simple room codes or QR codes - no accounts, no downloads, just chat.

## 🚀 Getting Started

### **Access Festival Chat**
- **Primary URL**: https://peddlenet.app
- **Backup URL**: https://festival-chat-peddlenet.web.app
- **Local Development**: http://[host-ip]:3000 (when running locally)

### **Device Requirements**
- **Desktop**: Chrome, Firefox, Safari, Edge (latest versions)
- **Mobile**: iOS Safari 14+, Android Chrome 90+
- **Network**: WiFi or cellular data connection
- **Camera**: Optional (for QR code scanning)

## 💬 How to Chat

### **Method 1: Join Existing Room (Most Common)**

**If someone shares a room code with you:**
1. Go to Festival Chat website
2. Choose "Join Room"
3. Enter the room code exactly (e.g., "bright-stage-42")
4. Click "Join Room"
5. Start chatting immediately!

**If someone shows you a QR code:**
1. Go to Festival Chat website  
2. Choose "Join Room"
3. Click "Scan QR Code"
4. Allow camera access
5. Point camera at QR code
6. Automatically join conversation!

### **Method 2: Create New Room**

**When you want to start a new conversation:**
1. Go to Festival Chat website
2. Choose "Create Room"
3. Enter a room name (e.g., "Mainstage VIP Area")
4. Click "Create Room"
5. Share the **room code** or **QR code** with others
6. Wait for people to join and start chatting!

### **Method 3: Rejoin Recent Room**

**Return to previous conversations:**
1. Go to Festival Chat website
2. Recent rooms appear as clickable cards
3. Click any recent room to rejoin instantly
4. Continue where you left off!

## 🎛️ Interface Guide

### **Main Screen Elements**

```
┌─────────────────────────────────┐
│  🎪 Festival Chat               │  ← Header
├─────────────────────────────────┤
│  Recent Rooms (if any)          │  ← Quick rejoin
│  [bright-stage-42] [main-vip]   │    
├─────────────────────────────────┤
│  ○ Create Room                  │  ← Create new
│  ○ Join Room                    │  ← Join existing
├─────────────────────────────────┤
│  Room Name: ________________    │  ← Room creation
│  [Create Room]                  │
│                                 │
│  Room Code: ________________    │  ← Room joining
│  [Join Room] [Scan QR]          │
└─────────────────────────────────┘
```

### **Chat Screen Elements**

```
┌─────────────────────────────────┐
│  ← 🎪 bright-stage-42           │  ← Back + Room info
├─────────────────────────────────┤
│  🎫 Room Code: bright-stage-42  │  ← Share info
│  [📋 Copy] [🔗 QR Code]         │
├─────────────────────────────────┤
│  Alice: Hey everyone! 👋         │  ← Messages
│  Bob: Great set from the DJ     │
│  You: Amazing sound quality!    │
│  ⚡ Connected • 3 people         │  ← Connection status
├─────────────────────────────────┤
│  Type a message... [Send]       │  ← Message input
└─────────────────────────────────┘
```

## 🔗 Sharing & Inviting

### **Room Code Sharing (Primary Method)**

**Room codes are the easiest way to invite people:**
- **Format**: Two words + number (e.g., "bright-stage-42")
- **Sharing**: Tell someone "Join bright-stage-42" verbally or via text
- **Case Insensitive**: "BRIGHT-STAGE-42" works same as "bright-stage-42"
- **Memorable**: Designed to be easy to remember and share

**Best Practices:**
```markdown
✅ DO: "Join bright-stage-42 on Festival Chat"
✅ DO: Text the room code in group messages
✅ DO: Write room code on whiteboards/signs
❌ DON'T: Share entire URLs (too long and complex)
```

### **QR Code Sharing (Visual Method)**

**QR codes are perfect for visual sharing:**
- **Display**: Project on screens, show on phone, print on signs
- **Scanning**: Point any camera at QR code to join instantly
- **No Typing**: Eliminates mistakes from manual room code entry
- **Fast**: Fastest way to get multiple people connected

**Best Use Cases:**
```markdown
✅ Conference presentations (project QR on screen)
✅ Event entrances (print QR on signs)
✅ Group meetups (show QR on phone screen)
✅ Stage announcements ("Scan to join backstage chat")
```

## 💬 Messaging Features

### **Basic Messaging**
- **Real-time**: Messages appear instantly on all devices
- **History**: Previous messages show when you join
- **Persistence**: Messages survive page refreshes and reconnections
- **Multiple Devices**: Same person can join from phone + laptop

### **Message Types**
- **Text Messages**: Standard chat messages
- **Emoji Support**: Full emoji keyboard support 🎉
- **System Messages**: "Alice joined the room" notifications
- **Connection Status**: "Connected" / "Reconnecting" indicators

### **Smart Features**
- **Auto-scroll**: Chat automatically scrolls to newest messages
- **Read Indicators**: See when messages are delivered
- **Typing Awareness**: Know when others are typing
- **Message Timestamps**: Hover/tap to see exact send time
- **Connection Resilience**: Automatic reconnection during network issues

## 📱 Mobile-Specific Features

### **Mobile Optimization**
- **Touch Targets**: All buttons sized for easy finger tapping
- **Responsive Design**: Interface adapts to phone/tablet screens
- **Keyboard Handling**: Message input stays visible while typing
- **Camera Integration**: Built-in QR code scanning via camera
- **Network Switching**: Handles WiFi ↔ cellular transitions

### **Mobile Best Practices**
```markdown
✅ Enable camera permissions for QR scanning
✅ Keep app open in browser tab for notifications
✅ Use landscape mode for better typing experience
✅ Add to home screen for app-like experience
✅ Ensure stable network connection for best performance
```

### **Battery & Performance**
- **Efficient Polling**: Minimal battery drain on mobile
- **Background Mode**: Receives messages when tab backgrounded
- **Low Data Usage**: <10KB per message (very lightweight)
- **Offline Resilience**: Messages queue and send when reconnected

## 🎪 Festival-Specific Use Cases

### **Music Festival Scenarios**

**Mainstage Coordination:**
```markdown
Scenario: Coachella Mainstage VIP
1. VIP host creates "Coachella Mainstage VIP"
2. Room code: "purple-stage-42"
3. Share code at VIP entrance
4. Guests coordinate meetups, share photos, discuss sets
5. Messages persist throughout festival weekend
```

**Artist/Crew Communication:**
```markdown
Scenario: Artist Backstage Coordination
1. Stage manager creates "Backstage Crew - Main"
2. QR code posted in backstage area
3. Crew scans to join communication channel
4. Real-time coordination during set changes
5. Emergency notifications reach everyone instantly
```

**Friend Group Coordination:**
```markdown
Scenario: Festival Friend Group
1. Group leader creates "Sarah's Festival Squad"
2. Shares "bright-squad-25" in group text
3. Friends join throughout arrival day
4. Coordinate meetup spots, food runs, set times
5. Stay connected across festival grounds
```

### **Conference/Event Scenarios**

**Session Q&A:**
```markdown
Scenario: TechCrunch Panel Discussion
1. Moderator creates "AI Panel Q&A"
2. QR code displayed on presentation screen
3. Audience scans to join discussion
4. Real-time questions during presentation
5. Networking continues after session
```

**Workshop Groups:**
```markdown
Scenario: Design Workshop Breakout
1. Facilitator creates "Design Workshop - Group A"
2. Shares room code "creative-lab-88"
3. Workshop participants join for collaboration
4. Share ideas, links, and feedback
5. Continue discussion post-workshop
```

## 🔧 Advanced Features

### **Multi-Room Management**
- **Recent Rooms**: Quick access to previously joined conversations
- **Room Switching**: Easy navigation between active conversations
- **Room History**: Messages preserved across sessions
- **Room Discovery**: Find and rejoin rooms you've been in before

### **Connection Management**
- **Auto-Reconnection**: Handles network drops gracefully
- **Connection Status**: Clear indicators of connection health
- **Offline Mode**: Messages queue when disconnected
- **Network Diagnostics**: Built-in tools for troubleshooting

### **Privacy & Security**
- **Anonymous Usage**: No accounts, emails, or personal data required
- **Temporary Storage**: Messages automatically deleted after 24 hours
- **Local Network**: Development mode works without internet
- **Secure Connections**: HTTPS/WSS encryption in production

## 🎯 Tips for Best Experience

### **Room Naming Best Practices**
```markdown
✅ GOOD Room Names:
- "Mainstage VIP Lounge" (descriptive, specific)
- "TechCrunch AI Panel" (event + topic)
- "Sarah's Wedding Party" (personal + occasion)

❌ AVOID:
- "Chat" (too generic)
- "Room1" (not descriptive)
- "asdfghjkl" (not memorable)
```

### **Sharing Room Codes Effectively**
```markdown
✅ EFFECTIVE Sharing:
- "Join 'bright-stage-42' on Festival Chat"
- Include full context and platform name
- Verify room code spelling when sharing
- Use QR codes for groups of 5+ people

❌ INEFFECTIVE:
- "Join bright stage 42" (missing hyphens)
- Just the code without context
- Sharing complex URLs instead of codes
```

### **Managing Multiple Conversations**
```markdown
✅ ORGANIZATION Tips:
- Use descriptive room names
- Join only rooms you actively need
- Clear recent rooms periodically
- Use room codes that match the event/purpose
```

## 🛠️ Troubleshooting Common Issues

### **"Room Not Found" Error**
```markdown
Problem: "Room code not found" message
Solutions:
1. Double-check room code spelling (include hyphens)
2. Verify room code is still active (24h limit)
3. Ask room creator to share code again
4. Try scanning QR code instead of manual entry
```

### **"Connection Failed" Error**
```markdown
Problem: Can't connect to chat server
Solutions:
1. Check internet connection (WiFi/cellular)
2. Refresh the page and try again
3. Try different network (WiFi → cellular)
4. Clear browser cache and reload
```

### **Messages Not Appearing**
```markdown
Problem: Messages don't show up in real-time
Solutions:
1. Check "Connected" status indicator
2. Refresh page to force reconnection
3. Verify you're in the correct room
4. Wait 10-15 seconds for automatic retry
```

### **QR Code Scanning Issues**
```markdown
Problem: QR code scanner doesn't work
Solutions:
1. Allow camera permissions in browser
2. Ensure good lighting on QR code
3. Try manual room code entry instead
4. Use different browser if camera blocked
```

### **Mobile Performance Issues**
```markdown
Problem: Slow or laggy on mobile
Solutions:
1. Close other browser tabs
2. Connect to stronger WiFi signal
3. Switch to cellular if WiFi poor
4. Restart browser app completely
```

## 📊 Understanding Room Limits

### **Technical Limits**
- **Users per Room**: 50+ concurrent users supported
- **Message History**: 100 most recent messages stored
- **Room Lifespan**: 24 hours of automatic persistence
- **Message Length**: 1000 characters maximum per message
- **File Sharing**: Text only (no file uploads currently)

### **Performance Guidelines**
```markdown
Optimal Experience:
- 5-15 people per room (most responsive)
- Avoid message spam (respect others)
- Use descriptive room names for organization
- Share room codes responsibly

Acceptable Experience:
- 15-30 people per room (still very good)
- Occasional message delays during peak usage
- May need refresh if connection drops

Heavy Usage:
- 30-50+ people per room (functional but slower)
- More frequent reconnections needed
- Consider splitting into multiple rooms
```

## 🎉 Getting the Most Out of Festival Chat

### **Social Features**
- **Group Coordination**: Perfect for festival squads, conference attendees
- **Event Integration**: Use for Q&A, feedback, coordination
- **Networking**: Connect with like-minded people at events
- **Real-time Updates**: Share live updates from different areas

### **Creative Uses**
```markdown
🎪 Festival Ideas:
- VIP area exclusive chats
- Artist meet-and-greet coordination
- Food truck location sharing
- Lost & found coordination
- After-party planning

📚 Conference Ideas:
- Session Q&A and discussion
- Workshop collaboration
- Networking icebreakers
- Speaker feedback
- Resource sharing

🎉 Event Ideas:
- Wedding party coordination
- Birthday party games
- Reunion catch-up chats
- Sports viewing parties
- Community meetups
```

### **Accessibility Features**
- **Large Touch Targets**: Easy to use with gloves or limited dexterity
- **High Contrast**: Dark mode reduces eye strain in various lighting
- **Simple Navigation**: Minimal complexity, intuitive interface
- **Voice Input**: Mobile keyboard voice input supported
- **Screen Reader**: Compatible with accessibility tools

---

## 🚀 Ready to Chat!

**Festival Chat is designed to be:**
- **Instant** - No downloads, accounts, or setup
- **Universal** - Works on any device with a browser
- **Reliable** - Handles network issues gracefully
- **Private** - Anonymous usage, temporary storage
- **Social** - Perfect for events, festivals, and gatherings

**Start chatting in seconds, connect with people around you, and make your next event more interactive and fun!**

*Perfect for festivals, conferences, parties, and anywhere people gather.* 🎪📱

---

**Need Help?** Check the [Troubleshooting Guide](./11-TROUBLESHOOTING.md) or [Quick Start Guide](./01-QUICK-START.md) for more assistance.
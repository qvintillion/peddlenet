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

### **Method 3: Enter Recent Room**

**Return to previous conversations:**
1. Go to Festival Chat website
2. Recent rooms appear as clickable cards
3. Click "Enter" on any recent room to join instantly
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
│  [🎨 Logo] bright-stage-42        │  ← Interactive logo + Room info
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

## ❤️ Favorites System

### **Never Lose Track of Your Rooms**

The Favorites system is Festival Chat's primary feature for managing and quickly accessing your most important chat rooms. It combines room bookmarking with intelligent notification management to keep you connected to your communities.

### **How Favorites Work**

**Adding Rooms to Favorites:**
1. Join any chat room
2. Click the ❤️ button in the chat header
3. Room is instantly added to your favorites
4. Automatic notification subscription enabled
5. ✅ Room appears on homepage favorites section!

**Accessing Favorite Rooms:**
1. Go to Festival Chat homepage
2. Scroll to "Favorites" section
3. See all your favorite rooms as horizontal scrolling cards
4. Click "Enter" on any card to rejoin instantly
5. See notification status at a glance

### **🏠 Homepage Favorites Interface**

**Favorites Cards Layout:**
```
┌─────────────────────────────────────────────────┐
│                   Favorites                     │
│                                        [Clear]  │
├─────────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ │
│ │   [×]   │ │   [×]   │ │   [×]   │ │   [×]   │ │
│ │mainstage│ │backstage│ │vip-lounge│ │afterparty│ │
│ │magic-42 │ │cosmic-88│ │bright-15│ │party-99 │ │
│ │2 hrs ago│ │5 hrs ago│ │1 day ago│ │3 days ago│ │
│ │🔔 On    │ │🔕 Off   │ │🔔 On    │ │🔕 Off   │ │
│ │ [Enter] │ │ [Enter] │ │ [Enter] │ │ [Enter] │ │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘ │
│                Scroll horizontally →            │
└─────────────────────────────────────────────────┘
```

**Card Information:**
- **Room Name**: Full room identifier (e.g., "mainstage-vip")
- **Room Code**: Shareable code for others to join (e.g., "magic-42")
- **Last Activity**: When you last visited this room
- **Notification Status**: Current notification subscription state
- **Remove Button (×)**: Remove from favorites and disable notifications
- **Enter Button**: Rejoin the room instantly

### **🔔 Integrated Notification Management**

**Automatic Notification Subscription:**
```markdown
✅ Add to Favorites → Automatically enables notifications
❌ Remove from Favorites → Automatically disables notifications
⚙️ Room Settings → Can customize notification preferences
🔄 Status Sync → Favorites cards always show current notification state
```

**Notification Status Indicators:**
```markdown
🔔 Green Status:
├─ Green dot indicator
├─ 🔔 Bell icon
├─ "On" text label
└─ You'll receive notifications when away from this room

🔕 Gray Status:
├─ Gray dot indicator
├─ 🔕 Muted bell icon
├─ "Off" text label
└─ No notifications for this room
```

**Managing Notifications per Room:**
1. **From Favorites Card**: Click ❤️ in room to toggle favorite + notifications
2. **From Room Settings**: Use ⚙️ button in chat to customize notification preferences
3. **Bulk Management**: Use "Clear" button to remove all favorites and disable all notifications

### **💡 Smart Features**

#### **Persistent Across Sessions**
- **Survives Browser Refresh**: Favorites persist when you refresh the page
- **Cross-Device Sync**: Favorites stored locally on each device
- **Session Restoration**: Return to favorited rooms even after closing browser
- **Room Code Preservation**: Always shows the correct shareable room code

#### **Intelligent Room Management**
```markdown
🧠 Smart Behaviors:
✅ Most recently visited rooms appear first
✅ Inactive rooms (>7 days) automatically archived
✅ Notification preferences preserved when re-entering rooms
✅ Room codes stay consistent for easy sharing
✅ Real-time status updates across all interface elements
```

#### **Visual Feedback System**
```markdown
🎨 Visual Cues:
🟢 Hover Effect: Cards highlight when you hover (purple border)
⭐ Activity Indicators: Recently active rooms show brighter colors
📅 Time Stamps: Clear "2 hrs ago" / "3 days ago" labels
🔄 Status Sync: Instant updates when notification settings change
```

### **🎪 Festival Use Cases**

#### **Music Festival Coordination**
```markdown
Scenario: Multi-Stage Festival Management
1. Add "Mainstage VIP" to favorites → Auto-notifications ON
2. Add "Backstage Crew" to favorites → Auto-notifications ON
3. Add "Food Truck Squad" to favorites → Auto-notifications ON
4. Homepage shows all 3 rooms with status indicators
5. Quick-switch between conversations via "Enter" buttons
6. Get notified for any room when exploring festival grounds
```

#### **Conference Room Hopping**
```markdown
Scenario: Multi-Track Conference
1. Favorite "AI Panel Q&A" → Notifications ON
2. Favorite "Startup Networking" → Notifications ON
3. Disable notifications for "General Announcements" → Status shows OFF
4. Access all rooms instantly from homepage
5. Stay updated on important discussions while attending sessions
```

#### **Event Production Teams**
```markdown
Scenario: Event Coordination
1. "Production Team" → Always favorited, notifications ON
2. "Security Channel" → Favorited, notifications ON
3. "Vendor Coordination" → Favorited, notifications during setup only
4. Quick access to all channels from central homepage
5. Manage notification noise by room priority
```

### **🛠️ Advanced Management**

#### **Removing Rooms from Favorites**
```markdown
Method 1 - From Favorites Card:
1. Click the × button on any favorites card
2. Confirm removal in popup
3. Room removed + notifications disabled
4. Card disappears from homepage

Method 2 - From Chat Room:
1. Click ❤️ button in chat header (turns from red to white)
2. Room immediately removed from favorites
3. Notifications automatically disabled
4. Homepage updates in real-time

Method 3 - Bulk Clear:
1. Click "Clear" button in favorites section
2. Confirm bulk removal
3. All favorites removed + all notifications disabled
4. Clean slate for new rooms
```

#### **Notification Customization**
```markdown
Per-Room Notification Settings:
1. Enter any favorited room
2. Click ⚙️ (settings) button
3. Customize notification preferences:
   ├─ All messages (default)
   ├─ @mentions only
   ├─ Important messages only
   └─ Completely disabled
4. Settings automatically sync to favorites card
5. Preferences preserved when re-entering room
```

### **📱 Mobile Favorites Experience**

#### **Touch-Optimized Interface**
- **Large Touch Targets**: All buttons sized for easy finger tapping
- **Horizontal Scrolling**: Swipe through favorites cards smoothly
- **Quick Actions**: Large "Enter" buttons for instant room access
- **Visual Status**: Clear notification indicators at a glance

#### **Mobile-Specific Features**
```markdown
📱 Mobile Optimizations:
✅ Swipe to scroll through favorite rooms
✅ Large tap targets for settings and removal
✅ Responsive card sizing for phone screens
✅ Touch-friendly notification toggles
✅ Haptic feedback on button presses (iOS/Android)
```

### **🔧 Technical Details**

#### **Data Storage**
- **Local Storage**: Favorites list stored in browser localStorage
- **Cross-Tab Sync**: Changes sync across multiple browser tabs
- **Room Code Integration**: Connects with room code system for consistency
- **Event System**: Real-time updates between components

#### **Performance Features**
```markdown
⚡ Optimizations:
✅ Memoized rendering (prevents unnecessary re-renders)
✅ Event-driven updates (efficient cross-component communication)
✅ Smart re-ordering (most recent rooms first)
✅ Lazy loading (only load visible room data)
✅ Efficient cleanup (automatic removal of stale rooms)
```

### **💡 Tips for Best Experience**

#### **Effective Favorites Management**
```markdown
✅ BEST PRACTICES:
• Favorite only rooms you actively participate in
• Use notification customization for noisy rooms
• Regularly clean up inactive rooms (use "Clear" button)
• Take advantage of quick "Enter" buttons for room switching
• Let status indicators guide your notification management

❌ AVOID:
• Favoriting every room you visit (creates clutter)
• Ignoring notification status indicators
• Forgetting to remove inactive event rooms
• Manually typing room codes when favorites exist
```

#### **Festival-Specific Tips**
```markdown
🎪 Festival Success:
• Favorite main coordination rooms at event start
• Use notification customization during busy periods
• Quick-switch between VIP, general, and crew channels
• Share room codes from favorites cards (always current)
• Clean up favorites at event end for next festival
```

### **🎯 Why Favorites Matter**

**The Favorites system transforms Festival Chat from a simple messaging app into a **comprehensive festival communication hub**:**

1. **🚀 Instant Access**: No more remembering or searching for room codes
2. **🔔 Smart Notifications**: Automatic subscription management with granular control
3. **📱 Mobile Optimized**: Touch-friendly interface perfect for festival environments
4. **🎪 Event-Focused**: Designed specifically for multi-room festival coordination
5. **💾 Persistent**: Survives app refreshes, browser restarts, and network issues
6. **🔄 Synchronized**: Status indicators always accurate across all interface elements

**Favorites make Festival Chat feel like a native app while maintaining the simplicity of a web-based solution.** 🎪❤️

---

### **Never Miss a Message - ENHANCED 2025**

Festival Chat features a **breakthrough global notification system** that ensures you receive alerts for messages from any subscribed rooms, even when you're not actively viewing the chat. **Recent major improvements** ensure notification preferences are properly respected and synchronized across all interface elements.

### **How Notifications Work**

**Step 1: Enable Notifications (One Time)**
1. Visit the Festival Chat homepage
2. Look for the "Notifications" section
3. Click "🔔 Enable Notifications"
4. Allow browser notifications when prompted
5. ✅ You're now set up for all future rooms!

**Step 2: Subscribe to Rooms (Per Room)**
1. Join any chat room
2. Click the ❤️ button to add to favorites
3. Click the ⚙️ button to open room settings
4. Toggle on "Room notifications"
5. Customize your notification preferences
6. ✅ You'll get notified for this room when away!

### **🆕 Enhanced Status Synchronization (June 2025)**

**Major UI Improvements:**
- **Persistent Preferences**: Notification settings are now properly preserved when re-entering rooms
- **Synchronized Status**: Favorites cards and room settings always show the same notification status
- **Smart Auto-Subscribe**: New rooms auto-enable notifications, but respect your preferences for returning rooms
- **Real-time Updates**: Notification status updates immediately across all interface elements

**How Status Indicators Work:**
```markdown
🏠 Homepage Favorites Cards:
✅ Green dot + 🔔 + "On" = Notifications enabled for this room
⭕ Gray dot + 🔕 + "Off" = Notifications disabled for this room

⚙️ Room Settings Panel:
✅ Toggle ON = Notifications enabled (matches favorites card)
❌ Toggle OFF = Notifications disabled (matches favorites card)
✅ Status always synchronized between both interfaces
```

**Improved User Experience:**
```markdown
✅ BEFORE (Fixed Issues):
❌ Disabling notifications in room settings
❌ Leaving room and returning
❌ Notifications would re-enable automatically
❌ Favorites card and room settings showed different statuses

✅ AFTER (Current Behavior):
✅ Disable notifications in room settings
✅ Leave room and return multiple times
✅ Notifications stay disabled as intended
✅ Favorites card and room settings always match
✅ Your preferences are respected and preserved
```

### **Notification Features**

#### **🌍 Global Scope**
- **Cross-Room Alerts**: Get notified for any subscribed room
- **Homepage Notifications**: Receive alerts even when browsing homepage
- **Multi-Room Management**: Manage notifications for multiple rooms from favorites cards
- **Persistent Subscriptions**: Settings survive page refreshes and app restarts
- **Preference Preservation**: Notification choices are respected when re-entering rooms
- **Synchronized Interface**: Status indicators always match across favorites and room settings

#### **📱 Smart Mobile Detection**
- **Background Detection**: Automatically detects when app is backgrounded
- **Home Button Support**: Triggers when you press phone's home button
- **Tab Switching**: Detects when you switch to other browser tabs
- **Lock Screen**: Works even when phone is locked

#### **⚡ Real-Time Delivery**
- **Instant Alerts**: Notifications appear within seconds of message
- **Rich Content**: Shows sender name and message preview
- **Direct Links**: Tap notification to jump directly to conversation
- **Action Buttons**: "Open Chat" or "Dismiss" options

### **Notification Settings**

#### **Global Settings (Homepage)**
```markdown
🔔 Master Controls:
✅ Enable notifications (master switch)
✅ New messages (get alerts for chat messages)
⚪ User joined (when someone joins room)
⚪ User left (when someone leaves room)
```

#### **Room-Specific Settings (In Chat)**
```markdown
🎪 Per-Room Controls:
✅ Room notifications (subscribe to this room)
✅ All messages (every message triggers notification)
⚪ @mentions only (only when mentioned by name)
⚪ Important only (system messages only)
```

### **Mobile Notification Best Practices**

#### **✅ For Best Results:**
- **Allow Permissions**: Always allow browser notifications when prompted
- **Keep Browser Open**: Leave Festival Chat tab open in browser
- **Stable Connection**: Ensure good WiFi or cellular signal
- **Update Browser**: Use latest version of Chrome/Safari for best support
- **Add to Home Screen**: Consider adding Festival Chat to phone home screen

#### **📱 Mobile-Specific Tips:**
```markdown
iPhone Users:
- Enable "Web App" notifications in Safari settings
- Keep Safari tab active for best notification delivery
- Consider using "Add to Home Screen" for app-like experience

Android Users:
- Chrome provides excellent notification support
- Ensure Festival Chat has notification permissions
- Background tabs receive notifications reliably
```

### **Notification Scenarios**

#### **🎪 Festival Use Cases:**

**VIP Area Coordination:**
```markdown
Scenario: You're subscribed to "Mainstage VIP" room
1. You step away to get food
2. Someone posts "Artist meet & greet in 5 mins!"
3. 🔔 Notification appears on your phone
4. Tap notification → Jump back to VIP chat
5. Join the meet & greet in time!
```

**Multi-Room Management:**
```markdown
Scenario: You're in multiple festival groups
1. Subscribed to: "Main Squad", "VIP Access", "Food Crew"
2. Browsing festival map on homepage
3. 🔔 "Food Crew": "Best tacos at tent #42!"
4. 🔔 "VIP Access": "Backstage tour starting now"
5. Choose which notification to follow!
```

**After-Party Planning:**
```markdown
Scenario: Festival day ends, planning continues
1. Still subscribed to "Festival Squad 2024"
2. At hotel, browsing other apps
3. 🔔 "After party location changed to Hotel Z"
4. Tap notification → Get updated location
5. Don't miss the after-party!
```

### **Troubleshooting Notifications**

#### **Not Receiving Notifications?**
```markdown
Quick Fixes:
1. ✅ Check browser notification permissions
2. ✅ Verify "Enable Notifications" is on (homepage)
3. ✅ Ensure room notifications are enabled (in chat)
4. ✅ Test with "Send Test Notification" button
5. ✅ Try refreshing the page and re-enabling
```

#### **Mobile Not Working?**
```markdown
Mobile Troubleshooting:
1. 🔄 Refresh Festival Chat page
2. 📱 Check phone notification settings
3. 🌐 Ensure good internet connection
4. 🔔 Re-enable notifications from homepage
5. 📋 Test with different browser if needed
```

#### **Too Many Notifications?**
```markdown
Managing Notification Volume:
1. 🎛️ Turn off notifications for inactive rooms
2. ⚙️ Set to "@mentions only" in busy rooms
3. 🔕 Use "Do Not Disturb" during events
4. 🧹 Clean up old room subscriptions regularly
```

### **Privacy & Notifications**

- **Anonymous**: Notifications don't reveal your identity
- **Local Only**: Notification preferences stored on your device
- **Temporary**: Subscriptions auto-expire after 24 hours
- **Secure**: All notifications encrypted via HTTPS
- **No Tracking**: We don't track notification analytics

### **Advanced Notification Features**

#### **🔄 Subscription Management**
```markdown
Favorites Card Status Indicators (Homepage):
✅ Green dot + 🔔 + "On" = Notifications enabled for this room
⭕ Gray dot + 🔕 + "Off" = Notifications disabled for this room
✅ Status reflects current notification subscription state
✅ Click "Enter" to join room with notification preference preserved
✅ Click "×" to remove from favorites and disable notifications

Room Settings Panel (In Chat):
✅ "Room notifications" toggle matches favorites card status
✅ Toggle OFF = Immediately updates favorites card to show "🔕 Off"
✅ Toggle ON = Immediately updates favorites card to show "🔔 On"
✅ Settings persist when leaving and re-entering rooms
✅ Auto-subscribe for new rooms, respect preferences for returning rooms

Advanced Management:
✅ Auto-subscribe when joining rooms for first time
✅ Preserve user preferences for rooms previously visited
✅ Auto-cleanup after 24 hours of inactivity
✅ Restore subscriptions after page refresh
✅ Sync across multiple browser tabs
✅ Real-time status updates across all UI elements
```

#### **⚡ Performance Optimized**
```markdown
Efficiency Features:
✅ Battery-efficient background connection
✅ Minimal data usage for notifications
✅ Smart retry logic for failed deliveries
✅ Multiple fallback notification methods
```

**The notification system ensures you stay connected to your festival community, even when exploring other parts of the event or using other apps!** 🎪📱

---

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
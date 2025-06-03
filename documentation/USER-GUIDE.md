# User Guide

## Welcome to Festival Chat! 🎵

Festival Chat is a peer-to-peer messaging app designed for music festivals and events. Connect with friends and fellow attendees without relying on crowded cellular networks!

## Getting Started

### Creating a Chat Room

1. **Go to the Admin Page**
   - Navigate to `/admin` or click "Create Room" from the homepage
   
2. **Choose a Room Name**
   - Enter a memorable name like "Main Stage Crew" or "Camp Thunder Dome"
   - The app will convert it to a URL-friendly format
   - Example: "Lost & Found Tent" becomes "lost-found-tent"

3. **Generate QR Code**
   - Click the "Generate QR 🎲" button
   - A QR code will appear that others can scan to join

4. **Share the Room**
   - Show the QR code to friends
   - Or copy the room ID to share manually
   - The QR code contains the full URL for easy mobile scanning

5. **Join the Room**
   - Click "Join This Room" to enter the chat
   - You'll be prompted for a display name if you haven't set one

### Joining an Existing Room

#### Method 1: QR Code Scanning
1. Open your phone's camera or QR scanner
2. Point at the QR code
3. Tap the notification to open the chat room
4. Enter your display name
5. Start chatting!

#### Method 2: Direct Link
1. Get the room ID from someone already in the room
2. Go to `/chat/[room-id]` 
3. Enter your display name when prompted
4. Wait for automatic connection (2-5 seconds)

#### Method 3: Manual Connection
1. If auto-connect fails, click "Manual Connect"
2. Ask someone for their Peer ID (shown in the chat header)
3. Enter their Peer ID and click "Connect"
4. You should connect within seconds

## Using the Chat

### Sending Messages
- Type your message in the input field at the bottom
- Press Enter or click "Send" to send
- Your messages appear on the right in blue
- Others' messages appear on the left in white

### Connection Status
- **Green dot** = Connected to peers
- **Red dot** = Not connected
- The header shows how many peers you're connected to

### Sharing the Room
- Click "📱 QR Code" in the header to show the room's QR code
- Anyone can share the room QR at any time
- Great for inviting latecomers!

### Debug Information
- Click "Show Debug" to see technical details
- Shows your Peer ID, connection status, and network info
- Useful for troubleshooting connection issues

## Tips for Best Experience

### At Festivals
1. **Create rooms with descriptive names** - "Blue Tent Row 5" is better than "Our Spot"
2. **Share QR codes in person** - Works great in low-signal areas
3. **Stay in range** - P2P works best when devices are within WiFi range
4. **Use mobile hotspots** - One person can create a hotspot for the group

### Connection Tips
1. **Be patient** - Initial connection takes 2-5 seconds
2. **Stay on HTTPS** - Required for mobile browsers
3. **Keep the app open** - Connections drop if you switch apps
4. **Rejoin if disconnected** - Just scan the QR code again

### Troubleshooting

**"Can't connect to peers"**
- Make sure you're in the same room (exact room ID)
- Check that you're on HTTPS (not HTTP)
- Try manual connection with Peer IDs
- Refresh the page and try again

**"Messages aren't sending"**
- Check the connection indicator (should be green)
- Verify you have at least one connected peer
- Try sending a message again

**"QR code won't scan"**
- Ensure good lighting
- Hold phone steady
- Try moving closer/further from the code
- Manually enter the room URL if needed

## Privacy & Security

### Your Data is Private
- **No servers** - Messages go directly between devices
- **No storage** - Messages exist only in your browser
- **No tracking** - We don't collect any user data
- **No accounts** - No sign-up or personal info required

### Security Features
- All connections are encrypted by WebRTC
- Peer IDs are randomly generated
- Room IDs are unique to your group
- Messages can't be intercepted by others

## Advanced Features

### Room Name Suggestions
- Click the 🎲 button for creative room name ideas
- Names are festival-themed and fun
- Examples: "electric-dome-42", "neon-groove-7"

### Peer Management
- See all discovered peers in the debug panel
- Manually connect to specific peers
- Clear stored peers if having issues

### Multiple Rooms
- You can join different rooms in different tabs
- Each room is completely separate
- Great for organizing different friend groups

## Mobile-Specific Instructions

### iOS (iPhone/iPad)
1. Open Safari (Chrome won't work for cameras)
2. Allow camera permissions when scanning QR codes
3. Add to Home Screen for app-like experience
4. Keep Safari in foreground for best performance

### Android
1. Use Chrome or Firefox
2. Allow camera permissions
3. Add to Home Screen from browser menu
4. Enable "Desktop Site" if having issues

## Festival Scenarios

### Finding Lost Friends
- Create room: "John's Phone Lost and Found"
- Share QR code with security/info booth
- Friends can join and coordinate meetup

### Coordinating Meeting Spots
- Create room: "Food Trucks 3pm"
- Share with your group
- Everyone can check in when they arrive

### Sharing Set Times
- Create room: "Saturday Schedule"
- Post must-see acts and times
- Discuss and plan as a group

## FAQ

**Q: Do I need internet?**
A: Only to initially load the app. Once connected, messages work peer-to-peer.

**Q: How many people can join a room?**
A: Technically up to 10, but 4-6 works best for performance.

**Q: Can I rejoin a room later?**
A: Yes! Just use the same room ID or QR code.

**Q: Are messages saved?**
A: No, messages are only stored temporarily in your browser.

**Q: Can I use this outside festivals?**
A: Absolutely! Great for any gathering where internet is limited.

**Q: Why can't I connect on desktop?**
A: Desktop browsers need HTTPS. Use ngrok for local testing.

## Enjoy the Festival! 🎪✨

Festival Chat is built by the community, for the community. Have fun, stay connected, and enjoy the music!

Need help? Check the [Troubleshooting Guide](TROUBLESHOOTING.md) or open an issue on GitHub.

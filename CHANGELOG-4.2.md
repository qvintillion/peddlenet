# Changelog - Version 4.2-roomdata

## Server-Side Room Metadata & Cross-Platform Sync

### 🎯 Major Changes

**Server (signaling-server.js)**
- Added room metadata storage (in-memory Map)
- New POST `/room/:roomId/metadata` endpoint for storing display names
- New GET `/room/:roomId/metadata` endpoint for retrieving room info
- Version updated to 4.2-roomdata

**Webapp**
- Store room metadata on server when creating rooms (`src/app/page.tsx`)
- Fetch metadata before joining rooms - no more auto-creation (`src/components/RoomCode.tsx`)
- Track room visits for recent rooms list (`src/app/chat/[roomId]/page.tsx`)
- Ensure favorited rooms appear in favorites (`src/components/FavoriteButton.tsx`)
- Show display names in favorite cards (`src/components/JoinedRooms.tsx`)
- Improved QR modal labels (`src/components/QRModal.tsx`)

**Android**
- New `RoomMetadataManager.kt` utility for server metadata operations
- Store metadata when creating rooms (`Navigation.kt`)
- Fetch metadata when joining by code (`Navigation.kt`)

### 🐛 Bugs Fixed

1. **Room auto-creation**: Joining by code no longer creates new rooms automatically
2. **Cross-platform sync**: Display names now sync between webapp and Android
3. **Recent rooms empty**: Fixed tracking when RoomCodeDisplay was removed
4. **Favorites not showing**: Ensured rooms are in recent list when favorited

### 🚀 Deployment

- **Staging Server**: Deployed and tested
- **Production Server**: Deployed and tested (v4.2-roomdata)
- **Status**: ✅ Ready for production

### 📝 Commits

1. Server: add room metadata storage endpoints (v4.2-roomdata)
2. Webapp: store and fetch room metadata from server
3. Android: implement RoomMetadataManager for metadata sync
4. UI: improve room code display and remove incorrect banner
5. Fix: restore recent rooms and favorites tracking
6. UI: show display name in favorite room cards

### ⚠️ Breaking Changes

None - Fully backward compatible

### 📚 Documentation

See `docs/RELEASE-4.2-ROOM-METADATA.md` for complete details

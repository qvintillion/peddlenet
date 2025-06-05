# 📦 Archived Hooks & Components

This folder contains P2P hooks and components that were part of the experimental P2P implementation but are not used in the current production WebSocket-based chat system.

## Archived Hooks

### P2P Connection Hooks
- **`use-p2p-adaptive.ts`** - Adaptive P2P connection management
- **`use-p2p-mobile-optimized.ts`** - Mobile-optimized P2P implementation  
- **`use-p2p-optimized.ts`** - Enhanced P2P with better reliability
- **`use-p2p-stable.ts`** - Stable P2P connection variant
- **`use-signaling-client.ts`** - Signaling server client hook
- **`use-signaling-room-discovery.ts`** - Room peer discovery via signaling

## Why Archived?

These experimental P2P implementations were replaced with a more reliable WebSocket-based approach for the production version. The current implementation uses:

- **Server**: `signaling-server.js` (WebSocket server with message persistence)
- **Client**: `src/hooks/use-websocket-chat.ts` (Direct WebSocket communication)

## Future Roadmap

These P2P hooks may be revisited in v2.0 for:
- **Mesh Network Evolution** - True P2P mesh with intelligent routing
- **Hybrid Implementation** - Combining WebSocket reliability with P2P efficiency
- **Offline Capabilities** - P2P connections that work without server

## Status
- ✅ **Current**: WebSocket chat (reliable, multi-user, persistent)
- 🔮 **Future**: Hybrid P2P + WebSocket mesh network

---
*Archived during project cleanup - June 2025*  
*These may be referenced for future mesh network implementation*

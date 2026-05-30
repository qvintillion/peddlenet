# Changelog - Version 4.3-relay-sender

## Relayed-Sender Attribution for the BLE → WebSocket Bridge

### 🎯 Major Changes

**Server (signaling-server.js)**
- `chat-message` handler now honors an explicit `message.sender` when the
  payload carries `relayed: true`. Previously the server always stamped the
  message with the sending socket's own display name, so a message that an
  Android device relayed on behalf of a BLE-only peer was attributed to the
  bridge node instead of the real author.
- Broadcast payload now includes `relayed` (boolean) and `relayedBy` (the
  bridge node's display name) for observability.
- Non-relayed messages are unchanged: they still derive the sender from the
  socket identity.
- Version bumped to `4.3-relay-sender` (reported at `GET /health`).

**Deploy script (scripts/deploy-websocket-cloudbuild.sh)**
- Banner, feature list, and version markers updated to `4.3-relay-sender`.

### 🐛 Problem Fixed

In a hybrid 3-device test (a5 = BLE-only, nord = bridge on cell data,
emulator = WebSocket-only), a5's messages reached the emulator but appeared
to come from **nord**. Root cause: the WebSocket server is sender-authoritative
and the relayed sender was being discarded. With this change the message is
correctly attributed to **a5**.

### 🔁 Loop Safety

The echoed broadcast returns with the same stable `id` (`a5-<timestamp>`), so
every client — including the bridge node — drops it via existing id-based
deduplication. No new loop risk.

### 🚀 Deployment

- **Production Server**: Deployed via `./scripts/deploy-websocket-cloudbuild.sh`
- **Verify**: `curl -s https://peddlenet-websocket-server-hfttiarlja-uc.a.run.app/health`
  → expect `"version":"4.3-relay-sender"`

### ⚠️ Breaking Changes

None — fully backward compatible. A client that does not set `relayed` behaves
exactly as before, and an older server that ignores the field degrades
gracefully (attributes to the bridge node, i.e. pre-4.3 behavior).

### 🔗 Paired Android Change

Requires PeddleNet Android Phase 10.3 (`WebSocketManager.relayMessage()` +
`MessageRepository` BLE→WebSocket bridge). See the Android repo's
`docs/implementation/PHASE_10_3_RELIABILITY_COMPLETE.md`.

# Changelog - Versions 4.3.1 & 4.3.2

## Durable, Cross-Platform Room Names

These two releases make a room's friendly display name survive Cloud Run cold
starts and reach every client — including web/WS-only users and rooms created on
a BLE-only Android device.

---

## 4.3.1-metadata-durable — Repopulate-on-join

### 🎯 Changes

**Server (signaling-server.js)**
- `join-room` now accepts an optional `roomDisplayName`. If the server has no
  metadata for the room (e.g. wiped on a scale-to-zero cold start) and a joining
  client supplies the name, the server repopulates `roomMetadata`
  (`restoredOnJoin: true`). Existing metadata is never overwritten; only its
  `lastActivity` is refreshed.
- Version reported at `GET /health` → `4.3.1-metadata-durable`.

**Web client**
- `use-websocket-chat.ts` includes the locally cached room name
  (`localStorage 'room:{roomId}:name'`) as `roomDisplayName` on `join-room`.
- `RoomCode.tsx`: a 404 from the metadata lookup (routine after a cold start) no
  longer blocks joining — a valid-format code maps deterministically to a room
  ID, so the client joins anyway.

### 🐛 Problem Fixed

Room metadata lives in an in-memory `Map` that Cloud Run wipes when it scales to
zero. After a cold start, joining by code returned a 404 and either showed the
prettified code or (previously) blocked the join entirely.

---

## 4.3.2-name-on-join — Server returns the name on join

### 🎯 Changes

**Server (signaling-server.js)**
- `room-joined` payload now includes `roomDisplayName` (from `roomMetadata` when
  known) so a client that joined by code/QR — and never cached the name — can
  display and persist the real name instead of the code.
- Version reported at `GET /health` → `4.3.2-name-on-join`.

**Web client**
- `use-websocket-chat.ts` listens for `room-joined`, persists `roomDisplayName`
  to `localStorage`, and exposes a reactive `roomName`.
- `app/chat/[roomId]/page.tsx` resolves `serverRoomName || cachedName` and passes
  it to both the room title, the `ChatRoomSwitcher` dropdown (new `currentRoomName`
  prop), and the `QRModal` "Invite Others" popup.

### 🐛 Problem Fixed

The room title, switcher dropdown, and QR popup read the name only from
`localStorage`, which is empty for anyone who didn't create the room — so they
always showed the prettified code. They now show the authoritative name the
server returns on join.

---

## 🚀 Deployment

- **Production Server**: `./scripts/deploy-websocket-cloudbuild.sh`
- **Verify**: `curl -s https://peddlenet-websocket-server-hfttiarlja-uc.a.run.app/health`
  → expect `"version":"4.3.2-name-on-join"`
- **Web**: `git push origin main` (Vercel auto-deploys).

## ⚠️ Breaking Changes

None. Clients that omit `roomDisplayName` behave as before; an older server that
ignores it degrades to showing the prettified code.

## 🔗 Paired Android Change

PeddleNet Android Phase 10.4 carries the room name across the BLE mesh and
forwards it to the server from a bridge node, so a name set on a BLE-only creator
reaches web/WS-only clients. See the Android repo's
`docs/implementation/PHASE_10_4_ROOM_NAME_PROPAGATION.md`.

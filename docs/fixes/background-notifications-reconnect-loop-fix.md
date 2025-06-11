# Background Notifications Reconnect Loop Fix

## Problem
The festival chat app was experiencing a connection rate limit error causing an infinite reconnect loop when:
- Notifications were disabled for a room
- The room was in the user's favorites
- User entered the room

## Root Cause
1. **Multiple simultaneous connections**: Both WebSocket chat and background notifications were connecting at the same time
2. **Aggressive reconnection**: The background notification manager was making unlimited reconnection attempts without proper backoff
3. **No rate limit handling**: When hitting server rate limits, the app would immediately retry causing a loop
4. **Unnecessary connections**: Background notifications were connecting even when no notifications were enabled

## Solution Implemented

### 1. Rate Limiting & Backoff
- Added connection attempt tracking with max retries (5 attempts)
- Implemented exponential backoff with jitter (2s → 4s → 8s → 16s → 30s max)
- Added rate limit detection to prevent immediate retries

### 2. Smart Connection Management
- Only connect when there are active subscriptions (`subscribed: true`)
- Prevent duplicate connection attempts with `isConnecting` flag
- Automatically disconnect when no active subscriptions remain
- Reset connection attempts on successful connection

### 3. Connection State Validation
- Added `shouldAttemptConnection()` method to validate before connecting:
  - Check rate limit status
  - Verify not already connecting/connected
  - Ensure active subscriptions exist
- Improved error handling for rate limit vs other errors

### 4. Reconnection Logic
- Manual reconnection control (disabled automatic Socket.IO reconnection)
- Scheduled reconnection with proper delays
- Only reconnect for valid disconnection reasons (not rate limits)
- Clear timers on successful connection or cleanup

### 5. Subscription State Management
- Preserve user preferences for disabled notifications
- Don't auto-connect for rooms with `subscribed: false`
- Better distinction between "never subscribed" vs "explicitly disabled"

## Key Changes Made

### Before (Problematic):
```typescript
this.socket.on('disconnect', (reason) => {
  // Auto-reconnect after delay
  this.reconnectTimer = setTimeout(() => {
    this.connect(); // Immediate retry without checks
  }, 5000);
});
```

### After (Fixed):
```typescript
this.socket.on('disconnect', (reason) => {
  // Only auto-reconnect for non-rate-limit errors and if we have active subscriptions
  if (reason !== 'io client disconnect' && !reason.includes('rate limit')) {
    this.scheduleReconnection(); // Smart reconnection with backoff
  }
});
```

## Files Modified
- `src/hooks/use-background-notifications.ts` - Complete rewrite with rate limiting and smart connection management

## Testing
To test the fix:
1. Add a room to favorites
2. Disable notifications for that room  
3. Enter the room
4. Check console - should see "No active subscriptions - skipping connection" instead of connection loop
5. Re-enable notifications - should connect successfully without rate limiting

## Prevention
- Background connections now only occur when needed
- Rate limiting prevents server overload
- Exponential backoff prevents rapid-fire reconnection attempts
- Better state management prevents unnecessary connection attempts

This fix eliminates the reconnection loop while maintaining proper notification functionality when enabled.

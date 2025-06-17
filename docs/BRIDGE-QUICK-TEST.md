# 🧪 Quick Bridging Test

## Test if bridging system is working properly

### Step 1: Check if bridge monitoring is active
```javascript
window.HybridChatDebug.getBridgeStatus()
// Should return object with networkCondition, bridgeStats, etc.
```

### Step 2: Simulate poor network conditions
```javascript
window.HybridChatDebug.simulatePoorNetwork()
// Should return: "Poor network simulation activated - bridging should engage"
```

### Step 3: Check if bridging is now enabled
```javascript
window.HybridChatDebug.getBridgeStatus().bridgeEnabled
// Should return: true (bridging activated due to poor network)
```

### Step 4: Test bridge message queuing
```javascript
window.HybridChatDebug.testBridging("Test bridge message!")
// Should return: "Bridging test message queued with ID: [message-id]"
```

### Step 5: Check queue status
```javascript
window.HybridChatDebug.getBridgeStatus().queuedMessages
// Should show: 1 (or more if you ran test multiple times)
```

### Step 6: Force route failure to trigger bridging
```javascript
// First make sure you have poor network simulation active
window.HybridChatDebug.simulatePoorNetwork()

// Now try to send a regular message - should trigger bridging fallback
// Type in chat: "This should trigger bridging!"
// Check console for: "🌉 [BRIDGE FALLBACK] Both routes failed, activating message bridging..."
```

### Step 7: Recovery test
```javascript
window.HybridChatDebug.simulateNetworkRecovery()
// Should return: "Network recovery simulation activated"

window.HybridChatDebug.getBridgeStatus().bridgeEnabled
// Should return: false (bridging deactivated due to good network)
```

## ✅ Expected Results

- ✅ Bridge monitoring should be active
- ✅ Poor network simulation should enable bridging
- ✅ Test messages should queue properly  
- ✅ Route failures should trigger bridging fallback
- ✅ Network recovery should disable bridging
- ✅ No infinite loops or errors

## 🚨 If Tests Fail

Check console for error messages and verify:
1. `window.MessageBridgeDebug` is available
2. `window.HybridChatDebug.getBridgeStatus()` returns valid data
3. No "Maximum update depth" errors
4. WebSocket/WebRTC connections are working normally

# HTTPS Development Setup

## The Problem
PeerJS requires HTTPS connections to work with modern signaling servers. When using `http://localhost:3000`, PeerJS cannot connect to secure WebSocket servers.

## Solutions

### Option 1: Use ngrok for Desktop Testing (Recommended)
```bash
# Start your dev server
npm run dev

# In another terminal, start ngrok
ngrok http 3000

# Use the HTTPS URL for BOTH desktop and mobile:
# Desktop: https://abc123.ngrok.io/admin
# Mobile: https://abc123.ngrok.io (scan QR)
```

### Option 2: Local HTTPS with mkcert
```bash
# Install mkcert (one-time setup)
# macOS:
brew install mkcert
# or download from: https://github.com/FiloSottile/mkcert/releases

# Create local certificate authority
mkcert -install

# Generate certificates for localhost
mkcert localhost 127.0.0.1 ::1

# This creates:
# localhost+2.pem (certificate)
# localhost+2-key.pem (private key)
```

Then update your Next.js to use HTTPS:

**Create `server.js`:**
```javascript
const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const httpsOptions = {
  key: fs.readFileSync('./localhost+2-key.pem'),
  cert: fs.readFileSync('./localhost+2.pem'),
};

app.prepare().then(() => {
  createServer(httpsOptions, (req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(3000, (err) => {
    if (err) throw err;
    console.log('> Ready on https://localhost:3000');
  });
});
```

**Update package.json:**
```json
{
  "scripts": {
    "dev": "node server.js",
    "dev:http": "next dev"
  }
}
```

### Option 3: Use local-ssl-proxy (Simplest)
```bash
# Install local-ssl-proxy globally
npm install -g local-ssl-proxy

# Start your regular dev server
npm run dev

# In another terminal, create HTTPS proxy
local-ssl-proxy --source 3001 --target 3000

# Now use: https://localhost:3001
```

## Current Working Configuration

Based on your test results, use this configuration for reliable P2P connections:

```typescript
// This configuration works on HTTPS
const workingPeerConfig = {
  debug: 2,
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' }
    ]
  }
};
```

## Testing Recommendations

1. **For Development**: Use ngrok for both desktop and mobile
2. **For Production**: Deploy to Vercel/Netlify (automatic HTTPS)
3. **For Local HTTPS**: Use mkcert or local-ssl-proxy

## Verification Steps

After setting up HTTPS for desktop:

1. **Desktop**: Go to `https://localhost:3000/peertest` or `https://abc123.ngrok.io/peertest`
2. **Run Simple Test**: Should now pass ✅
3. **Both devices on HTTPS**: Can now connect to each other
4. **Test main app**: QR code flow should work between devices

The key insight is that **both devices must use HTTPS** for PeerJS to work reliably.

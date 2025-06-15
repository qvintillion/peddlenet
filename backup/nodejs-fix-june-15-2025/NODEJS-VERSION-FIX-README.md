# Node.js Version Fix - June 15, 2025

## 🚨 Issue
- Firebase Functions was set to `nodejs18` but the app was built with Node.js 20
- This caused API routes to fail with 500 errors, preventing UI changes from syncing to staging
- Room code registration API failing: `POST /api/register-room-code` → 500 error

## ✅ Fix Applied
1. **Updated firebase.json**: `"runtime": "nodejs18"` → `"runtime": "nodejs20"`
2. **Confirmed functions/package.json**: `"node": "20"` (already correct)
3. **Ready for Firebase complete deployment**

## 🔄 Next Steps
```bash
# Deploy with Node.js 20 support
npm run deploy:firebase:complete
```

## 📊 Expected Result
- Room code registration API will work: `POST /api/register-room-code` → 200 OK
- UI changes will sync properly to staging
- All Firebase Functions will run with Node.js 20 as intended

## 🔧 Root Cause
The mismatch occurred because:
- Development used Node.js 20 for months
- Firebase was accidentally downgraded to 18 (likely during a previous deployment fix)
- Functions built with Node.js 20 syntax couldn't run on Node.js 18 runtime

This fix restores consistency between build and runtime environments.

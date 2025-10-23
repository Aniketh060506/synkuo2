# CopyDock Desktop App + Chrome Extension Setup Guide

## 📦 What You Have

1. **Desktop App (Electron)** - Bundles React frontend + FastAPI backend
2. **Chrome Extension** - Connects to desktop app via Native Messaging
3. **localStorage Storage** - No database required!

---

## 🚀 Quick Start (Development)

### Step 1: Start Desktop App

```bash
cd /app/electron
npm install  # or yarn install
npm start
```

This will:
- Start FastAPI backend on port 8001
- Open Electron window with React app
- Start Native Messaging host for Chrome extension

### Step 2: Load Chrome Extension

1. Open Chrome: `chrome://extensions/`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select folder: `/app/chrome-extension/`
5. Note the **Extension ID** (e.g., `abcdefghijklmnopqrstuvwxyz123456`)

### Step 3: Register Native Messaging Host

The extension needs to know where your desktop app's native messaging host is located.

#### On Linux/Mac:

```bash
# Create directory
mkdir -p ~/.config/google-chrome/NativeMessagingHosts/

# Create manifest file
cat > ~/.config/google-chrome/NativeMessagingHosts/com.copydock.app.json << EOF
{
  "name": "com.copydock.app",
  "description": "CopyDock Desktop App",
  "path": "/app/electron/native-messaging-host.js",
  "type": "stdio",
  "allowed_origins": [
    "chrome-extension://YOUR_EXTENSION_ID_HERE/"
  ]
}
EOF

# Replace YOUR_EXTENSION_ID_HERE with actual extension ID
sed -i 's/YOUR_EXTENSION_ID_HERE/ACTUAL_EXTENSION_ID/' ~/.config/google-chrome/NativeMessagingHosts/com.copydock.app.json

# Make host executable
chmod +x /app/electron/native-messaging-host.js
```

#### On Windows:

```powershell
# Create manifest file
$manifestPath = "$env:APPDATA\..\Local\Google\Chrome\User Data\NativeMessagingHosts"
New-Item -ItemType Directory -Force -Path $manifestPath

$manifest = @"
{
  "name": "com.copydock.app",
  "description": "CopyDock Desktop App",
  "path": "C:\\path\\to\\app\\electron\\native-messaging-host.js",
  "type": "stdio",
  "allowed_origins": [
    "chrome-extension://YOUR_EXTENSION_ID_HERE/"
  ]
}
"@

$manifest | Out-File -FilePath "$manifestPath\com.copydock.app.json" -Encoding ASCII

# Add registry key
New-Item -Path "HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.copydock.app" -Force
Set-ItemProperty -Path "HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.copydock.app" -Name "(Default)" -Value "$manifestPath\com.copydock.app.json"
```

### Step 4: Test Everything

1. **Open Desktop App** (Electron window should be visible)
2. **Open Chrome Extension Popup**:
   - Should show: "Connected ✅"
   - Should show: "Target: Web Captures" (or your set notebook)
3. **Go to any webpage** (e.g., Wikipedia)
4. **Select some text**
5. **Click the floating "Send to [Notebook]" button**
6. **Check Desktop App** - content should appear!

---

## 🛠️ Setting Target Notebook

### Option 1: Via Desktop App Settings

1. Open Desktop App
2. Go to Settings (add Settings component)
3. Select target notebook from dropdown
4. Extension updates automatically within 10 seconds

### Option 2: Via Backend API

```bash
curl -X POST http://localhost:8001/api/settings/target-notebook \
  -H "Content-Type: application/json" \
  -d '{
    "notebookId": "my-work-notes",
    "notebookName": "Work Notes"
  }'
```

Extension will show "Send to Work Notes" after refresh.

---

## 💻 Building for Production

### Build Desktop App

```bash
cd /app/electron

# Build for your platform
npm run build           # Current platform
npm run build:win       # Windows .exe
npm run build:mac       # macOS .dmg
npm run build:linux     # Linux .AppImage
```

Output: `/app/electron/dist/`

### Package Chrome Extension

```bash
cd /app/chrome-extension
zip -r copydock-extension.zip * -x "*.md" "*.html" "create-icons.js"
```

Upload `copydock-extension.zip` to Chrome Web Store.

---

## ⚙️ How It Works

### Architecture

```
┌──────────────────────────────────┐
│   ELECTRON DESKTOP APP         │
│                                  │
│  React (port 3000)              │
│  FastAPI (port 8001)            │
│  localStorage (~/.copydock/)    │
│  Native Messaging Host          │
└─────────────────┬────────────────┘
                 │
                 │ Native Messaging
                 │ (STDIN/STDOUT)
                 │
┌────────────────┴────────────────┐
│   CHROME EXTENSION            │
│                                  │
│  background.js (connects)       │
│  content.js (floating button)   │
│  popup.js (status display)      │
└──────────────────────────────────┘
```

### Message Flow

1. **Extension → Desktop**: `PING` (check if connected)
2. **Desktop → Extension**: `PONG` (yes, connected!)
3. **Extension → Desktop**: `GET_TARGET_NOTEBOOK`
4. **Desktop → Extension**: `TARGET_NOTEBOOK_RESPONSE` (name: "Work Notes")
5. **User selects text on webpage**
6. **Extension shows**: "Send to Work Notes"
7. **User clicks button**
8. **Extension → Desktop**: `CAPTURE_CONTENT` (text + HTML)
9. **Desktop saves to localStorage**
10. **Desktop → Extension**: `CAPTURE_SUCCESS`
11. **Extension shows**: "✅ Saved to Work Notes"

---

## 🐛 Troubleshooting

### Extension shows "Disconnected"

**Cause**: Desktop app not running or Native Messaging not registered.

**Fix**:
1. Start desktop app: `cd /app/electron && npm start`
2. Check native messaging manifest exists:
   ```bash
   ls ~/.config/google-chrome/NativeMessagingHosts/com.copydock.app.json
   ```
3. Check extension ID matches in manifest
4. Check Chrome logs: `chrome://extensions` → Extension → Inspect views → Service Worker

### Backend not starting

**Cause**: Python not in PATH or port 8001 already in use.

**Fix**:
```bash
# Check if port is in use
lsof -i :8001

# Kill process if needed
kill -9 <PID>

# Start backend manually for debugging
cd /app/backend
python3 server.py
```

### Captures not saving

**Cause**: Backend API error or storage file permissions.

**Fix**:
```bash
# Check storage file
cat ~/.copydock/storage.json

# Check backend logs
tail -f /tmp/backend_uvicorn.log

# Test API manually
curl -X POST http://localhost:8001/api/web-capture \
  -H "Content-Type: application/json" \
  -d '{
    "selectedText": "test",
    "selectedHTML": "<p>test</p>",
    "sourceDomain": "test.com",
    "sourceUrl": "https://test.com",
    "timestamp": "2025-01-20T10:00:00Z"
  }'
```

### Native Messaging Host Logs

Check native messaging host output:
```bash
# The host writes to stderr
# Check Electron console output when starting:
cd /app/electron
NODE_ENV=development npm start

# Look for lines starting with [NATIVE]
```

---

## 📚 Additional Resources

- **Chrome Native Messaging Docs**: https://developer.chrome.com/docs/apps/nativeMessaging/
- **Electron Docs**: https://www.electronjs.org/docs/latest/
- **FastAPI Docs**: https://fastapi.tiangolo.com/

---

## ✅ Checklist

- [ ] Electron app starts successfully
- [ ] Backend responds at http://localhost:8001/api/health
- [ ] Chrome extension loaded
- [ ] Extension ID copied
- [ ] Native messaging manifest created with correct extension ID
- [ ] Extension shows "Connected ✅"
- [ ] Extension shows target notebook name
- [ ] Text selection shows floating button
- [ ] Capture saves to desktop app
- [ ] Toast notification appears

---

**You're all set! 🎉**

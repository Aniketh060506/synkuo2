# 🎯 CopyDock Chrome Extension - Complete Setup Guide

A powerful Chrome extension that captures web content and sends it directly to your CopyDock application.

## ✨ Features

- **📋 Floating Selection Button** - Appears when you select text on any webpage
- **⌨️ Keyboard Shortcut** - `Ctrl+Shift+C` (Windows/Linux) or `Cmd+Shift+C` (Mac)
- **🎨 Beautiful UI** - Modern design with smooth animations
- **✅ Success Notifications** - Toast messages showing capture status
- **🔄 Auto-Sync** - Content automatically saved to CopyDock backend
- **📊 Connection Monitor** - Real-time status indicator in popup

## 📦 Installation Steps

### Step 1: Open Chrome Extensions Page
1. Navigate to `chrome://extensions/` in Chrome
2. Enable **Developer mode** (toggle in top-right corner)

### Step 2: Load the Extension
1. Click **"Load unpacked"**
2. Navigate to `/app/chrome-extension/` folder
3. Click **"Select Folder"**

### Step 3: Verify Installation
✅ "CopyDock Web Clipper" appears in extensions list
✅ Extension icon (📋) visible in browser toolbar

## 🚀 How to Use

### Method 1: Floating Button
1. Select text on any webpage
2. Click the "📋 Send to CopyDock" button that appears
3. Success! Toast notification shows: "✅ Saved to Web Captures"

### Method 2: Keyboard Shortcut
1. Select text on any webpage
2. Press `Ctrl+Shift+C` (Windows/Linux) or `Cmd+Shift+C` (Mac)
3. Done! Content captured instantly

### Method 3: Context Menu
1. Select text and right-click
2. Choose "Send to CopyDock"

## 🔧 Technical Details

### Backend API Endpoint
- **URL:** `http://localhost:3000/api/web-capture`
- **Method:** POST
- **Data:** Selected text, HTML, source URL, timestamp

### Captured Data Structure
```json
{
  "selectedText": "Plain text content",
  "selectedHTML": "<p>Formatted HTML</p>",
  "sourceDomain": "example.com",
  "sourceUrl": "https://example.com/page",
  "targetNotebookId": "default",
  "timestamp": "2025-01-20T10:30:00Z"
}
```

### Files Included
```
chrome-extension/
├── manifest.json      # Extension config
├── background.js      # Backend communication
├── content.js         # UI & selection handling
├── content.css        # Styles
├── popup.html         # Extension popup
├── popup.js           # Popup logic
├── icon16.png         # 16x16 icon
├── icon48.png         # 48x48 icon
└── icon128.png        # 128x128 icon
```

## 🐛 Troubleshooting

### Extension Won't Load
- **Check:** All icon files (icon16.png, icon48.png, icon128.png) exist
- **Check:** manifest.json has no syntax errors

### Connection Issues
- **Check:** CopyDock backend is running (port 8001)
- **Check:** Frontend is running (port 3000)
- **Test:** Open extension popup to see connection status

### Captures Not Saving
1. Open DevTools Console (F12) on webpage
2. Click extension icon → "Service Worker" link
3. Check console for errors
4. Verify backend logs:
   ```bash
   tail -f /var/log/supervisor/backend.*.log
   ```

## 📋 View Captured Content

### In Frontend
- Captured content is sent to backend API
- Backend stores in MongoDB `web_captures` collection

### Via API
```bash
curl http://localhost:3000/api/web-captures
```

## 🎨 Customization

### Change API URL
Edit `background.js`, line 3:
```javascript
const API_URL = 'https://your-api-url.com/api';
```

### Customize Colors
Edit `content.css` to modify button and toast colors.

### Keyboard Shortcuts
Go to `chrome://extensions/shortcuts` to customize key combinations.

## ✅ Test the Extension

1. Click extension icon (📋) in toolbar
2. Click "Test Capture" button
3. Should show: "✅ Test Successful!"

---

**Version:** 1.0.0 | **Made with ❤️ for CopyDock**

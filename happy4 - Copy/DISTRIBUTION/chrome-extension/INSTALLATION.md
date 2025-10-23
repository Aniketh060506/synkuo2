# 🚀 CopyDock Chrome Extension - Quick Installation

## ✅ Step-by-Step Installation (2 Minutes)

### 📋 Step 1: Download the Extension Folder
The extension is ready at: `/app/chrome-extension/`

**All files are included:**
- ✅ manifest.json
- ✅ background.js  
- ✅ content.js
- ✅ content.css
- ✅ popup.html & popup.js
- ✅ icon16.png, icon48.png, icon128.png

### 🌐 Step 2: Open Chrome Extensions

1. Open Google Chrome
2. Type in address bar: `chrome://extensions/`
3. Press Enter

### 🔧 Step 3: Enable Developer Mode

Look at the **top-right corner** of the page:
- Find the toggle switch labeled **"Developer mode"**
- Click to enable it (should turn blue/on)

### 📂 Step 4: Load the Extension

1. Click the **"Load unpacked"** button (top-left area)
2. Navigate to `/app/chrome-extension/` folder on your computer
3. Click **"Select Folder"** or **"Open"**

### ✅ Step 5: Verify Installation

You should see:
- **"CopyDock Web Clipper"** card in your extensions list
- Status: No errors shown
- **📋 Icon** appears in your Chrome toolbar (top-right)

### 📌 Step 6: Pin the Extension (Optional)

1. Click the **puzzle icon (🧩)** in Chrome toolbar
2. Find **"CopyDock Web Clipper"**
3. Click the **pin icon** to keep it visible

---

## 🎯 How to Use

### Try It Now! (30 Seconds)

1. **Go to any website** (try Wikipedia)
2. **Select some text** with your mouse
3. **Look for the floating button:** "📋 Send to CopyDock"
4. **Click it!**
5. **Success!** You'll see: "✅ Saved to Web Captures"

### Or Use Keyboard Shortcut

- **Windows/Linux:** `Ctrl + Shift + C`
- **Mac:** `Cmd + Shift + C`

---

## 🔍 Check if It's Working

### Method 1: Extension Popup
1. Click the **📋 icon** in Chrome toolbar
2. Check status:
   - **Connected ✅** = Working perfectly!
   - **Disconnected ❌** = Backend not running
3. Click **"Test Capture"** button
   - Should show: "✅ Test Successful!"

### Method 2: Test on Real Page
1. Visit: https://en.wikipedia.org/wiki/Chrome_extension
2. Select any paragraph
3. Click the floating button or press `Ctrl+Shift+C`
4. Look for success toast notification

---

## 🐛 Common Issues & Fixes

### ❌ "Failed to load extension"

**Problem:** Missing icon files
**Fix:** Make sure these files exist:
```bash
cd /app/chrome-extension
ls -l icon*.png
```
Should show: icon16.png, icon48.png, icon128.png

### ❌ "Disconnected" Status

**Problem:** Backend not running
**Fix:** Make sure CopyDock app is running:
```bash
sudo supervisorctl status
```
All services should show "RUNNING"

### ❌ Floating Button Not Appearing

**Problem:** Extension not loaded properly
**Fix:**
1. Go to `chrome://extensions/`
2. Find CopyDock Web Clipper
3. Click the **refresh icon (🔄)** to reload
4. Try selecting text again

### ❌ Keyboard Shortcut Not Working

**Fix:** Check/customize shortcuts:
1. Go to `chrome://extensions/shortcuts`
2. Find "CopyDock Web Clipper"
3. Verify or change the key combination

---

## 📱 What Gets Captured?

When you capture content, the extension saves:

- ✅ **Selected Text** - Plain text version
- ✅ **Selected HTML** - Formatted version with links, bold, etc.
- ✅ **Source URL** - Where you captured it from
- ✅ **Domain** - Website name (e.g., wikipedia.org)
- ✅ **Timestamp** - When you captured it

All data is sent to YOUR CopyDock backend (not any external service).

---

## 🎨 Customization

### Change Backend URL

If you deploy to production:

1. Open `/app/chrome-extension/background.js`
2. Line 4: Update `API_URL`
```javascript
const API_URL = 'https://your-domain.com/api';
```
3. Reload extension in `chrome://extensions/`

### Change Keyboard Shortcut

1. Visit `chrome://extensions/shortcuts`
2. Find "CopyDock Web Clipper"  
3. Click pencil icon to edit
4. Set your preferred keys

---

## 🎉 You're All Set!

The extension is now:
- ✅ Capturing web content
- ✅ Sending to CopyDock backend
- ✅ Saving to MongoDB
- ✅ Showing success notifications

**Happy capturing! 📋✨**

---

## 📊 View Captured Content

### In CopyDock App
- Captures are stored in MongoDB database
- Collection: `web_captures`

### Via API
```bash
curl https://quick-deploy-42.preview.emergentagent.com/api/web-captures
```

---

**Version 1.0.0** | Made with ❤️ for CopyDock

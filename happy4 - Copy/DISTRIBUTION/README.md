# 📦 CopyDock Desktop Distribution Package

## What's Inside

This package contains everything you need to run CopyDock desktop app and Chrome extension.

### 📂 Files & Folders

```
DISTRIBUTION/
├── copydock-app/           # Main application folder
│   ├── backend/            # FastAPI backend
│   ├── frontend/           # React frontend (built)
│   ├── electron/           # Electron app
│   └── START.bat           # Windows startup script
│
├── chrome-extension/       # Chrome extension folder
│   ├── manifest.json
│   ├── background.js
│   ├── content.js
│   ├── popup.html
│   └── ... (all extension files)
│
└── INSTALLATION-GUIDE.md   # This file

```

---

## 🚀 Installation Instructions

### Step 1: Install Prerequisites

#### Required Software:
1. **Python 3.8+** (for backend)
   - Download: https://www.python.org/downloads/
   - ⚠️ IMPORTANT: Check "Add Python to PATH" during installation

2. **Node.js 16+** (for Electron)
   - Download: https://nodejs.org/
   - Choose LTS version

#### Verify Installation:
Open Command Prompt and run:
```cmd
python --version
node --version
npm --version
```

You should see version numbers for all three commands.

---

### Step 2: Setup Desktop App

1. **Extract** the `copydock-app` folder to your desired location  
   (e.g., `C:\Program Files\CopyDock\`)

2. **Install Backend Dependencies**:
   ```cmd
   cd copydock-app\backend
   pip install -r requirements.txt
   ```

3. **Install Electron Dependencies**:
   ```cmd
   cd copydock-app\electron
   npm install
   ```

4. **Start the App**:
   - Double-click `START.bat` in the `copydock-app` folder
   - OR run from Command Prompt:
     ```cmd
     cd copydock-app
     START.bat
     ```

The Electron window should open with the CopyDock app running!

---

### Step 3: Install Chrome Extension

1. **Open Chrome**: Go to `chrome://extensions/`

2. **Enable Developer Mode**: Toggle the switch in the top-right corner

3. **Load Extension**:
   - Click "Load unpacked"
   - Select the `chrome-extension` folder from this distribution
   - Extension will be loaded ✅

4. **Note the Extension ID**:
   - Under the extension card, you'll see something like:  
     `ID: abcdefghijklmnopqrstuvwxyz123456`
   - Copy this ID (you'll need it for the next step)

---

### Step 4: Connect Extension to Desktop App

The extension needs to communicate with the desktop app through Chrome's Native Messaging.

#### On Windows:

1. Open the `chrome-extension` folder
2. Edit `com.copydock.app.json`
3. Update these values:
   ```json
   {
     "path": "C:\\path\\to\\copydock-app\\electron\\native-messaging-host.js",
     "allowed_origins": [
       "chrome-extension://YOUR_EXTENSION_ID_HERE/"
     ]
   }
   ```
   Replace:
   - `C:\\path\\to\\copydock-app` with actual path (use double backslashes `\\`)
   - `YOUR_EXTENSION_ID_HERE` with the ID you copied in Step 3

4. **Register the manifest** (Run as Administrator):
   ```cmd
   reg add "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.copydock.app" /ve /t REG_SZ /d "C:\path\to\chrome-extension\com.copydock.app.json" /f
   ```
   Replace `C:\path\to\chrome-extension` with actual path

---

## ✅ Test Everything

1. **Start Desktop App**: Double-click `START.bat`
2. **Check Extension**: Click extension icon → Should show "Connected ✅"
3. **Test Capture**:
   - Go to any website
   - Select some text
   - Floating "📋 Send to CopyDock" button should appear
   - Click it
   - Check desktop app → Content should be saved!

---

## 🛠️ Troubleshooting

### Desktop App Won't Start

**Issue**: Python not found  
**Fix**: Reinstall Python with "Add to PATH" checked

**Issue**: Port 8001 already in use  
**Fix**: Close other apps using port 8001 or edit `backend/server.py` to use a different port

### Extension Shows "Disconnected"

**Issue**: Desktop app not running  
**Fix**: Start the desktop app first

**Issue**: Native messaging not registered  
**Fix**: Re-run the registry command from Step 4

### Captures Not Saving

**Issue**: Backend not responding  
**Fix**: Check if backend is running at http://localhost:8001/docs

---

## 📝 Notes

- **Data Storage**: All your notes and todos are stored locally in:
  - Windows: `C:\Users\YourName\.copydock\storage.json`
  
- **Logs**: Check logs if something goes wrong:
  - Backend: `copydock-app\backend\server.log`
  - Electron: Check console in the Electron window

- **Updates**: Replace the entire `copydock-app` folder with new versions

---

## 🎉 You're All Set!

Enjoy using CopyDock! 

**Features**:
- 📝 Rich text editor with tables, lists, code blocks
- ✅ Multi-level todo system (Year → Month → Day → Hour)
- 📊 Analytics dashboard with streak tracking
- 🌐 Web clipper via Chrome extension
- 🔍 Search and organize notes
- 💾 Local storage (no cloud, your data stays private)

---

## 📞 Support

For issues or questions:
- Check logs in the desktop app console
- Verify all prerequisites are installed
- Make sure paths in `com.copydock.app.json` are correct

**System Requirements**:
- Windows 10/11 (64-bit)
- 4GB RAM minimum
- 500MB free disk space
- Chrome/Chromium browser

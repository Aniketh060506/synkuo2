# 🚀 COPYDOCK DESKTOP + CHROME EXTENSION - MASTER IMPLEMENTATION PLAN

## 📋 TABLE OF CONTENTS
1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Technology Stack](#technology-stack)
4. [Implementation Phases](#implementation-phases)
5. [File Structure](#file-structure)
6. [Communication Protocol](#communication-protocol)
7. [Step-by-Step Build Guide](#step-by-step-build-guide)
8. [Testing Checklist](#testing-checklist)
9. [Deployment Guide](#deployment-guide)

---

## 🎯 SYSTEM OVERVIEW

**Goal:** Build a desktop application (Electron) that users can install, which:
- Runs a complete note-taking app with Todo system
- Uses localStorage (NO DATABASE) for data persistence
- Connects to Chrome Extension via Native Messaging
- Allows users to capture web content directly into notebooks
- Shows real-time connection status in extension
- Target notebook set in desktop app reflects in extension

**User Journey:**
1. User downloads CopyDock Desktop App (.exe / .dmg / .AppImage)
2. User installs and launches app
3. User installs Chrome Extension from Chrome Web Store
4. Extension shows "Connected ✅" automatically
5. User sets target notebook in desktop app UI
6. User browses web, selects text, clicks "Send to [Notebook Name]"
7. Content appears instantly in desktop app

---

## 🏗️ ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────────────┐
│                    COPYDOCK DESKTOP APP                      │
│                      (Electron)                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  React Frontend (port 3000)                            │ │
│  │  - Notebook Editor (TipTap)                            │ │
│  │  - Todo System (Year/Month/Day/Hour views)             │ │
│  │  - Analytics Dashboard                                 │ │
│  │  - Settings: Set Target Notebook for Extension         │ │
│  │  - localStorage API for data persistence               │ │
│  └────────────────────────────────────────────────────────┘ │
│                            ↕                                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  FastAPI Backend (port 8001)                           │ │
│  │  - REST API endpoints                                  │ │
│  │  - localStorage bridge (file-based)                    │ │
│  │  - Web capture endpoint (/api/web-capture)             │ │
│  └────────────────────────────────────────────────────────┘ │
│                            ↕                                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Native Messaging Host                                 │ │
│  │  - Listens on STDIN for Chrome messages               │ │
│  │  - Sends responses via STDOUT                          │ │
│  │  - Protocol: JSON with 4-byte length prefix            │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↕
                   [Native Messaging]
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                    CHROME EXTENSION                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  background.js (Service Worker)                        │ │
│  │  - Establishes Native Messaging connection             │ │
│  │  - Monitors connection status                          │ │
│  │  - Gets target notebook name from desktop              │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  content.js (Content Script)                           │ │
│  │  - Floating button on text selection                   │ │
│  │  - Captures text + HTML                                │ │
│  │  - Shows "Send to [Notebook Name]"                     │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  popup.html/js (Extension Popup)                       │ │
│  │  - Shows connection status (Connected/Disconnected)    │ │
│  │  - Displays target notebook name                       │ │
│  │  - Test capture button                                 │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ TECHNOLOGY STACK

### Desktop App (Electron)
- **Electron** v28+ (Cross-platform desktop framework)
- **React** 18+ (Frontend UI)
- **FastAPI** (Python backend, runs as subprocess)
- **localStorage** (File-based: `userData/storage.json`)
- **electron-builder** (Packaging for .exe, .dmg, .AppImage)

### Chrome Extension
- **Manifest V3** (Latest Chrome extension format)
- **Native Messaging API** (Direct communication with desktop app)
- **Content Scripts** (Inject UI into web pages)
- **Service Worker** (Background processing)

### Communication
- **Native Messaging Protocol** (Chrome ↔ Desktop)
- **REST API** (React ↔ FastAPI, internal)
- **File-based storage** (JSON files in userData folder)

---

## 📂 IMPLEMENTATION PHASES

### **PHASE 1: Remove MongoDB, Use localStorage** ✅
**Goal:** Migrate all data storage from MongoDB to browser localStorage / file-based storage

**Tasks:**
1. Remove all MongoDB dependencies from backend
2. Create localStorage service in backend (file-based JSON)
3. Update all API endpoints to use localStorage
4. Test all features work without MongoDB

**Files to Modify:**
- `backend/server.py` - Remove MongoDB client, add file storage
- `backend/requirements.txt` - Remove pymongo
- Frontend already uses localStorage, no changes needed

**Data Storage Location:**
- Desktop App: `~/.copydock/storage.json` (or AppData on Windows)
- Browser: `localStorage` (for frontend-only operations)

---

### **PHASE 2: Build Electron Desktop App** 🔄
**Goal:** Create Electron wrapper that bundles React + FastAPI

**Tasks:**
1. Create Electron project structure
2. Configure Electron to launch React frontend
3. Configure Electron to start FastAPI backend as subprocess
4. Setup auto-restart for backend if it crashes
5. Create application menu and tray icon
6. Implement Native Messaging host in Electron

**Files to Create:**
```
/app/electron/
├── main.js                 # Electron main process
├── preload.js             # Bridge between Electron and React
├── native-messaging-host.js  # Chrome extension communication
├── package.json           # Electron dependencies
├── build-config.js        # electron-builder configuration
└── assets/
    ├── icon.png           # App icon (1024x1024)
    ├── icon.ico           # Windows icon
    └── icon.icns          # macOS icon
```

**Key Features:**
- Auto-start backend on app launch
- Window state persistence (size, position)
- System tray integration
- Auto-updater support (optional)
- Deep linking support (copydock://)

---

### **PHASE 3: Update Chrome Extension for Native Messaging** 🔄
**Goal:** Replace HTTP API calls with Native Messaging

**Tasks:**
1. Update manifest.json with nativeMessaging permission
2. Update background.js to establish Native Messaging connection
3. Add connection status monitoring
4. Add target notebook name fetching
5. Update content.js to show dynamic notebook name
6. Add disconnection handling and user notifications

**Files to Modify:**
- `chrome-extension/manifest.json`
- `chrome-extension/background.js`
- `chrome-extension/content.js`
- `chrome-extension/popup.js`

**New Message Types:**
```javascript
// Extension → Desktop
{ "type": "GET_STATUS" }
{ "type": "GET_TARGET_NOTEBOOK" }
{ "type": "CAPTURE_CONTENT", "payload": {...} }

// Desktop → Extension
{ "type": "STATUS_RESPONSE", "connected": true }
{ "type": "TARGET_NOTEBOOK_RESPONSE", "notebookId": "...", "notebookName": "..." }
{ "type": "CAPTURE_SUCCESS" }
{ "type": "CAPTURE_ERROR", "message": "..." }
```

---

### **PHASE 4: Native Messaging Host Registration** 🔄
**Goal:** Register desktop app as Native Messaging host with Chrome

**Tasks:**
1. Create native messaging manifest file
2. Auto-register manifest during app installation
3. Detect Chrome/Edge installation paths
4. Update registry (Windows) or config files (Mac/Linux)

**Manifest File Location:**
- **Windows:** `HKEY_CURRENT_USER\Software\Google\Chrome\NativeMessagingHosts\com.copydock.app`
- **macOS:** `~/Library/Application Support/Google/Chrome/NativeMessagingHosts/com.copydock.app.json`
- **Linux:** `~/.config/google-chrome/NativeMessagingHosts/com.copydock.app.json`

**Manifest Content:**
```json
{
  "name": "com.copydock.app",
  "description": "CopyDock Desktop App",
  "path": "/path/to/copydock/native-messaging-host.exe",
  "type": "stdio",
  "allowed_origins": [
    "chrome-extension://[EXTENSION_ID]/"
  ]
}
```

---

### **PHASE 5: Desktop UI - Set Target Notebook** 🔄
**Goal:** Add UI in desktop app to set target notebook for extension

**Tasks:**
1. Add "Chrome Extension Settings" section in Settings page
2. Add dropdown to select target notebook
3. Add "Set as Target" button next to each notebook
4. Show current target notebook with indicator
5. Save preference to localStorage
6. Notify extension when target changes

**UI Location:**
- Settings page → Chrome Extension section
- OR right-click menu on notebook → "Set as Extension Target"

**Visual Indicator:**
- Show 🎯 icon next to target notebook in sidebar
- Show "Extension Target" badge

---

### **PHASE 6: Package & Distribute** 🔄
**Goal:** Build installers for Windows, macOS, Linux

**Tasks:**
1. Configure electron-builder for all platforms
2. Code sign applications (optional but recommended)
3. Create auto-updater configuration
4. Build installers (.exe, .dmg, .AppImage)
5. Test installation on clean machines
6. Create installation guide

**Build Commands:**
```bash
npm run build:win    # Windows .exe
npm run build:mac    # macOS .dmg
npm run build:linux  # Linux .AppImage
```

**Distribution:**
- Host installers on website
- GitHub Releases (recommended)
- Auto-updater points to update server

---

## 📁 FILE STRUCTURE

```
/app/
├── frontend/                 # React App (existing)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── TodoSystem.jsx
│   │   │   ├── Settings.jsx  [NEW: Add Extension Settings]
│   │   │   └── ...
│   │   ├── utils/
│   │   │   └── storage.js    # localStorage utilities
│   │   └── index.js
│   └── package.json
│
├── backend/                  # FastAPI (existing, modified)
│   ├── server.py             [MODIFY: Remove MongoDB, add file storage]
│   ├── storage_service.py    [NEW: File-based storage service]
│   └── requirements.txt      [MODIFY: Remove pymongo]
│
├── electron/                 [NEW: Electron Desktop App]
│   ├── main.js               # Main Electron process
│   ├── preload.js            # Security bridge
│   ├── native-messaging-host.js  # Chrome extension communication
│   ├── backend-launcher.js   # Launches FastAPI subprocess
│   ├── package.json          # Electron dependencies
│   ├── electron-builder.yml  # Build configuration
│   └── assets/
│       ├── icon.png
│       ├── icon.ico
│       └── icon.icns
│
├── chrome-extension/         # Chrome Extension (existing, modified)
│   ├── manifest.json         [MODIFY: Add Native Messaging]
│   ├── background.js         [MODIFY: Native Messaging connection]
│   ├── content.js            [MODIFY: Dynamic notebook name]
│   ├── popup.js              [MODIFY: Connection status]
│   ├── content.css
│   └── icons/
│
├── scripts/                  [NEW: Build & deployment scripts]
│   ├── build-electron.sh     # Build Electron app
│   ├── register-native-messaging.sh  # Register with Chrome
│   └── package-extension.sh  # Package extension for store
│
├── docs/                     [NEW: Documentation]
│   ├── INSTALLATION.md       # User installation guide
│   ├── DEVELOPMENT.md        # Developer setup guide
│   └── ARCHITECTURE.md       # Technical architecture
│
└── MASTER_PLAN.md           # This file
```

---

## 🔄 COMMUNICATION PROTOCOL

### Native Messaging Message Format

**All messages use 4-byte length prefix + JSON payload**

```
[4 bytes: message length in native byte order][JSON message]
```

### Message Types

#### 1. Connection Status Check
```javascript
// Extension → Desktop
{
  "type": "PING"
}

// Desktop → Extension
{
  "type": "PONG",
  "connected": true,
  "appVersion": "1.0.0"
}
```

#### 2. Get Target Notebook
```javascript
// Extension → Desktop
{
  "type": "GET_TARGET_NOTEBOOK"
}

// Desktop → Extension
{
  "type": "TARGET_NOTEBOOK_RESPONSE",
  "notebookId": "nb_work_001",
  "notebookName": "Work Notes",
  "notebookColor": "#3B82F6"
}
```

#### 3. Capture Web Content
```javascript
// Extension → Desktop
{
  "type": "CAPTURE_CONTENT",
  "payload": {
    "selectedText": "Lorem ipsum...",
    "selectedHTML": "<p>Lorem ipsum...</p>",
    "sourceDomain": "example.com",
    "sourceUrl": "https://example.com/article",
    "timestamp": "2025-01-20T10:30:00Z"
  }
}

// Desktop → Extension (Success)
{
  "type": "CAPTURE_SUCCESS",
  "notebookName": "Work Notes",
  "message": "Content saved successfully"
}

// Desktop → Extension (Error)
{
  "type": "CAPTURE_ERROR",
  "message": "Failed to save content",
  "error": "Target notebook not found"
}
```

#### 4. Target Notebook Changed
```javascript
// Desktop → Extension (Push notification)
{
  "type": "TARGET_NOTEBOOK_CHANGED",
  "notebookId": "nb_personal_002",
  "notebookName": "Personal Notes"
}
```

---

## 🔨 STEP-BY-STEP BUILD GUIDE

### **STEP 1: Prepare Development Environment**

```bash
# Install Node.js (v18+)
# Install Python (v3.9+)
# Install Git

# Clone repository
cd /app

# Install frontend dependencies
cd frontend
yarn install

# Install backend dependencies
cd ../backend
pip install -r requirements.txt
```

---

### **STEP 2: Remove MongoDB from Backend**

**A. Create File-Based Storage Service**

Create `/app/backend/storage_service.py`:

```python
import json
import os
from pathlib import Path
from typing import Any, Dict, Optional
import shutil

class StorageService:
    def __init__(self, storage_path: Optional[str] = None):
        if storage_path:
            self.storage_dir = Path(storage_path)
        else:
            # Default to user data directory
            if os.name == 'nt':  # Windows
                base = Path(os.environ.get('APPDATA', ''))
            else:  # macOS / Linux
                base = Path.home()
            self.storage_dir = base / '.copydock'
        
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        self.storage_file = self.storage_dir / 'storage.json'
        self._ensure_storage_exists()
    
    def _ensure_storage_exists(self):
        if not self.storage_file.exists():
            self._write_data({
                'notebooks': [],
                'todos': {},
                'web_captures': [],
                'settings': {
                    'target_notebook_id': 'default',
                    'target_notebook_name': 'Web Captures'
                }
            })
    
    def _read_data(self) -> Dict[str, Any]:
        with open(self.storage_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    def _write_data(self, data: Dict[str, Any]):
        with open(self.storage_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    
    def get_all_data(self) -> Dict[str, Any]:
        return self._read_data()
    
    def update_data(self, key: str, value: Any):
        data = self._read_data()
        data[key] = value
        self._write_data(data)
    
    def get_settings(self) -> Dict[str, Any]:
        data = self._read_data()
        return data.get('settings', {})
    
    def update_settings(self, settings: Dict[str, Any]):
        data = self._read_data()
        data['settings'] = {**data.get('settings', {}), **settings}
        self._write_data(data)
    
    def add_web_capture(self, capture: Dict[str, Any]) -> bool:
        try:
            data = self._read_data()
            data['web_captures'].append(capture)
            self._write_data(data)
            return True
        except Exception as e:
            print(f"Error adding web capture: {e}")
            return False
    
    def get_web_captures(self, limit: int = 100) -> list:
        data = self._read_data()
        captures = data.get('web_captures', [])
        return captures[-limit:]  # Return most recent

# Global instance
storage = StorageService()
```

**B. Update Backend Server**

Modify `/app/backend/server.py`:

```python
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uvicorn
from datetime import datetime
from storage_service import storage

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class WebCapture(BaseModel):
    selectedText: str
    selectedHTML: Optional[str] = None
    sourceDomain: str
    sourceUrl: str
    targetNotebookId: Optional[str] = "default"
    timestamp: str

class TargetNotebook(BaseModel):
    notebookId: str
    notebookName: str

# Endpoints
@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "Backend is running"}

@app.post("/api/web-capture")
async def capture_content(capture: WebCapture):
    capture_data = {
        "id": f"cap_{datetime.now().timestamp()}",
        "text": capture.selectedText,
        "html": capture.selectedHTML,
        "domain": capture.sourceDomain,
        "url": capture.sourceUrl,
        "notebook_id": capture.targetNotebookId,
        "timestamp": capture.timestamp,
        "created_at": datetime.now().isoformat()
    }
    
    success = storage.add_web_capture(capture_data)
    
    if success:
        settings = storage.get_settings()
        return {
            "success": True,
            "notebookId": capture.targetNotebookId,
            "notebookName": settings.get('target_notebook_name', 'Web Captures'),
            "message": "Content captured successfully"
        }
    else:
        raise HTTPException(status_code=500, detail="Failed to save capture")

@app.get("/api/web-captures")
async def get_captures(limit: int = 100):
    captures = storage.get_web_captures(limit)
    return {"captures": captures, "count": len(captures)}

@app.get("/api/settings/target-notebook")
async def get_target_notebook():
    settings = storage.get_settings()
    return {
        "notebookId": settings.get('target_notebook_id', 'default'),
        "notebookName": settings.get('target_notebook_name', 'Web Captures')
    }

@app.post("/api/settings/target-notebook")
async def set_target_notebook(notebook: TargetNotebook):
    storage.update_settings({
        'target_notebook_id': notebook.notebookId,
        'target_notebook_name': notebook.notebookName
    })
    return {"success": True, "message": "Target notebook updated"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
```

**C. Update requirements.txt**

Remove MongoDB dependency:
```txt
fastapi
uvicorn[standard]
pydantic
python-multipart
```

**D. Test Backend**

```bash
cd /app/backend
python server.py

# Test in another terminal
curl http://localhost:8001/api/health
```

---

### **STEP 3: Create Electron App**

**A. Initialize Electron Project**

```bash
cd /app
mkdir electron
cd electron
npm init -y
npm install electron electron-builder
npm install --save-dev electron-reload
```

**B. Create Main Process** (`/app/electron/main.js`)

```javascript
const { app, BrowserWindow, ipcMain, Tray, Menu } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

let mainWindow = null;
let backendProcess = null;
let nativeMessagingHost = null;

// Paths
const isDev = process.env.NODE_ENV === 'development';
const BACKEND_PATH = path.join(__dirname, '../backend/server.py');
const FRONTEND_URL = isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, '../frontend/build/index.html')}`;

// Start FastAPI Backend
function startBackend() {
    console.log('Starting FastAPI backend...');
    backendProcess = spawn('python', [BACKEND_PATH]);
    
    backendProcess.stdout.on('data', (data) => {
        console.log(`Backend: ${data}`);
    });
    
    backendProcess.stderr.on('data', (data) => {
        console.error(`Backend Error: ${data}`);
    });
    
    backendProcess.on('close', (code) => {
        console.log(`Backend exited with code ${code}`);
        if (code !== 0 && mainWindow) {
            // Restart backend if crashed
            setTimeout(startBackend, 2000);
        }
    });
}

// Create Main Window
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        icon: path.join(__dirname, 'assets/icon.png')
    });
    
    mainWindow.loadURL(FRONTEND_URL);
    
    if (isDev) {
        mainWindow.webContents.openDevTools();
    }
    
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// App Ready
app.whenReady().then(() => {
    startBackend();
    
    // Wait for backend to start
    setTimeout(() => {
        createWindow();
        startNativeMessagingHost();
    }, 2000);
    
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Quit App
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', () => {
    // Kill backend process
    if (backendProcess) {
        backendProcess.kill();
    }
    if (nativeMessagingHost) {
        nativeMessagingHost.kill();
    }
});

// Start Native Messaging Host
function startNativeMessagingHost() {
    const hostPath = path.join(__dirname, 'native-messaging-host.js');
    nativeMessagingHost = spawn('node', [hostPath]);
    
    nativeMessagingHost.stdout.on('data', (data) => {
        console.log(`Native Host: ${data}`);
    });
    
    nativeMessagingHost.stderr.on('data', (data) => {
        console.error(`Native Host Error: ${data}`);
    });
}
```

**C. Create Preload Script** (`/app/electron/preload.js`)

```javascript
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    platform: process.platform,
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    openExternal: (url) => ipcRenderer.send('open-external', url)
});
```

**D. Create Native Messaging Host** (`/app/electron/native-messaging-host.js`)

```javascript
#!/usr/bin/env node

const fs = require('fs');
const axios = require('axios');

const BACKEND_URL = 'http://localhost:8001';

// Native Messaging Protocol
function sendMessage(message) {
    const json = JSON.stringify(message);
    const length = Buffer.byteLength(json);
    const lengthBuffer = Buffer.alloc(4);
    lengthBuffer.writeUInt32LE(length, 0);
    
    process.stdout.write(lengthBuffer);
    process.stdout.write(json);
}

function readMessage() {
    return new Promise((resolve) => {
        const lengthBuffer = Buffer.alloc(4);
        process.stdin.read(4).copy(lengthBuffer);
        const length = lengthBuffer.readUInt32LE(0);
        
        const messageBuffer = process.stdin.read(length);
        const message = JSON.parse(messageBuffer.toString());
        resolve(message);
    });
}

// Message Handlers
async function handleMessage(message) {
    try {
        switch (message.type) {
            case 'PING':
                sendMessage({ type: 'PONG', connected: true, appVersion: '1.0.0' });
                break;
            
            case 'GET_TARGET_NOTEBOOK':
                const targetResponse = await axios.get(`${BACKEND_URL}/api/settings/target-notebook`);
                sendMessage({
                    type: 'TARGET_NOTEBOOK_RESPONSE',
                    notebookId: targetResponse.data.notebookId,
                    notebookName: targetResponse.data.notebookName
                });
                break;
            
            case 'CAPTURE_CONTENT':
                const captureResponse = await axios.post(`${BACKEND_URL}/api/web-capture`, message.payload);
                sendMessage({
                    type: 'CAPTURE_SUCCESS',
                    notebookName: captureResponse.data.notebookName,
                    message: 'Content saved successfully'
                });
                break;
            
            default:
                sendMessage({ type: 'ERROR', message: 'Unknown message type' });
        }
    } catch (error) {
        sendMessage({
            type: 'ERROR',
            message: error.message
        });
    }
}

// Start listening
process.stdin.on('readable', async () => {
    try {
        const message = await readMessage();
        await handleMessage(message);
    } catch (error) {
        console.error('Error reading message:', error);
    }
});
```

**E. Update package.json**

```json
{
  "name": "copydock-desktop",
  "version": "1.0.0",
  "main": "main.js",
  "scripts": {
    "start": "electron .",
    "build": "electron-builder",
    "build:win": "electron-builder --win",
    "build:mac": "electron-builder --mac",
    "build:linux": "electron-builder --linux"
  },
  "dependencies": {
    "axios": "^1.6.0",
    "electron": "^28.0.0"
  },
  "devDependencies": {
    "electron-builder": "^24.9.0"
  },
  "build": {
    "appId": "com.copydock.app",
    "productName": "CopyDock",
    "directories": {
      "output": "dist"
    },
    "files": [
      "main.js",
      "preload.js",
      "native-messaging-host.js",
      "assets/**/*",
      "../frontend/build/**/*",
      "../backend/**/*"
    ],
    "win": {
      "target": "nsis",
      "icon": "assets/icon.ico"
    },
    "mac": {
      "target": "dmg",
      "icon": "assets/icon.icns"
    },
    "linux": {
      "target": "AppImage",
      "icon": "assets/icon.png"
    }
  }
}
```

---

### **STEP 4: Update Chrome Extension**

**A. Update manifest.json**

```json
{
  "manifest_version": 3,
  "name": "CopyDock Web Clipper",
  "version": "1.0.0",
  "description": "Capture web content directly into CopyDock desktop app",
  "permissions": [
    "nativeMessaging",
    "contextMenus",
    "storage"
  ],
  "host_permissions": [
    "<all_urls>"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"],
      "css": ["content.css"],
      "run_at": "document_end"
    }
  ],
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  "commands": {
    "capture-selection": {
      "suggested_key": {
        "default": "Ctrl+Shift+C",
        "mac": "Command+Shift+C"
      },
      "description": "Capture selected text"
    }
  }
}
```

**B. Update background.js**

```javascript
let nativePort = null;
let isConnected = false;
let targetNotebook = { id: 'default', name: 'Loading...' };

// Connect to Native Messaging Host
function connectNativeApp() {
    try {
        nativePort = chrome.runtime.connectNative('com.copydock.app');
        
        nativePort.onMessage.addListener((message) => {
            handleNativeMessage(message);
        });
        
        nativePort.onDisconnect.addListener(() => {
            isConnected = false;
            nativePort = null;
            console.log('Disconnected from desktop app');
            
            // Try to reconnect after 5 seconds
            setTimeout(connectNativeApp, 5000);
        });
        
        // Send ping to check connection
        sendNativeMessage({ type: 'PING' });
        
    } catch (error) {
        console.error('Failed to connect to native app:', error);
        isConnected = false;
    }
}

// Send message to desktop app
function sendNativeMessage(message) {
    if (nativePort) {
        nativePort.postMessage(message);
    }
}

// Handle messages from desktop app
function handleNativeMessage(message) {
    switch (message.type) {
        case 'PONG':
            isConnected = true;
            // Request target notebook info
            sendNativeMessage({ type: 'GET_TARGET_NOTEBOOK' });
            break;
        
        case 'TARGET_NOTEBOOK_RESPONSE':
            targetNotebook = {
                id: message.notebookId,
                name: message.notebookName
            };
            // Notify popup and content scripts
            chrome.runtime.sendMessage({
                type: 'TARGET_NOTEBOOK_UPDATED',
                notebook: targetNotebook
            });
            break;
        
        case 'CAPTURE_SUCCESS':
            chrome.runtime.sendMessage({
                type: 'CAPTURE_RESULT',
                success: true,
                notebookName: message.notebookName
            });
            break;
        
        case 'ERROR':
            chrome.runtime.sendMessage({
                type: 'CAPTURE_RESULT',
                success: false,
                message: message.message
            });
            break;
    }
}

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'CAPTURE_CONTENT') {
        if (isConnected) {
            sendNativeMessage({
                type: 'CAPTURE_CONTENT',
                payload: message.payload
            });
        } else {
            sendResponse({ success: false, message: 'Desktop app not connected' });
        }
    } else if (message.type === 'GET_STATUS') {
        sendResponse({
            connected: isConnected,
            targetNotebook: targetNotebook
        });
    }
    return true; // Keep channel open for async response
});

// Connect on startup
connectNativeApp();

// Refresh target notebook every 10 seconds
setInterval(() => {
    if (isConnected) {
        sendNativeMessage({ type: 'GET_TARGET_NOTEBOOK' });
    }
}, 10000);
```

**C. Update content.js**

```javascript
let floatingButton = null;
let targetNotebookName = 'Loading...';

// Listen for target notebook updates
chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'TARGET_NOTEBOOK_UPDATED') {
        targetNotebookName = message.notebook.name;
        updateFloatingButton();
    } else if (message.type === 'CAPTURE_RESULT') {
        if (message.success) {
            showToast(`✅ Saved to ${message.notebookName}`, 'success');
        } else {
            showToast(`❌ ${message.message}`, 'error');
        }
        hideFloatingButton();
    }
});

// Get initial status
chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (response) => {
    if (response && response.targetNotebook) {
        targetNotebookName = response.targetNotebook.name;
    }
});

// Show floating button on text selection
document.addEventListener('mouseup', (e) => {
    const selectedText = window.getSelection().toString().trim();
    
    if (selectedText.length > 0) {
        showFloatingButton(e.pageX, e.pageY);
    } else {
        hideFloatingButton();
    }
});

function showFloatingButton(x, y) {
    if (!floatingButton) {
        floatingButton = document.createElement('div');
        floatingButton.id = 'copydock-floating-button';
        floatingButton.innerHTML = `📋 Send to <strong>${targetNotebookName}</strong>`;
        document.body.appendChild(floatingButton);
        
        floatingButton.addEventListener('click', captureSelection);
    }
    
    floatingButton.style.left = `${x}px`;
    floatingButton.style.top = `${y + 20}px`;
    floatingButton.style.display = 'block';
}

function updateFloatingButton() {
    if (floatingButton) {
        floatingButton.innerHTML = `📋 Send to <strong>${targetNotebookName}</strong>`;
    }
}

function hideFloatingButton() {
    if (floatingButton) {
        floatingButton.style.display = 'none';
    }
}

function captureSelection() {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    if (!selectedText) {
        showToast('⚠️ No text selected', 'warning');
        return;
    }
    
    // Get HTML content
    let selectedHTML = '';
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const div = document.createElement('div');
        div.appendChild(range.cloneContents());
        selectedHTML = div.innerHTML;
    }
    
    // Send to background script
    chrome.runtime.sendMessage({
        type: 'CAPTURE_CONTENT',
        payload: {
            selectedText: selectedText,
            selectedHTML: selectedHTML,
            sourceDomain: window.location.hostname,
            sourceUrl: window.location.href,
            timestamp: new Date().toISOString()
        }
    });
    
    showToast('Sending to CopyDock...', 'info');
}

function showToast(message, type) {
    const toast = document.createElement('div');
    toast.className = `copydock-toast copydock-toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Keyboard shortcut
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        if (window.getSelection().toString().trim()) {
            captureSelection();
        }
    }
});
```

**D. Update popup.js**

```javascript
let connectionStatus = document.getElementById('connection-status');
let targetNotebookEl = document.getElementById('target-notebook');
let testButton = document.getElementById('test-capture');

// Check status on popup open
chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (response) => {
    updateUI(response);
});

// Listen for updates
chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'TARGET_NOTEBOOK_UPDATED') {
        chrome.runtime.sendMessage({ type: 'GET_STATUS' }, updateUI);
    }
});

function updateUI(status) {
    if (status.connected) {
        connectionStatus.innerHTML = '<span class="status-dot connected"></span> Connected ✅';
        connectionStatus.className = 'status connected';
        targetNotebookEl.innerHTML = `Target: <strong>${status.targetNotebook.name}</strong>`;
        testButton.disabled = false;
    } else {
        connectionStatus.innerHTML = '<span class="status-dot disconnected"></span> Disconnected ❌';
        connectionStatus.className = 'status disconnected';
        targetNotebookEl.innerHTML = '<em>Desktop app not running</em>';
        testButton.disabled = true;
    }
}

// Test capture button
testButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({
        type: 'CAPTURE_CONTENT',
        payload: {
            selectedText: 'Test capture from extension popup',
            selectedHTML: '<p>Test capture from extension popup</p>',
            sourceDomain: 'extension',
            sourceUrl: 'chrome-extension://',
            timestamp: new Date().toISOString()
        }
    });
    
    testButton.textContent = 'Sent!';
    setTimeout(() => {
        testButton.textContent = 'Test Capture';
    }, 2000);
});

// Refresh status every 3 seconds
setInterval(() => {
    chrome.runtime.sendMessage({ type: 'GET_STATUS' }, updateUI);
}, 3000);
```

---

### **STEP 5: Add Desktop UI for Setting Target Notebook**

**A. Create Settings Component**

Add to `/app/frontend/src/components/Settings.jsx`:

```javascript
import React, { useState, useEffect } from 'react';
import { Target, Chrome } from 'lucide-react';

export default function Settings({ notebooks, onClose }) {
    const [targetNotebook, setTargetNotebook] = useState(null);
    
    useEffect(() => {
        // Load current target from localStorage
        const saved = localStorage.getItem('extensionTargetNotebook');
        if (saved) {
            setTargetNotebook(JSON.parse(saved));
        }
    }, []);
    
    const handleSetTarget = async (notebook) => {
        const target = {
            id: notebook.id,
            name: notebook.name
        };
        
        // Save to localStorage
        localStorage.setItem('extensionTargetNotebook', JSON.stringify(target));
        setTargetNotebook(target);
        
        // Notify backend
        try {
            await fetch('http://localhost:8001/api/settings/target-notebook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    notebookId: target.id,
                    notebookName: target.name
                })
            });
            
            // Show success message
            alert(`✅ "${notebook.name}" set as Chrome Extension target`);
        } catch (error) {
            console.error('Failed to update backend:', error);
        }
    };
    
    return (
        <div className="settings-panel">
            <h2 className="flex items-center gap-2 text-xl font-bold mb-4">
                <Chrome className="w-6 h-6" />
                Chrome Extension Settings
            </h2>
            
            <div className="bg-gray-800 p-4 rounded-lg mb-6">
                <p className="text-gray-300 mb-2">
                    Current Target: {' '}
                    <strong className="text-blue-400">
                        {targetNotebook ? targetNotebook.name : 'Not Set'}
                    </strong>
                </p>
                <p className="text-sm text-gray-500">
                    Web content captured from Chrome extension will be saved to this notebook.
                </p>
            </div>
            
            <h3 className="font-semibold mb-3">Select Target Notebook:</h3>
            
            <div className="space-y-2">
                {notebooks.map(notebook => (
                    <div
                        key={notebook.id}
                        className="flex items-center justify-between bg-gray-800 p-3 rounded-lg hover:bg-gray-700 transition"
                    >
                        <div className="flex items-center gap-3">
                            {targetNotebook?.id === notebook.id && (
                                <Target className="w-5 h-5 text-green-400" />
                            )}
                            <span>{notebook.name}</span>
                        </div>
                        <button
                            onClick={() => handleSetTarget(notebook)}
                            className={`px-4 py-2 rounded-lg transition ${
                                targetNotebook?.id === notebook.id
                                    ? 'bg-green-600 text-white'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                        >
                            {targetNotebook?.id === notebook.id ? 'Current Target' : 'Set as Target'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
```

---

## ✅ TESTING CHECKLIST

### Phase 1: Backend Testing
- [ ] Backend starts without MongoDB dependency
- [ ] File storage created at correct location
- [ ] `/api/health` endpoint responds
- [ ] `/api/settings/target-notebook` GET works
- [ ] `/api/settings/target-notebook` POST updates file
- [ ] `/api/web-capture` POST saves capture
- [ ] `/api/web-captures` GET returns data

### Phase 2: Electron Testing
- [ ] Electron app starts successfully
- [ ] Backend subprocess launches automatically
- [ ] Frontend loads in Electron window
- [ ] All frontend features work (notebooks, todos, etc.)
- [ ] Window state persists across restarts
- [ ] App closes cleanly (backend killed)

### Phase 3: Extension Testing
- [ ] Extension loads in Chrome without errors
- [ ] Background script connects to native host
- [ ] Connection status shows "Connected" when app running
- [ ] Connection status shows "Disconnected" when app closed
- [ ] Target notebook name displays correctly
- [ ] Text selection shows floating button
- [ ] Floating button shows correct notebook name
- [ ] Click floating button captures content
- [ ] Keyboard shortcut (Ctrl+Shift+C) works
- [ ] Toast notifications appear
- [ ] Content appears in desktop app

### Phase 4: Integration Testing
- [ ] Change target notebook in desktop app
- [ ] Extension updates target name within 10 seconds
- [ ] Capture content from extension
- [ ] Content appears in correct notebook in desktop app
- [ ] Close desktop app → extension shows "Disconnected"
- [ ] Open desktop app → extension shows "Connected"
- [ ] Multiple captures in sequence work correctly

### Phase 5: Build Testing
- [ ] Windows .exe builds successfully
- [ ] macOS .dmg builds successfully
- [ ] Linux .AppImage builds successfully
- [ ] Install app on clean machine
- [ ] Native messaging manifest registered correctly
- [ ] Extension connects after app installation
- [ ] Uninstall removes all components

---

## 🚀 DEPLOYMENT GUIDE

### Build Desktop App

```bash
cd /app/electron

# Build for all platforms
npm run build

# Or build specific platform
npm run build:win    # Windows .exe
npm run build:mac    # macOS .dmg
npm run build:linux  # Linux .AppImage
```

Output: `/app/electron/dist/`

### Package Chrome Extension

```bash
cd /app/chrome-extension
zip -r copydock-extension.zip * -x "*.git*" "node_modules/*"
```

### Distribution Steps

1. **Desktop App:**
   - Upload installers to website/GitHub Releases
   - Provide installation instructions
   - Include Native Messaging setup in installer

2. **Chrome Extension:**
   - Submit to Chrome Web Store
   - Fill extension details, screenshots
   - Wait for approval (1-3 days)
   - Provide extension ID to users

3. **Documentation:**
   - Create user guide (installation + usage)
   - Create troubleshooting guide
   - Create video tutorial (optional)

---

## 📝 NOTES FOR FUTURE DEVELOPERS

### Key Design Decisions

1. **Why localStorage instead of MongoDB?**
   - Simpler setup for desktop app
   - No database server required
   - Faster for local operations
   - Easier for users to backup data

2. **Why Native Messaging instead of HTTP?**
   - More secure (no open ports)
   - Automatic connection status
   - Works without network
   - Chrome's recommended approach

3. **Why Electron instead of native app?**
   - Cross-platform (Windows, Mac, Linux)
   - Reuse existing React frontend
   - Faster development
   - Easier to maintain

### Common Issues & Solutions

**Issue:** Extension can't connect to desktop app
- **Solution:** Check native messaging manifest is registered correctly
- **Debug:** Check Chrome native messaging logs

**Issue:** Backend doesn't start in Electron
- **Solution:** Ensure Python is in PATH, check backend logs
- **Debug:** Log backend subprocess output

**Issue:** Storage file not found
- **Solution:** Ensure storage directory has write permissions
- **Debug:** Check storage_service.py logs

### Future Enhancements

- [ ] Cloud sync (optional)
- [ ] Auto-updates for desktop app
- [ ] Multiple target notebooks (quick switch)
- [ ] OCR for captured images
- [ ] Browser bookmarks import
- [ ] Mobile app companion
- [ ] Team collaboration features

---

## 🎯 SUMMARY

This plan provides a complete roadmap to build CopyDock as a desktop application with Chrome extension integration. Follow each phase sequentially, test thoroughly at each step, and refer back to this document when in doubt.

**Estimated Development Time:**
- Phase 1 (Remove MongoDB): 2-3 hours
- Phase 2 (Build Electron): 4-6 hours
- Phase 3 (Update Extension): 3-4 hours
- Phase 4 (Native Messaging): 2-3 hours
- Phase 5 (Desktop UI): 2-3 hours
- Phase 6 (Package & Test): 3-4 hours

**Total:** ~16-23 hours for complete implementation

---

**Good luck building! 🚀**

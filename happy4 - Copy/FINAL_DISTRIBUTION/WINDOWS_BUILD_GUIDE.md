# 🎯 CopyDock - Building Single .exe on Windows

## Quick Start (5 Minutes)

### Prerequisites
- Windows 10 or 11 (64-bit)
- Node.js 16+ ([Download](https://nodejs.org/))
- Python 3.8+ ([Download](https://www.python.org/downloads/))
  - ⚠️ **MUST** check "Add Python to PATH" during installation

### Step-by-Step Instructions

1. **Extract the copydock-app folder** to your Windows PC (e.g., `C:\copydock-app\`)

2. **Open PowerShell or Command Prompt**
   - Press `Win + R`
   - Type `cmd` and press Enter
   - Navigate to the folder:
     ```cmd
     cd C:\copydock-app
     ```

3. **Install Electron Dependencies**
   ```cmd
   cd electron
   npm install
   ```
   This takes 2-3 minutes and downloads ~100MB of files.

4. **Build the Portable .exe**
   ```cmd
   npm run build:win
   ```
   This takes 5-10 minutes and creates the final .exe file.

5. **Find Your .exe File**
   ```
   electron\dist\CopyDock.exe
   ```
   
   File size: **~150-200MB** (normal for Electron apps)

6. **Test It!**
   - Double-click `CopyDock.exe`
   - App should launch without any console windows
   - Your custom logo will appear as the app icon

## ✅ What You Get

- ✅ **Single portable .exe file**
- ✅ **No installation needed**
- ✅ **Your custom logo as app icon**
- ✅ **Hidden console (professional look)**
- ✅ **Frontend black screen fixed**
- ✅ **Includes all Node.js dependencies**

## ⚠️ Known Limitations

The .exe still requires Python to be installed on the user's PC. This is normal for FastAPI/Python backends.

**To make it 100% standalone** (no Python needed), see "Advanced Build" section below.

## 📦 Distribution

After building:

1. **Copy** `electron\dist\CopyDock.exe` to a clean folder
2. **Add** a `README.txt` with instructions
3. **Zip** the folder
4. **Share** with users!

Users just:
1. Extract the zip
2. Install Python 3.8+ (if not already installed)
3. Double-click `CopyDock.exe`
4. Done!

## 🚀 Advanced: 100% Standalone Build (No Python Needed)

If you want a truly standalone .exe with ZERO dependencies:

### Additional Step 1: Build Backend to .exe

```cmd
cd backend
pip install pyinstaller
pyinstaller --onefile --name copydock-backend --windowed server.py
```

This creates `backend\dist\copydock-backend.exe` (~80MB).

### Additional Step 2: Update Electron Config

Edit `electron\package.json`:

```json
"extraResources": [
  {
    "from": "../backend/dist/copydock-backend.exe",
    "to": "backend/copydock-backend.exe"
  },
  {
    "from": "../frontend/build",
    "to": "frontend"
  }
]
```

Edit `electron\main.js` (line 18):

```javascript
const BACKEND_EXE = app.isPackaged
    ? path.join(resourcesPath, 'backend', 'copydock-backend.exe')
    : path.join(__dirname, '../backend/dist/copydock-backend.exe');
```

And update the `startBackend()` function to launch the .exe instead of Python script.

### Additional Step 3: Rebuild Electron

```cmd
cd electron
npm run build:win
```

### Result

You now have a **single .exe (~280-350MB)** with:
- ✅ **Python runtime embedded**
- ✅ **Node.js runtime embedded**
- ✅ **ZERO dependencies**
- ✅ **Truly portable**

## 🐛 Troubleshooting

### "npm is not recognized"
- Restart your computer after installing Node.js
- Or add Node.js to PATH manually

### "python is not recognized"
- Reinstall Python with "Add to PATH" checked
- Or add Python to PATH manually

### Build fails with "wine is required"
- You're trying to build on Linux/Mac
- This guide is Windows-only
- Use GitHub Actions for cross-platform builds

### .exe is too large (>500MB)
- Normal for Electron apps with embedded backend
- Chrome engine alone is ~100MB
- Compare to VS Code (300MB), Slack (400MB), Discord (500MB)

### Black screen when opening .exe
- Make sure `frontend/package.json` has `"homepage": "./"`
- Rebuild frontend: `cd frontend && npm run build`
- Rebuild Electron: `cd electron && npm run build:win`

## 📊 File Size Comparison

| Build Type | Size | Python Required | Pros | Cons |
|------------|------|-----------------|------|------|
| START.bat | 6MB | ✅ Yes | Small, easy updates | Console window, needs Python |
| Portable .exe | 150-200MB | ✅ Yes | Professional, single file | Still needs Python |
| Standalone .exe | 280-350MB | ❌ No | Zero dependencies | Large file size |

## 🎨 Your Custom Logo

Your uploaded logo has been integrated as:
- `electron/assets/icon.ico` (Windows icon)
- `electron/assets/icon-*.png` (Multiple sizes)
- `electron/assets/icon-256x256.png` (Main icon)

The logo will appear as:
- Taskbar icon
- Window title bar icon
- Desktop shortcut icon (if you create one)
- App icon in Task Manager

## 📝 Next Steps

1. **Build the .exe** following the steps above
2. **Test it** on a clean Windows PC (without Python/Node.js)
3. **Package it** with instructions for your users
4. **Ship it!** 🚀

## 💡 Tips

- **First build takes longest** (10-15 min) - subsequent builds are faster (2-3 min)
- **Test on Windows 10 AND 11** - both are supported
- **Antivirus may flag it** - unsigned .exe files trigger warnings (normal)
- **Sign your .exe** with code signing certificate for professional distribution
- **Use NSIS installer** instead of portable .exe for enterprise deployment

## 🆘 Need Help?

Common issues:
1. Logo not appearing → Check `icon.ico` is 256x256+
2. Black screen → Verify `homepage: "./"` in `frontend/package.json`
3. Backend not starting → Check Python is in PATH
4. Build fails → Delete `node_modules` and `npm install` again

## 📚 Resources

- [Electron Builder Docs](https://www.electron.build/)
- [PyInstaller Manual](https://pyinstaller.org/)
- [Code Signing Guide](https://www.electron.build/code-signing)
- [NSIS Installer](https://www.electron.build/configuration/nsis)

---

**Built with ❤️ for CopyDock**

Last updated: October 2025

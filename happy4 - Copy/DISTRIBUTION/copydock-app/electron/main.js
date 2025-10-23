const { app, BrowserWindow, ipcMain, Menu, Tray, dialog } = require('electron');
const path = require('path');
const launcher = require('./launcher');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');

let mainWindow = null;
let nativeMessagingHost = null;
let tray = null;

// Paths
const isDev = process.env.NODE_ENV === 'development';
const resourcesPath = app.isPackaged 
    ? process.resourcesPath 
    : path.join(__dirname, '..');

const BACKEND_SCRIPT = app.isPackaged
    ? path.join(resourcesPath, 'backend', 'server.py')
    : path.join(__dirname, '../backend/server.py');

const FRONTEND_PATH = app.isPackaged
    ? path.join(resourcesPath, 'frontend', 'index.html')
    : path.join(__dirname, '../frontend/build/index.html');

const FRONTEND_URL = isDev 
    ? 'http://localhost:3000' 
    : `file://${FRONTEND_PATH}`;

console.log('[MAIN] Starting CopyDock Desktop App...');
console.log('[MAIN] Development mode:', isDev);
console.log('[MAIN] Packaged:', app.isPackaged);
console.log('[MAIN] Resources path:', resourcesPath);
console.log('[MAIN] Backend script:', BACKEND_SCRIPT);
console.log('[MAIN] Frontend URL:', FRONTEND_URL);

// Start FastAPI Backend using launcher
async function startBackend() {
    try {
        await launcher.startBackend(BACKEND_SCRIPT);
        console.log('[MAIN] Backend started successfully');
    } catch (err) {
        console.error('[MAIN] Failed to start backend:', err.message);
    }
}

// Create Main Window
function createWindow() {
    console.log('[WINDOW] Creating main window...');
    
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1000,
        minHeight: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        icon: path.join(__dirname, 'assets', process.platform === 'win32' ? 'icon.ico' : 'icon.png'),
        title: 'CopyDock',
        backgroundColor: '#1a1a1a',
        show: false // Don't show until ready
    });
    
    // Show window when ready
    mainWindow.once('ready-to-show', () => {
        console.log('[WINDOW] Window ready, showing...');
        mainWindow.show();
    });
    
    mainWindow.loadURL(FRONTEND_URL);
    
    if (isDev) {
        mainWindow.webContents.openDevTools();
    }
    
    mainWindow.on('closed', () => {
        console.log('[WINDOW] Window closed');
        mainWindow = null;
    });
    
    // Create application menu
    createMenu();
}

// Create Application Menu
function createMenu() {
    const template = [
        {
            label: 'File',
            submenu: [
                { role: 'quit' }
            ]
        },
        {
            label: 'Edit',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
                { role: 'selectAll' }
            ]
        },
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' }
            ]
        },
        {
            label: 'Help',
            submenu: [
                {
                    label: 'About CopyDock',
                    click: () => {
                        dialog.showMessageBox(mainWindow, {
                            title: 'About CopyDock',
                            message: 'CopyDock Desktop',
                            detail: `Version: 1.0.0\nChrome Extension Enabled\n\nA powerful note-taking app with web clipping.`,
                            type: 'info'
                        });
                    }
                },
                {
                    label: 'Chrome Extension Status',
                    click: () => {
                        const status = nativeMessagingHost ? 'Running' : 'Not Running';
                        dialog.showMessageBox(mainWindow, {
                            title: 'Extension Status',
                            message: 'Native Messaging Host',
                            detail: `Status: ${status}\n\nThe Chrome extension can connect when this app is running.`,
                            type: 'info'
                        });
                    }
                }
            ]
        }
    ];
    
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

// Start Native Messaging Host
function startNativeMessagingHost() {
    console.log('[NATIVE] Starting Native Messaging Host...');
    const hostPath = path.join(__dirname, 'native-messaging-host.js');
    
    nativeMessagingHost = spawn('node', [hostPath], {
        stdio: ['pipe', 'pipe', 'pipe']
    });
    
    nativeMessagingHost.stdout.on('data', (data) => {
        console.log(`[NATIVE] ${data.toString().trim()}`);
    });
    
    nativeMessagingHost.stderr.on('data', (data) => {
        console.error(`[NATIVE ERROR] ${data.toString().trim()}`);
    });
    
    nativeMessagingHost.on('close', (code) => {
        console.log(`[NATIVE] Native messaging host exited with code ${code}`);
    });
    
    nativeMessagingHost.on('error', (err) => {
        console.error('[NATIVE] Failed to start native messaging host:', err);
    });
}

// App Ready
app.whenReady().then(() => {
    console.log('[APP] Electron app ready');
    console.log('[APP] Platform:', process.platform);
    console.log('[APP] Version:', app.getVersion());
    
    // Start backend
    startBackend();
    
    // Wait for backend to start, then create window
    setTimeout(() => {
        createWindow();
        startNativeMessagingHost();
    }, 3000);
    
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Quit App
app.on('window-all-closed', () => {
    console.log('[APP] All windows closed');
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', () => {
    console.log('[APP] Quitting app, cleaning up...');
    
    // Stop backend using launcher
    launcher.stopBackend();
    
    // Kill native messaging host
    if (nativeMessagingHost) {
        console.log('[NATIVE] Killing native messaging host...');
        nativeMessagingHost.kill('SIGTERM');
        nativeMessagingHost = null;
    }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('[APP] Uncaught exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('[APP] Unhandled rejection at:', promise, 'reason:', reason);
});

console.log('[MAIN] Main process initialized');

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    platform: process.platform,
    isElectron: true,
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    openExternal: (url) => ipcRenderer.send('open-external', url),
    
    // Native messaging status
    getNativeMessagingStatus: () => ipcRenderer.invoke('get-native-messaging-status'),
    
    // App info
    getAppInfo: () => ({
        name: 'CopyDock Desktop',
        version: '1.0.0',
        isElectron: true
    })
});

console.log('[PRELOAD] Preload script loaded');

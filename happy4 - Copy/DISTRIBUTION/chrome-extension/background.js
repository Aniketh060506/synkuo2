/**
 * CopyDock Chrome Extension - Background Service Worker
 * Handles Native Messaging communication with desktop app
 */

let nativePort = null;
let isConnected = false;
let targetNotebook = { id: 'default', name: 'Loading...' };
let reconnectTimeout = null;

const NATIVE_APP_NAME = 'com.copydock.app';

console.log('[Background] Service worker started');

// Connect to Native Messaging Host (Desktop App)
function connectNativeApp() {
    try {
        console.log('[Background] Attempting to connect to native app...');
        
        nativePort = chrome.runtime.connectNative(NATIVE_APP_NAME);
        
        nativePort.onMessage.addListener((message) => {
            console.log('[Background] Received message from desktop:', message);
            handleNativeMessage(message);
        });
        
        nativePort.onDisconnect.addListener(() => {
            const error = chrome.runtime.lastError;
            console.log('[Background] Disconnected from desktop app', error);
            
            isConnected = false;
            nativePort = null;
            targetNotebook = { id: 'default', name: 'Desktop App Not Running' };
            
            // Notify all tabs about disconnection
            chrome.runtime.sendMessage({
                type: 'CONNECTION_STATUS',
                connected: false
            }).catch(() => {});
            
            // Try to reconnect after 5 seconds
            if (reconnectTimeout) clearTimeout(reconnectTimeout);
            reconnectTimeout = setTimeout(connectNativeApp, 5000);
        });
        
        // Send ping to verify connection
        sendNativeMessage({ type: 'PING' });
        
    } catch (error) {
        console.error('[Background] Failed to connect to native app:', error);
        isConnected = false;
        
        // Retry connection
        if (reconnectTimeout) clearTimeout(reconnectTimeout);
        reconnectTimeout = setTimeout(connectNativeApp, 5000);
    }
}

// Send message to desktop app
function sendNativeMessage(message) {
    if (nativePort) {
        try {
            console.log('[Background] Sending to desktop:', message);
            nativePort.postMessage(message);
        } catch (error) {
            console.error('[Background] Error sending message:', error);
        }
    } else {
        console.warn('[Background] Cannot send message - not connected to desktop app');
    }
}

// Handle messages from desktop app
function handleNativeMessage(message) {
    switch (message.type) {
        case 'PONG':
            console.log('[Background] Connected to desktop app!', message);
            isConnected = true;
            
            // Request target notebook info
            sendNativeMessage({ type: 'GET_TARGET_NOTEBOOK' });
            
            // Notify all tabs about connection
            chrome.runtime.sendMessage({
                type: 'CONNECTION_STATUS',
                connected: true
            }).catch(() => {});
            break;
        
        case 'TARGET_NOTEBOOK_RESPONSE':
            console.log('[Background] Target notebook updated:', message);
            targetNotebook = {
                id: message.notebookId,
                name: message.notebookName
            };
            
            // Notify all tabs about target notebook update
            chrome.runtime.sendMessage({
                type: 'TARGET_NOTEBOOK_UPDATED',
                notebook: targetNotebook
            }).catch(() => {});
            break;
        
        case 'CAPTURE_SUCCESS':
            console.log('[Background] Capture successful:', message);
            chrome.runtime.sendMessage({
                type: 'CAPTURE_RESULT',
                success: true,
                notebookName: message.notebookName,
                message: message.message
            }).catch(() => {});
            break;
        
        case 'CAPTURE_ERROR':
        case 'ERROR':
            console.error('[Background] Error from desktop:', message);
            chrome.runtime.sendMessage({
                type: 'CAPTURE_RESULT',
                success: false,
                message: message.message || 'Unknown error'
            }).catch(() => {});
            break;
        
        default:
            console.warn('[Background] Unknown message type:', message.type);
    }
}

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('[Background] Message from extension:', message);
    
    switch (message.type) {
        case 'GET_STATUS':
            sendResponse({
                connected: isConnected,
                targetNotebook: targetNotebook
            });
            break;
        
        case 'CAPTURE_CONTENT':
            if (isConnected) {
                sendNativeMessage({
                    type: 'CAPTURE_CONTENT',
                    payload: message.payload
                });
                sendResponse({ success: true, message: 'Sending to desktop app...' });
            } else {
                sendResponse({
                    success: false,
                    message: 'Desktop app not connected. Please open CopyDock desktop app.'
                });
            }
            break;
        
        case 'REFRESH_TARGET':
            if (isConnected) {
                sendNativeMessage({ type: 'GET_TARGET_NOTEBOOK' });
                sendResponse({ success: true });
            } else {
                sendResponse({ success: false, message: 'Not connected' });
            }
            break;
        
        default:
            console.warn('[Background] Unknown message type from extension:', message.type);
    }
    
    return true; // Keep channel open for async response
});

// Refresh target notebook every 10 seconds
setInterval(() => {
    if (isConnected) {
        sendNativeMessage({ type: 'GET_TARGET_NOTEBOOK' });
    }
}, 10000);

// Connect on startup
connectNativeApp();

console.log('[Background] Background script initialized');

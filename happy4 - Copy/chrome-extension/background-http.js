/**
 * CopyDock Chrome Extension - HTTP Background Worker
 * Direct HTTP communication with desktop app (no native messaging)
 */

let isConnected = false;
let targetNotebook = { id: 'default', name: 'Desktop app not running' };
let checkInterval = null;

const BACKEND_URL = 'http://localhost:8001';

console.log('[Background] HTTP mode - checking backend connection...');

// Check if backend is running via HTTP
async function checkConnection() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/health`, {
            method: 'GET',
            mode: 'cors'
        });
        
        if (response.ok) {
            if (!isConnected) {
                console.log('[Background] Connected to SynkUp backend');
                isConnected = true;
                targetNotebook = { id: 'default', name: 'Web Captures' };
                chrome.action.setTitle({ title: 'SynkUp - Connected' });
                
                // Load notebooks
                loadNotebooks();
            }
        } else {
            throw new Error('Backend not responding');
        }
    } catch (error) {
        if (isConnected) {
            console.log('[Background] Lost connection to backend');
            isConnected = false;
            targetNotebook = { id: 'default', name: 'Desktop app not running' };
            chrome.action.setTitle({ title: 'SynkUp - Disconnected' });
        }
    }
}

// Load notebooks from backend
async function loadNotebooks() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/notebooks`, {
            method: 'GET',
            mode: 'cors'
        });
        
        if (response.ok) {
            const notebooks = await response.json();
            if (notebooks.length > 0) {
                targetNotebook = {
                    id: notebooks[0].id,
                    name: notebooks[0].name
                };
                console.log('[Background] Target notebook:', targetNotebook);
            }
        }
    } catch (error) {
        console.log('[Background] Failed to load notebooks:', error.message);
    }
}

// Capture content via HTTP
async function captureContent(data) {
    try {
        console.log('[Background] Capturing content:', data);
        
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid capture data provided');
        }
        
        // Use existing web-capture endpoint
        const capturePayload = {
            selectedText: data.selectedText || '',
            selectedHTML: data.selectedHTML || '',
            sourceDomain: data.sourceDomain || 'unknown',
            sourceUrl: data.sourceUrl || 'unknown',
            targetNotebookId: targetNotebook.id || 'default',
            timestamp: data.timestamp || new Date().toISOString()
        };
        
        console.log('[Background] Sending to backend:', capturePayload);
        
        const response = await fetch(`${BACKEND_URL}/api/web-capture`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(capturePayload),
            mode: 'cors'
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('[Background] Content captured:', result);
            
            // Show success notification
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icon48.png',
                title: 'SynkUp',
                message: `Content saved to ${result.notebookName || 'notebook'}`
            });
            
            return result;
        } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
    } catch (error) {
        console.error('[Background] Capture failed:', error);
        
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icon48.png',
            title: 'SynkUp Error',
            message: 'Failed to capture content. Make sure SynkUp app is running.'
        });
        
        return { success: false, error: error.message };
    }
}

// Message handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('[Background] Received message:', message);
    
    switch (message.type) {
        case 'GET_STATUS':
            sendResponse({
                connected: isConnected,
                targetNotebook: targetNotebook
            });
            break;
            
        case 'GET_NOTEBOOKS':
            if (isConnected) {
                // Since /api/notebooks doesn't exist, create mock notebooks
                const mockNotebooks = [
                    { id: 'default', name: 'Web Captures' },
                    { id: 'notes', name: 'Notes' },
                    { id: 'research', name: 'Research' },
                    { id: 'bookmarks', name: 'Bookmarks' }
                ];
                sendResponse({ notebooks: mockNotebooks });
            } else {
                sendResponse({ notebooks: [] });
            }
            break;
            
        case 'SET_TARGET_NOTEBOOK':
            targetNotebook = {
                id: message.notebookId,
                name: message.notebookName || 'Selected Notebook'
            };
            console.log('[Background] Target notebook updated:', targetNotebook);
            sendResponse({ success: true });
            break;
            
        case 'CAPTURE_CONTENT':
            const captureData = message.data || message.payload || {};
            captureContent(captureData)
                .then(result => sendResponse(result))
                .catch(error => {
                    console.error('[Background] Capture error:', error);
                    sendResponse({ success: false, error: error.message });
                });
            return true; // Keep channel open for async response
            
        case 'REFRESH_STATUS':
            checkConnection().then(() => {
                sendResponse({
                    connected: isConnected,
                    targetNotebook: targetNotebook
                });
            });
            return true;
    }
});

// Context menu for right-click capture
chrome.contextMenus.create({
    id: 'synkup-capture',
    title: 'Send to SynkUp',
    contexts: ['selection']
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'synkup-capture') {
        captureContent({
            selectedText: info.selectionText,
            selectedHTML: '',
            sourceDomain: new URL(tab.url).hostname,
            sourceUrl: tab.url
        });
    }
});

// Start checking connection immediately and every 3 seconds
checkConnection();
checkInterval = setInterval(checkConnection, 3000);

// Set initial state
chrome.action.setTitle({ title: 'SynkUp - Checking...' });

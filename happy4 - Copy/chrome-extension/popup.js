/**
 * CopyDock Chrome Extension - Popup Script
 * Displays connection status and target notebook
 */

let connectionStatusEl = document.getElementById('connection-status');
let notebookSelector = document.getElementById('notebook-selector');
let testButton = document.getElementById('test-capture');
let refreshButton = document.getElementById('refresh-button');

let availableNotebooks = [];
let selectedNotebookId = null;

console.log('[Popup] Popup opened');

// Update UI with current status
function updateUI(status) {
    console.log('[Popup] Updating UI with status:', status);
    
    if (status.connected) {
        connectionStatusEl.innerHTML = '<span class="status-dot connected"></span> Connected ✅';
        connectionStatusEl.className = 'status connected';
        testButton.disabled = false;
        refreshButton.disabled = false;
        
        // Load notebooks
        loadNotebooks();
    } else {
        connectionStatusEl.innerHTML = '<span class="status-dot disconnected"></span> Disconnected ❌';
        connectionStatusEl.className = 'status disconnected';
        testButton.disabled = true;
        refreshButton.disabled = true;
        
        // Clear notebook selector
        notebookSelector.innerHTML = '<option value="">Desktop app not running</option>';
        notebookSelector.disabled = true;
    }
}

// Load available notebooks
function loadNotebooks() {
    chrome.runtime.sendMessage({ type: 'GET_NOTEBOOKS' }, (response) => {
        if (response && response.notebooks) {
            availableNotebooks = response.notebooks;
            populateNotebookSelector();
        }
    });
}

// Populate notebook selector dropdown
function populateNotebookSelector() {
    notebookSelector.innerHTML = '';
    
    availableNotebooks.forEach(notebook => {
        const option = document.createElement('option');
        option.value = notebook.id;
        option.textContent = notebook.name;
        notebookSelector.appendChild(option);
    });
    
    // Select first notebook by default or previously selected
    if (availableNotebooks.length > 0) {
        selectedNotebookId = selectedNotebookId || availableNotebooks[0].id;
        notebookSelector.value = selectedNotebookId;
        notebookSelector.disabled = false;
    }
}

// Handle notebook selection change
if (notebookSelector) {
    notebookSelector.addEventListener('change', (e) => {
        selectedNotebookId = e.target.value;
        console.log('[Popup] Selected notebook:', selectedNotebookId);
        
        // Save selection for next time
        chrome.storage.local.set({ selectedNotebookId: selectedNotebookId });
        
        // Notify background script
        chrome.runtime.sendMessage({
            type: 'SET_TARGET_NOTEBOOK',
            notebookId: selectedNotebookId
        });
    });
}

// Load saved selection
chrome.storage.local.get(['selectedNotebookId'], (result) => {
    if (result.selectedNotebookId) {
        selectedNotebookId = result.selectedNotebookId;
    }
});

// Get status from background script
function checkStatus() {
    chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (response) => {
        if (response) {
            updateUI(response);
        }
    });
}

// Initial status check
checkStatus();

// Listen for status updates
chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'CONNECTION_STATUS' || message.type === 'TARGET_NOTEBOOK_UPDATED') {
        checkStatus();
    }
});

// Test capture button
if (testButton) {
    testButton.addEventListener('click', () => {
        chrome.runtime.sendMessage({
            type: 'CAPTURE_CONTENT',
            payload: {
                selectedText: 'Test capture from extension popup',
                selectedHTML: '<p>Test capture from extension popup</p>',
                sourceDomain: 'extension-popup',
                sourceUrl: 'chrome-extension://popup',
                timestamp: new Date().toISOString()
            }
        }, (response) => {
            if (response && response.success) {
                testButton.textContent = 'Sent! ✅';
                setTimeout(() => {
                    testButton.textContent = 'Test Capture';
                }, 2000);
            } else {
                testButton.textContent = 'Failed ❌';
                setTimeout(() => {
                    testButton.textContent = 'Test Capture';
                }, 2000);
            }
        });
    });
}

// Refresh button
if (refreshButton) {
    refreshButton.addEventListener('click', () => {
        refreshButton.textContent = 'Refreshing...';
        chrome.runtime.sendMessage({ type: 'REFRESH_TARGET' }, () => {
            setTimeout(() => {
                refreshButton.textContent = '🔄 Refresh';
                checkStatus();
            }, 500);
        });
    });
}

// Auto-refresh every 3 seconds
setInterval(checkStatus, 3000);

console.log('[Popup] Popup script ready');

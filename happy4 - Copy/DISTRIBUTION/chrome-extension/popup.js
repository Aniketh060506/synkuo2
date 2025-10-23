/**
 * CopyDock Chrome Extension - Popup Script
 * Displays connection status and target notebook
 */

let connectionStatusEl = document.getElementById('connection-status');
let targetNotebookEl = document.getElementById('target-notebook');
let testButton = document.getElementById('test-capture');
let refreshButton = document.getElementById('refresh-button');

console.log('[Popup] Popup opened');

// Update UI with current status
function updateUI(status) {
    console.log('[Popup] Updating UI with status:', status);
    
    if (status.connected) {
        connectionStatusEl.innerHTML = '<span class="status-dot connected"></span> Connected ✅';
        connectionStatusEl.className = 'status connected';
        targetNotebookEl.innerHTML = `Target: <strong>${status.targetNotebook.name}</strong>`;
        testButton.disabled = false;
        refreshButton.disabled = false;
    } else {
        connectionStatusEl.innerHTML = '<span class="status-dot disconnected"></span> Disconnected ❌';
        connectionStatusEl.className = 'status disconnected';
        targetNotebookEl.innerHTML = '<em>Desktop app not running</em><br><small style="color: #888;">Please open CopyDock desktop app</small>';
        testButton.disabled = true;
        refreshButton.disabled = true;
    }
}

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

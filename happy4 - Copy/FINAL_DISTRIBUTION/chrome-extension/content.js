/**
 * CopyDock Chrome Extension - Content Script
 * Handles text selection and floating button UI
 */

let floatingButton = null;
let targetNotebookName = 'Loading...';
let isConnected = false;

console.log('[Content] CopyDock content script loaded');

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message) => {
    console.log('[Content] Received message:', message);
    
    switch (message.type) {
        case 'CONNECTION_STATUS':
            isConnected = message.connected;
            if (!isConnected) {
                targetNotebookName = 'Desktop App Not Running';
                updateFloatingButton();
            }
            break;
        
        case 'TARGET_NOTEBOOK_UPDATED':
            targetNotebookName = message.notebook.name;
            isConnected = true;
            updateFloatingButton();
            break;
        
        case 'CAPTURE_RESULT':
            if (message.success) {
                showToast(`✅ Saved to ${message.notebookName}`, 'success');
            } else {
                showToast(`❌ ${message.message}`, 'error');
            }
            hideFloatingButton();
            break;
    }
});

// Get initial status from background
chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (response) => {
    if (response) {
        isConnected = response.connected;
        if (response.targetNotebook) {
            targetNotebookName = response.targetNotebook.name;
        }
        console.log('[Content] Initial status:', { isConnected, targetNotebookName });
    }
});

// Show floating button on text selection
document.addEventListener('mouseup', (e) => {
    // Small delay to ensure selection is complete
    setTimeout(() => {
        const selectedText = window.getSelection().toString().trim();
        
        if (selectedText.length > 0) {
            showFloatingButton(e.pageX, e.pageY);
        } else {
            hideFloatingButton();
        }
    }, 10);
});

// Hide button when clicking elsewhere
document.addEventListener('mousedown', (e) => {
    if (floatingButton && !floatingButton.contains(e.target)) {
        const selectedText = window.getSelection().toString().trim();
        if (selectedText.length === 0) {
            hideFloatingButton();
        }
    }
});

function showFloatingButton(x, y) {
    if (!floatingButton) {
        floatingButton = document.createElement('div');
        floatingButton.id = 'copydock-floating-button';
        floatingButton.className = 'copydock-floating-button';
        document.body.appendChild(floatingButton);
        
        floatingButton.addEventListener('click', (e) => {
            e.stopPropagation();
            captureSelection();
        });
    }
    
    updateFloatingButton();
    
    // Position button
    floatingButton.style.left = `${x}px`;
    floatingButton.style.top = `${y + 20}px`;
    floatingButton.style.display = 'block';
    
    // Add animation
    floatingButton.style.opacity = '0';
    floatingButton.style.transform = 'translateY(-5px)';
    setTimeout(() => {
        floatingButton.style.opacity = '1';
        floatingButton.style.transform = 'translateY(0)';
    }, 10);
}

function updateFloatingButton() {
    if (floatingButton) {
        if (isConnected) {
            floatingButton.innerHTML = `📋 Send to <strong>${targetNotebookName}</strong>`;
            floatingButton.style.cursor = 'pointer';
            floatingButton.style.opacity = '1';
        } else {
            floatingButton.innerHTML = `⚠️ Desktop App Not Running`;
            floatingButton.style.cursor = 'not-allowed';
            floatingButton.style.opacity = '0.7';
        }
    }
}

function hideFloatingButton() {
    if (floatingButton) {
        floatingButton.style.opacity = '0';
        floatingButton.style.transform = 'translateY(-5px)';
        setTimeout(() => {
            if (floatingButton) {
                floatingButton.style.display = 'none';
            }
        }, 200);
    }
}

function captureSelection() {
    if (!isConnected) {
        showToast('⚠️ Please open CopyDock desktop app', 'warning');
        return;
    }
    
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
    }, (response) => {
        if (response && !response.success) {
            showToast(`❌ ${response.message}`, 'error');
        } else {
            showToast('📤 Sending to CopyDock...', 'info');
        }
    });
}

function showToast(message, type = 'info') {
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

// Keyboard shortcut handler
document.addEventListener('keydown', (e) => {
    // Ctrl+Shift+C or Cmd+Shift+C
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        const selectedText = window.getSelection().toString().trim();
        if (selectedText) {
            e.preventDefault();
            captureSelection();
        }
    }
});

console.log('[Content] CopyDock content script ready');

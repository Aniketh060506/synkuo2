/**
 * Native Messaging Host for Chrome Extension
 * 
 * This script implements Chrome's Native Messaging protocol:
 * - Reads messages from STDIN (4-byte length prefix + JSON)
 * - Sends messages to STDOUT (4-byte length prefix + JSON)
 * - Communicates with local backend API (http://localhost:8001)
 */

const axios = require('axios');

const BACKEND_URL = 'http://localhost:8001';

// Enable/disable debug logging
const DEBUG = true;

function log(message) {
    if (DEBUG) {
        // Write to stderr so it doesn't interfere with STDOUT communication
        process.stderr.write(`[NATIVE HOST] ${message}\n`);
    }
}

// Send message to Chrome Extension
function sendMessage(message) {
    try {
        const json = JSON.stringify(message);
        const length = Buffer.byteLength(json);
        
        // Create 4-byte length buffer (little-endian)
        const lengthBuffer = Buffer.alloc(4);
        lengthBuffer.writeUInt32LE(length, 0);
        
        // Write length prefix
        process.stdout.write(lengthBuffer);
        // Write JSON message
        process.stdout.write(json);
        
        log(`Sent message: ${json}`);
    } catch (error) {
        log(`Error sending message: ${error.message}`);
    }
}

// Read message from Chrome Extension
function readMessage(callback) {
    let lengthBuffer = Buffer.alloc(4);
    let lengthBytesRead = 0;
    
    // Read 4-byte length prefix
    const readLength = () => {
        const chunk = process.stdin.read(4 - lengthBytesRead);
        if (chunk) {
            chunk.copy(lengthBuffer, lengthBytesRead);
            lengthBytesRead += chunk.length;
            
            if (lengthBytesRead === 4) {
                const length = lengthBuffer.readUInt32LE(0);
                log(`Message length: ${length} bytes`);
                readContent(length);
            } else {
                process.stdin.once('readable', readLength);
            }
        } else {
            process.stdin.once('readable', readLength);
        }
    };
    
    // Read JSON message content
    const readContent = (length) => {
        let contentBuffer = Buffer.alloc(length);
        let contentBytesRead = 0;
        
        const readChunk = () => {
            const chunk = process.stdin.read(length - contentBytesRead);
            if (chunk) {
                chunk.copy(contentBuffer, contentBytesRead);
                contentBytesRead += chunk.length;
                
                if (contentBytesRead === length) {
                    const json = contentBuffer.toString('utf8');
                    log(`Received message: ${json}`);
                    
                    try {
                        const message = JSON.parse(json);
                        callback(message);
                    } catch (error) {
                        log(`Error parsing message: ${error.message}`);
                        sendMessage({ type: 'ERROR', message: 'Invalid JSON' });
                    }
                    
                    // Ready for next message
                    lengthBuffer = Buffer.alloc(4);
                    lengthBytesRead = 0;
                    process.stdin.once('readable', readLength);
                } else {
                    process.stdin.once('readable', readChunk);
                }
            } else {
                process.stdin.once('readable', readChunk);
            }
        };
        
        readChunk();
    };
    
    readLength();
}

// Handle incoming messages from Chrome Extension
async function handleMessage(message) {
    try {
        log(`Handling message type: ${message.type}`);
        
        switch (message.type) {
            case 'PING':
                // Connection check
                sendMessage({
                    type: 'PONG',
                    connected: true,
                    appVersion: '1.0.0',
                    timestamp: new Date().toISOString()
                });
                break;
            
            case 'GET_TARGET_NOTEBOOK':
                // Get current target notebook from backend
                try {
                    const response = await axios.get(`${BACKEND_URL}/api/settings/target-notebook`);
                    sendMessage({
                        type: 'TARGET_NOTEBOOK_RESPONSE',
                        notebookId: response.data.notebookId,
                        notebookName: response.data.notebookName
                    });
                } catch (error) {
                    log(`Error getting target notebook: ${error.message}`);
                    sendMessage({
                        type: 'TARGET_NOTEBOOK_RESPONSE',
                        notebookId: 'default',
                        notebookName: 'Web Captures'
                    });
                }
                break;
            
            case 'CAPTURE_CONTENT':
                // Save web capture to backend
                try {
                    const response = await axios.post(
                        `${BACKEND_URL}/api/web-capture`,
                        message.payload
                    );
                    
                    if (response.data.success) {
                        sendMessage({
                            type: 'CAPTURE_SUCCESS',
                            notebookName: response.data.notebookName,
                            message: 'Content saved successfully'
                        });
                    } else {
                        throw new Error(response.data.message || 'Unknown error');
                    }
                } catch (error) {
                    log(`Error capturing content: ${error.message}`);
                    sendMessage({
                        type: 'CAPTURE_ERROR',
                        message: error.message || 'Failed to save content'
                    });
                }
                break;
            
            default:
                log(`Unknown message type: ${message.type}`);
                sendMessage({
                    type: 'ERROR',
                    message: `Unknown message type: ${message.type}`
                });
        }
    } catch (error) {
        log(`Error handling message: ${error.message}`);
        sendMessage({
            type: 'ERROR',
            message: error.message
        });
    }
}

// Start listening for messages
log('Native Messaging Host started');
log(`Backend URL: ${BACKEND_URL}`);
log('Waiting for messages from Chrome Extension...');

process.stdin.on('readable', () => {
    readMessage(handleMessage);
});

process.stdin.on('end', () => {
    log('STDIN ended, exiting...');
    process.exit(0);
});

process.stdin.on('error', (error) => {
    log(`STDIN error: ${error.message}`);
    process.exit(1);
});

// Handle process signals
process.on('SIGTERM', () => {
    log('Received SIGTERM, exiting...');
    process.exit(0);
});

process.on('SIGINT', () => {
    log('Received SIGINT, exiting...');
    process.exit(0);
});

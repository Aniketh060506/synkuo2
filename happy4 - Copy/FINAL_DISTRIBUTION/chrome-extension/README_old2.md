# CopyDock Chrome Extension Setup Guide

## 🚀 Features

- ✅ **Floating Button** - Select text on any webpage, get a beautiful "Send to CopyDock" button
- ✅ **Keyboard Shortcut** - Press `Ctrl+Shift+C` (or `Cmd+Shift+C` on Mac) to capture
- ✅ **Right-Click Menu** - Context menu "Send to CopyDock" option
- ✅ **Native Messaging** - Direct communication with desktop app (no localhost needed!)
- ✅ **Connection Status** - See if desktop app is running
- ✅ **Target Notebook** - Shows which notebook content will be saved to

---

## 📋 Installation Steps

### Part 1: Install Chrome Extension

1. **Open Chrome** and go to `chrome://extensions/`
2. **Enable Developer Mode** (toggle in top right)
3. **Click "Load unpacked"**
4. **Select the folder**: `/app/chrome-extension/`
5. **Note the Extension ID** (looks like: `abcdefghijklmnopqrstuvwxyz123456`)

### Part 2: Setup Native Messaging for Desktop App

The desktop app needs to register itself with Chrome to receive messages from the extension.

#### **Windows Setup:**

1. **Update the manifest file** (`com.copydock.app.json`):
   - Replace `COPYDOCK_APP_PATH` with actual path to your desktop app executable
   - Replace `EXTENSION_ID_HERE` with the Chrome extension ID from Part 1
   
   Example:
   ```json
   {
     "name": "com.copydock.app",
     "description": "CopyDock Desktop App Native Messaging Host",
     "path": "C:\\Program Files\\CopyDock\\copydock.exe",
     "type": "stdio",
     "allowed_origins": [
       "chrome-extension://abcdefghijklmnopqrstuvwxyz123456/"
     ]
   }
   ```

2. **Register with Windows Registry**:
   
   Create a `.reg` file with this content:
   ```reg
   Windows Registry Editor Version 5.00

   [HKEY_CURRENT_USER\Software\Google\Chrome\NativeMessagingHosts\com.copydock.app]
   @="C:\\path\\to\\com.copydock.app.json"
   ```
   
   Replace `C:\\path\\to\\com.copydock.app.json` with actual path to the JSON file.
   
   Double-click the `.reg` file to install.

#### **Mac Setup:**

1. **Update the manifest file** (`com.copydock.app.json`):
   ```json
   {
     "name": "com.copydock.app",
     "description": "CopyDock Desktop App Native Messaging Host",
     "path": "/Applications/CopyDock.app/Contents/MacOS/copydock",
     "type": "stdio",
     "allowed_origins": [
       "chrome-extension://EXTENSION_ID_HERE/"
     ]
   }
   ```

2. **Install the manifest**:
   ```bash
   mkdir -p ~/Library/Application\ Support/Google/Chrome/NativeMessagingHosts/
   cp com.copydock.app.json ~/Library/Application\ Support/Google/Chrome/NativeMessagingHosts/
   ```

#### **Linux Setup:**

1. **Update the manifest file** (`com.copydock.app.json`):
   ```json
   {
     "name": "com.copydock.app",
     "description": "CopyDock Desktop App Native Messaging Host",
     "path": "/usr/local/bin/copydock",
     "type": "stdio",
     "allowed_origins": [
       "chrome-extension://EXTENSION_ID_HERE/"
     ]
   }
   ```

2. **Install the manifest**:
   ```bash
   mkdir -p ~/.config/google-chrome/NativeMessagingHosts/
   cp com.copydock.app.json ~/.config/google-chrome/NativeMessagingHosts/
   ```

---

## 🖥️ Desktop App Requirements

Your CopyDock desktop app (`.exe`) needs to implement **Chrome Native Messaging Protocol**:

### Protocol Overview:

1. **Communication Method**: STDIN/STDOUT
2. **Message Format**: JSON with 4-byte length prefix (little-endian)

### Message Structure:

**From Extension to App:**
```json
{
  "type": "CONTENT_CAPTURE",
  "payload": {
    "selectedText": "The selected text content",
    "selectedHTML": "<p>HTML version</p>",
    "sourceDomain": "wikipedia.org",
    "sourceUrl": "https://en.wikipedia.org/wiki/Something",
    "targetNotebookId": "nb_12345",
    "timestamp": "2025-01-20T10:30:00.000Z"
  }
}
```

**From App to Extension:**
```json
{
  "type": "CAPTURE_SUCCESS",
  "notebookName": "Work Notes"
}
```

```json
{
  "type": "TARGET_NOTEBOOK_UPDATE",
  "notebookId": "nb_12345",
  "notebookName": "Work Notes"
}
```

### Python Example (for .exe built with PyInstaller):

```python
#!/usr/bin/env python
import sys
import json
import struct

def send_message(message):
    """Send message to Chrome extension"""
    encoded = json.dumps(message).encode('utf-8')
    sys.stdout.buffer.write(struct.pack('I', len(encoded)))
    sys.stdout.buffer.write(encoded)
    sys.stdout.buffer.flush()

def read_message():
    """Read message from Chrome extension"""
    text_length_bytes = sys.stdin.buffer.read(4)
    if not text_length_bytes:
        return None
    text_length = struct.unpack('I', text_length_bytes)[0]
    text = sys.stdin.buffer.read(text_length).decode('utf-8')
    return json.loads(text)

def handle_capture(payload):
    """Handle content capture from extension"""
    # Save to your database/storage
    # ... your code here ...
    
    # Send success response
    send_message({
        "type": "CAPTURE_SUCCESS",
        "notebookName": "Work Notes"
    })

def main():
    while True:
        message = read_message()
        if message is None:
            break
            
        if message['type'] == 'CONTENT_CAPTURE':
            handle_capture(message['payload'])

if __name__ == '__main__':
    main()
```

---

## 🧪 Testing

1. **Start your CopyDock desktop app**
2. **Open Chrome extension popup** - should show "Connected ✅"
3. **Go to any website** (e.g., Wikipedia)
4. **Select some text**
5. **Click the floating "📋 Send to CopyDock" button**
6. **Check your desktop app** - content should appear in target notebook!

---

## 🎯 User Experience Flow

1. User browses a website
2. Selects interesting text/content
3. Beautiful floating button appears: "📋 Send to CopyDock"
4. User clicks button (or presses `Ctrl+Shift+C`)
5. Content instantly saves to desktop app
6. Toast notification: "✅ Saved to Work Notes"

---

## 🔧 Troubleshooting

### Extension shows "Disconnected"
- Make sure CopyDock desktop app is running
- Check native messaging host is registered correctly
- Verify Extension ID in manifest matches actual ID

### Button doesn't appear on selection
- Check if content scripts are loading (inspect page console)
- Try reloading the webpage

### Content not saving
- Check desktop app's native messaging implementation
- Look at app logs for errors
- Test with simple JSON message first

---

## 📚 Additional Resources

- [Chrome Native Messaging Documentation](https://developer.chrome.com/docs/apps/nativeMessaging/)
- [Native Messaging Protocol](https://developer.chrome.com/docs/extensions/mv3/nativeMessaging/#native-messaging-host-protocol)

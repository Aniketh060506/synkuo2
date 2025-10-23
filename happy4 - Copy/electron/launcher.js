// Backend launcher with embedded Python support
const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { app, dialog } = require('electron');

let backendProcess = null;

function findPython() {
    // Try to find Python in system
    const pythonCommands = ['python', 'python3', 'py'];
    
    for (const cmd of pythonCommands) {
        try {
            const version = execSync(`${cmd} --version`, { encoding: 'utf8', stdio: 'pipe' });
            if (version.includes('Python 3')) {
                console.log(`[LAUNCHER] Found Python: ${cmd} - ${version.trim()}`);
                return cmd;
            }
        } catch (e) {
            // Try next command
        }
    }
    
    return null;
}

function installDependencies(pythonCmd, requirementsPath) {
    console.log('[LAUNCHER] Installing Python dependencies...');
    try {
        execSync(`${pythonCmd} -m pip install -r "${requirementsPath}" --quiet`, {
            encoding: 'utf8',
            stdio: 'inherit'
        });
        console.log('[LAUNCHER] Dependencies installed successfully');
        return true;
    } catch (e) {
        console.error('[LAUNCHER] Failed to install dependencies:', e.message);
        return false;
    }
}

function startBackend(backendScript) {
    return new Promise((resolve, reject) => {
        const pythonCmd = findPython();
        
        if (!pythonCmd) {
            const error = 'Python 3 is not installed or not found in PATH';
            console.error(`[LAUNCHER] ${error}`);
            dialog.showErrorBox(
                'Python Required',
                `${error}\n\nPlease install Python 3.8+ from:\nhttps://www.python.org/downloads/\n\nMake sure to check "Add Python to PATH" during installation.`
            );
            reject(new Error(error));
            return;
        }
        
        // Check if requirements.txt exists and install dependencies
        const requirementsPath = path.join(path.dirname(backendScript), 'requirements.txt');
        if (fs.existsSync(requirementsPath)) {
            const flagFile = path.join(app.getPath('userData'), '.dependencies_installed');
            if (!fs.existsSync(flagFile)) {
                if (installDependencies(pythonCmd, requirementsPath)) {
                    fs.writeFileSync(flagFile, new Date().toISOString());
                }
            }
        }
        
        // Check if port 8001 is already in use
        try {
            if (process.platform === 'win32') {
                execSync('netstat -ano | findstr :8001', { stdio: 'pipe' });
                console.log('[LAUNCHER] Backend already running on port 8001');
                resolve();
                return;
            }
        } catch (e) {
            // Port not in use, continue
        }
        
        console.log('[LAUNCHER] Starting backend server...');
        backendProcess = spawn(pythonCmd, [backendScript], {
            detached: false,
            stdio: ['ignore', 'pipe', 'pipe'],
            cwd: path.dirname(backendScript)
        });
        
        backendProcess.stdout.on('data', (data) => {
            console.log(`[BACKEND] ${data.toString().trim()}`);
        });
        
        backendProcess.stderr.on('data', (data) => {
            const msg = data.toString().trim();
            if (!msg.includes('WARNING')) {
                console.error(`[BACKEND ERROR] ${msg}`);
            }
        });
        
        backendProcess.on('close', (code) => {
            console.log(`[BACKEND] Process exited with code ${code}`);
        });
        
        backendProcess.on('error', (err) => {
            console.error('[BACKEND] Failed to start:', err);
            reject(err);
        });
        
        // Wait a moment for backend to start
        setTimeout(() => {
            resolve();
        }, 2000);
    });
}

function stopBackend() {
    if (backendProcess && !backendProcess.killed) {
        console.log('[LAUNCHER] Stopping backend server...');
        backendProcess.kill();
        backendProcess = null;
    }
}

module.exports = {
    startBackend,
    stopBackend,
    findPython
};

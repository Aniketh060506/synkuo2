@echo off
title CopyDock Extension Fix
color 0A

echo ================================================================
echo                    CopyDock Extension Fix
echo ================================================================
echo.

REM Step 1: Get current directory
set "CURRENT_DIR=%~dp0"
echo Current directory: %CURRENT_DIR%

REM Step 2: Check if CopyDock is installed
set "INSTALLED_PATH=C:\Program Files\CopyDock"
if exist "%INSTALLED_PATH%" (
    echo [✓] Found CopyDock installation at: %INSTALLED_PATH%
    set "NATIVE_HOST=%INSTALLED_PATH%\resources\app.asar.unpacked\native-messaging-host.js"
) else (
    echo [!] CopyDock not installed. Using portable version...
    set "NATIVE_HOST=%CURRENT_DIR%electron\native-messaging-host.js"
)

echo Native host path: %NATIVE_HOST%

REM Step 3: Create native messaging manifest
set "MANIFEST_DIR=%LOCALAPPDATA%\CopyDock"
if not exist "%MANIFEST_DIR%" mkdir "%MANIFEST_DIR%"

set "MANIFEST_FILE=%MANIFEST_DIR%\com.copydock.app.json"

echo [→] Creating native messaging manifest...
echo {> "%MANIFEST_FILE%"
echo   "name": "com.copydock.app",>> "%MANIFEST_FILE%"
echo   "description": "CopyDock Native Messaging Host",>> "%MANIFEST_FILE%"
echo   "path": "node.exe",>> "%MANIFEST_FILE%"
echo   "type": "stdio",>> "%MANIFEST_FILE%"
echo   "allowed_origins": [>> "%MANIFEST_FILE%"
echo     "chrome-extension://*/">> "%MANIFEST_FILE%"
echo   ]>> "%MANIFEST_FILE%"
echo }>> "%MANIFEST_FILE%"

REM Step 4: Register with Chrome
echo [→] Registering with Chrome...
reg add "HKCU\SOFTWARE\Google\Chrome\NativeMessagingHosts\com.copydock.app" /ve /t REG_SZ /d "%MANIFEST_FILE%" /f >nul 2>&1

if %ERRORLEVEL% EQU 0 (
    echo [✓] Registry entry created successfully
) else (
    echo [!] Failed to create registry entry - try running as administrator
)

REM Step 5: Check if Node.js is available
echo [→] Checking Node.js...
node --version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [✓] Node.js is available
) else (
    echo [!] Node.js not found in PATH
)

echo.
echo ================================================================
echo                        INSTRUCTIONS
echo ================================================================
echo.
echo 1. CLOSE Chrome completely (all windows)
echo 2. START CopyDock desktop app first
echo 3. OPEN Chrome and go to chrome://extensions/
echo 4. ENABLE "Developer mode" (top right)
echo 5. CLICK "Load unpacked"
echo 6. SELECT: %CURRENT_DIR%chrome-extension\
echo 7. TEST: Click extension icon - should show "Connected"
echo.
echo If still not working:
echo - Try running this script as Administrator
echo - Check if CopyDock app is running on port 8001
echo - Restart computer and try again
echo.
pause

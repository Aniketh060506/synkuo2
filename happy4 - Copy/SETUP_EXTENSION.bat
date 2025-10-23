@echo off
title CopyDock Extension Setup
echo Setting up Chrome Extension Native Messaging...
echo.

REM Detect CopyDock installation paths
set "PORTABLE_PATH=%~dp0electron\native-messaging-host.js"
set "INSTALLED_PATH1=C:\Program Files\CopyDock\resources\app.asar.unpacked\native-messaging-host.js"
set "INSTALLED_PATH2=%LOCALAPPDATA%\Programs\CopyDock\resources\app.asar.unpacked\native-messaging-host.js"
set "INSTALLED_PATH3=%APPDATA%\CopyDock\resources\app.asar.unpacked\native-messaging-host.js"

REM Find which path exists
set "NATIVE_HOST_PATH="
if exist "%INSTALLED_PATH1%" (
    set "NATIVE_HOST_PATH=%INSTALLED_PATH1%"
    echo Found CopyDock at: Program Files
) else if exist "%INSTALLED_PATH2%" (
    set "NATIVE_HOST_PATH=%INSTALLED_PATH2%"
    echo Found CopyDock at: LocalAppData
) else if exist "%INSTALLED_PATH3%" (
    set "NATIVE_HOST_PATH=%INSTALLED_PATH3%"
    echo Found CopyDock at: AppData
) else if exist "%PORTABLE_PATH%" (
    set "NATIVE_HOST_PATH=%PORTABLE_PATH%"
    echo Found CopyDock at: Portable location
) else (
    echo ❌ CopyDock installation not found!
    echo.
    echo Please make sure CopyDock is installed or running from this folder.
    pause
    exit /b 1
)

echo Using native host: %NATIVE_HOST_PATH%
echo.

REM Create native messaging manifest directory
set "MANIFEST_DIR=%LOCALAPPDATA%\CopyDock"
if not exist "%MANIFEST_DIR%" mkdir "%MANIFEST_DIR%"

REM Create the native messaging manifest with correct path
set "MANIFEST_FILE=%MANIFEST_DIR%\com.copydock.app.json"
echo Creating manifest at: %MANIFEST_FILE%

echo {> "%MANIFEST_FILE%"
echo   "name": "com.copydock.app",>> "%MANIFEST_FILE%"
echo   "description": "CopyDock Native Messaging Host",>> "%MANIFEST_FILE%"
echo   "path": "node.exe",>> "%MANIFEST_FILE%"
echo   "type": "stdio",>> "%MANIFEST_FILE%"
echo   "allowed_origins": [>> "%MANIFEST_FILE%"
echo     "chrome-extension://*/">> "%MANIFEST_FILE%"
echo   ]>> "%MANIFEST_FILE%"
echo }>> "%MANIFEST_FILE%"

REM Register with Chrome
echo Registering with Chrome...
reg add "HKCU\SOFTWARE\Google\Chrome\NativeMessagingHosts\com.copydock.app" /ve /t REG_SZ /d "%MANIFEST_FILE%" /f >nul 2>&1

if %ERRORLEVEL% EQU 0 (
    echo ✅ Chrome extension setup complete!
) else (
    echo ❌ Failed to register with Chrome (try running as Administrator)
)

echo.
echo ================================================================
echo                     SETUP COMPLETE
echo ================================================================
echo.
echo Next steps:
echo 1. Start CopyDock desktop app
echo 2. Open Chrome: chrome://extensions/
echo 3. Enable "Developer mode"
echo 4. Click "Load unpacked"
echo 5. Select: %~dp0chrome-extension\
echo 6. Test the extension!
echo.
pause

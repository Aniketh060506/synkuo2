@echo off
title SynkUp - Chrome Extension Setup
echo Setting up Chrome Extension Native Messaging...

REM Get the installation directory
set "INSTALL_DIR=%~dp0"
set "NATIVE_HOST_PATH=%INSTALL_DIR%native-messaging-host.js"

REM Create manifest in user's local folder (not hardcoded)
set "MANIFEST_DIR=%LOCALAPPDATA%\SynkUp"
if not exist "%MANIFEST_DIR%" mkdir "%MANIFEST_DIR%"
set "MANIFEST_PATH=%MANIFEST_DIR%\com.synkup.app.json"

REM Create native messaging manifest with dynamic path
echo {> "%MANIFEST_PATH%"
echo   "name": "com.synkup.app",>> "%MANIFEST_PATH%"
echo   "description": "SynkUp Native Messaging Host",>> "%MANIFEST_PATH%"
echo   "path": "node.exe",>> "%MANIFEST_PATH%"
echo   "type": "stdio",>> "%MANIFEST_PATH%"
echo   "allowed_origins": [>> "%MANIFEST_PATH%"
echo     "chrome-extension://**/">> "%MANIFEST_PATH%"
echo   ]>> "%MANIFEST_PATH%"
echo }>> "%MANIFEST_PATH%"

REM Register native messaging host
reg add "HKCU\SOFTWARE\Google\Chrome\NativeMessagingHosts\com.synkup.app" /ve /t REG_SZ /d "%MANIFEST_PATH%" /f > nul 2>&1

echo ✅ Chrome Extension setup complete!
echo You can now load the Chrome extension from: %INSTALL_DIR%resources\chrome-extension\
echo Make sure Node.js is installed and SynkUp app is running.
pause

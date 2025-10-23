@echo off
echo Creating native messaging setup...

REM Create manifest that points to Node.js with the script
set "SCRIPT_PATH=%~dp0electron\native-messaging-host.js"
set "MANIFEST_PATH=%TEMP%\com.copydock.app.json"

echo {> "%MANIFEST_PATH%"
echo   "name": "com.copydock.app",>> "%MANIFEST_PATH%"
echo   "description": "CopyDock Native Messaging Host",>> "%MANIFEST_PATH%"
echo   "path": "cmd.exe",>> "%MANIFEST_PATH%"
echo   "type": "stdio",>> "%MANIFEST_PATH%"
echo   "allowed_origins": [>> "%MANIFEST_PATH%"
echo     "chrome-extension://*/">> "%MANIFEST_PATH%"
echo   ]>> "%MANIFEST_PATH%"
echo }>> "%MANIFEST_PATH%"

REM Register with Chrome
reg add "HKCU\SOFTWARE\Google\Chrome\NativeMessagingHosts\com.copydock.app" /ve /t REG_SZ /d "%MANIFEST_PATH%" /f

echo Done! Now:
echo 1. Close Chrome completely
echo 2. Start CopyDock app
echo 3. Open Chrome and test extension
pause

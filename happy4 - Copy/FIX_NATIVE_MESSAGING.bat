@echo off
echo Fixing native messaging configuration...

REM Create the correct manifest file
set "MANIFEST_DIR=%LOCALAPPDATA%\CopyDock"
if not exist "%MANIFEST_DIR%" mkdir "%MANIFEST_DIR%"

set "MANIFEST_FILE=%MANIFEST_DIR%\com.copydock.app.json"
set "NATIVE_HOST_PATH=%~dp0electron\native-messaging-host.js"

echo Creating fixed manifest...
echo {> "%MANIFEST_FILE%"
echo   "name": "com.copydock.app",>> "%MANIFEST_FILE%"
echo   "description": "CopyDock Native Messaging Host",>> "%MANIFEST_FILE%"
echo   "path": "cmd.exe",>> "%MANIFEST_FILE%"
echo   "type": "stdio",>> "%MANIFEST_FILE%"
echo   "allowed_origins": [>> "%MANIFEST_FILE%"
echo     "chrome-extension://*/">> "%MANIFEST_FILE%"
echo   ]>> "%MANIFEST_FILE%"
echo }>> "%MANIFEST_FILE%"

REM Register with Chrome
reg add "HKCU\SOFTWARE\Google\Chrome\NativeMessagingHosts\com.copydock.app" /ve /t REG_SZ /d "%MANIFEST_FILE%" /f

echo Fixed! Now:
echo 1. Close Chrome completely
echo 2. Make sure CopyDock app is running  
echo 3. Open Chrome and test extension
pause

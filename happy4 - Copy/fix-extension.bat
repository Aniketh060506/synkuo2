@echo off
echo Fixing Chrome Extension Connection...

REM Create the native messaging manifest
set "MANIFEST_DIR=%LOCALAPPDATA%\CopyDock"
if not exist "%MANIFEST_DIR%" mkdir "%MANIFEST_DIR%"

set "MANIFEST_FILE=%MANIFEST_DIR%\com.copydock.app.json"

echo {> "%MANIFEST_FILE%"
echo   "name": "com.copydock.app",>> "%MANIFEST_FILE%"
echo   "description": "CopyDock Desktop App",>> "%MANIFEST_FILE%"
echo   "path": "%~dp0electron\\dist\\win-unpacked\\resources\\backend\\copydock-backend.exe",>> "%MANIFEST_FILE%"
echo   "type": "stdio",>> "%MANIFEST_FILE%"
echo   "allowed_origins": [>> "%MANIFEST_FILE%"
echo     "chrome-extension://*/">> "%MANIFEST_FILE%"
echo   ]>> "%MANIFEST_FILE%"
echo }>> "%MANIFEST_FILE%"

REM Register with Chrome
reg add "HKCU\SOFTWARE\Google\Chrome\NativeMessagingHosts\com.copydock.app" /ve /t REG_SZ /d "%MANIFEST_FILE%" /f

echo Fixed! Now restart Chrome and try the extension.
echo Make sure the CopyDock desktop app is running first.
pause

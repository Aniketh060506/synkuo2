@echo off
echo ========================================
echo   SynkUp Desktop App Launcher
echo ========================================
echo.

REM Get the directory where this script is located
set "APP_DIR=%~dp0"
cd /d "%APP_DIR%"

echo [1/3] Starting FastAPI Backend...
start /B python "%APP_DIR%\..\backend\server.py"
timeout /t 3 /nobreak >nul

echo [2/3] Starting Electron App...
cd electron
call npm start

echo.
echo ========================================
echo   SynkUp is running!
echo ========================================
pause

@echo off
title CopyDock Desktop App
color 0B
chcp 65001 > nul

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                                                                ║
echo ║              📱 CopyDock Desktop App v1.1                      ║
echo ║              Your Personal Productivity System                 ║
echo ║                                                                ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

REM Change to script directory
cd /d "%~dp0"

echo [1/5] Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed or not in PATH!
    echo.
    echo Please install Python 3.8+ from: https://www.python.org/downloads/
    echo ⚠️  IMPORTANT: Check "Add Python to PATH" during installation
    echo.
    pause
    exit /b 1
)
python --version
echo ✅ Python found

echo.
echo [2/5] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed or not in PATH!
    echo.
    echo Please install Node.js 16+ from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)
node --version
echo ✅ Node.js found

echo.
echo [3/5] Installing backend dependencies (first time only)...
cd backend
if not exist ".dependencies_installed" (
    echo Installing Python packages (this may take 1-2 minutes)...
    python -m pip install -r requirements.txt --quiet --disable-pip-version-check
    if errorlevel 1 (
        echo ⚠️  Some packages failed to install, but continuing...
    )
    echo. > .dependencies_installed
    echo ✅ Backend dependencies installed
) else (
    echo ✅ Backend dependencies already installed
)
cd ..

echo.
echo [4/5] Installing Electron dependencies (first time only)...
cd electron
if not exist "node_modules" (
    echo Installing Node.js packages (this may take 2-3 minutes)...
    call npm install --silent
    if errorlevel 1 (
        echo ❌ Failed to install Electron dependencies!
        pause
        exit /b 1
    )
    echo ✅ Electron dependencies installed
) else (
    echo ✅ Electron dependencies already installed
)

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║  [5/5] Starting CopyDock...                                    ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo 🌐 Backend API: http://localhost:8001
echo 🖥️  Frontend: Electron Window
echo.
echo 📝 Press Ctrl+C to stop the application
echo 💡 Close this window to exit completely
echo.

REM Start backend in background
start /B python ..\backend\server.py > ..\backend.log 2>&1

REM Wait for backend to start
echo ⏳ Waiting for backend to initialize...
timeout /t 3 /nobreak >nul

REM Start Electron (this will block until app closes)
echo 🚀 Launching application...
call npm start

REM Cleanup on exit
echo.
echo ✨ Application closed. Thank you for using CopyDock!
timeout /t 2 /nobreak >nul

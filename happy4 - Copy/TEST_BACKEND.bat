@echo off
echo Testing if CopyDock backend is running...
echo.

REM Check if port 8001 is listening
netstat -an | findstr ":8001"
if %ERRORLEVEL% EQU 0 (
    echo [✓] Backend is running on port 8001
) else (
    echo [X] Backend is NOT running on port 8001
    echo.
    echo Please start the CopyDock app first!
    pause
    exit /b 1
)

REM Try to connect to the backend
echo.
echo Testing backend connection...
curl -s http://localhost:8001/api/health
if %ERRORLEVEL% EQU 0 (
    echo.
    echo [✓] Backend API is responding
) else (
    echo [X] Backend API is not responding
)

echo.
pause

@echo off
echo =========================================
echo    Starting TalkAI Backend Server
echo =========================================
echo.
cd /d "%~dp0"
echo Current directory: %CD%
echo.
echo Compiling TypeScript and starting server...
echo.
call npm run start
echo.
echo.
if errorlevel 1 (
    echo ERROR: Server failed to start!
    echo Check the error messages above.
) else (
    echo Server started successfully!
)
echo.
pause

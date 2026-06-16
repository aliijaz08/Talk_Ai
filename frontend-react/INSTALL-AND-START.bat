@echo off
cd /d "%~dp0"

REM Old lockfile pinned react-scripts@0.0.0 (invalid). If install was broken, remove stale modules.
if exist "node_modules" (
  if not exist "node_modules\react-scripts\bin\react-scripts.js" (
    echo Removing incomplete node_modules folder...
    rmdir /s /q node_modules
  )
)

if not exist "node_modules\react-scripts\bin\react-scripts.js" (
  echo Running npm install ^(this may take a few minutes^)...
  call npm install
  if errorlevel 1 (
    echo npm install failed.
    pause
    exit /b 1
  )
)

echo Starting dev server...
call npm start

@echo off
echo Complete Git Push Script for TalkAI
echo ====================================

echo.
echo Step 1: Checking Git status...
git status

echo.
echo Step 2: Removing old remote if exists...
git remote remove origin 2>nul

echo.
echo Step 3: Adding correct remote URL (with underscore)...
git remote add origin https://github.com/aliijaz08/Talk_Ai.git

echo.
echo Step 4: Verifying remote URL...
git remote -v

echo.
echo Step 5: Adding all files...
git add .

echo.
echo Step 6: Creating commit...
git commit -m "Complete TalkAI application: React frontend, Node.js backend with TypeScript, Prisma, multi-AI support"

echo.
echo Step 7: Ensuring we're on main branch...
git branch -M main

echo.
echo Step 8: Pushing to GitHub (you may need to authenticate)...
git push -u origin main

echo.
echo ====================================
echo.
echo If you see authentication errors:
echo 1. You may need a Personal Access Token instead of password
echo 2. Or set up SSH keys
echo.
echo If push was successful, visit: https://github.com/aliijaz08/Talk_Ai
echo.
pause

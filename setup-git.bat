@echo off
echo Initializing Git repository...
git init

echo.
echo Adding remote repository...
git remote add origin https://github.com/aliijaz08/Talk_Ai.git

echo.
echo Adding all files...
git add .

echo.
echo Creating initial commit...
git commit -m "Initial commit: TalkAI application with React frontend and Node.js backend"

echo.
echo Pushing to GitHub...
git branch -M main
git push -u origin main

echo.
echo Done! Your code has been pushed to GitHub.
pause

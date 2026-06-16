@echo off
echo ========================================
echo  PUSH YOUR CODE TO GITHUB - SIMPLE
echo ========================================
echo.

echo Step 1: Removing old remote...
git remote remove origin
echo Done!
echo.

echo Step 2: Adding correct remote...
git remote add origin https://github.com/aliijaz08/Talk_Ai.git
echo Done!
echo.

echo Step 3: Checking what we have...
git remote -v
echo.

echo Step 4: Adding ALL your files...
git add .
echo Done!
echo.

echo Step 5: Committing everything...
git commit -m "TalkAI: React frontend + Node.js/TypeScript backend with Prisma and AI integration"
echo Done!
echo.

echo Step 6: Making sure branch is called main...
git branch -M main
echo Done!
echo.

echo Step 7: Now pushing to GitHub...
echo (You will need to enter your username and Personal Access Token)
echo.
git push -u origin main
echo.

echo ========================================
echo All done! Check above for any errors.
echo ========================================
pause

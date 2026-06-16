@echo off
echo Fixing Git setup with correct repository URL...

echo.
echo Step 1: Removing existing remote...
git remote remove origin

echo.
echo Step 2: Adding correct remote URL with underscore...
git remote add origin https://github.com/aliijaz08/Talk_Ai.git

echo.
echo Step 3: Renaming branch to main...
git branch -M main

echo.
echo Step 4: Pushing to GitHub...
git push -u origin main

echo.
echo Done! Check the output above for any errors.
pause

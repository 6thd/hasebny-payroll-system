
@echo off
echo ====================================================================
echo == This script will upload your project to GitHub.                ==
echo == Make sure you have Git installed on your system.               ==
echo ====================================================================

REM Initialize a Git repository if it doesn't exist
git init -b main

REM Add all the files to be tracked
git add .

REM Commit the files with a message
git commit -m "Initial commit of Hasebny Payroll System"

REM Add your GitHub repository as the remote destination
git remote add origin https://github.com/6thd/hasebny-payroll-system.git

REM Push the code to GitHub
echo Pushing files to GitHub...
git push -u origin main

echo.
echo ====================================================================
echo == Done! Your files have been uploaded to your GitHub repository. ==
echo ====================================================================
pause

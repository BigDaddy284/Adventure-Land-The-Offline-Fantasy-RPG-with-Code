@echo off
rem Fantasy Land: pulls the latest official game code into your copy.
rem Run Stop.bat first.
setlocal
cd /d "%~dp0.."
git remote get-url upstream >nul 2>nul || git remote add upstream https://github.com/kaansoral/adventureland_mongodb.git

rem The website bumps version.js on every start; drop that so it never blocks an update.
git checkout -- version.js >nul 2>nul

echo Getting your own copy's latest version...
git pull --no-rebase origin main || goto conflict
echo Getting the official game's latest version...
git pull --no-rebase upstream main || goto conflict
pushd common
git pull
popd

call npm install --no-audit --no-fund
pushd node
call npm install --no-audit --no-fund
popd
echo.
echo Updated. Your settings.txt was not touched. Start the game with Play.bat.
pause
exit /b 0

:conflict
echo.
echo The official update changed the same lines as the single player changes.
echo Nothing is broken yet: run "git merge --abort" in this folder to undo, then ask for help.
pause
exit /b 1

@echo off
rem Adventure Land single player: one-time setup. Safe to run again.
setlocal
cd /d "%~dp0.."

where node >nul 2>nul || (echo Node.js is missing. Install the LTS version from https://nodejs.org and run this again. & pause & exit /b 1)
where git >nul 2>nul || (echo Git is missing. Install it from https://git-scm.com/download/win and run this again. & pause & exit /b 1)

git remote get-url upstream >nul 2>nul || git remote add upstream https://github.com/kaansoral/adventureland_mongodb.git

if not exist common\ (
	echo Downloading the shared engine...
	git clone --depth 1 https://github.com/kaansoral/common_engine.git common || (pause & exit /b 1)
)
if not exist secretsandconfig\ mklink /J secretsandconfig singleplayer\config >nul
if not exist settings.txt copy settings.example.txt settings.txt >nul

echo Installing website packages...
call npm install --no-audit --no-fund || (pause & exit /b 1)
echo Installing game server packages...
pushd node
call npm install --no-audit --no-fund || (popd & pause & exit /b 1)
popd

echo Checking the database...
node scripts\seed_mongodb.js --dry-run >nul 2>nul
if errorlevel 1 (
	echo The database is already set up, or MongoDB is not running. If this is your first setup, start MongoDB and run this again.
) else (
	node scripts\seed_mongodb.js --confirm adventureland || (pause & exit /b 1)
)

echo.
echo Setup finished. Double-click singleplayer\start_game.bat to play.
pause

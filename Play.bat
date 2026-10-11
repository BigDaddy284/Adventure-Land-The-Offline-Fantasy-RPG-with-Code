@echo off
rem Fantasy Land (single player Adventure Land): starts the database, website and game server in order, then opens the game.
rem The first run also installs everything, which takes a few minutes.
setlocal
cd /d "%~dp0"
title Fantasy Land - Launcher

where node >nul 2>nul || (echo Node.js is missing. Install the LTS version from https://nodejs.org and run Play.bat again. & pause & exit /b 1)

rem ---------- First run: install ----------
if not exist common\ (
	where git >nul 2>nul || (echo Git is missing. Install it from https://git-scm.com/download/win and run Play.bat again. & pause & exit /b 1)
	echo Downloading the shared engine...
	git clone --depth 1 https://github.com/kaansoral/common_engine.git common || (pause & exit /b 1)
)
rem The config link is remade every start, so renaming or moving this folder never breaks it
rmdir secretsandconfig 2>nul
if not exist secretsandconfig\ mklink /J secretsandconfig singleplayer\config >nul
if not exist settings.txt copy settings.example.txt settings.txt >nul
if not exist node_modules\ (
	echo Installing website packages...
	call npm install --no-audit --no-fund || (pause & exit /b 1)
)
if not exist node\node_modules\ (
	echo Installing game server packages...
	pushd node
	call npm install --no-audit --no-fund || (popd & pause & exit /b 1)
	popd
)
where git >nul 2>nul && (git remote get-url upstream >nul 2>nul || git remote add upstream https://github.com/kaansoral/adventureland_mongodb.git)

rem ---------- 1. Database ----------
rem The game keeps its own database on port 27018 (separate from any MongoDB service on 27017),
rem started as a one-member replica set because the game needs database transactions.
node singleplayer\wait_port.js 27018 1 database >nul 2>nul
if not errorlevel 1 goto database_running
set "MONGOD="
for /f "delims=" %%M in ('where mongod 2^>nul') do set "MONGOD=%%M"
if defined MONGOD goto start_database
for /d %%D in ("%ProgramFiles%\MongoDB\Server\*") do if exist "%%D\bin\mongod.exe" set "MONGOD=%%D\bin\mongod.exe"
if defined MONGOD goto start_database
echo MongoDB is not installed. Install MongoDB Community Server from https://www.mongodb.com/try/download/community and run Play.bat again.
pause
exit /b 1
:start_database
if not exist singleplayer\data\ mkdir singleplayer\data
echo Starting the database...
start "Fantasy Land - Database" /min "%MONGOD%" --dbpath "%~dp0singleplayer\data" --bind_ip 127.0.0.1 --port 27018 --replSet rs0
:database_running
node singleplayer\wait_port.js 27018 60 database || (pause & exit /b 1)
node singleplayer\init_db.js || (pause & exit /b 1)

rem First run: load the maps into the empty database
node scripts\seed_mongodb.js --dry-run >nul 2>nul
if not errorlevel 1 (
	echo Loading the maps into the database...
	node scripts\seed_mongodb.js --confirm adventureland || (pause & exit /b 1)
)

rem ---------- 2. Website ----------
node singleplayer\wait_port.js 8090 1 website >nul 2>nul
if errorlevel 1 start "Fantasy Land - Website" /min cmd /k node main.js
node singleplayer\wait_port.js 8090 120 website || (pause & exit /b 1)

rem ---------- 3. Game server ----------
node singleplayer\wait_port.js 7192 1 "game server" >nul 2>nul
if errorlevel 1 start "Fantasy Land - Game Server" /min cmd /k "cd node && node server.js local"
node singleplayer\wait_port.js 7192 180 "game server" || (pause & exit /b 1)

rem ---------- 4. Play ----------
rem Opens the game in its own resizable window (Edge app mode with its own profile, so Stop.bat can close it).
echo Opening the game...
start "" msedge --app=http://127.0.0.1:8090 --user-data-dir="%LOCALAPPDATA%\FantasyLandSinglePlayer" --no-first-run --window-size=1280,800 2>nul || start "" http://127.0.0.1:8090
echo.
echo Everything is running. Close the game window when you're done, then run Stop.bat.
timeout /t 8 >nul

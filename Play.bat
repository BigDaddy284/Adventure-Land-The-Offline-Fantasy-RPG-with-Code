@echo off
rem Adventure Land: The Offline Fantasy RPG with Code (single player): starts the database, website and game server in order, then opens the game.
rem The first run also installs everything, which takes a few minutes.
setlocal
cd /d "%~dp0"
title Adventure Land - Launcher
rem Adventure Land.exe runs this with AL_LAUNCHER set: everything then starts without console windows,
rem and their messages go to the logs folder instead.
if not exist logs\ mkdir logs

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

rem version.js is rewritten every time the website starts, and Windows refuses to write a hidden file: an earlier build hid it, so unhide it
attrib -h version.js >nul 2>nul
attrib -h package-lock.json >nul 2>nul
rem Hide the game's own files, so the folder only shows what you use (turn on Hidden items in File Explorer to see them)
if exist singleplayer\hidden.txt for /f "usebackq eol=# delims=" %%F in ("singleplayer\hidden.txt") do if exist "%%F" attrib +h "%%F" >nul 2>nul

rem ---------- Another copy left running ----------
rem The website, game server or database can still be running from another Adventure Land folder (an older version, or a game
rem ended from Task Manager). They're closed first, so this copy runs its own files, saves into its own folder, and the other
rem folder can be deleted. The database gets a clean shutdown so that folder's saves are kept.
powershell -NoProfile -Command "$d='%~dp0'.ToLower(); Get-NetTCPConnection -State Listen -LocalPort 8090,7192 -ErrorAction SilentlyContinue | ForEach-Object { $p = Get-CimInstance Win32_Process -Filter \"ProcessId=$($_.OwningProcess)\"; if ($p -and $p.Name -eq 'node.exe' -and -not ([string]$p.CommandLine).ToLower().Contains($d)) { Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue } }" >nul 2>nul
node singleplayer\other_copy_db.js

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
if defined AL_LAUNCHER goto start_database_hidden
start "Adventure Land - Database" /min "%MONGOD%" --dbpath "%~dp0singleplayer\data" --bind_ip 127.0.0.1 --port 27018 --replSet rs0
goto database_running
:start_database_hidden
start "" /b "%MONGOD%" --dbpath "%~dp0singleplayer\data" --bind_ip 127.0.0.1 --port 27018 --replSet rs0 --logpath "%~dp0logs\database.log" --logappend
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
echo Starting the website...
node singleplayer\wait_port.js 8090 1 website >nul 2>nul
if not errorlevel 1 goto website_running
if defined AL_LAUNCHER goto start_website_hidden
start "Adventure Land - Website" /min cmd /k node "%~dp0main.js"
goto website_running
:start_website_hidden
start "" /b cmd /c "node "%~dp0main.js" > "%~dp0logs\website.log" 2>&1"
:website_running
node singleplayer\wait_port.js 8090 120 website || (pause & exit /b 1)

rem ---------- 3. Game server ----------
echo Starting the game server...
node singleplayer\wait_port.js 7192 1 "game server" >nul 2>nul
if not errorlevel 1 goto game_server_running
if defined AL_LAUNCHER goto start_game_server_hidden
start "Adventure Land - Game Server" /min cmd /k "cd node && node "%~dp0node\server.js" local"
goto game_server_running
:start_game_server_hidden
start "" /b cmd /c "cd node && node "%~dp0node\server.js" local > "%~dp0logs\game-server.log" 2>&1"
:game_server_running
node singleplayer\wait_port.js 7192 180 "game server" || (pause & exit /b 1)

rem ---------- 4. Play ----------
rem Adventure Land.exe opens the game window itself, so it can tell when you close it
if defined AL_LAUNCHER echo Opening the game...& exit /b 0
rem Opens the game in its own resizable window (Edge app mode with its own profile, so Stop.bat can close it).
echo Opening the game...
start "" msedge --app=http://127.0.0.1:8090 --user-data-dir="%LOCALAPPDATA%\AdventureLandSinglePlayer" --no-first-run --window-size=1280,800 --disable-background-timer-throttling --disable-renderer-backgrounding --disable-backgrounding-occluded-windows --disable-features=CalculateNativeWinOcclusion,IntensiveWakeUpThrottling 2>nul || start "" http://127.0.0.1:8090
echo.
echo Everything is running. Close the game window when you're done, then run Stop.bat.
timeout /t 8 >nul

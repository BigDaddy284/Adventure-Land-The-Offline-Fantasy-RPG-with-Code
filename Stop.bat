@echo off
rem Adventure Land single player: closes the game window, game server, website and database started by Play.bat.
rem Game window: only Edge processes using the game's own profile folder, so your normal Edge windows stay open.
powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \"Name='msedge.exe'\" | Where-Object { $_.CommandLine -like '*AdventureLandSinglePlayer*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }" >nul 2>nul
taskkill /fi "WINDOWTITLE eq Adventure Land - Game Server*" /t /f >nul 2>nul
taskkill /fi "WINDOWTITLE eq Adventure Land - Website*" /t /f >nul 2>nul
rem The database gets a clean shutdown so it can save properly
cd /d "%~dp0"
node singleplayer\stop_db.js >nul 2>nul
echo Adventure Land stopped.
timeout /t 3 >nul

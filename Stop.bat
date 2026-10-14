@echo off
rem Fantasy Land (single player Adventure Land): closes the game window, game server, website and database started by Play.bat.
rem Game window: only Edge and WebView2 processes using the game's own profile folder, so your normal Edge windows stay open.
powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \"Name='msedge.exe' OR Name='msedgewebview2.exe'\" | Where-Object { ($_.CommandLine -like '*FantasyLandSinglePlayer*' -or $_.CommandLine -like '*AdventureLandSinglePlayer*') } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }" >nul 2>nul
rem The game window is Fantasy Land.exe's own window. When this was not started by Fantasy Land.exe itself, close it too.
if not defined FL_STOPPING taskkill /im "Fantasy Land.exe" /f >nul 2>nul
rem Give the game server a moment to save the characters that just disconnected
echo Saving characters...
rem (ping rather than timeout, because timeout fails when Fantasy Land.exe runs this without a window)
ping -n 9 127.0.0.1 >nul
rem The older "Venture Land" and "Adventure Land" window names are closed too, for a game started before the rename
for %%N in ("Fantasy Land" "Venture Land" "Adventure Land") do (
	taskkill /fi "WINDOWTITLE eq %%~N - Game Server*" /t /f >nul 2>nul
	taskkill /fi "WINDOWTITLE eq %%~N - Website*" /t /f >nul 2>nul
)
rem Fantasy Land.exe starts the website and game server without windows, so they're found by their file path instead
powershell -NoProfile -Command "$d='%~dp0'.ToLower(); Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | Where-Object { $c = ([string]$_.CommandLine).ToLower(); $c.Contains($d + 'main.js') -or $c.Contains($d + 'node\server.js') } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }" >nul 2>nul
rem The database gets a clean shutdown so it can save properly
cd /d "%~dp0"
node singleplayer\stop_db.js >nul 2>nul
echo Fantasy Land stopped.
ping -n 4 127.0.0.1 >nul

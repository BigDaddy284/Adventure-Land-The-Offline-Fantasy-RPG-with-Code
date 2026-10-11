@echo off
rem Adventure Land single player: closes the game server, website and database windows started by Play.bat.
taskkill /fi "WINDOWTITLE eq Adventure Land - Game Server*" /t /f >nul 2>nul
taskkill /fi "WINDOWTITLE eq Adventure Land - Website*" /t /f >nul 2>nul
rem The database gets a normal close so it can save cleanly
taskkill /fi "WINDOWTITLE eq Adventure Land - Database*" >nul 2>nul
echo Adventure Land stopped.
timeout /t 3 >nul

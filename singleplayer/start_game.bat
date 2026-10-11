@echo off
rem Adventure Land single player: starts the website and the game server, then opens the game.
cd /d "%~dp0.."
if not exist settings.txt copy settings.example.txt settings.txt >nul
start "Adventure Land - Website" cmd /k node main.js
timeout /t 4 /nobreak >nul
start "Adventure Land - Game Server" cmd /k "cd node && node server.js local"
timeout /t 10 /nobreak >nul
start "" http://localhost:8090
